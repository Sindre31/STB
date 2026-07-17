#!/usr/bin/env node
// Genererer en kort, ekte AI-ekspertkommentar om Storebrand-aksjen via Claude API
// og skriver js/ai-view.js. Kjøres av GitHub Actions ETTER update-data.mjs, men bare
// hvis ANTHROPIC_API_KEY er satt. Feiler mykt: ved feil skrives ingen fil, og siden
// faller tilbake på den regelbaserte vurderingen som allerede vises.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.log("ANTHROPIC_API_KEY mangler – hopper over AI-kommentar (siden bruker regelbasert vurdering).");
  process.exit(0);
}

// Les de auto-genererte, ekte tallene fra live.js.
function loadLive() {
  const txt = readFileSync(join(ROOT, "js", "live.js"), "utf8");
  const m = txt.match(/const STB_LIVE\s*=\s*([\s\S]*);\s*$/);
  if (!m) throw new Error("Fant ikke STB_LIVE i js/live.js");
  return JSON.parse(m[1]);
}

async function main() {
  const live = loadLive();
  const q = live.quote || {};
  const peers = Object.entries(live.peers || {})
    .filter(([tk]) => tk !== "STB.OL")
    .map(([tk, p]) => `${tk}: P/E ${p.pe ?? "?"}, utbytte ${p.dividendYield ?? "?"} %, 1 år ${p.oneYearPct ?? "?"} %`)
    .join("; ");

  const facts = [
    `Kurs: ${q.price} NOK (${q.changePct >= 0 ? "+" : ""}${q.changePct} % i dag)`,
    `P/E (TTM): ${q.peTtm}, P/E (fremover): ${q.peForward}`,
    `Direkteavkastning: ${q.dividendYield} %`,
    `Markedsverdi: ${q.marketCap} mrd NOK`,
    `Resultat per aksje (TTM): ${q.epsTtm}`,
    q.bookValue ? `Bokført egenkapital per aksje: ${q.bookValue}` : null,
    `Analytikernes snittmål: ${q.analystTarget} NOK (${q.analystRating || "?"}, ${q.analystCount || "?"} analytikere)`,
    q.perf ? `Kursutvikling: 1 år ${q.perf.oneY} %, 5 år ${q.perf.fiveY} %` : null,
    `52-ukers intervall: ${q.week52Low}–${q.week52High} NOK`,
    peers ? `Sammenlignbare selskaper – ${peers}` : null,
  ].filter(Boolean).join("\n");

  const prompt =
    `Du er en nøktern norsk aksjeekspert. Basert utelukkende på de faktiske nøkkeltallene under, ` +
    `skriv en kort, balansert vurdering av Storebrand-aksjen (STB.OL) på norsk. ` +
    `Vær konkret, unngå svulstig språk, og ikke gi et direkte kjøps- eller salgsråd.\n\n` +
    `NØKKELTALL (${live.updated}):\n${facts}\n\n` +
    `Svar KUN med gyldig JSON på formen:\n` +
    `{"verdict": "<Billig|Rimelig|Dyr> priset", "headline": "<kort overskrift, maks 8 ord>", ` +
    `"body": "<2-4 setninger som begrunner vurderingen ut fra tallene>"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 1200,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const view = JSON.parse(jsonStr);
  if (!view.body || !view.headline) throw new Error("Ufullstendig svar fra modellen");

  const out = {
    generated: live.updated,
    verdict: String(view.verdict || "").slice(0, 40),
    headline: String(view.headline).slice(0, 120),
    body: String(view.body).slice(0, 900),
  };
  const js =
    "// Ekte AI-ekspertkommentar generert av en språkmodell (Anthropic) ut fra de ferske\n" +
    "// nøkkeltallene i live.js. AUTO-GENERERT av scripts/ai-commentary.mjs — ikke rediger for hånd.\n" +
    "// Vises på siden hvis den finnes; ellers brukes den regelbaserte vurderingen.\n" +
    "const STB_AI_VIEW = " + JSON.stringify(out, null, 2) + ";\n";
  writeFileSync(join(ROOT, "js", "ai-view.js"), js);
  console.log(`OK – AI-kommentar skrevet (${out.verdict}): ${out.headline}`);
}

main().catch((err) => {
  console.error("AI-kommentar feilet (siden faller tilbake på regelbasert vurdering):", err.message);
  process.exit(0); // myk feil – ikke stopp workflowen
});
