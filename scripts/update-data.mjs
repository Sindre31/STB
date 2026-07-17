#!/usr/bin/env node
// Henter ferske data fra Yahoo Finance og skriver to auto-genererte filer:
//   js/prices.js  – historiske kursserier (1 år daglig, 5 år ukentlig, maks månedlig)
//   js/live.js    – siste snapshot: kurs + nøkkeltall (P/E, direkteavkastning, markedsverdi …)
//                   for STB og peers, som overstyrer håndkuratert data i data.js.
// Kjøres av GitHub Actions på en tidsplan. Ved feil på kursseriene skrives INGEN filer
// (gammel, god data beholdes). Nøkkeltall er "best effort": feiler de, beholdes forrige verdi.

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

const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

async function fetchChart(ticker, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${ticker} ${range}/${interval}`);
  const result = (await res.json())?.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${ticker} ${range}/${interval}`);
  return result;
}

function seriesFrom(result, dateFmt) {
  const ts = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    if (closes[i] == null) continue;
    const iso = new Date(ts[i] * 1000).toISOString();
    out.push([dateFmt === "month" ? iso.slice(0, 7) : iso.slice(0, 10), round(closes[i])]);
  }
  return out;
}

const pctChange = (s) => (s.length < 2 ? null : round((s[s.length - 1][1] / s[0][1] - 1) * 100, 1));

// ---- Nøkkeltall via crumb-beskyttet quoteSummary (best effort) ----
async function getCrumb() {
  const c = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } });
  const cookies = (c.headers.getSetCookie?.() || []).map((s) => s.split(";")[0]).join("; ");
  const res = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, Cookie: cookies },
  });
  const crumb = await res.text();
  if (!crumb || crumb.length > 40) throw new Error("Ugyldig crumb");
  return { crumb, cookies };
}

const REC_NO = { strong_buy: "Sterkt kjøp", buy: "Kjøp", hold: "Hold", sell: "Selg", strong_sell: "Sterkt salg" };
async function fetchFundamentals(ticker, auth) {
  const url =
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}` +
    `?modules=summaryDetail,defaultKeyStatistics,financialData&crumb=${encodeURIComponent(auth.crumb)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Cookie: auth.cookies } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = (await res.json())?.quoteSummary?.result?.[0] || {};
  const sd = d.summaryDetail || {}, ks = d.defaultKeyStatistics || {}, fd = d.financialData || {};
  const raw = (o, k) => (o[k] && typeof o[k] === "object" ? o[k].raw : undefined);
  return {
    peTtm: round(raw(sd, "trailingPE")),
    peForward: round(raw(sd, "forwardPE")),
    dividendYield: round(raw(sd, "dividendYield") * 100),
    marketCap: round(raw(sd, "marketCap") / 1e9),
    epsTtm: round(raw(ks, "trailingEps")),
    bookValue: round(raw(ks, "bookValue")),
    priceToBook: round(raw(ks, "priceToBook")),
    beta: round(raw(sd, "beta")),
    analystTarget: round(raw(fd, "targetMeanPrice")),
    analystHigh: round(raw(fd, "targetHighPrice")),
    analystLow: round(raw(fd, "targetLowPrice")),
    analystRating: REC_NO[fd.recommendationKey] || undefined,
    analystCount: raw(fd, "numberOfAnalystOpinions"),
  };
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && !Number.isNaN(v)));

// ---- Børsmeldinger fra Oslo Børs NewsWeb (best effort) ----
// issuer-filteret i API-et virker ikke, så vi henter et datospenn og filtrerer på issuerId 1955.
// NewsWeb publiserer norsk + engelsk som par; vi foretrekker den norske tittelen.
const NW_ISSUER = 1955;
const isEnglishTitle = (t) => /\b(the|of|results|notice|transaction|invitation|reminder|buyback|announcement|quarter|proposal|completion|acquisition|minutes|resolutions|prospectus|voting|mandatory|managers|primary insider|financial calendar|contemplated)\b/i.test(t);
const isNorwegianTitle = (t) => /[æøå]/i.test(t) || /\b(og|av|resultater|meldepliktig|primærinnsider|tilbakekjøp|påminnelse|innkalling|generalforsamling|flagging|forslag|kvartal|utbytte|igangsettelse|invitasjon|gjennomført|oppkjøp|børs|finanskalender|stemmerett|handel)\b/i.test(t);

async function fetchNewsFeed() {
  const day = 86400000, iso = (t) => new Date(t).toISOString().slice(0, 10);
  // API-et kapper store spenn (returnerer bare de nyeste ~600 på tvers av alle utstedere),
  // så vi henter i mindre biter bakover i tid og slår sammen for å få nok STB-meldinger.
  const byId = new Map();
  for (let c = 0; c < 8; c++) {
    const to = Date.now() + day - c * 22 * day, from = to - 23 * day;
    const url = `https://api3.oslo.oslobors.no/v1/newsreader/list?fromDate=${iso(from)}&toDate=${iso(to)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) { if (c === 0) throw new Error(`NewsWeb HTTP ${res.status}`); continue; }
    for (const m of (await res.json())?.data?.messages || []) {
      if (m.issuerId === NW_ISSUER && !m.test) byId.set(m.messageId, m);
    }
  }
  const stb = [...byId.values()].sort((a, b) => (a.publishedTime < b.publishedTime ? 1 : -1));
  const clean = (m) => m.title.replace(/^STOREBRAND ASA:\s*/i, "").trim();
  // Norsk-score: æøå = 2, norsk ord = 1, engelsk ord = -1. NewsWeb publiserer norsk+engelsk som par
  // under 1 sek fra hverandre; vi grupperer meldinger innen 2 sek og beholder den mest norske.
  const score = (t) => (/[æøå]/i.test(t) ? 2 : 0) + (isNorwegianTitle(t) ? 1 : 0) - (isEnglishTitle(t) ? 1 : 0);
  const used = new Set(), kept = [];
  for (const m of stb) {
    if (used.has(m.messageId)) continue;
    const group = stb.filter((o) => !used.has(o.messageId) && Math.abs(Date.parse(o.publishedTime) - Date.parse(m.publishedTime)) < 2000);
    const best = group.reduce((a, b) => (score(clean(b)) > score(clean(a)) ? b : a));
    group.forEach((o) => used.add(o.messageId));
    kept.push({
      title: clean(best),
      date: best.publishedTime.slice(0, 10),
      category: best.category?.[0]?.category_no || "",
      url: `https://newsweb.oslobors.no/message/${best.messageId}`,
    });
    if (kept.length >= 8) break;
  }
  return kept;
}

async function seriesForTicker(ticker) {
  const [a, b, c] = await Promise.all([
    fetchChart(ticker, "1y", "1d"),
    fetchChart(ticker, "5y", "1wk"),
    fetchChart(ticker, "max", "1mo"),
  ]);
  return { oneY: seriesFrom(a, "day"), fiveY: seriesFrom(b, "day"), max: seriesFrom(c, "month") };
}

async function main() {
  // ---- STB kursserier (obligatorisk) ----
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

  const meta = oneYres.meta || {};
  const dayCloses = seriesFrom(fiveDres, "day").map((d) => d[1]);
  const price = round(meta.regularMarketPrice ?? dayCloses.at(-1));
  const prevClose = dayCloses.length >= 2 ? dayCloses.at(-2) : meta.chartPreviousClose;
  const change = round(price - prevClose);
  const changePct = round((change / prevClose) * 100);
  const dataDate = oneY.at(-1)[0]; // siste handelsdato – brukes til å oppdage utdaterte data

  // ---- Nøkkeltall (best effort – hele blokken hoppes over hvis crumb feiler) ----
  let auth = null;
  try { auth = await getCrumb(); } catch (e) { console.warn("Crumb feilet, hopper over nøkkeltall:", e.message); }

  let stbFund = {};
  const peerFund = {};
  if (auth) {
    stbFund = clean(await fetchFundamentals("STB.OL", auth).catch(() => ({})));
    for (const p of PEERS) {
      const f = await fetchFundamentals(p.ticker, auth).catch(() => ({}));
      peerFund[p.ticker] = clean({ pe: f.peTtm, dividendYield: f.dividendYield, marketCap: f.marketCap, priceToBook: f.priceToBook });
    }
  }

  const stbQuote = clean({
    price, change, changePct,
    week52Low: round(meta.fiftyTwoWeekLow),
    week52High: round(meta.fiftyTwoWeekHigh),
    volume: meta.regularMarketVolume,
    ...stbFund,
    perf: { oneY: pctChange(oneY), fiveY: pctChange(fiveY), sinceGraph: pctChange(max) },
  });

  // ---- Peers: kurs + 1-års utvikling + nøkkeltall ----
  const peerCharts = await Promise.all(PEERS.map((p) => fetchChart(p.ticker, "1y", "1wk").catch(() => null)));
  const peers = {};
  PEERS.forEach((p, i) => {
    const r = peerCharts[i];
    const entry = { ...(peerFund[p.ticker] || {}) };
    if (r) {
      const s = seriesFrom(r, "day");
      if (s.length) {
        entry.price = round(r.meta?.regularMarketPrice ?? s.at(-1)[1]);
        entry.oneYearPct = pctChange(s);
      }
    }
    if (Object.keys(entry).length) peers[p.ticker] = entry;
  });

  // ---- Peer-kursserier (for indeksert sammenligningsgraf) ----
  const peerSeries = {};
  for (const p of PEERS) {
    if (p.ticker === "STB.OL") continue;
    const s = await seriesForTicker(p.ticker).catch(() => null);
    if (s && s.oneY.length) peerSeries[p.ticker] = s;
  }

  // ---- Børsmeldinger (best effort – egen fil, feiler stille) ----
  let newsFeed = [];
  try { newsFeed = await fetchNewsFeed(); } catch (e) { console.warn("NewsWeb feilet, hopper over børsmeldinger:", e.message); }

  const updated = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const pricesJs =
    "// Ekte historiske sluttkurser (Oslo Børs / Nordiske børser), hentet via Yahoo Finance chart-API.\n" +
    "// oneY: siste 12 mnd (daglig) · fiveY: 5 år (ukentlig) · max: lang historikk (månedlig).\n" +
    "// STB_PEER_PRICES brukes til den indekserte sammenligningsgrafen.\n" +
    "// AUTO-GENERERT av scripts/update-data.mjs — ikke rediger for hånd.\n" +
    "const STB_PRICES = " + JSON.stringify({ oneY, fiveY, max }) + ";\n" +
    "const STB_PEER_PRICES = " + JSON.stringify(peerSeries) + ";\n";

  const liveJs =
    "// Siste snapshot (kurs + nøkkeltall), AUTO-GENERERT av scripts/update-data.mjs — ikke rediger for hånd.\n" +
    "// main.js legger disse verdiene over den håndkuraterte dataen i data.js ved innlasting.\n" +
    "// dataDate = siste handelsdato; brukes til å vise et varsel hvis dataene blir utdaterte.\n" +
    "const STB_LIVE = " + JSON.stringify({ updated, dataDate, quote: stbQuote, peers }, null, 2) + ";\n";

  writeFileSync(join(ROOT, "js", "prices.js"), pricesJs);
  writeFileSync(join(ROOT, "js", "live.js"), liveJs);

  // Skriv børsmeldinger kun hvis vi faktisk fikk noe (unngå å overskrive god data med tom liste).
  if (newsFeed.length) {
    const newsJs =
      "// Siste børsmeldinger fra Oslo Børs NewsWeb (issuer 1955 = Storebrand ASA).\n" +
      "// AUTO-GENERERT av scripts/update-data.mjs — ikke rediger for hånd.\n" +
      "const STB_NEWSFEED = " + JSON.stringify({ updated, messages: newsFeed }, null, 2) + ";\n";
    writeFileSync(join(ROOT, "js", "newsfeed.js"), newsJs);
  }

  console.log(
    `OK – ${updated}: STB ${price} (${changePct > 0 ? "+" : ""}${changePct} %), ` +
    `nøkkeltall ${auth ? "hentet" : "hoppet over"}, ` +
    `${oneY.length}/${fiveY.length}/${max.length} punkter, ${Object.keys(peers).length}/${PEERS.length} peers.`
  );
}

main().catch((err) => {
  console.error("FEIL – ingen filer skrevet:", err.message);
  process.exit(1);
});
