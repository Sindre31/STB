/* Storebrand Aksjeoversikt – rendering mot ekte data (data.js + prices.js + live.js). */

const nf0 = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kr = (v, d = 2) => (d === 2 ? nf2 : nf1).format(v) + " kr";
const pct = (v) => (v > 0 ? "+" : "") + nf2.format(v) + " %";
const pct1 = (v) => (v > 0 ? "+" : "") + nf1.format(v) + " %";

const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs, text) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }

/* ---------- Live-overlay over håndkuratert data ---------- */
(function applyLive() {
  if (typeof STB_LIVE === "undefined") return;
  if (STB_LIVE.updated) STB_DATA.meta.updated = STB_LIVE.updated;
  if (STB_LIVE.quote) {
    const q = STB_LIVE.quote;
    Object.keys(q).forEach((k) => {
      if (k === "perf" && q.perf) STB_DATA.quote.perf = Object.assign({}, STB_DATA.quote.perf, q.perf);
      else if (q[k] != null) STB_DATA.quote[k] = q[k];
    });
  }
  if (STB_LIVE.peers) {
    STB_DATA.peers.forEach((p) => {
      const lv = STB_LIVE.peers[p.ticker];
      if (!lv) return;
      if (lv.price != null) p.price = lv.price;
      if (lv.oneYearPct != null) p.oneYearPct = Math.round(lv.oneYearPct);
      if (lv.pe != null) p.pe = lv.pe;
      if (lv.dividendYield != null) p.dividendYield = lv.dividendYield;
      if (lv.marketCap != null) p.marketCap = lv.marketCap;
      if (lv.priceToBook != null) p.priceToBook = lv.priceToBook;
    });
  }
})();

/* ---------- Tema ---------- */
(function initTheme() {
  const saved = localStorage.getItem("stb-theme");
  // Lys modus er standard; mørk kun hvis brukeren aktivt har valgt det.
  if (saved !== "dark") document.body.classList.add("light");
  const btn = document.getElementById("theme-btn");
  const setLabel = () => { btn.textContent = document.body.classList.contains("light") ? "Mørkt tema" : "Lyst tema"; };
  setLabel();
  btn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("stb-theme", document.body.classList.contains("light") ? "light" : "dark");
    setLabel();
  });
})();

/* ---------- Tooltip ---------- */
const tooltip = document.getElementById("tooltip");
function showTip(evt, html) {
  tooltip.classList.remove("wide");
  tooltip.innerHTML = html;
  tooltip.style.left = evt.clientX + "px";
  tooltip.style.top = evt.clientY + "px";
  tooltip.classList.add("show");
}
const hideTip = () => tooltip.classList.remove("show");

/* ---------- Info-tegn ved finansuttrykk ---------- */
const GLOSSARY = {
  marketcap: ["Markedsverdi", "Antall aksjer ganget med aksjekursen — hva hele selskapet er verdt på børsen akkurat nå."],
  pe: ["P/E (Price/Earnings)", "Kurs delt på resultat per aksje. Sier hvor mange års overskudd du betaler for én aksje. Lav P/E kan bety billig — eller lave vekstforventninger."],
  yield: ["Direkteavkastning", "Årlig utbytte delt på aksjekursen, i prosent. Viser den løpende utbytteavkastningen ved dagens kurs."],
  eps: ["Resultat per aksje (EPS)", "Selskapets overskudd fordelt på antall aksjer. Grunnlaget i P/E-brøken."],
  pb: ["Pris/Bok (P/B)", "Kurs delt på bokført egenkapital per aksje. Under 1 betyr at aksjen prises lavere enn den bokførte verdien."],
  solvency: ["Solvensmargin", "Forholdet mellom kapitalen forsikringsselskapet har og kapitalen myndighetene krever. Over 100 % betyr buffer utover minstekravet; Storebrands eget mål er minst 130 %."],
  combined: ["Combined ratio", "Erstatninger pluss kostnader delt på premieinntekter i skadeforsikring. Under 100 % betyr at forsikringsdriften går med overskudd."],
  roe: ["Egenkapitalavkastning (ROE)", "Overskuddet målt mot egenkapitalen — hvor godt selskapet forrenter eiernes penger."],
  cashroe: ["Kontant-ROE", "Egenkapitalavkastning basert på kontantresultatet (kontantstrømmen), som Storebrand styrer utbytte og tilbakekjøp etter."],
  aum: ["Forvaltningskapital (AUM)", "Samlede kundemidler selskapet forvalter. Storebrand tjener honorarer på denne kapitalen."],
  payout: ["Utdelingsgrad", "Andelen av overskuddet som betales ut som utbytte."],
  volatility: ["Volatilitet", "Hvor mye kursen svinger, målt som årlig standardavvik i avkastningen. Høyere tall betyr større kursutslag og mer usikkerhet."],
  beta: ["Beta", "Hvor mye aksjen svinger i forhold til markedet. Under 1 betyr mindre svingninger enn børsen samlet."],
};
const infoIcon = (term) => GLOSSARY[term] ? `<span class="info-i" data-term="${term}" role="button" tabindex="0" aria-label="Forklaring">i</span>` : "";
function wireInfoIcons() {
  document.querySelectorAll(".info-i[data-term]").forEach((ic) => {
    const g = GLOSSARY[ic.getAttribute("data-term")];
    if (!g) return;
    const show = (e) => { e.stopPropagation(); tooltip.classList.add("wide"); tooltip.innerHTML = `<strong>${g[0]}</strong><br>${g[1]}`; tooltip.style.left = (e.touches ? e.touches[0].clientX : e.clientX) + "px"; tooltip.style.top = (e.touches ? e.touches[0].clientY : e.clientY) + "px"; tooltip.classList.add("show"); };
    ic.addEventListener("mouseenter", show);
    ic.addEventListener("mouseleave", hideTip);
    ic.addEventListener("click", show);
  });
}

/* ---------- Modal / popup ---------- */
const modalEl = document.getElementById("modal");
function openModal(title, content) {
  document.getElementById("modal-title").textContent = title;
  const c = document.getElementById("modal-content");
  c.innerHTML = "";
  if (typeof content === "string") c.innerHTML = content; else c.appendChild(content);
  modalEl.hidden = false;
}
const closeModal = () => { modalEl.hidden = true; };
document.getElementById("modal-close").addEventListener("click", closeModal);
modalEl.addEventListener("click", (e) => { if (e.target === modalEl) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modalEl.hidden) closeModal(); });

/* ---------- Stale-varsel ---------- */
(function staleCheck() {
  const banner = document.getElementById("stale-banner");
  if (typeof STB_LIVE === "undefined" || !STB_LIVE.dataDate) {
    banner.textContent = "⚠ Kunne ikke laste ferske kursdata — viser sist lagrede tall.";
    banner.hidden = false;
    return;
  }
  const last = new Date(STB_LIVE.dataDate + "T00:00:00Z");
  const days = Math.floor((Date.now() - last.getTime()) / 86400000);
  if (days > 5) {
    const d = last.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
    banner.textContent = `⚠ Kursdataene kan være utdaterte. Siste registrerte handelsdag er ${d} (${days} dager siden) — den automatiske oppdateringen kan ha feilet.`;
    banner.hidden = false;
  }
})();

/* ---------- Nav + header ---------- */
const NAV = [
  ["oversikt", "Oversikt"], ["kurs", "Kurs"], ["ai", "AI-ekspert"], ["analytikere", "Analytikere"], ["selskap", "Selskap"],
  ["utbytte", "Utbytte"], ["nokkeltall", "Nøkkeltall"], ["rapporter", "Rapporter"],
  ["innsidehandel", "Innsidehandel"], ["sammenligning", "Sammenligning"], ["nyheter", "Nyheter"], ["kilder", "Kilder"],
];
function renderNav() {
  const nav = document.getElementById("nav-tabs");
  NAV.forEach(([id, label]) => { const a = document.createElement("a"); a.href = "#" + id; a.textContent = label; nav.appendChild(a); });
}
function renderHeader() {
  const q = STB_DATA.quote, up = q.change >= 0;
  document.getElementById("head-price").textContent = kr(q.price);
  const c = document.getElementById("head-change");
  c.textContent = `${up ? "▲" : "▼"} ${pct(q.changePct)}`;
  c.className = "chg " + (up ? "up" : "down");
  document.getElementById("head-updated").textContent = "Oppdatert " + STB_DATA.meta.updated;
}

/* ---------- Stat-grid ---------- */
function renderStats() {
  const q = STB_DATA.quote, k = STB_DATA.kpis;
  const tiles = [
    { label: "Kurs", val: kr(q.price), sub: pct1(q.changePct) + " i dag" },
    { label: "Markedsverdi", info: "marketcap", val: nf1.format(q.marketCap) + " mrd", sub: "NOK", pop: showMarketCapHistory },
    { label: "P/E", info: "pe", val: nf1.format(q.peTtm), sub: "Siste 12 mnd", pop: showPeHistory },
    { label: "Direkteavkastning", info: "yield", val: nf1.format(q.dividendYield) + " %", sub: "Utbytte/kurs", pop: showYieldHistory },
    { label: "Solvensmargin", info: "solvency", val: k.solvency + " %", sub: "Bufferkapital", pop: showSolvencyHistory },
    { label: "Avkastning 1 år", val: pct1(oneYearRet(STB_PRICES.oneY) ?? q.perf.oneY), sub: "Kursutvikling", pop: show1yPrice },
  ];
  const g = document.getElementById("stat-grid");
  tiles.forEach((t) => {
    const hint = t.pop ? `<div class="click-hint">Klikk for utvikling ▸</div>` : "";
    const node = h(`<div class="stat${t.pop ? " clickable" : ""}"><div class="label">${t.label}${t.info ? infoIcon(t.info) : ""}</div><div class="val">${t.val}</div><div class="sub">${t.sub}</div>${hint}</div>`);
    if (t.pop) node.addEventListener("click", t.pop);
    g.appendChild(node);
  });
}

/* ---------- Prisgraf med periode + peer-sammenligning ---------- */
const PERIODS = [["1u", "1 uke"], ["1m", "1 mnd"], ["3m", "3 mnd"], ["oneY", "1 år"], ["fiveY", "5 år"], ["max", "Maks"]];
const PEER_SHORT = { "GJF.OL": "Gjensidige", "PROT.OL": "Protector", "TRYG.CO": "Tryg", "SAMPO.HE": "Sampo", "OSEBX.OL": "Oslo Børs" };
const PEER_COLORS = { "GJF.OL": "#6ea8dc", "PROT.OL": "#3ecf8e", "TRYG.CO": "#c58af0", "SAMPO.HE": "#e8975a", "OSEBX.OL": "#d98b8b" };
const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
// 1-års avkastning beregnet fra daglig serie – samme metode for STB og alle peers.
const oneYearRet = (series) => (series && series.length > 1 ? ((series[series.length - 1][1] / series[0][1]) - 1) * 100 : null);
// Hent riktig kursserie for valgt periode. 1m/3m utledes fra den daglige 1-års-serien.
function seriesSlice(store, period) {
  if (!store) return null;
  if (period === "1u") return store.oneY.slice(-5);
  if (period === "1m") return store.oneY.slice(-22);
  if (period === "3m") return store.oneY.slice(-66);
  return store[period];
}

function renderPriceChart() {
  const svg = document.getElementById("price-chart");
  let period = "oneY";
  const cmp = new Set(); // flere selskaper kan sammenlignes samtidig

  const pBtns = document.getElementById("period-buttons");
  PERIODS.forEach(([key, label]) => {
    const b = h(`<button class="tbtn${key === period ? " active" : ""}">${label}</button>`);
    b.addEventListener("click", () => { period = key; [...pBtns.children].forEach((x, i) => x.classList.toggle("active", PERIODS[i][0] === key)); draw(); });
    pBtns.appendChild(b);
  });
  const peerWrap = document.getElementById("peer-buttons");
  Object.keys(PEER_SHORT).forEach((tk) => {
    if (!STB_PEER_PRICES[tk]) return;
    const b = h(`<button class="pbtn" data-tk="${tk}">${PEER_SHORT[tk]}</button>`);
    b.addEventListener("click", () => {
      if (cmp.has(tk)) { cmp.delete(tk); b.classList.remove("active"); b.style.color = ""; b.style.borderColor = ""; }
      else { cmp.add(tk); b.classList.add("active"); b.style.color = PEER_COLORS[tk]; b.style.borderColor = PEER_COLORS[tk]; }
      draw();
    });
    peerWrap.appendChild(b);
  });

  const PADL = 48, PADR = 16, TOP = 14, BOT = 292, W = 800, XR = W - PADR;
  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const comparing = cmp.size > 0;

    // Bygg liste av serier som skal tegnes. I sammenligningsmodus indekseres alt til 100.
    const idx = (arr) => arr.map((d) => (arr[0][1] ? (d[1] / arr[0][1]) * 100 : 100));
    const stbArr = seriesSlice(STB_PRICES, period);
    const series = [];
    series.push({ name: "Storebrand", color: "var(--acc)", width: 2.2, raw: stbArr, vals: comparing ? idx(stbArr) : stbArr.map((d) => d[1]) });
    if (comparing) {
      [...cmp].forEach((tk) => {
        const arr = seriesSlice(STB_PEER_PRICES[tk], period);
        series.push({ name: PEER_SHORT[tk], color: PEER_COLORS[tk], width: 2, raw: arr, vals: idx(arr) });
      });
    }

    let yMin = Math.min(...series.flatMap((s) => s.vals));
    let yMax = Math.max(...series.flatMap((s) => s.vals));
    const padY = (yMax - yMin) * 0.08 || 1; yMin -= padY; yMax += padY;
    const xAt = (i, n) => PADL + (i / (n - 1)) * (XR - PADL);
    const y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);
    const yFmt = comparing ? (v) => nf0.format(v) : (v) => nf0.format(v);

    for (let s = 0; s <= 4; s++) {
      const v = yMin + (yMax - yMin) * (s / 4), yy = y(v);
      svg.appendChild(el("line", { x1: PADL, x2: XR, y1: yy, y2: yy, class: "chart-grid" }));
      svg.appendChild(el("text", { x: PADL - 6, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, yFmt(v)));
    }
    const stb = stbArr;
    [0, Math.floor(stb.length / 2), stb.length - 1].forEach((i) => {
      svg.appendChild(el("text", { x: xAt(i, stb.length), y: 314, "text-anchor": i === 0 ? "start" : i === stb.length - 1 ? "end" : "middle", class: "chart-axis" }, stb[i][0]));
    });

    const pathFor = (vals) => { let d = ""; vals.forEach((v, i) => { d += (i ? " L " : "M ") + xAt(i, vals.length) + " " + y(v); }); return d; };

    if (!comparing) {
      const s0 = series[0].vals;
      svg.appendChild(el("path", { d: pathFor(s0) + ` L ${xAt(s0.length - 1, s0.length)} ${BOT} L ${PADL} ${BOT} Z`, fill: "var(--acc)", "fill-opacity": "0.08", stroke: "none" }));
    }
    // Tegn peers under STB, STB øverst
    series.slice(1).forEach((s) => svg.appendChild(el("path", { d: pathFor(s.vals), fill: "none", stroke: s.color, "stroke-width": s.width })));
    svg.appendChild(el("path", { d: pathFor(series[0].vals), fill: "none", stroke: series[0].color, "stroke-width": series[0].width }));

    // hover
    const vline = el("line", { x1: 0, x2: 0, y1: TOP, y2: BOT, stroke: "var(--mut)", "stroke-width": "1", "stroke-dasharray": "3,3", opacity: "0" });
    svg.appendChild(vline);
    const dots = series.map((s) => { const c = el("circle", { r: 4, fill: s.color, opacity: "0" }); svg.appendChild(c); return c; });
    const overlay = el("rect", { x: PADL, y: TOP, width: XR - PADL, height: BOT - TOP, fill: "transparent", "pointer-events": "all" });
    svg.appendChild(overlay);

    function move(evt) {
      const t = evt.touches ? evt.touches[0] : evt;
      const pt = svg.createSVGPoint(); pt.x = t.clientX; pt.y = t.clientY;
      const ctm = svg.getScreenCTM(); if (!ctm) return;
      const f = Math.max(0, Math.min(1, (pt.matrixTransform(ctm.inverse()).x - PADL) / (XR - PADL)));
      const px = PADL + f * (XR - PADL);
      vline.setAttribute("x1", px); vline.setAttribute("x2", px); vline.setAttribute("opacity", "1");
      let html = `<div class="t-date">${stb[Math.round(f * (stb.length - 1))][0]}</div>`;
      series.forEach((s, k) => {
        const i = Math.round(f * (s.vals.length - 1));
        dots[k].setAttribute("cx", xAt(i, s.vals.length)); dots[k].setAttribute("cy", y(s.vals[i])); dots[k].setAttribute("opacity", "1");
        // I sammenligningsmodus: vis prosentendring siden periodestart. Ellers: kroner.
        const label = comparing ? pct1(s.vals[i] - 100) : kr(s.raw[i][1]);
        html += `<div style="color:${s.color}">${s.name}: ${label}</div>`;
      });
      showTip(t, html);
    }
    const clear = () => { vline.setAttribute("opacity", "0"); dots.forEach((d) => d.setAttribute("opacity", "0")); hideTip(); };
    overlay.addEventListener("mousemove", move);
    overlay.addEventListener("mouseleave", clear);
    overlay.addEventListener("touchmove", move, { passive: true });
    overlay.addEventListener("touchend", clear);

    const stbChg = ((stb[stb.length - 1][1] / stb[0][1]) - 1) * 100;
    const perfEl = document.getElementById("chart-perf");
    perfEl.textContent = pct1(stbChg);
    perfEl.className = "perf " + (stbChg >= 0 ? "up" : "down");
    const leg = document.getElementById("cmp-legend");
    if (comparing) {
      leg.hidden = false;
      leg.innerHTML = series.map((s) => `<span style="color:${s.color}">— ${s.name}</span>`).join("") + `<span style="color:var(--mut)">Indeksert: 100 = periodestart, hover viser % endring</span>`;
    } else { leg.hidden = true; }
  }
  draw();
}

/* ---------- AI-ekspert: verdilinje, fremtidsprojeksjon, backtest ---------- */
const AI_LOOKBACKS = [["1m", "1 mnd"], ["3m", "3 mnd"], ["1y", "1 år"], ["3y", "3 år"]];
const AI_FORWARDS = [[0, "0"], [1, "1 mnd"], [3, "3 mnd"], [6, "6 mnd"], [12, "12 mnd"]];
function aiLookback(lb) {
  if (lb === "1m") return STB_PRICES.oneY.slice(-22);
  if (lb === "3m") return STB_PRICES.oneY.slice(-66);
  if (lb === "3y") return STB_PRICES.fiveY.slice(-157);
  return STB_PRICES.oneY;
}
// Daglig realisert volatilitet (logg-avkastning) fra siste års kursserie.
function dailyVol(prices) {
  const r = [];
  for (let i = 1; i < prices.length; i++) if (prices[i] > 0 && prices[i - 1] > 0) r.push(Math.log(prices[i] / prices[i - 1]));
  if (r.length < 3) return 0.012;
  const m = r.reduce((a, v) => a + v, 0) / r.length;
  return Math.sqrt(r.reduce((a, x) => a + (x - m) ** 2, 0) / (r.length - 1));
}
// Backtest av modellens retningssignal (kausalt: kun forutgående kurser brukes).
// Hver dag: ligger kursen under sitt eget glidende snitt (undervurdert) → forvent oppgang, ellers nedgang.
// Treff = faktisk retning H handelsdager frem stemte med signalet.
function backtestSignal(series, win, horizon) {
  const p = series.map((d) => d[1]);
  let hits = 0, total = 0, followRet = 0;
  for (let i = win; i + horizon < p.length; i++) {
    const sma = p.slice(i - win, i).reduce((a, v) => a + v, 0) / win;
    if (Math.abs(p[i] / sma - 1) < 0.005) continue; // for nær snittet – ingen klar mening
    const bull = p[i] < sma;
    const fut = (p[i + horizon] / p[i]) - 1;
    total++;
    if ((bull && fut > 0) || (!bull && fut < 0)) hits++;
    followRet += bull ? fut : -fut;
  }
  return { hits, total, rate: total ? (hits / total) * 100 : null, avgFollow: total ? (followRet / total) * 100 : null };
}
// B3: ensemble av tre kausale delmodeller. Vektene settes fra treffrate på FØRSTE halvdel (trening),
// og den kombinerte modellen valideres på ANDRE halvdel (walk-forward – ikke overtilpasset).
function ensembleBacktest(series) {
  const p = series.map((d) => d[1]);
  const sma = (i, w) => { const a = Math.max(0, i - w + 1), s = p.slice(a, i + 1); return s.reduce((x, v) => x + v, 0) / s.length; };
  const defs = [
    { name: "Mean reversion", dir: (i) => (p[i] < sma(i, 20) ? 1 : -1) },
    { name: "Momentum 3 mnd", dir: (i) => (i >= 66 ? (p[i] > p[i - 66] ? 1 : -1) : 0) },
    { name: "Langsiktig verdi", dir: (i) => (p[i] < sma(i, 120) ? 1 : -1) },
  ];
  const H = 21, warm = 120, lastI = p.length - 1 - H;
  if (lastI - warm < 20) return null;
  const mid = Math.floor((warm + lastI) / 2);
  const hit = defs.map(() => ({ h: 0, t: 0 }));
  for (let i = warm; i < mid; i++) { const fut = p[i + H] / p[i] - 1; defs.forEach((d, j) => { const dir = d.dir(i); if (dir) { hit[j].t++; if ((dir > 0 && fut > 0) || (dir < 0 && fut < 0)) hit[j].h++; } }); }
  const rates = hit.map((x) => (x.t ? (x.h / x.t) * 100 : 50));
  const weights = rates.map((r) => Math.max(0, r - 50)), wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const wn = weights.map((w) => w / wsum);
  let vh = 0, vt = 0;
  for (let i = mid; i <= lastI; i++) { const fut = p[i + H] / p[i] - 1; const score = defs.reduce((a, d, j) => a + wn[j] * d.dir(i), 0); if (Math.abs(score) > 0.15) { vt++; if ((score > 0 && fut > 0) || (score < 0 && fut < 0)) vh++; } }
  const iC = p.length - 1, curDirs = defs.map((d) => d.dir(iC));
  return { models: defs.map((d, j) => ({ name: d.name, rate: rates[j], weight: wn[j], dir: curDirs[j] })), valRate: vt ? (vh / vt) * 100 : null, valN: vt, curScore: defs.reduce((a, d, j) => a + wn[j] * curDirs[j], 0) };
}
function renderAiExpert() {
  const svg = document.getElementById("ai-chart");
  const q = STB_DATA.quote, k = STB_DATA.kpis;
  let lb = "1y", fwd = 3;

  // Fundamental verdiforankring: snitt av flere uavhengige, ekte ankere.
  const peerAvgPe = avg(STB_DATA.peers.filter((p) => !p.isSubject && p.pe).map((p) => p.pe));
  const peerAvgY = avg(STB_DATA.peers.filter((p) => !p.isSubject && p.dividendYield).map((p) => p.dividendYield));
  const peerPBs = STB_DATA.peers.filter((p) => !p.isSubject && p.priceToBook).map((p) => p.priceToBook);
  const peerAvgPB = peerPBs.length ? avg(peerPBs) : null;
  const anchors = [];
  if (q.analystTarget) anchors.push({ label: "analytikermål", value: q.analystTarget });
  if (q.epsTtm && peerAvgPe) anchors.push({ label: `bransje-P/E ${nf1.format(peerAvgPe)}×`, value: q.epsTtm * peerAvgPe });
  if (q.bookValue && peerAvgPB) anchors.push({ label: `bransje-P/B ${nf1.format(peerAvgPB)}×`, value: q.bookValue * peerAvgPB });
  const anchorAvg = anchors.length ? avg(anchors.map((a) => a.value)) : q.price;

  // B1: løpende TTM-EPS (stegfunksjon fra ekte årlig EPS + dagens TTM) → verdilinja følger inntjeningen.
  const epsBreaks = (STB_DATA.financialsHistory || []).map((f) => ({ t: Date.parse(`${f.year + 1}-02-15`), eps: f.eps }))
    .concat(q.epsTtm ? [{ t: Date.now(), eps: q.epsTtm }] : []).sort((a, b) => a.t - b.t);
  const epsAt = (t) => { let e = epsBreaks.length ? epsBreaks[0].eps : q.epsTtm; for (const b of epsBreaks) if (t >= b.t) e = b.eps; return e; };
  const fairMult = (q.epsTtm && anchorAvg) ? anchorAvg / q.epsTtm : null; // implisitt "rimelig" P/E

  // Realisert volatilitet → usikkerhetsbånd. B2: analytiker-spennet (høy−lav) legges til som ekstra usikkerhet.
  const volD = dailyVol(STB_PRICES.oneY.map((d) => d[1]));
  const volAnnual = volD * Math.sqrt(252) * 100;
  const spreadFrac = (q.analystHigh && q.analystLow && q.analystTarget) ? (q.analystHigh - q.analystLow) / q.analystTarget : 0;
  const bandPct = (m) => Math.min(Math.hypot(volD * Math.sqrt(m * 21), spreadFrac * 0.5 * (m / 12)), 0.4);
  // B5: dyr/billig-grense skaleres med volatilitet (strammere i rolige perioder, løsere i urolige).
  const thr = Math.max(4, Math.min(10, volD * Math.sqrt(21) * 100 * 0.9));

  // Track record + ensemble – kjøres én gang (uavhengig av valgt periode).
  const bt = backtestSignal(STB_PRICES.oneY, 20, 21);
  const ens = ensembleBacktest(STB_PRICES.oneY);
  const track = document.getElementById("ai-track");
  if (track) {
    track.innerHTML = "";
    [
      ["Treffrate retning", bt.rate == null ? "–" : nf0.format(bt.rate) + " %"],
      ["Testede signaler", bt.total ? nf0.format(bt.total) : "–"],
      ["Snittavk./signal", bt.avgFollow == null ? "–" : pct1(bt.avgFollow)],
      ["Årlig volatilitet" + infoIcon("volatility"), nf0.format(volAnnual) + " %"],
    ].forEach(([l, v]) => track.appendChild(h(`<div class="ministat"><div class="label">${l}</div><div class="val">${v}</div></div>`)));
  }

  const lbWrap = document.getElementById("ai-lookback-buttons");
  AI_LOOKBACKS.forEach(([key, label]) => {
    const b = h(`<button class="tbtn${key === lb ? " active" : ""}">${label}</button>`);
    b.addEventListener("click", () => { lb = key; [...lbWrap.children].forEach((x, i) => x.classList.toggle("active", AI_LOOKBACKS[i][0] === key)); draw(); });
    lbWrap.appendChild(b);
  });
  const fwWrap = document.getElementById("ai-forward-buttons");
  AI_FORWARDS.forEach(([val, label]) => {
    const b = h(`<button class="tbtn${val === fwd ? " active" : ""}">${label}</button>`);
    b.addEventListener("click", () => { fwd = val; [...fwWrap.children].forEach((x, i) => x.classList.toggle("active", AI_FORWARDS[i][0] === fwd)); draw(); });
    fwWrap.appendChild(b);
  });

  const PADL = 48, PADR = 16, TOP = 14, BOT = 268, XR = 800 - PADR, MS_M = 30.44 * 86400000;

  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const hist = aiLookback(lb), n = hist.length;
    const prices = hist.map((d) => d[1]);
    const target = anchorAvg; // blandet fundamental forankring (analytikermål + bransje-P/E + bransje-P/B)

    // AI-estimat: glidende verdivurdering (følger kurs) forankret gradvis mot fundamental verdi
    // som selv følger inntjeningen (TTM-EPS × implisitt rimelig multippel).
    const win = Math.max(5, Math.round(n / 6));
    const sma = prices.map((_, i) => { const a = Math.max(0, i - win + 1), s = prices.slice(a, i + 1); return s.reduce((x, v) => x + v, 0) / s.length; });
    const tsL = hist.map((d) => Date.parse(d[0]));
    const fair = sma.map((v, i) => {
      const w = (i / (n - 1)) * 0.4;
      const epsFair = fairMult ? epsAt(tsL[i]) * fairMult : anchorAvg;
      const fund = fairMult ? epsFair * 0.6 + anchorAvg * 0.4 : anchorAvg;
      return v * (1 - w) + fund * w;
    });
    const fairEnd = fair[n - 1];

    // Fremtidsprojeksjon: fra dagens estimat mot analytikernes 12-mnd mål, med voksende usikkerhet.
    const fVals = [], fHi = [], fLo = [];
    for (let m = 1; m <= fwd; m++) { const v = fairEnd + (target - fairEnd) * (m / 12); fVals.push(v); fHi.push(v * (1 + bandPct(m))); fLo.push(v * (1 - bandPct(m))); }

    const ts = hist.map((d) => Date.parse(d[0])), todayTs = ts[n - 1];
    const fTs = []; for (let m = 1; m <= fwd; m++) fTs.push(todayTs + m * MS_M);
    const xMin = ts[0], xMax = fwd > 0 ? fTs[fwd - 1] : todayTs;
    const X = (t) => PADL + (t - xMin) / (xMax - xMin) * (XR - PADL);

    const allV = [...prices, ...fair, ...(fwd > 0 ? [...fVals, ...fHi, ...fLo] : [])];
    let yMin = Math.min(...allV), yMax = Math.max(...allV);
    const padY = (yMax - yMin) * 0.08 || 1; yMin -= padY; yMax += padY;
    const Y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);

    for (let s = 0; s <= 4; s++) {
      const v = yMin + (yMax - yMin) * (s / 4), yy = Y(v);
      svg.appendChild(el("line", { x1: PADL, x2: XR, y1: yy, y2: yy, class: "chart-grid" }));
      svg.appendChild(el("text", { x: PADL - 6, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, nf0.format(v)));
    }
    const tickTs = fwd > 0 ? [xMin, todayTs, xMax] : [xMin, ts[Math.floor(n / 2)], todayTs];
    tickTs.forEach((t, i) => { const d = new Date(t); svg.appendChild(el("text", { x: X(t), y: 288, "text-anchor": i === 0 ? "start" : i === tickTs.length - 1 ? "end" : "middle", class: "chart-axis" }, MND[d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2))); });

    // areal under kurs (historikk)
    let ap = ""; prices.forEach((v, i) => { ap += (i ? " L " : "M ") + X(ts[i]) + " " + Y(v); });
    ap += ` L ${X(todayTs)} ${BOT} L ${X(xMin)} ${BOT} Z`;
    svg.appendChild(el("path", { d: ap, fill: "var(--acc)", "fill-opacity": "0.07", stroke: "none" }));

    if (fwd > 0) {
      let bd = `M ${X(todayTs)} ${Y(fairEnd)}`;
      for (let m = 0; m < fwd; m++) bd += ` L ${X(fTs[m])} ${Y(fHi[m])}`;
      for (let m = fwd - 1; m >= 0; m--) bd += ` L ${X(fTs[m])} ${Y(fLo[m])}`;
      svg.appendChild(el("path", { d: bd + " Z", fill: "var(--ai)", "fill-opacity": "0.13", stroke: "none" }));
      let fl = `M ${X(todayTs)} ${Y(fairEnd)}`; for (let m = 0; m < fwd; m++) fl += ` L ${X(fTs[m])} ${Y(fVals[m])}`;
      svg.appendChild(el("path", { d: fl, fill: "none", stroke: "var(--ai)", "stroke-width": "2", "stroke-dasharray": "2,3" }));
    }
    let fd = ""; fair.forEach((v, i) => { fd += (i ? " L " : "M ") + X(ts[i]) + " " + Y(v); });
    svg.appendChild(el("path", { d: fd, fill: "none", stroke: "var(--ai)", "stroke-width": "2", "stroke-dasharray": "6,4" }));
    let pd = ""; prices.forEach((v, i) => { pd += (i ? " L " : "M ") + X(ts[i]) + " " + Y(v); });
    svg.appendChild(el("path", { d: pd, fill: "none", stroke: "var(--acc)", "stroke-width": "2.2" }));

    if (fwd > 0) {
      svg.appendChild(el("line", { x1: X(todayTs), x2: X(todayTs), y1: TOP, y2: BOT, stroke: "var(--mut)", "stroke-width": "1", "stroke-dasharray": "2,4" }));
      svg.appendChild(el("text", { x: X(todayTs), y: 26, "text-anchor": "middle", class: "chart-axis" }, "i dag"));
      svg.appendChild(el("circle", { cx: X(fTs[fwd - 1]), cy: Y(fVals[fwd - 1]), r: 4.5, fill: "var(--ai)" }));
      svg.appendChild(el("text", { x: X(fTs[fwd - 1]), y: Y(fVals[fwd - 1]) - 8, "text-anchor": "end", class: "chart-axis", fill: "var(--ai)", "font-weight": "600" }, kr(fVals[fwd - 1], 0)));
    }

    // hover (historikk-delen)
    const vline = el("line", { x1: 0, x2: 0, y1: TOP, y2: BOT, stroke: "var(--mut)", "stroke-width": "1", "stroke-dasharray": "3,3", opacity: "0" });
    const dP = el("circle", { r: 4, fill: "var(--acc)", opacity: "0" }), dF = el("circle", { r: 4, fill: "var(--ai)", opacity: "0" });
    svg.appendChild(vline); svg.appendChild(dP); svg.appendChild(dF);
    const ovW = Math.max(1, X(todayTs) - PADL);
    const overlay = el("rect", { x: PADL, y: TOP, width: ovW, height: BOT - TOP, fill: "transparent", "pointer-events": "all" });
    svg.appendChild(overlay);
    const move = (evt) => {
      const t = evt.touches ? evt.touches[0] : evt;
      const pt = svg.createSVGPoint(); pt.x = t.clientX; pt.y = t.clientY;
      const ctm = svg.getScreenCTM(); if (!ctm) return;
      const f = Math.max(0, Math.min(1, (pt.matrixTransform(ctm.inverse()).x - PADL) / ovW));
      const i = Math.round(f * (n - 1)), px = X(ts[i]);
      vline.setAttribute("x1", px); vline.setAttribute("x2", px); vline.setAttribute("opacity", "1");
      dP.setAttribute("cx", px); dP.setAttribute("cy", Y(prices[i])); dP.setAttribute("opacity", "1");
      dF.setAttribute("cx", px); dF.setAttribute("cy", Y(fair[i])); dF.setAttribute("opacity", "1");
      showTip(t, `<div class="t-date">${hist[i][0]}</div><div style="color:var(--acc)">Kurs: ${kr(prices[i])}</div><div style="color:var(--ai)">AI-estimat: ${kr(fair[i])}</div>`);
    };
    const clear = () => { vline.setAttribute("opacity", "0"); dP.setAttribute("opacity", "0"); dF.setAttribute("opacity", "0"); hideTip(); };
    overlay.addEventListener("mousemove", move); overlay.addEventListener("mouseleave", clear);
    overlay.addEventListener("touchmove", move, { passive: true }); overlay.addEventListener("touchend", clear);

    // --- Vurdering ---
    const gap = ((q.price - fairEnd) / fairEnd) * 100;
    const ret1y = oneYearRet(STB_PRICES.oneY);
    const peerRets = STB_DATA.peers.filter((p) => !p.isSubject && p.oneYearPct != null).map((p) => p.oneYearPct);
    const peerAvgRet = peerRets.length ? avg(peerRets) : null;
    const rangePos = q.week52High > q.week52Low ? ((q.price - q.week52Low) / (q.week52High - q.week52Low)) * 100 : 50;
    let rating, cls;
    if (gap > thr) { rating = "Dyr priset"; cls = "down"; }
    else if (gap < -thr) { rating = "Billig priset"; cls = "up"; }
    else { rating = "Rimelig priset"; cls = "neutral"; }
    document.getElementById("ai-badge").innerHTML = `<span class="ai-badge ${cls}">AI-ekspert: ${rating}</span>`;
    document.getElementById("ai-estimate").textContent = fwd > 0 ? `Anslag om ${fwd} mnd: ~${kr(fVals[fwd - 1], 0)}` : "";

    const signals = [
      sig("Verdi vs. kurs", gap <= 0, `Kursen er ${nf1.format(Math.abs(gap))} % ${gap >= 0 ? "over" : "under"} AI-estimatet`),
      sig("Analytikermål", q.analystTarget ? q.price <= q.analystTarget : true, q.analystTarget ? `${nf1.format(Math.abs((q.price / q.analystTarget - 1) * 100))} % ${q.price <= q.analystTarget ? "opp til" : "over"} snittmål ${kr(q.analystTarget, 0)}` : "ingen data"),
      sig("P/E vs. bransjen", q.peTtm <= peerAvgPe, `P/E ${nf1.format(q.peTtm)} mot snitt ${nf1.format(peerAvgPe)}`),
      sig("Utbytte vs. bransjen", q.dividendYield >= peerAvgY, `${nf1.format(q.dividendYield)} % mot snitt ${nf1.format(peerAvgY)} %`),
      sig("Relativ styrke", peerAvgRet != null && ret1y >= peerAvgRet, peerAvgRet != null ? `${pct1(ret1y)} mot bransje ${pct1(peerAvgRet)} siste år` : "ingen data"),
      sig("52-ukers posisjon", rangePos <= 60, `${nf0.format(rangePos)} % opp i 52-ukers spennet`),
      sig("Soliditet", k.solvency >= 175, `Solvens ${k.solvency} % ${k.solvency >= 175 ? "gir rom for tilbakekjøp" : ""}`),
    ];
    // B4: enkelt rentesignal – stigende lange renter er normalt positivt for et livselskap.
    if (q.rate10yChg3m != null) signals.push(sig("Renteretning", q.rate10yChg3m >= 0, `Lange renter (10 år, global) ${q.rate10yChg3m >= 0 ? "opp" : "ned"} ${nf2.format(Math.abs(q.rate10yChg3m))} pp siste 3 mnd — ${q.rate10yChg3m >= 0 ? "positivt" : "negativt"} for livselskap`));
    const sc = signals.filter((s) => s.good).length - signals.filter((s) => !s.good).length;
    const chips = document.getElementById("ai-signals"); chips.innerHTML = "";
    signals.forEach((s) => chips.appendChild(h(`<span class="ai-chip ${s.good ? "good" : "bad"}">${s.good ? "▲" : "▼"} ${s.label}<span class="ai-chip-sub">${s.detail}</span></span>`)));

    const fundament = sc >= 2 ? "trekker i positiv retning" : sc <= -2 ? "trekker i negativ retning" : "er blandet";
    const anchorTxt = anchors.map((a) => `${a.label} ${kr(a.value, 0)}`).join(", ");
    let txt = `Etter en oppgang på ${pct1(ret1y)} det siste året handles Storebrand nå ${nf1.format(Math.abs(gap))} % ${gap >= 0 ? "over" : "under"} AI-ekspertens estimerte verdi på ${kr(fairEnd, 0)}. `;
    if (anchors.length > 1) txt += `Den verdien er forankret i ${anchors.length} uavhengige mål (${anchorTxt}) med et snitt på ${kr(anchorAvg, 0)}. `;
    txt += `Verdsettelsen (P/E ${nf1.format(q.peTtm)}) er ${q.peTtm <= peerAvgPe ? "lavere" : "høyere"} enn snittet for lignende selskaper (${nf1.format(peerAvgPe)}), og solvensmarginen på ${k.solvency} % ${k.solvency >= 175 ? "gir rom for fortsatte tilbakekjøp" : "er solid"}. `;
    if (fwd > 0) txt += `Anslag ${fwd} måneder frem: <strong>~${kr(fVals[fwd - 1], 0)}</strong>, med et usikkerhetsbånd på ±${nf0.format(bandPct(fwd) * 100)} % som kombinerer aksjens faktiske volatilitet (${nf0.format(volAnnual)} % årlig) og spriket i analytikernes mål. `;
    if (ens) txt += `En ensemblemodell (mean reversion + momentum + langsiktig verdi, vektet etter historisk treffrate) gir nå et <strong>${ens.curScore >= 0.15 ? "positivt" : ens.curScore <= -0.15 ? "negativt" : "nøytralt"}</strong> samlet signal og traff ${ens.valRate == null ? "–" : nf0.format(ens.valRate) + " %"} på uavhengige valideringsdata. `;
    txt += `Grensen for dyr/billig er nå ±${nf1.format(thr)} % (kalibrert mot volatiliteten). Konklusjon: aksjen ser <strong>${rating.toLowerCase()}</strong> ut mot sin egen verdibane, mens verdsettelse og soliditet ${fundament}.`;
    document.getElementById("ai-rationale").innerHTML = txt;

    aiState = { rating, gap, fairEnd, anchors, anchorAvg, sc, signals, volAnnual, bt, ens, thr, fairMult, spreadFrac, peerAvgPe, ret1y, fwd, fLast: fwd > 0 ? fVals[fwd - 1] : null, target };
  }
  draw();

  const methodBtn = document.getElementById("ai-method-btn");
  if (methodBtn) methodBtn.addEventListener("click", () => openModal("Hvordan AI-modellen tenker", buildMethodModal()));
}
let aiState = {};
function buildMethodModal() {
  const s = aiState, q = STB_DATA.quote;
  const pos = s.signals ? s.signals.filter((x) => x.good).length : 0;
  const neg = s.signals ? s.signals.filter((x) => !x.good).length : 0;
  const anchorTxt = s.anchors ? s.anchors.map((a) => `${a.label} (${kr(a.value, 0)})`).join(", ") : "–";
  const usesLLM = typeof STB_AI_VIEW !== "undefined" && STB_AI_VIEW.body;
  const wrap = document.createElement("div");
  wrap.innerHTML =
    `<div class="modal-sub">Modellen er <strong>ikke en svart boks</strong>. Den kjører åpent i nettleseren på de ekte tallene på siden, og hvert steg kan etterprøves. Den er et beslutningsstøtte-verktøy, ikke et kjøps- eller salgsråd.</div>` +
    `<div class="method-h">Metodene den bruker</div>` +
    `<ul class="method-list">` +
    `<li><strong>Verdilinje:</strong> et glidende snitt av kursen som trekkes mot en fundamental verdi. Den fundamentale delen <em>følger inntjeningen</em> — resultat per aksje (TTM) × en implisitt rimelig multippel${s.fairMult ? ` (~${nf1.format(s.fairMult)}×)` : ""} — så verdien flytter seg når resultatene endres, ikke bare når kursen gjør det.</li>` +
    `<li><strong>Fundamental forankring:</strong> snittet av flere uavhengige ankere — ${anchorTxt} — gir ${s.anchorAvg ? kr(s.anchorAvg, 0) : "–"}.</li>` +
    `<li><strong>${s.signals ? s.signals.length : 7} signaler:</strong> verdi vs. kurs, analytikermål, P/E og utbytte mot bransjen, relativ styrke, 52-ukers posisjon, soliditet${s.signals && s.signals.some((x) => x.label === "Renteretning") ? " og renteretning" : ""}.</li>` +
    `<li><strong>Fremtidsprojeksjon:</strong> konvergerer mot fundamental verdi, med et usikkerhetsbånd som kombinerer aksjens <em>faktiske</em> volatilitet (${s.volAnnual != null ? nf0.format(s.volAnnual) + " % årlig" : "–"}) og spriket mellom høyeste og laveste analytikermål.</li>` +
    `<li><strong>Ensemble (walk-forward):</strong> tre delmodeller (mean reversion, momentum, langsiktig verdi) vektes etter treffrate på en treningsperiode og valideres på en senere, uavhengig periode — så vektene ikke er overtilpasset.</li>` +
    `<li><strong>Dynamisk terskel:</strong> grensen for «dyr»/«billig» skaleres med volatiliteten (nå ±${s.thr != null ? nf1.format(s.thr) : "6"} %) i stedet for et fast tall.</li>` +
    `<li><strong>Språkmodell (valgfri):</strong> en Anthropic Claude-modell skriver en kort kommentar ut fra de ferske tallene. ${usesLLM ? "Aktiv nå." : "Ikke aktiv (krever API-nøkkel) — den regelbaserte vurderingen brukes i stedet."}</li>` +
    `</ul>` +
    (s.ens ? `<div class="method-h">Ensemble – delmodeller</div><table class="ens-table"><thead><tr><th>Delmodell</th><th class="num">Treffrate</th><th class="num">Vekt</th><th>Nå</th></tr></thead><tbody>` +
      s.ens.models.map((m) => `<tr><td>${m.name}</td><td class="num">${nf0.format(m.rate)} %</td><td class="num">${nf0.format(m.weight * 100)} %</td><td><span style="color:${m.dir > 0 ? "var(--up)" : m.dir < 0 ? "var(--down)" : "var(--mut)"}">${m.dir > 0 ? "▲ opp" : m.dir < 0 ? "▼ ned" : "–"}</span></td></tr>`).join("") +
      `</tbody></table><p class="ntext" style="color:var(--mut);margin-top:6px">Kombinert traff ensemblet ${s.ens.valRate == null ? "–" : nf0.format(s.ens.valRate) + " %"} på ${s.ens.valN} uavhengige valideringstester (vekter satt på en tidligere treningsperiode).</p>` : "") +
    `<div class="method-h">Hvorfor konklusjonen «${s.rating || "–"}» akkurat nå</div>` +
    `<p class="ntext" style="color:var(--tx)">Kursen (${kr(q.price, 0)}) ligger ${s.gap != null ? nf1.format(Math.abs(s.gap)) + " % " + (s.gap >= 0 ? "over" : "under") : "–"} den estimerte verdien (${s.fairEnd != null ? kr(s.fairEnd, 0) : "–"}). ` +
    `Av signalene peker <strong style="color:var(--up)">${pos} positivt</strong> og <strong style="color:var(--down)">${neg} negativt</strong> (nettoscore ${s.sc >= 0 ? "+" : ""}${s.sc}). ` +
    `Grensen for «dyr»/«billig» er nå ±${s.thr != null ? nf1.format(s.thr) : "6"} % (kalibrert mot volatiliteten); innenfor det kalles den «rimelig priset».</p>` +
    `<div class="method-sig" id="method-sig"></div>` +
    `<p class="ntext" style="margin-top:14px;color:var(--mut)">Modellen forutsier ikke fremtiden og tar ikke høyde for nyheter eller hendelser som ikke ligger i tallene. Bruk den som ett av flere verktøy.</p>`;
  const sigBox = wrap.querySelector("#method-sig");
  if (s.signals) s.signals.forEach((x) => sigBox.appendChild(h(`<span class="ai-chip ${x.good ? "good" : "bad"}">${x.good ? "▲" : "▼"} ${x.label}<span class="ai-chip-sub">${x.detail}</span></span>`)));
  return wrap;
}
const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sig = (label, good, detail) => ({ label, good, detail });

// Ekte språkmodell-generert kommentar (js/ai-view.js), hvis den finnes.
function renderAiView() {
  const box = document.getElementById("ai-llm");
  if (!box || typeof STB_AI_VIEW === "undefined" || !STB_AI_VIEW.body) return;
  const v = STB_AI_VIEW;
  box.hidden = false;
  box.innerHTML =
    `<div class="ai-llm-head"><span class="ai-llm-tag">Språkmodell-vurdering</span>` +
    (v.verdict ? `<span class="ai-llm-verdict">${v.verdict}</span>` : "") + `</div>` +
    (v.headline ? `<div class="ai-llm-title">${v.headline}</div>` : "") +
    `<p class="ai-llm-body">${v.body}</p>` +
    `<div class="ai-llm-foot">Generert ${v.generated || ""} av en språkmodell ut fra de ferske nøkkeltallene på siden.</div>`;
}

/* ---------- 52-ukers meter ---------- */
function renderRangeMeter() {
  const q = STB_DATA.quote, m = document.getElementById("range-meter");
  const p = (v) => Math.max(0, Math.min(100, ((v - q.week52Low) / (q.week52High - q.week52Low)) * 100));
  const cur = p(q.price), tgt = p(q.analystTarget);
  m.appendChild(h(`<div class="fill grad" style="width:${cur}%"></div>`));
  m.appendChild(h(`<div class="tick" style="left:${cur}%;background:var(--tx)"></div>`));
  m.appendChild(h(`<div class="flag" style="left:${cur}%;top:-24px">${kr(q.price, 0)}</div>`));
  m.appendChild(h(`<div class="tick" style="left:${tgt}%;background:var(--peer)"></div>`));
  m.appendChild(h(`<div class="flag" style="left:${tgt}%;top:16px;color:var(--peer)">Mål ${kr(q.analystTarget, 0)}</div>`));
  document.getElementById("range-low").textContent = nf0.format(q.week52Low);
  document.getElementById("range-high").textContent = nf0.format(q.week52High);
  const cntEl = document.getElementById("analyst-count");
  if (cntEl && q.analystCount) cntEl.textContent = ` (${q.analystRating || "snitt"}, ${q.analystCount} analytikere)`;
}

/* ---------- Selskap + segmenter ---------- */
function renderCompany() {
  document.getElementById("company-desc").textContent = STB_DATA.company.description;
  const subs = document.getElementById("company-subs");
  STB_DATA.company.subsidiariesDetailed.forEach((c) => {
    subs.appendChild(h(`<div class="tickline"><span class="mk">▸</span><div><span style="font-weight:600">${c.name}</span><span class="desc"> — ${c.desc}</span></div></div>`));
  });
  const segs = STB_DATA.segments, maxV = Math.max(...segs.map((s) => s.value));
  document.getElementById("segment-sub").textContent = "Q2 2026, kontantresultat i millioner kroner — hvor pengene tjenes";
  const bars = document.getElementById("segment-bars");
  segs.forEach((s) => {
    bars.appendChild(h(`<div class="seg-row"><div class="seg-head"><span>${s.name}${s.growth ? ' <span style="color:var(--mut)">' + s.growth + "</span>" : ""}</span><span class="mono">${nf0.format(s.value)}</span></div><div class="seg-track"><div class="seg-fill" style="width:${(s.value / maxV) * 100}%"></div></div></div>`));
  });
  const sum = segs.reduce((a, s) => a + s.value, 0);
  document.getElementById("segment-sum").textContent = `Sum kontantresultat Q2 2026: ${nf0.format(sum)} mill. (+26 % å/å)`;
}

/* ---------- Utbytte ---------- */
function renderDividends() {
  const divs = STB_DATA.dividends, maxA = Math.max(...divs.map((d) => d.amount));
  const bars = document.getElementById("div-bars");
  divs.forEach((d) => {
    const hpx = d.amount === 0 ? 3 : Math.round((d.amount / maxA) * 140);
    const isCut = d.amount === 0;
    bars.appendChild(h(`<div class="colbar"><span class="amt" style="color:${isCut ? "var(--down)" : "var(--tx)"}">${isCut ? "0" : nf2.format(d.amount)}</span><div class="bar" style="height:${hpx}px;background:${isCut ? "var(--down)" : "var(--acc)"}"></div><span class="yr">${d.year}</span></div>`));
  });
  const st = STB_DATA.dividendStats;
  // Utdelingsgrad beregnes live fra siste utbytte / resultat per aksje (fallback til lagret verdi).
  const lastDiv = divs[divs.length - 1].amount;
  const payout = STB_DATA.quote.epsTtm ? (lastDiv / STB_DATA.quote.epsTtm) * 100 : st.payoutRatio;
  const stats = [["Direkteavkastning", nf1.format(STB_DATA.quote.dividendYield) + " %"], ["Utdelingsgrad", nf0.format(payout) + " %"], ["Vekst siste år", pct1(st.oneYearGrowthPct)]];
  const g = document.getElementById("div-stats");
  stats.forEach(([l, v]) => g.appendChild(h(`<div class="ministat"><div class="label">${l}</div><div class="val">${v}</div></div>`)));

  const tbody = document.getElementById("div-table-body");
  divs.forEach((d) => tbody.appendChild(h(`<tr><td class="mono">${d.year}</td><td class="num">${d.amount === 0 ? "0,00 kr" : kr(d.amount)}</td><td class="num" style="color:var(--mut)">${d.exDate}</td><td class="num" style="color:var(--mut)">${d.payDate}</td></tr>`)));
  const btn = document.getElementById("div-toggle"), wrap = document.getElementById("div-table-wrap");
  btn.addEventListener("click", () => { const s = wrap.hidden; wrap.hidden = !s; btn.textContent = s ? "Skjul tabell" : "Vis tabell"; });
}

/* ---------- Nøkkeltall / solvens / AUM / mål ---------- */
function renderKeyFigures() {
  const k = STB_DATA.kpis;
  document.getElementById("solvency-num").textContent = k.solvency + " %";
  document.getElementById("solvency-sub").textContent = "Solid buffer per Q2 2026";
  const meter = document.getElementById("solvency-meter");
  const scale = 250; // 0–250 % skala
  meter.appendChild(h(`<div class="fill up" style="width:${(k.solvency / scale) * 100}%"></div>`));
  meter.appendChild(h(`<div class="tick" style="left:${(175 / scale) * 100}%;background:var(--down)"></div>`));
  meter.appendChild(h(`<div class="flag" style="left:${(175 / scale) * 100}%;top:18px;color:var(--down)">175 % terskel</div>`));

  const stats = [["Combined ratio", k.combinedRatioQ + " %", "combined"], ["Egenkapitalavk.", k.roeTtm + " %", "roe"], ["Kontant-ROE", k.roeCashAnnualized + " %", "cashroe"], ["Markedsandel skade", nf1.format(k.retailPcMarketShare) + " %"]];
  const g = document.getElementById("key-stats");
  stats.forEach(([l, v, info]) => g.appendChild(h(`<div class="ministat"><div class="label">${l}${info ? infoIcon(info) : ""}</div><div class="val">${v}</div></div>`)));

  const aum = STB_DATA.aumHistory, maxAum = Math.max(...aum.map((a) => a.value));
  const ab = document.getElementById("aum-bars");
  aum.forEach((a) => {
    const hpx = Math.round((a.value / maxAum) * 110);
    ab.appendChild(h(`<div class="colbar"><span class="amt">${nf0.format(a.value)}</span><div class="bar" style="height:${hpx}px;background:color-mix(in srgb, var(--acc) 70%, var(--sf2))"></div><span class="yr">${a.year}</span></div>`));
  });

  const t = STB_DATA.targets, list = document.getElementById("targets-list");
  t.items.forEach((it) => list.appendChild(h(`<div class="goalline"><span class="mk">▸</span><span>${it.label}: <strong>${it.value}</strong></span></div>`)));
  list.appendChild(h(`<div class="goalline"><span class="mk">▸</span><span style="color:var(--mut)">${t.dividendPolicy}</span></div>`));
}

/* ---------- Rapporter ---------- */
function renderReports() {
  const r = STB_DATA.reports;
  document.getElementById("reports-lead").textContent = `Siste rapportering: ${r.latest.period}, publisert ${r.latest.reportDate}. Se storebrand.no/ir for fullstendige tall.`;
  document.getElementById("highlights-title").textContent = "Høydepunkter " + r.latest.period;
  const hi = document.getElementById("report-highlights");
  r.latest.highlights.forEach((txt) => hi.appendChild(h(`<div class="kv-row"><span class="k">${txt}</span></div>`)));
  const cal = document.getElementById("report-calendar");
  r.calendar.forEach((c) => cal.appendChild(h(`<div class="cal-row"><span class="date">${c.date}</span><span>${c.label} · ${c.status}</span></div>`)));
  const links = document.getElementById("report-links");
  r.links.forEach((l) => { const a = document.createElement("a"); a.href = l.url; a.target = "_blank"; a.rel = "noopener"; a.className = "src-pill"; a.textContent = l.label + " ↗"; links.appendChild(a); });
}

/* ---------- Live børsmeldinger fra Oslo Børs NewsWeb ---------- */
const NW_CAT = {
  "MELDEPLIKTIG HANDEL FOR PRIMÆRINNSIDERE": "Innsidehandel",
  "UTSTEDERS MELDEPLIKT VED HANDEL I EGNE AKSJER": "Tilbakekjøp",
  "HALVÅRSRAPPORT": "Rapport",
  "KVARTALSRAPPORT": "Rapport",
  "ÅRSRAPPORT": "Årsrapport",
  "KAPITAL- OG STEMMERETTSENDRINGER": "Kapital",
  "ANNEN INFORMASJONSPLIKTIG REGULATORISK INFORMASJON": "Regulatorisk",
  "IKKE-INFORMASJONSPLIKTIGE PRESSEMELDINGER": "Presse",
  "INNKALLING TIL GENERALFORSAMLING": "Generalforsamling",
  "FLAGGEMELDINGER": "Flagging",
};
const nwCat = (c) => NW_CAT[c] || (c ? c.charAt(0) + c.slice(1).toLowerCase().split(" ")[0] : "");
function renderNewsFeed() {
  const card = document.getElementById("newsfeed-card");
  if (!card || typeof STB_NEWSFEED === "undefined" || !STB_NEWSFEED.messages || !STB_NEWSFEED.messages.length) return;
  card.hidden = false;
  document.getElementById("newsfeed-sub").textContent = `Offisielle meldinger publisert på Oslo Børs NewsWeb · sist hentet ${STB_NEWSFEED.updated}`;
  const list = document.getElementById("newsfeed-list");
  const fmtDate = (d) => { const p = d.split("-"); return `${p[2]}.${p[1]}.${p[0]}`; };
  STB_NEWSFEED.messages.forEach((n) => {
    list.appendChild(h(`<a class="nw-row" href="${n.url}" target="_blank" rel="noopener"><span class="nw-date">${fmtDate(n.date)}</span><span class="nw-title">${n.title}</span>${n.category ? `<span class="nw-cat">${nwCat(n.category)}</span>` : ""}</a>`));
  });
}

const insiderIsoDate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : s);
function insiderRow(t) {
  const val = t.shares != null ? nf0.format(t.shares * t.price) : "–";
  const sharesC = t.shares != null ? nf0.format(t.shares) : "flere";
  const typeCell = t.type === "Kjøp" ? '<span class="tag-buy">KJØP</span>' : t.type === "Salg" ? '<span class="tag-sell">SALG</span>' : t.type;
  const nameC = t.url ? `<a href="${t.url}" target="_blank" rel="noopener" class="linkish">${t.name}</a>` : t.name;
  const roleSub = t.role ? `<div style="font-size:11px;color:var(--mut)">${t.role}</div>` : "";
  return h(`<tr><td class="mono" style="color:var(--mut)">${insiderIsoDate(t.date)}</td><td>${nameC}${roleSub}</td><td>${typeCell}</td><td class="num">${sharesC}</td><td class="num">${nf0.format(t.price)}</td><td class="num">${val}</td></tr>`);
}
function showInsiderTable(txs) {
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Alle meldepliktige handler hentet fra Oslo Børs NewsWeb (${txs.length} transaksjoner). Klikk et navn for å åpne meldingen.</div>`));
  const scroll = h(`<div class="table-scroll"><table><thead><tr><th>Dato</th><th>Person / rolle</th><th>Type</th><th class="num">Antall</th><th class="num">Kurs</th><th class="num">Verdi (kr)</th></tr></thead><tbody></tbody></table></div>`);
  const tb = scroll.querySelector("tbody");
  txs.forEach((t) => tb.appendChild(insiderRow(t)));
  wrap.appendChild(scroll);
  openModal("Alle innsidehandler", wrap);
}

/* ---------- Innsidehandel / tilbakekjøp / eierstruktur ---------- */
function renderInsiders() {
  const d = STB_DATA.insiders;
  document.getElementById("insider-lead").textContent = d.note;
  if (d.sourceUrl) {
    document.getElementById("insider-source").innerHTML =
      `<a href="${d.sourceUrl}" target="_blank" rel="noopener" class="src-pill">${d.sourceLabel || "Oslo Børs NewsWeb ↗"}</a>`;
  }
  // Bruk ferske API-tolkede transaksjoner hvis de finnes, ellers kuratert fallback.
  const live = typeof STB_INSIDERS !== "undefined" && STB_INSIDERS.transactions && STB_INSIDERS.transactions.length;
  const txs = live ? STB_INSIDERS.transactions : d.transactions;
  const tb = document.getElementById("insider-table-body");
  txs.slice(0, 6).forEach((t) => tb.appendChild(insiderRow(t)));
  if (txs.length) {
    const label = txs.length > 6 ? `Se alle ${txs.length} innsidehandler ▸` : "Åpne full innsidehandel-tabell ▸";
    const link = h(`<button class="ghost-btn" id="insider-more" style="margin-top:10px;">${label}</button>`);
    link.addEventListener("click", () => showInsiderTable(txs));
    document.getElementById("insider-source").appendChild(link);
  }
  if (live) {
    document.getElementById("insider-lead").textContent =
      "Meldepliktige handler for primærinnsidere, hentet automatisk fra Oslo Børs NewsWeb og oppdatert løpende. Innsidere har i hovedsak vært nettokjøpere — ofte tolket positivt, men ingen garanti for kursutvikling.";
  }
  document.getElementById("buyback-text").textContent = d.buyback.description;
  const bm = document.getElementById("buyback-meter");
  bm.appendChild(h(`<div class="fill" style="width:50%"></div>`));

  const own = STB_DATA.ownershipBreakdown, ob = document.getElementById("ownership-bars");
  const maxOwn = Math.max(...own.map((o) => o.pct));
  own.forEach((o) => ob.appendChild(h(`<div class="seg-row"><div class="seg-head"><span>${o.name}</span><span class="mono" style="color:var(--mut)">${nf1.format(o.pct)} %</span></div><div class="seg-track"><div class="seg-fill" style="width:${(o.pct / maxOwn) * 100}%;background:var(--peer)"></div></div></div>`)));
  document.getElementById("ownership-note").textContent = STB_DATA.ownership.note;
}

/* ---------- Sammenligning ---------- */
function renderComparison() {
  const peers = STB_DATA.peers;
  const peBars = document.getElementById("pe-bars"), yBars = document.getElementById("yield-bars");
  const maxPe = Math.max(...peers.map((p) => p.pe)), maxY = Math.max(...peers.map((p) => p.dividendYield));
  peers.forEach((p) => {
    const col = p.isSubject ? "var(--acc)" : "var(--mut)", fw = p.isSubject ? 700 : 500;
    peBars.appendChild(h(`<div class="bar-row"><span style="font-weight:${fw}">${shortName(p.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${(p.pe / maxPe) * 100}%;background:${col}"></div></div><span class="bar-val">${nf1.format(p.pe)}</span></div>`));
    yBars.appendChild(h(`<div class="bar-row"><span style="font-weight:${fw}">${shortName(p.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${(p.dividendYield / maxY) * 100}%;background:${p.isSubject ? "var(--acc)" : "var(--peer)"}"></div></div><span class="bar-val">${nf1.format(p.dividendYield)} %</span></div>`));
  });
  const tb = document.getElementById("cmp-table-body");
  peers.forEach((p) => {
    // 1-års avkastning fra samme daglige serie som resten av siden (samkjørt).
    const series = p.isSubject ? STB_PRICES.oneY : (STB_PEER_PRICES[p.ticker] && STB_PEER_PRICES[p.ticker].oneY);
    const ret = oneYearRet(series);
    const val = ret == null ? p.oneYearPct : ret;
    const yr = val == null ? "–" : pct1(val);
    const yrCol = val == null ? "var(--mut)" : val >= 0 ? "var(--up)" : "var(--down)";
    tb.appendChild(h(`<tr class="${p.isSubject ? "subject" : ""}"><td style="font-weight:${p.isSubject ? 700 : 400}">${p.name}</td><td class="num">${nf1.format(p.price)} ${p.currency}</td><td class="num" style="color:var(--mut)">${nf0.format(p.marketCap)} mrd</td><td class="num">${nf1.format(p.pe)}</td><td class="num">${nf1.format(p.dividendYield)} %</td><td class="num" style="color:${yrCol}">${yr}</td></tr>`));
  });
}
const shortName = (n) => n.split(" ")[0];

/* ---------- Nyheter ---------- */
const NEWS_DATE = { positivt: "Nyhet", risiko: "Risiko", folgemedpaa: "Følg med" };
function renderNews() {
  const list = document.getElementById("news-list");
  STB_DATA.news.forEach((n) => {
    list.appendChild(h(`<div class="news-row ${n.tag}"><span class="ndate">${NEWS_DATE[n.tag] || ""}</span><div class="nbody"><div class="ntitle">${n.title}</div><div class="ntext">${n.body}</div></div></div>`));
  });
}

/* ---------- Kilder ---------- */
function renderSources() {
  document.getElementById("footer-updated").textContent = STB_DATA.meta.updated;
  const list = document.getElementById("sources-list");
  STB_DATA.sources.forEach((s) => { const a = document.createElement("a"); a.href = s.url; a.target = "_blank"; a.rel = "noopener"; a.className = "src-pill"; a.textContent = s.label; list.appendChild(a); });
}

/* ---------- Historikk-popup (P/E, direkteavkastning) ---------- */
// Årsslutt-kurs fra den månedlige maks-serien ("YYYY-MM").
function yearEndClose(year) {
  const rows = STB_PRICES.max.filter((d) => d[0].slice(0, 4) === String(year));
  return rows.length ? rows[rows.length - 1][1] : null;
}
// Enkel linjegraf med merkede punkter for popup-bruk. points = [[label, value], ...].
function historyChartSVG(points, fmt, color) {
  color = color || "var(--acc)";
  const W = 620, HH = 300, PADL = 54, PADR = 20, TOP = 22, BOT = 248;
  const svg = el("svg", { viewBox: `0 0 ${W} ${HH}`, class: "chart-svg" });
  const vals = points.map((p) => p[1]);
  let yMin = Math.min(...vals), yMax = Math.max(...vals);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const padY = (yMax - yMin) * 0.18 || 1; yMin = Math.max(0, yMin - padY); yMax += padY;
  const n = points.length;
  const X = (i) => PADL + (n === 1 ? 0.5 : i / (n - 1)) * (W - PADR - PADL);
  const Y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);
  for (let s = 0; s <= 4; s++) {
    const v = yMin + (yMax - yMin) * (s / 4), yy = Y(v);
    svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: yy, y2: yy, class: "chart-grid" }));
    svg.appendChild(el("text", { x: PADL - 8, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, fmt(v)));
  }
  const dense = n > 10;
  const xTicks = dense ? [0, Math.floor(n / 2), n - 1] : points.map((_, i) => i);
  xTicks.forEach((i) => svg.appendChild(el("text", { x: X(i), y: BOT + 22, "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle", class: "chart-axis" }, points[i][0])));
  let ap = ""; points.forEach((p, i) => (ap += (i ? " L " : "M ") + X(i) + " " + Y(p[1])));
  svg.appendChild(el("path", { d: ap + ` L ${X(n - 1)} ${BOT} L ${X(0)} ${BOT} Z`, fill: color, "fill-opacity": "0.08", stroke: "none" }));
  svg.appendChild(el("path", { d: ap, fill: "none", stroke: color, "stroke-width": dense ? "2" : "2.4" }));
  if (dense) {
    const i = n - 1;
    svg.appendChild(el("circle", { cx: X(i), cy: Y(points[i][1]), r: 4, fill: color }));
    svg.appendChild(el("text", { x: X(i), y: Y(points[i][1]) - 10, "text-anchor": "end", class: "chart-axis", fill: color, "font-weight": "600" }, fmt(points[i][1])));
  } else {
    points.forEach((p, i) => {
      svg.appendChild(el("circle", { cx: X(i), cy: Y(p[1]), r: 4, fill: color }));
      svg.appendChild(el("text", { x: X(i), y: Y(p[1]) - 10, "text-anchor": "middle", class: "chart-axis", fill: color, "font-weight": "600" }, fmt(p[1])));
    });
  }
  return svg;
}
// Tidsbasert flerlinje-graf (P/E- eller yield-sammenligning mot peers).
function multiLineTimeChart(seriesList, fmt) {
  const W = 620, H = 300, PADL = 50, PADR = 84, TOP = 16, BOT = 244;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg" });
  const allPts = seriesList.flatMap((s) => s.points), ts = allPts.map((p) => Date.parse(p[0]));
  const tMin = Math.min(...ts), tMax = Math.max(...ts), vals = allPts.map((p) => p[1]);
  let yMin = Math.min(...vals), yMax = Math.max(...vals); const padY = (yMax - yMin) * 0.1 || 1; yMin = Math.max(0, yMin - padY); yMax += padY;
  const X = (t) => PADL + (t - tMin) / (tMax - tMin) * (W - PADR - PADL);
  const Y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);
  for (let s = 0; s <= 4; s++) { const v = yMin + (yMax - yMin) * (s / 4), yy = Y(v); svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: yy, y2: yy, class: "chart-grid" })); svg.appendChild(el("text", { x: PADL - 6, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, fmt(v))); }
  [tMin, (tMin + tMax) / 2, tMax].forEach((t, i) => { const d = new Date(t); svg.appendChild(el("text", { x: X(t), y: BOT + 18, "text-anchor": i === 0 ? "start" : i === 2 ? "end" : "middle", class: "chart-axis" }, MND[d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2))); });
  seriesList.forEach((s) => {
    let d = ""; s.points.forEach((p, i) => (d += (i ? " L " : "M ") + X(Date.parse(p[0])) + " " + Y(p[1])));
    svg.appendChild(el("path", { d, fill: "none", stroke: s.color, "stroke-width": s.width || 2 }));
    const last = s.points[s.points.length - 1];
    svg.appendChild(el("text", { x: W - PADR + 4, y: Y(last[1]) + 4, class: "chart-axis", fill: s.color }, s.name.split(" ")[0]));
  });
  return svg;
}
// Bygg P/E- eller yield-serier siste år for STB + peers (forenklet: antar uendret inntjening/utbytte).
function peerRatioSeries(mode) {
  const out = [], q = STB_DATA.quote;
  const add = (name, color, ps, curRatio, curPrice, width) => {
    if (!ps || !ps.length || !curRatio || !curPrice) return;
    out.push({ name, color, width, points: ps.map((d) => [d[0], mode === "pe" ? curRatio * d[1] / curPrice : curRatio * curPrice / d[1]]) });
  };
  add("Storebrand", "var(--acc)", STB_PRICES.oneY, mode === "pe" ? q.peTtm : q.dividendYield, q.price, 2.6);
  STB_DATA.peers.filter((p) => !p.isSubject).forEach((p) => {
    const ps = STB_PEER_PRICES[p.ticker] && STB_PEER_PRICES[p.ticker].oneY;
    add(p.name, PEER_COLORS[p.ticker] || "var(--mut)", ps, mode === "pe" ? p.pe : p.dividendYield, p.price);
  });
  return out;
}
function appendPeerComparison(wrap, mode) {
  const cmp = peerRatioSeries(mode);
  if (cmp.length < 2) return;
  wrap.appendChild(h(`<div class="method-h" style="margin-top:20px;">${mode === "pe" ? "P/E" : "Direkteavkastning"} siste år vs. bransjen (forenklet)</div>`));
  wrap.appendChild(h(`<p class="ntext" style="color:var(--mut);margin:-2px 0 6px">Forenklet: antar uendret ${mode === "pe" ? "inntjening" : "utbytte"}, så linjene viser hvordan ${mode === "pe" ? "verdsettelsen" : "direkteavkastningen"} har beveget seg med kursen det siste året.</p>`));
  wrap.appendChild(multiLineTimeChart(cmp, mode === "pe" ? (v) => nf1.format(v) : (v) => nf1.format(v) + " %"));
}
function showPeHistory() {
  const q = STB_DATA.quote;
  const pts = STB_DATA.financialsHistory
    .map((f) => { const yc = yearEndClose(f.year); return yc && f.eps ? [String(f.year), yc / f.eps] : null; })
    .filter(Boolean);
  pts.push(["Nå", q.peTtm]);
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">P/E = kurs delt på resultat per aksje. Historiske punkter bruker årsslutt-kurs og selskapets rapporterte årlige EPS; «Nå» bruker dagens kurs og resultat siste 12 mnd.</div>`));
  wrap.appendChild(historyChartSVG(pts, (v) => nf1.format(v), "var(--acc)"));
  wrap.appendChild(h(`<p class="ntext" style="margin-top:14px;color:var(--mut)">Årlig EPS: ${STB_DATA.financialsHistory.map((f) => f.year + " " + nf2.format(f.eps) + " kr").join(" · ")} · nå ${nf2.format(q.epsTtm)} kr.</p>`));
  appendPeerComparison(wrap, "pe");
  openModal("P/E-utvikling", wrap);
}
function showYieldHistory() {
  const yrNow = new Date().getFullYear();
  const pts = STB_DATA.dividends
    .map((d) => { const yc = d.year >= yrNow ? STB_DATA.quote.price : yearEndClose(d.year); return yc ? [String(d.year), (d.amount / yc) * 100] : null; })
    .filter(Boolean);
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Direkteavkastning = utbytte delt på kurs. Beregnet som utbyttet betalt i året delt på årsslutt-kursen (siste år mot dagens kurs). 2020 var utbyttet kuttet til null.</div>`));
  wrap.appendChild(historyChartSVG(pts, (v) => nf1.format(v) + " %", "var(--peer)"));
  appendPeerComparison(wrap, "yield");
  openModal("Direkteavkastning over tid", wrap);
}
function showMarketCapHistory() {
  const q = STB_DATA.quote;
  // Implisitt aksjeantall = årets nettoresultat / EPS (fanger opp tilbakekjøp). Markedsverdi = kurs × antall.
  const pts = STB_DATA.financialsHistory
    .map((f) => { const yc = yearEndClose(f.year); if (!yc || !f.eps) return null; const sharesM = f.netIncome / f.eps; return [String(f.year), (yc * sharesM) / 1000]; })
    .filter(Boolean);
  pts.push(["Nå", q.marketCap]);
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Markedsverdi = kurs × antall aksjer (mrd. kr). Historikken bruker årsslutt-kurs og aksjeantallet utledet fra rapportert resultat og EPS, slik at tilbakekjøp fanges opp.</div>`));
  wrap.appendChild(historyChartSVG(pts, (v) => nf0.format(v), "var(--acc)"));
  openModal("Markedsverdi over tid", wrap);
}
function showSolvencyHistory() {
  const hist = STB_DATA.solvencyHistory || [];
  const pts = hist.map((s) => [String(s.year), s.value]);
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Solvensmargin (Solvens II) ved årsslutt. Storebrands langsiktige minstemål er 130 %, og over 175 % vurderes ekstrautbytte eller tilbakekjøp.</div>`));
  wrap.appendChild(historyChartSVG(pts, (v) => nf0.format(v) + " %", "var(--up)"));
  wrap.appendChild(h(`<p class="ntext" style="margin-top:12px;color:var(--mut)">Kilde: Storebrand kvartals- og årsrapporter.</p>`));
  openModal("Solvensmargin over tid", wrap);
}
function show1yPrice() {
  const pts = STB_PRICES.oneY;
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Kursutvikling siste 12 måneder (daglig sluttkurs). Full historikk finnes i Kurs-seksjonen.</div>`));
  wrap.appendChild(historyChartSVG(pts, (v) => nf0.format(v) + " kr", "var(--acc)"));
  const ret = oneYearRet(STB_PRICES.oneY);
  wrap.appendChild(h(`<p class="ntext" style="margin-top:12px;color:var(--mut)">Avkastning siste år: ${pct1(ret)} (fra ${nf0.format(pts[0][1])} til ${nf0.format(pts[pts.length - 1][1])} kr).</p>`));
  openModal("Avkastning siste 12 måneder", wrap);
}
function showSegmentDev() {
  const segs = STB_DATA.segments, fh = STB_DATA.financialsHistory;
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Konsernets resultat de siste årene (ekte årstall), og hvordan kontantresultatet fordeler seg på segmentene i siste kvartal mot samme kvartal i fjor. Full segment­historikk år for år ligger i årsrapportene.</div>`));
  // Ekte flerårig resultattrend for konsernet.
  wrap.appendChild(h(`<div class="method-h">Konsernresultat (mill. kr, netto)</div>`));
  wrap.appendChild(historyChartSVG(fh.map((f) => [String(f.year), f.netIncome]), (v) => nf0.format(v), "var(--acc)"));
  // Per-segment: siste kvartal mot samme kvartal i fjor.
  wrap.appendChild(h(`<div class="method-h" style="margin-top:20px;">Kontantresultat per segment: Q2 2026 vs Q2 2025</div>`));
  const withPrev = segs.map((s) => ({ ...s, prev: s.growthPct != null ? s.value / (1 + s.growthPct / 100) : null }));
  const maxV = Math.max(...segs.map((s) => s.value));
  withPrev.forEach((s) => {
    const barNow = (s.value / maxV) * 100, barPrev = s.prev != null ? (s.prev / maxV) * 100 : 0;
    wrap.appendChild(h(`<div class="seg-row" style="margin-bottom:14px;"><div class="seg-head"><span>${s.name}${s.growth ? ` <span style="color:var(--up)">${s.growth}</span>` : ""}</span><span class="mono">${nf0.format(s.value)}${s.prev != null ? ` <span style="color:var(--mut)">(${nf0.format(s.prev)})</span>` : ""}</span></div><div class="seg-track"><div class="seg-fill" style="width:${barNow}%"></div></div>${s.prev != null ? `<div class="seg-track" style="margin-top:4px;"><div class="seg-fill" style="width:${barPrev}%;background:var(--mut);opacity:.55"></div></div>` : ""}</div>`));
  });
  wrap.appendChild(h(`<div class="pop-legend"><span><span style="color:var(--acc)">▮</span> Q2 2026</span><span><span style="color:var(--mut)">▮</span> Q2 2025 (avledet)</span><a href="https://www.storebrand.no/en/investor-relations/annual-reports" target="_blank" rel="noopener" style="color:var(--acc)">Årsrapporter ↗</a></div>`));
  openModal("Resultat- og segmentutvikling", wrap);
}
function showCompanies() {
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Sentrale selskaper i Storebrand-konsernet, hvilket marked de dekker og hvor store de er. Konsernet forvalter samlet rundt 1 660 mrd. kroner.</div>`));
  const cards = document.createElement("div"); cards.className = "modal-cards";
  STB_DATA.company.subsidiariesDetailed.forEach((s) => {
    cards.appendChild(h(`<div class="modal-card"><div class="mc-top"><span class="mc-name">${s.name}</span><span class="mc-size">${s.size}</span></div><div class="mc-market">${s.market} · ${s.desc}</div><div class="mc-info">${s.info}</div></div>`));
  });
  wrap.appendChild(cards);
  openModal("Sentrale selskaper i konsernet", wrap);
}

function showBuybackHistory() {
  const bb = STB_DATA.insiders.buyback, sched = bb.schedule || [];
  const maxA = Math.max(...sched.map((s) => s.amount));
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Tilbakekjøp av egne aksjer. Øverst: faktisk gjennomførte tilbakekjøp per måned (fra Oslo Børs-meldinger). Nederst: annonsert program 2026 og prediksjon 2027–2030 fra selskapets policy. Tilbakekjøp reduserer antall aksjer og løfter normalt resultat per aksje.</div>`));

  // C3: faktisk gjennomførte tilbakekjøp, aggregert per måned (mill. kr).
  if (typeof STB_BUYBACKS !== "undefined" && STB_BUYBACKS.transactions && STB_BUYBACKS.transactions.length) {
    const txs = STB_BUYBACKS.transactions;
    const byMonth = new Map();
    txs.forEach((t) => { const key = t.iso.slice(0, 7); byMonth.set(key, (byMonth.get(key) || 0) + t.value); });
    const months = [...byMonth.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const totVal = txs.reduce((a, t) => a + t.value, 0), totSh = txs.reduce((a, t) => a + t.shares, 0);
    wrap.appendChild(h(`<div class="method-h">Gjennomført (siste meldinger)</div>`));
    const pts = months.map(([m, v]) => { const p = m.split("-"); return [`${MND[+p[1] - 1]} ${p[0].slice(2)}`, v / 1e6]; });
    wrap.appendChild(historyChartSVG(pts, (v) => nf0.format(v), "var(--up)"));
    wrap.appendChild(h(`<p class="ntext" style="margin-top:8px;color:var(--mut)">Sum i perioden: <strong style="color:var(--tx)">${nf0.format(totVal / 1e6)} mill. kr</strong> for ${nf0.format(totSh)} aksjer, over ${txs.length} handledager. Verdi per måned i mill. kr.</p>`));
    wrap.appendChild(h(`<div class="method-h" style="margin-top:20px;">Program og plan (mrd. kr)</div>`));
  }
  sched.forEach((s) => {
    const w = (s.amount / maxA) * 100;
    const col = s.kind === "predicted" ? "var(--mut)" : "var(--acc)";
    const tag = s.kind === "predicted" ? ' <span style="color:var(--mut)">prediksjon</span>' : s.done != null ? ` <span style="color:var(--up)">~${nf1.format(s.done)} mrd gjennomført</span>` : "";
    wrap.appendChild(h(`<div class="seg-row" style="margin-bottom:12px;"><div class="seg-head"><span>${s.year}${tag}</span><span class="mono">${nf1.format(s.amount)} mrd</span></div><div class="seg-track"><div class="seg-fill" style="width:${w}%;background:${col};${s.kind === "predicted" ? "opacity:.5;" : ""}"></div></div></div>`));
  });
  wrap.appendChild(h(`<p class="ntext" style="margin-top:6px;color:var(--mut)">${bb.cumulativeNote || ""}</p>`));
  wrap.appendChild(h(`<div class="pop-legend"><span><span style="color:var(--acc)">▮</span> Annonsert</span><span><span style="color:var(--mut)">▮</span> Prediksjon (policy)</span><a href="https://newsweb.oslobors.no/search?issuer=1955" target="_blank" rel="noopener" style="color:var(--acc)">Status-meldinger på Oslo Børs ↗</a></div>`));
  openModal("Tilbakekjøp – beløp og plan", wrap);
}
function showOwnershipHistory() {
  const own = STB_DATA.ownershipBreakdown, th = STB_DATA.treasuryHistory || [];
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Storebrand er bredt eid. Det finnes ingen offentlig sammenhengende tidsserie for hele aksjonærlisten, men eierendringer flagges på Oslo Børs når terskler krysses. Under: største eiere nå, og utviklingen i egne (tilbakekjøpte) aksjer.</div>`));
  const maxOwn = Math.max(...own.map((o) => o.pct));
  own.forEach((o) => wrap.appendChild(h(`<div class="seg-row" style="margin-bottom:8px;"><div class="seg-head"><span>${o.name}</span><span class="mono" style="color:var(--mut)">${nf1.format(o.pct)} %</span></div><div class="seg-track"><div class="seg-fill" style="width:${(o.pct / maxOwn) * 100}%;background:var(--peer)"></div></div></div>`)));
  if (th.length >= 2) {
    wrap.appendChild(h(`<div class="method-h">Egne aksjer (tilbakekjøpt) over tid</div>`));
    wrap.appendChild(h(`<p class="ntext" style="color:var(--tx)">${th.map((t) => `${nf2.format(t.pct)} % (${t.date})`).join(" → ")}. Andelen svinger med tilbakekjøp (øker) og sletting eller tildeling (reduserer).</p>`));
  }
  wrap.appendChild(h(`<div class="pop-legend"><a href="https://newsweb.oslobors.no/search?issuer=1955" target="_blank" rel="noopener" style="color:var(--acc)">Se flaggemeldinger på Oslo Børs ↗</a><a href="https://www.proff.no/aksjon%C3%A6rer/-/storebrand-asa/916300484" target="_blank" rel="noopener" style="color:var(--acc)">Aksjonærer på Proff.no ↗</a></div>`));
  openModal("Eierstruktur", wrap);
}

function showAnalystTargets() {
  const q = STB_DATA.quote, price = q.price, con = analystConsensus();
  const pts = con.listed.filter((a) => a.target).map((a) => ({ firm: a.firm, target: a.target, t: a.t, buy: /kjøp/i.test(a.rating), fresh: a.fresh }));
  const th = (typeof STB_TARGET_HISTORY !== "undefined" && STB_TARGET_HISTORY.points) ? STB_TARGET_HISTORY.points.map((p) => ({ t: Date.parse(p.date), mean: p.mean })) : [];
  const wrap = document.createElement("div");
  wrap.appendChild(h(`<div class="modal-sub">Hvert meglerhus sitt siste kursmål plottet på datoen det ble satt (fargelagt etter anbefaling), mot dagens kurs og konsensus. Blasse prikker er mål satt før siste kvartalsrapport (utdaterte, teller ikke i konsensus).</div>`));
  const W = 620, H = 320, PADL = 46, PADR = 96, TOP = 18, BOT = 250;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg" });
  const allT = [...pts.map((p) => p.t), ...th.map((m) => m.t), Date.now()];
  const tMin = Math.min(...allT), tMax = Math.max(...allT) + 3 * 86400000;
  const allY = [...pts.map((p) => p.target), price, con.high, con.low].filter((v) => v != null);
  let yMin = Math.min(...allY), yMax = Math.max(...allY); const padY = (yMax - yMin) * 0.12 || 10; yMin -= padY; yMax += padY;
  const X = (t) => (tMax === tMin ? PADL + (W - PADR - PADL) / 2 : PADL + (t - tMin) / (tMax - tMin) * (W - PADR - PADL));
  const Y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);
  for (let s = 0; s <= 4; s++) { const v = yMin + (yMax - yMin) * (s / 4), yy = Y(v); svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: yy, y2: yy, class: "chart-grid" })); svg.appendChild(el("text", { x: PADL - 6, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, nf0.format(v))); }
  [tMin, tMax].forEach((t, i) => { const d = new Date(t); svg.appendChild(el("text", { x: X(t), y: BOT + 20, "text-anchor": i === 0 ? "start" : "end", class: "chart-axis" }, MND[d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2))); });
  const hline = (v, col, label) => { if (v == null) return; svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: Y(v), y2: Y(v), stroke: col, "stroke-width": 1, "stroke-dasharray": "4,3" })); svg.appendChild(el("text", { x: W - PADR + 5, y: Y(v) + 4, class: "chart-axis", fill: col }, `${label} ${nf0.format(v)}`)); };
  hline(con.high, "var(--mut)", "Høy");
  hline(con.low, "var(--mut)", "Lav");
  hline(price, "var(--tx)", "Kurs");
  if (th.length > 1) { let d = ""; th.forEach((m, i) => (d += (i ? " L " : "M ") + X(m.t) + " " + Y(m.mean))); svg.appendChild(el("path", { d, fill: "none", stroke: "var(--peer)", "stroke-width": 2 })); }
  hline(con.mean, "var(--peer)", "Snitt");
  pts.forEach((p) => { const c = p.buy ? "var(--up)" : "var(--down)"; svg.appendChild(el("circle", { cx: X(p.t), cy: Y(p.target), r: 4.5, fill: c, opacity: p.fresh ? "1" : "0.35" })); });
  wrap.appendChild(svg);
  wrap.appendChild(h(`<div class="pop-legend"><span><span style="color:var(--up)">●</span> Kjøp</span><span><span style="color:var(--down)">●</span> Undervekt/negativ</span><span><span style="color:var(--peer)">—</span> Konsensus (snitt)</span></div>`));
  wrap.appendChild(h(`<p class="ntext" style="margin-top:10px;color:var(--mut)">Konsensus regnes fra ${con.source === "fresh" ? con.count + " ferske mål (etter siste kvartalsrapport)" : "Yahoo Finance"}. Full tabell med hvem som har hvilket mål står under grafen på siden.</p>`));
  openModal("Analytikernes kursmål over tid", wrap);
}

/* ---------- Analytikernes kursmål ---------- */
const parseNoDate = (d) => { const p = d.split("."); return Date.parse(`${p[2]}-${p[1]}-${p[0]}`); };
function analystConsensus() {
  // C1: konsensus beregnes kun fra mål oppdatert etter siste kvartalsrapport (ferske).
  const at = STB_DATA.analystTargets || {}, q = STB_DATA.quote;
  const qd = at.quarterDate ? Date.parse(at.quarterDate) : 0;
  const listed = (at.list || []).map((a) => ({ ...a, t: parseNoDate(a.date), fresh: parseNoDate(a.date) >= qd }));
  const fresh = listed.filter((a) => a.fresh && a.target);
  if (fresh.length >= 3) {
    const tg = fresh.map((a) => a.target);
    return { listed, mean: avg(tg), high: Math.max(...tg), low: Math.min(...tg), count: fresh.length, source: "fresh" };
  }
  return { listed, mean: q.analystTarget, high: q.analystHigh, low: q.analystLow, count: q.analystCount, source: "yahoo" };
}
function renderAnalysts() {
  const q = STB_DATA.quote;
  const con = analystConsensus();
  const low = con.low, high = con.high, mean = con.mean, price = q.price;
  const lo = Math.min(low, price) * 0.98, hi = Math.max(high, price) * 1.02;
  const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const m = document.getElementById("analyst-meter");
  m.appendChild(h(`<div class="fill grad" style="left:${pos(low)}%;width:${pos(high) - pos(low)}%"></div>`));
  m.appendChild(h(`<div class="tick" style="left:${pos(mean)}%;background:var(--peer)"></div>`));
  m.appendChild(h(`<div class="flag" style="left:${pos(mean)}%;top:-24px;color:var(--peer)">Snitt ${kr(mean, 0)}</div>`));
  m.appendChild(h(`<div class="tick" style="left:${pos(price)}%;background:var(--tx)"></div>`));
  m.appendChild(h(`<div class="flag" style="left:${pos(price)}%;top:12px;color:var(--tx)">Kurs ${kr(price, 0)}</div>`));
  document.getElementById("analyst-low-lbl").textContent = nf0.format(low);
  document.getElementById("analyst-high-lbl").textContent = nf0.format(high);

  const upside = (t) => { const u = (t / price - 1) * 100; const c = u >= 0 ? "var(--up)" : "var(--down)"; return `<span style="color:${c}">${pct1(u)}</span>`; };
  const rows = [
    ["Høyeste kursmål", high, upside(high)],
    ["Gjennomsnitt (konsensus)", mean, upside(mean)],
    ["Laveste kursmål", low, upside(low)],
  ];
  const tb = document.getElementById("analyst-table-body");
  rows.forEach(([label, val, up]) => tb.appendChild(h(`<tr><td>${label}</td><td class="num">${nf0.format(val)}</td><td class="num">${up}</td></tr>`)));
  const conTxt = con.source === "fresh"
    ? `Konsensus beregnet fra <strong>${con.count}</strong> kursmål oppdatert etter siste kvartalsrapport (${nf0.format(con.low)}–${nf0.format(con.high)} kr). Eldre mål er markert og holdt utenfor. Snittet ligger ${pct1((mean / price - 1) * 100)} mot dagens kurs på ${kr(price, 0)}.`
    : `Konsensus er <strong>${q.analystRating || "–"}</strong> basert på ${q.analystCount || "flere"} analytikere. Snittet ligger ${pct1((mean / price - 1) * 100)} mot dagens kurs på ${kr(price, 0)}. Kilde: Yahoo Finance.`;
  document.getElementById("analyst-note").innerHTML = conTxt;

  // Enkeltmeglerhus (datert øyeblikksbilde) – utdaterte (før kvartalsrapport) markeres.
  const at = STB_DATA.analystTargets;
  if (at && at.list) {
    document.getElementById("analyst-firms-sub").textContent =
      `Kursmål per meglerhus – øyeblikksbilde ${at.asOf} (${at.source}). Mål satt før siste kvartalsrapport er merket «utdatert» og teller ikke i konsensus.`;
    const posC = { "Kjøp": "var(--up)", "Undervekt": "var(--down)", "Underperform": "var(--down)", "Hold": "var(--mut)", "Selg": "var(--down)" };
    const fb = document.getElementById("analyst-firms-body");
    con.listed.forEach((a) => {
      const up = a.target ? (a.target / price - 1) * 100 : null;
      const upCell = up == null ? "–" : `<span style="color:${up >= 0 ? "var(--up)" : "var(--down)"}">${pct1(up)}</span>`;
      const tgt = a.target ? nf0.format(a.target) : "–";
      const stale = !a.fresh;
      const staleTag = stale ? ' <span class="stale-tag">utdatert</span>' : "";
      fb.appendChild(h(`<tr style="${stale ? "opacity:.5;" : ""}"><td>${a.firm}${staleTag}</td><td><span style="color:${posC[a.rating] || "var(--tx)"}">${a.rating}</span></td><td class="num">${tgt}</td><td class="num">${upCell}</td><td class="num" style="color:var(--mut)">${a.date}</td></tr>`));
    });
  }
}

function wirePopups() {
  const wire = (id, fn) => { const e = document.getElementById(id); if (e) e.addEventListener("click", (ev) => { if (!ev.target.classList.contains("info-i")) fn(); }); };
  wire("segment-title", showSegmentDev);
  wire("company-subs-title", showCompanies);
  wire("cmp-pe-title", showPeHistory);
  wire("cmp-yield-title", showYieldHistory);
  wire("buyback-title", showBuybackHistory);
  wire("ownership-title", showOwnershipHistory);
  wire("analyst-firms-title", showAnalystTargets);
}

renderNav();
renderHeader();
renderStats();
renderPriceChart();
renderRangeMeter();
renderAiExpert();
renderAiView();
renderAnalysts();
renderCompany();
renderDividends();
renderKeyFigures();
renderReports();
renderNewsFeed();
renderInsiders();
renderComparison();
renderNews();
renderSources();
wirePopups();
wireInfoIcons();
