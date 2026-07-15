#!/usr/bin/env node
// Henter ferske kurser fra Yahoo Finance chart-API og skriver to auto-genererte filer:
//   js/prices.js  – historiske kursserier (1 år daglig, 5 år ukentlig, maks månedlig)
//   js/live.js    – siste kurs-snapshot for STB + peers (overstyrer håndkuratert data i data.js)
// Kjøres av GitHub Actions på en tidsplan. Ved feil skrives INGEN filer (gammel, god data beholdes).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = "Mozilla/5.0 (compatible; STB-data-bot/1.0)";

const PEERS = [
  { ticker: "STB.OL", currency: "NOK" },
  { ticker: "GJF.OL", currency: "NOK" },
  { ticker: "PROT.OL", currency: "NOK" },
  { ticker: "TRYG.CO", currency: "DKK" },
  { ticker: "SAMPO.HE", currency: "EUR" },
];

async function fetchChart(ticker, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${ticker} ${range}/${interval}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${ticker} ${range}/${interval}`);
  return result;
}

function seriesFrom(result, dateFmt) {
  const ts = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    const d = new Date(ts[i] * 1000);
    const iso = d.toISOString();
    out.push([dateFmt === "month" ? iso.slice(0, 7) : iso.slice(0, 10), Math.round(c * 100) / 100]);
  }
  return out;
}

function pctChange(series) {
  if (series.length < 2) return null;
  const first = series[0][1], last = series[series.length - 1][1];
  return Math.round((last / first - 1) * 1000) / 10;
}

async function main() {
  // ---- STB kursserier ----
  const [oneYres, fiveYres, maxRes, fiveDres] = await Promise.all([
    fetchChart("STB.OL", "1y", "1d"),
    fetchChart("STB.OL", "5y", "1wk"),
    fetchChart("STB.OL", "max", "1mo"),
    fetchChart("STB.OL", "5d", "1d"),
  ]);

  const oneY = seriesFrom(oneYres, "day");
  const fiveY = seriesFrom(fiveYres, "day");
  const max = seriesFrom(maxRes, "month");
  if (!oneY.length || !fiveY.length || !max.length) throw new Error("Empty STB series");

  // ---- STB siste kurs / dagens endring ----
  const meta = oneYres.meta || {};
  const dayCloses = seriesFrom(fiveDres, "day").map((d) => d[1]);
  const price = Math.round((meta.regularMarketPrice ?? dayCloses[dayCloses.length - 1]) * 100) / 100;
  const prevClose = dayCloses.length >= 2 ? dayCloses[dayCloses.length - 2] : meta.chartPreviousClose;
  const change = Math.round((price - prevClose) * 100) / 100;
  const changePct = Math.round((change / prevClose) * 10000) / 100;

  const stbQuote = {
    price,
    change,
    changePct,
    week52Low: meta.fiftyTwoWeekLow != null ? Math.round(meta.fiftyTwoWeekLow * 100) / 100 : undefined,
    week52High: meta.fiftyTwoWeekHigh != null ? Math.round(meta.fiftyTwoWeekHigh * 100) / 100 : undefined,
    volume: meta.regularMarketVolume,
    perf: { oneY: pctChange(oneY), fiveY: pctChange(fiveY), sinceGraph: pctChange(max) },
  };

  // ---- Peers: siste kurs + 1-års utvikling ----
  const peerResults = await Promise.all(
    PEERS.map((p) => fetchChart(p.ticker, "1y", "1wk").catch(() => null))
  );
  const peers = {};
  PEERS.forEach((p, i) => {
    const r = peerResults[i];
    if (!r) return;
    const s = seriesFrom(r, "day");
    if (!s.length) return;
    const last = r.meta?.regularMarketPrice ?? s[s.length - 1][1];
    peers[p.ticker] = {
      price: Math.round(last * 100) / 100,
      oneYearPct: pctChange(s),
    };
  });

  const updated = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  // ---- Skriv filer ----
  const pricesJs =
    "// Ekte historiske sluttkurser for STB.OL (Oslo Børs), hentet via Yahoo Finance chart-API.\n" +
    "// oneY: siste 12 mnd (daglig) · fiveY: 5 år (ukentlig) · max: siden 2000 (månedlig).\n" +
    "// AUTO-GENERERT av scripts/update-data.mjs — ikke rediger for hånd.\n" +
    "const STB_PRICES = " + JSON.stringify({ oneY, fiveY, max }) + ";\n";

  const liveJs =
    "// Siste kurs-snapshot, AUTO-GENERERT av scripts/update-data.mjs — ikke rediger for hånd.\n" +
    "// main.js legger disse verdiene over den håndkuraterte dataen i data.js ved innlasting.\n" +
    "const STB_LIVE = " + JSON.stringify({ updated, quote: stbQuote, peers }, null, 2) + ";\n";

  writeFileSync(join(ROOT, "js", "prices.js"), pricesJs);
  writeFileSync(join(ROOT, "js", "live.js"), liveJs);

  console.log(`OK – oppdatert ${updated}: STB ${price} (${changePct > 0 ? "+" : ""}${changePct} %), ` +
    `${oneY.length}/${fiveY.length}/${max.length} punkter, ${Object.keys(peers).length}/${PEERS.length} peers.`);
}

main().catch((err) => {
  console.error("FEIL – ingen filer skrevet:", err.message);
  process.exit(1);
});
