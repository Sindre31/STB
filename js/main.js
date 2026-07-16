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
    });
  }
})();

/* ---------- Tema ---------- */
(function initTheme() {
  const saved = localStorage.getItem("stb-theme");
  if (saved === "light") document.body.classList.add("light");
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
  ["oversikt", "Oversikt"], ["kurs", "Kurs"], ["prediksjon", "Prediksjon"], ["selskap", "Selskap"],
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
    ["Avkastning 1 år", pct1(q.perf.oneY), "Kursutvikling"],
  ];
  const g = document.getElementById("stat-grid");
  tiles.forEach(([label, val, sub]) => {
    g.appendChild(h(`<div class="stat"><div class="label">${label}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`));
  });
}

/* ---------- Prisgraf med periode + peer-sammenligning ---------- */
const PERIODS = [["oneY", "1 år"], ["fiveY", "5 år"], ["max", "Maks"]];
const PEER_SHORT = { "GJF.OL": "Gjensidige", "PROT.OL": "Protector", "TRYG.CO": "Tryg", "SAMPO.HE": "Sampo" };

function renderPriceChart() {
  const svg = document.getElementById("price-chart");
  let period = "oneY", cmp = null;

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
      cmp = cmp === tk ? null : tk;
      [...peerWrap.querySelectorAll(".pbtn")].forEach((x) => x.classList.toggle("active", x.dataset.tk === cmp));
      draw();
    });
    peerWrap.appendChild(b);
  });

  const PADL = 48, PADR = 16, TOP = 14, BOT = 292, W = 800, XR = W - PADR;
  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const stb = STB_PRICES[period];
    const comparing = cmp && STB_PEER_PRICES[cmp] ? STB_PEER_PRICES[cmp][period] : null;

    // Indekser hvis sammenligning
    let sA, sB, yMin, yMax, yFmt;
    if (comparing) {
      const idx = (arr) => arr.map((d, i) => arr[0][1] ? (d[1] / arr[0][1]) * 100 : 100);
      sA = idx(stb); sB = idx(comparing);
      yMin = Math.min(...sA, ...sB); yMax = Math.max(...sA, ...sB);
      yFmt = (v) => nf0.format(v);
    } else {
      sA = stb.map((d) => d[1]); sB = null;
      yMin = Math.min(...sA); yMax = Math.max(...sA);
      yFmt = (v) => nf0.format(v);
    }
    const padY = (yMax - yMin) * 0.08 || 1; yMin -= padY; yMax += padY;
    const xA = (i, n) => PADL + (i / (n - 1)) * (XR - PADL);
    const y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);

    // gridlines + y-ticks
    for (let s = 0; s <= 4; s++) {
      const v = yMin + (yMax - yMin) * (s / 4), yy = y(v);
      svg.appendChild(el("line", { x1: PADL, x2: XR, y1: yy, y2: yy, class: "chart-grid" }));
      svg.appendChild(el("text", { x: PADL - 6, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, yFmt(v)));
    }
    // x-ticks
    [0, Math.floor(stb.length / 2), stb.length - 1].forEach((i) => {
      svg.appendChild(el("text", { x: xA(i, stb.length), y: 314, "text-anchor": i === 0 ? "start" : i === stb.length - 1 ? "end" : "middle", class: "chart-axis" }, stb[i][0]));
    });

    const path = (arr) => { let d = ""; arr.forEach((v, i) => { d += (i ? " L " : "M ") + xA(i, arr.length) + " " + y(v); }); return d; };

    if (!comparing) {
      let ad = path(sA) + ` L ${xA(sA.length - 1, sA.length)} ${BOT} L ${PADL} ${BOT} Z`;
      svg.appendChild(el("path", { d: ad, fill: "var(--acc)", "fill-opacity": "0.08", stroke: "none" }));
    } else {
      svg.appendChild(el("path", { d: path(sB), fill: "none", stroke: "var(--peer)", "stroke-width": "2" }));
    }
    svg.appendChild(el("path", { d: path(sA), fill: "none", stroke: "var(--acc)", "stroke-width": "2.2" }));

    // hover
    const vline = el("line", { x1: 0, x2: 0, y1: TOP, y2: BOT, stroke: "var(--mut)", "stroke-width": "1", "stroke-dasharray": "3,3", opacity: "0" });
    const dotA = el("circle", { r: 4, fill: "var(--acc)", opacity: "0" });
    const dotB = el("circle", { r: 4, fill: "var(--peer)", opacity: "0" });
    svg.appendChild(vline); svg.appendChild(dotA); svg.appendChild(dotB);
    const overlay = el("rect", { x: PADL, y: TOP, width: XR - PADL, height: BOT - TOP, fill: "transparent", "pointer-events": "all" });
    svg.appendChild(overlay);

    function move(evt) {
      const t = evt.touches ? evt.touches[0] : evt;
      const pt = svg.createSVGPoint(); pt.x = t.clientX; pt.y = t.clientY;
      const ctm = svg.getScreenCTM(); if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      const f = Math.max(0, Math.min(1, (loc.x - PADL) / (XR - PADL)));
      const iA = Math.round(f * (sA.length - 1));
      const px = xA(iA, sA.length), py = y(sA[iA]);
      vline.setAttribute("x1", px); vline.setAttribute("x2", px); vline.setAttribute("opacity", "1");
      dotA.setAttribute("cx", px); dotA.setAttribute("cy", py); dotA.setAttribute("opacity", "1");
      let html = `<div class="t-date">${stb[iA][0]}</div><div style="color:var(--acc)">Storebrand: ${kr(stb[iA][1])}</div>`;
      if (comparing) {
        const iB = Math.round(f * (sB.length - 1));
        dotB.setAttribute("cx", px); dotB.setAttribute("cy", y(sB[iB])); dotB.setAttribute("opacity", "1");
        html += `<div style="color:var(--peer)">${PEER_SHORT[cmp]}: ${kr(comparing[iB][1])}</div>`;
      } else { dotB.setAttribute("opacity", "0"); }
      showTip(t, html);
    }
    overlay.addEventListener("mousemove", move);
    overlay.addEventListener("mouseleave", () => { vline.setAttribute("opacity", "0"); dotA.setAttribute("opacity", "0"); dotB.setAttribute("opacity", "0"); hideTip(); });
    overlay.addEventListener("touchmove", move, { passive: true });
    overlay.addEventListener("touchend", () => { vline.setAttribute("opacity", "0"); dotA.setAttribute("opacity", "0"); dotB.setAttribute("opacity", "0"); hideTip(); });

    // perf + legend
    const chg = ((sA[sA.length - 1] / (comparing ? 100 : sA[0])) - 1) * 100;
    const stbChg = ((stb[stb.length - 1][1] / stb[0][1]) - 1) * 100;
    const perfEl = document.getElementById("chart-perf");
    perfEl.textContent = pct1(stbChg);
    perfEl.className = "perf " + (stbChg >= 0 ? "up" : "down");
    const leg = document.getElementById("cmp-legend");
    if (comparing) {
      leg.hidden = false;
      leg.innerHTML = `<span style="color:var(--acc)">— Storebrand</span><span style="color:var(--peer)">— ${PEER_SHORT[cmp]}</span><span style="color:var(--mut)">Indeksert, 100 = periodestart</span>`;
    } else { leg.hidden = true; }
  }
  draw();
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
}

/* ---------- Prediksjonsgraf (enkel trendmodell fra ekte månedsdata) ---------- */
const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
function renderPrediction() {
  const svg = document.getElementById("pred-chart");
  const monthly = STB_PRICES.max.slice(-12); // [ "YYYY-MM", pris ]
  const n = monthly.length;
  const prices = monthly.map((d) => d[1]);
  // lineær regresjon
  const xs = prices.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = prices.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (prices[i] - my); den += (x - mx) ** 2; });
  const slope = num / den, intercept = my - slope * mx;
  const model = xs.map((x) => slope * x + intercept);
  // avvik
  const resid = prices.map((p, i) => p - model[i]);
  const madPct = (resid.reduce((a, r, i) => a + Math.abs(r) / prices[i], 0) / n) * 100;
  const sigma = Math.sqrt(resid.reduce((a, r) => a + r * r, 0) / n);
  // anslag neste måned – trend justert mot analytikernes kursmål
  const trendFwd = slope * n + intercept;
  const fwd = 0.7 * trendFwd + 0.3 * STB_DATA.quote.analystTarget;
  const lo = fwd - 1.5 * sigma, hi = fwd + 1.5 * sigma;

  const all = [...prices, fwd, lo, hi];
  let yMin = Math.min(...all), yMax = Math.max(...all);
  const padY = (yMax - yMin) * 0.1 || 1; yMin -= padY; yMax += padY;
  const PADL = 48, XR = 784, TOP = 14, BOT = 234;
  const X = (i) => PADL + (i / n) * (XR - PADL); // 0..n (n = fwd)
  const Y = (v) => TOP + (1 - (v - yMin) / (yMax - yMin)) * (BOT - TOP);

  for (let s = 0; s <= 4; s++) {
    const v = yMin + (yMax - yMin) * (s / 4), yy = Y(v);
    svg.appendChild(el("line", { x1: PADL, x2: XR, y1: yy, y2: yy, class: "chart-grid" }));
    svg.appendChild(el("text", { x: PADL - 6, y: yy + 4, "text-anchor": "end", class: "chart-axis" }, nf0.format(v)));
  }
  monthly.forEach((d, i) => {
    if (i % 2 === 0 || i === n - 1) {
      const [yy, mm] = d[0].split("-");
      svg.appendChild(el("text", { x: X(i), y: 254, "text-anchor": "middle", class: "chart-axis" }, MND[+mm - 1]));
    }
  });
  // "i dag"
  svg.appendChild(el("line", { x1: X(n - 1), x2: X(n - 1), y1: TOP, y2: BOT, stroke: "var(--mut)", "stroke-width": "1", "stroke-dasharray": "2,4" }));
  svg.appendChild(el("text", { x: X(n - 1), y: 26, "text-anchor": "middle", class: "chart-axis" }, "i dag"));
  // usikkerhetsbånd (fra siste faktiske til anslag)
  svg.appendChild(el("path", { d: `M ${X(n - 1)} ${Y(prices[n - 1])} L ${X(n)} ${Y(hi)} L ${X(n)} ${Y(lo)} Z`, fill: "var(--peer)", "fill-opacity": "0.14", stroke: "none" }));
  // modell (stiplet)
  let md = ""; model.forEach((v, i) => { md += (i ? " L " : "M ") + X(i) + " " + Y(v); });
  md += ` L ${X(n)} ${Y(fwd)}`;
  svg.appendChild(el("path", { d: md, fill: "none", stroke: "var(--peer)", "stroke-width": "2", "stroke-dasharray": "6,4" }));
  // faktisk
  let ad = ""; prices.forEach((v, i) => { ad += (i ? " L " : "M ") + X(i) + " " + Y(v); });
  svg.appendChild(el("path", { d: ad, fill: "none", stroke: "var(--acc)", "stroke-width": "2.2" }));
  svg.appendChild(el("circle", { cx: X(n - 1), cy: Y(prices[n - 1]), r: 4.5, fill: "var(--acc)" }));
  svg.appendChild(el("circle", { cx: X(n), cy: Y(fwd), r: 4.5, fill: "var(--peer)" }));
  svg.appendChild(el("text", { x: X(n) - 6, y: Y(fwd) - 8, "text-anchor": "end", class: "chart-axis", fill: "var(--peer)", "font-weight": "600" }, kr(fwd, 0)));

  // neste måned-label
  const lastMonth = monthly[n - 1][0].split("-").map(Number);
  let nm = lastMonth[1], ny = lastMonth[0];
  nm++; if (nm > 12) { nm = 1; ny++; }
  document.getElementById("pred-mad").textContent = `Gj.sn. avvik siste 12 mnd: ±${nf1.format(madPct)} %`;
  document.getElementById("pred-note").innerHTML =
    `Modellanslag ${MND[nm - 1]} ${ny}: <span class="mono" style="color:var(--tx)">${kr(fwd, 0)}</span> (intervall ${nf0.format(lo)}–${nf0.format(hi)} kr). Dette er en enkel statistisk modell for illustrasjon — ikke en prognose du bør handle på.`;
}

/* ---------- Selskap + segmenter ---------- */
function renderCompany() {
  document.getElementById("company-desc").textContent = STB_DATA.company.description;
  const subs = document.getElementById("company-subs");
  STB_DATA.company.subsidiariesDetailed.forEach((c) => {
    subs.appendChild(h(`<div class="tickline"><span class="mk">▸</span><div><span style="font-weight:600">${c.name}</span><span class="desc"> — ${c.desc}</span></div></div>`));
  });
  const segs = STB_DATA.segments, maxV = Math.max(...segs.map((s) => s.value));
  document.getElementById("segment-sub").textContent = "Q2 2026, millioner kroner — hvor pengene tjenes";
  const bars = document.getElementById("segment-bars");
  segs.forEach((s) => {
    bars.appendChild(h(`<div class="seg-row"><div class="seg-head"><span>${s.name}${s.growth ? ' <span style="color:var(--mut)">' + s.growth + "</span>" : ""}</span><span class="mono">${nf0.format(s.value)}</span></div><div class="seg-track"><div class="seg-fill" style="width:${(s.value / maxV) * 100}%"></div></div></div>`));
  });
  const sum = segs.reduce((a, s) => a + s.value, 0);
  document.getElementById("segment-sum").textContent = `Sum driftsresultat Q2 2026: ${nf0.format(sum)} mill. (+17 % å/å)`;
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
  const stats = [["Direkteavkastning", nf2.format(STB_DATA.quote.dividendYield) + " %"], ["Utdelingsgrad", nf0.format(st.payoutRatio) + " %"], ["Vekst siste år", pct1(st.oneYearGrowthPct)]];
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
  own.forEach((o) => ob.appendChild(h(`<div class="seg-row"><div class="seg-head"><span>${o.name}</span><span class="mono" style="color:var(--mut)">${o.pct} %</span></div><div class="seg-track"><div class="seg-fill" style="width:${o.pct}%;background:var(--peer)"></div></div></div>`)));
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
    const yr = p.oneYearPct == null ? "–" : pct1(p.oneYearPct);
    const yrCol = p.oneYearPct == null ? "var(--mut)" : p.oneYearPct >= 0 ? "var(--up)" : "var(--down)";
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
renderPrediction();
renderCompany();
renderDividends();
renderKeyFigures();
renderReports();
renderInsiders();
renderComparison();
renderNews();
renderSources();
