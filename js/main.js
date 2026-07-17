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
  tooltip.innerHTML = html;
  tooltip.style.left = evt.clientX + "px";
  tooltip.style.top = evt.clientY + "px";
  tooltip.classList.add("show");
}
const hideTip = () => tooltip.classList.remove("show");

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
  ["oversikt", "Oversikt"], ["kurs", "Kurs"], ["ai", "AI-ekspert"], ["selskap", "Selskap"],
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
    ["Kurs", kr(q.price), pct1(q.changePct) + " i dag"],
    ["Markedsverdi", nf1.format(q.marketCap) + " mrd", "NOK"],
    ["P/E", nf1.format(q.peTtm), "Siste 12 mnd"],
    ["Direkteavkastning", nf1.format(q.dividendYield) + " %", "Utbytte/kurs"],
    ["Solvensmargin", k.solvency + " %", "Bufferkapital"],
    ["Avkastning 1 år", pct1(oneYearRet(STB_PRICES.oneY) ?? q.perf.oneY), "Kursutvikling"],
  ];
  const g = document.getElementById("stat-grid");
  tiles.forEach(([label, val, sub]) => {
    g.appendChild(h(`<div class="stat"><div class="label">${label}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`));
  });
}

/* ---------- Prisgraf med periode + peer-sammenligning ---------- */
const PERIODS = [["1m", "1 mnd"], ["3m", "3 mnd"], ["oneY", "1 år"], ["fiveY", "5 år"], ["max", "Maks"]];
const PEER_SHORT = { "GJF.OL": "Gjensidige", "PROT.OL": "Protector", "TRYG.CO": "Tryg", "SAMPO.HE": "Sampo" };
const PEER_COLORS = { "GJF.OL": "#6ea8dc", "PROT.OL": "#3ecf8e", "TRYG.CO": "#c58af0", "SAMPO.HE": "#e8975a" };
const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
// 1-års avkastning beregnet fra daglig serie – samme metode for STB og alle peers.
const oneYearRet = (series) => (series && series.length > 1 ? ((series[series.length - 1][1] / series[0][1]) - 1) * 100 : null);
// Hent riktig kursserie for valgt periode. 1m/3m utledes fra den daglige 1-års-serien.
function seriesSlice(store, period) {
  if (!store) return null;
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

  // Realisert volatilitet → usikkerhetsbånd som vokser med kvadratroten av tid.
  const volD = dailyVol(STB_PRICES.oneY.map((d) => d[1]));
  const volAnnual = volD * Math.sqrt(252) * 100;
  const bandPct = (m) => Math.min(volD * Math.sqrt(m * 21), 0.35);

  // Track record – kjøres én gang (uavhengig av valgt periode).
  const bt = backtestSignal(STB_PRICES.oneY, 20, 21);
  const track = document.getElementById("ai-track");
  if (track) {
    track.innerHTML = "";
    [
      ["Treffrate retning", bt.rate == null ? "–" : nf0.format(bt.rate) + " %"],
      ["Testede signaler", bt.total ? nf0.format(bt.total) : "–"],
      ["Snittavk./signal", bt.avgFollow == null ? "–" : pct1(bt.avgFollow)],
      ["Årlig volatilitet", nf0.format(volAnnual) + " %"],
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

    // AI-estimat: glidende verdivurdering forankret gradvis mot den fundamentale verdien.
    const win = Math.max(5, Math.round(n / 6));
    const sma = prices.map((_, i) => { const a = Math.max(0, i - win + 1), s = prices.slice(a, i + 1); return s.reduce((x, v) => x + v, 0) / s.length; });
    const fair = sma.map((v, i) => { const w = (i / (n - 1)) * 0.35; return v * (1 - w) + target * w; });
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
    if (gap > 6) { rating = "Dyr priset"; cls = "down"; }
    else if (gap < -6) { rating = "Billig priset"; cls = "up"; }
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
    const sc = signals.filter((s) => s.good).length - signals.filter((s) => !s.good).length;
    const chips = document.getElementById("ai-signals"); chips.innerHTML = "";
    signals.forEach((s) => chips.appendChild(h(`<span class="ai-chip ${s.good ? "good" : "bad"}">${s.good ? "▲" : "▼"} ${s.label}<span class="ai-chip-sub">${s.detail}</span></span>`)));

    const fundament = sc >= 2 ? "trekker i positiv retning" : sc <= -2 ? "trekker i negativ retning" : "er blandet";
    const anchorTxt = anchors.map((a) => `${a.label} ${kr(a.value, 0)}`).join(", ");
    let txt = `Etter en oppgang på ${pct1(ret1y)} det siste året handles Storebrand nå ${nf1.format(Math.abs(gap))} % ${gap >= 0 ? "over" : "under"} AI-ekspertens estimerte verdi på ${kr(fairEnd, 0)}. `;
    if (anchors.length > 1) txt += `Den verdien er forankret i ${anchors.length} uavhengige mål (${anchorTxt}) med et snitt på ${kr(anchorAvg, 0)}. `;
    txt += `Verdsettelsen (P/E ${nf1.format(q.peTtm)}) er ${q.peTtm <= peerAvgPe ? "lavere" : "høyere"} enn snittet for lignende selskaper (${nf1.format(peerAvgPe)}), og solvensmarginen på ${k.solvency} % ${k.solvency >= 175 ? "gir rom for fortsatte tilbakekjøp" : "er solid"}. `;
    if (fwd > 0) txt += `Anslag ${fwd} måneder frem: <strong>~${kr(fVals[fwd - 1], 0)}</strong>, med et usikkerhetsbånd på ±${nf0.format(bandPct(fwd) * 100)} % utledet fra aksjens faktiske volatilitet (${nf0.format(volAnnual)} % årlig). `;
    txt += `Historisk har retningssignalet truffet ${bt.rate == null ? "–" : nf0.format(bt.rate) + " %"} av gangene på ${bt.total} tester siste år. Konklusjon: aksjen ser <strong>${rating.toLowerCase()}</strong> ut mot sin egen verdibane, mens verdsettelse og soliditet ${fundament}.`;
    document.getElementById("ai-rationale").innerHTML = txt;
  }
  draw();
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

  const stats = [["Combined ratio", k.combinedRatioQ + " %"], ["Egenkapitalavk.", k.roeTtm + " %"], ["Kontant-ROE", k.roeCashAnnualized + " %"], ["Markedsandel skade", nf1.format(k.retailPcMarketShare) + " %"]];
  const g = document.getElementById("key-stats");
  stats.forEach(([l, v]) => g.appendChild(h(`<div class="ministat"><div class="label">${l}</div><div class="val">${v}</div></div>`)));

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

/* ---------- Innsidehandel / tilbakekjøp / eierstruktur ---------- */
function renderInsiders() {
  const d = STB_DATA.insiders;
  document.getElementById("insider-lead").textContent = d.note;
  const tb = document.getElementById("insider-table-body");
  d.transactions.forEach((t) => {
    const val = t.shares * t.price;
    const typeCell = t.type === "Kjøp" ? '<span class="tag-buy">KJØP</span>' : t.type;
    tb.appendChild(h(`<tr><td class="mono" style="color:var(--mut)">${t.date}</td><td>${t.name}</td><td>${typeCell}</td><td class="num">${nf0.format(t.shares)}</td><td class="num">${nf0.format(t.price)}</td><td class="num">${nf0.format(val)}</td></tr>`));
  });
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

renderNav();
renderHeader();
renderStats();
renderPriceChart();
renderRangeMeter();
renderAiExpert();
renderAiView();
renderCompany();
renderDividends();
renderKeyFigures();
renderReports();
renderInsiders();
renderComparison();
renderNews();
renderSources();
