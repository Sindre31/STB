const nf0 = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtKr(v, decimals = 2) {
  return (decimals === 2 ? nf2 : nf1).format(v) + " kr";
}
function fmtPct(v) {
  return (v > 0 ? "+" : "") + nf2.format(v) + " %";
}
function fmtPctShort(v) {
  return (v > 0 ? "+" : "") + nf1.format(v) + " %";
}

/* ---------- Apply live snapshot over hand-curated data ---------- */
(function applyLive() {
  if (typeof STB_LIVE === "undefined") return;
  if (STB_LIVE.updated) STB_DATA.meta.updated = STB_LIVE.updated;
  if (STB_LIVE.quote) {
    const q = STB_LIVE.quote;
    Object.keys(q).forEach(k => {
      if (k === "perf" && q.perf) {
        STB_DATA.quote.perf = Object.assign({}, STB_DATA.quote.perf, q.perf);
      } else if (q[k] !== undefined && q[k] !== null) {
        STB_DATA.quote[k] = q[k];
      }
    });
  }
  if (STB_LIVE.peers) {
    STB_DATA.peers.forEach(p => {
      const live = STB_LIVE.peers[p.ticker];
      if (!live) return;
      if (live.price != null) p.price = live.price;
      if (live.oneYearPct != null) p.oneYearPct = Math.round(live.oneYearPct);
      if (live.pe != null) p.pe = live.pe;
      if (live.dividendYield != null) p.dividendYield = live.dividendYield;
      if (live.marketCap != null) p.marketCap = live.marketCap;
    });
  }
})();

/* ---------- Stale-data banner: varsle hvis auto-oppdateringen har stoppet ---------- */
(function staleCheck() {
  const banner = document.getElementById("stale-banner");
  if (!banner) return;
  // Ingen live-fil lastet i det hele tatt:
  if (typeof STB_LIVE === "undefined" || !STB_LIVE.dataDate) {
    banner.textContent = "⚠ Kunne ikke laste ferske kursdata — viser sist lagrede tall.";
    banner.hidden = false;
    return;
  }
  const last = new Date(STB_LIVE.dataDate + "T00:00:00Z");
  const days = Math.floor((Date.now() - last.getTime()) / 86400000);
  // Børsen er stengt i helger/helligdager, så 5 dager gir rom uten falske varsler.
  if (days > 5) {
    const d = last.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
    banner.textContent = `⚠ Kursdataene kan være utdaterte. Siste registrerte handelsdag er ${d} (${days} dager siden) — den automatiske oppdateringen kan ha feilet.`;
    banner.hidden = false;
  }
})();

const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

/* ---------- Theme toggle ---------- */
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("stb-theme");
  if (saved) root.setAttribute("data-theme", saved);
  const btn = document.getElementById("theme-toggle");
  const currentScheme = () =>
    root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const setLabel = () => { btn.textContent = currentScheme() === "dark" ? "☀ Lyst" : "● Mørkt"; };
  setLabel();
  btn.addEventListener("click", () => {
    const next = currentScheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("stb-theme", next);
    setLabel();
    if (window._redrawPriceChart) window._redrawPriceChart();
  });
})();

/* ---------- Shared tooltip ---------- */
const tooltip = document.getElementById("tooltip");
function showTooltip(evt, html) {
  tooltip.innerHTML = html;
  tooltip.style.left = evt.clientX + "px";
  tooltip.style.top = evt.clientY + "px";
  tooltip.classList.add("show");
}
function hideTooltip() { tooltip.classList.remove("show"); }

/* ---------- Header live price ---------- */
function renderHeader() {
  const q = STB_DATA.quote;
  const up = q.change >= 0;
  document.getElementById("live-price-value").textContent = fmtKr(q.price);
  const chgEl = document.getElementById("live-price-change");
  chgEl.textContent = `${up ? "▲" : "▼"} ${fmtPct(q.changePct)}`;
  chgEl.classList.add(up ? "up" : "down");
}

/* ---------- Hero ---------- */
function renderHero() {
  const q = STB_DATA.quote;
  const up = q.change >= 0;
  document.getElementById("hero-price").textContent = fmtKr(q.price);
  const d = document.getElementById("hero-delta");
  d.textContent = `${up ? "▲" : "▼"} ${fmtKr(Math.abs(q.change))} (${fmtPct(q.changePct)}) i dag`;
  d.classList.add(up ? "up" : "down");
  document.getElementById("hero-asof").textContent =
    `Sist oppdatert ${STB_DATA.meta.updated} · ${STB_DATA.meta.ticker} · ${STB_DATA.meta.exchange} · ${STB_DATA.meta.indices}`;

  const k = STB_DATA.kpis;
  const tiles = [
    ["Markedsverdi", `${nf1.format(q.marketCap)} mrd kr`],
    ["P/E (siste 12 mnd)", nf2.format(q.peTtm)],
    ["Direkteavkastning", nf2.format(q.dividendYield) + " %"],
    ["Solvensmargin", k.solvency + " %"],
    ["Egenkapitalavkastning", k.roeTtm + " %"],
    ["Forvaltningskapital", `${nf0.format(k.aum)} mrd kr`],
    ["Avkastning 1 år", fmtPctShort(q.perf.oneY)],
    ["Analytikere", `${q.analystRating} · mål ${fmtKr(q.analystTarget)}`],
  ];
  const grid = document.getElementById("stat-grid");
  tiles.forEach(([label, value]) => {
    const tile = document.createElement("div");
    tile.className = "stat-tile";
    tile.innerHTML = `<div class="label">${label}</div><div class="value small">${value}</div>`;
    grid.appendChild(tile);
  });
}

/* ---------- Company profile ---------- */
function renderCompany() {
  const c = STB_DATA.company;
  document.getElementById("company-desc").textContent = c.description;
  const facts = [
    ["Grunnlagt", c.founded],
    ["Hovedkontor", c.hq],
    ["Konsernsjef", c.ceo],
    ["Ansatte", c.employees],
    ["Markeder", c.markets],
    ["Børs", `${STB_DATA.meta.exchange} · ${STB_DATA.meta.indices}`],
  ];
  const fl = document.getElementById("company-facts");
  facts.forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "fact-row";
    row.innerHTML = `<span class="fact-k">${k}</span><span class="fact-v">${v}</span>`;
    fl.appendChild(row);
  });
  const subs = document.getElementById("company-subs");
  c.subsidiaries.forEach(s => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = s;
    subs.appendChild(chip);
  });
}

/* ---------- Interactive price line chart ---------- */
function renderPriceChart() {
  const svg = document.getElementById("price-chart");
  const rangeMap = { "1Y": STB_PRICES.oneY, "5Y": STB_PRICES.fiveY, "MAX": STB_PRICES.max };
  let currentRange = "1Y";

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function draw() {
    const data = rangeMap[currentRange];
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const width = 720, height = 300;
    const padL = 48, padR = 16, padT = 16, padB = 28;
    const innerW = width - padL - padR, innerH = height - padT - padB;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.classList.add("chart-svg");

    const vals = data.map(d => d[1]);
    let min = Math.min(...vals), max = Math.max(...vals);
    const pad = (max - min) * 0.08 || 1;
    min -= pad; max += pad;

    const x = i => padL + (i / (data.length - 1)) * innerW;
    const y = v => padT + innerH - ((v - min) / (max - min)) * innerH;

    // gridlines + y labels (4 steps)
    for (let s = 0; s <= 4; s++) {
      const v = min + (max - min) * (s / 4);
      const yy = y(v);
      svg.appendChild(el("line", { x1: padL, x2: width - padR, y1: yy, y2: yy, class: "chart-gridline" }));
      const t = el("text", { x: padL - 8, y: yy + 4, "text-anchor": "end", class: "chart-axis-text" });
      t.textContent = nf0.format(v);
      svg.appendChild(t);
    }

    // x labels (start, mid, end)
    [0, Math.floor(data.length / 2), data.length - 1].forEach(i => {
      const t = el("text", { x: x(i), y: height - 8, "text-anchor": i === 0 ? "start" : i === data.length - 1 ? "end" : "middle", class: "chart-axis-text" });
      t.textContent = data[i][0];
      svg.appendChild(t);
    });

    const up = vals[vals.length - 1] >= vals[0];
    const lineColor = css(up ? "--good" : "--critical") || css("--series-1");

    // area fill
    let areaD = `M ${x(0)} ${y(vals[0])}`;
    data.forEach((d, i) => { areaD += ` L ${x(i)} ${y(d[1])}`; });
    areaD += ` L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
    const area = el("path", { d: areaD, fill: lineColor, "fill-opacity": "0.10", stroke: "none" });
    svg.appendChild(area);

    // line
    let lineD = `M ${x(0)} ${y(vals[0])}`;
    data.forEach((d, i) => { lineD += ` L ${x(i)} ${y(d[1])}`; });
    svg.appendChild(el("path", { d: lineD, fill: "none", stroke: lineColor, "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }));

    // crosshair layer
    const vline = el("line", { x1: 0, x2: 0, y1: padT, y2: padT + innerH, stroke: css("--baseline"), "stroke-width": "1", opacity: "0" });
    const dot = el("circle", { r: 4.5, fill: lineColor, stroke: css("--surface-1"), "stroke-width": "2", opacity: "0" });
    svg.appendChild(vline); svg.appendChild(dot);

    const overlay = el("rect", { x: padL, y: padT, width: innerW, height: innerH, fill: "transparent", "pointer-events": "all", style: "cursor:crosshair" });
    svg.appendChild(overlay);

    function move(evt) {
      const pt = svg.createSVGPoint();
      const touch = evt.touches ? evt.touches[0] : evt;
      pt.x = touch.clientX; pt.y = touch.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      let i = Math.round(((loc.x - padL) / innerW) * (data.length - 1));
      i = Math.max(0, Math.min(data.length - 1, i));
      const px = x(i), py = y(data[i][1]);
      vline.setAttribute("x1", px); vline.setAttribute("x2", px); vline.setAttribute("opacity", "1");
      dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.setAttribute("opacity", "1");
      showTooltip(touch, `<strong>${fmtKr(data[i][1])}</strong><br>${data[i][0]}`);
    }
    function leave() { vline.setAttribute("opacity", "0"); dot.setAttribute("opacity", "0"); hideTooltip(); }
    overlay.addEventListener("mousemove", move);
    overlay.addEventListener("mouseleave", leave);
    overlay.addEventListener("touchstart", move, { passive: true });
    overlay.addEventListener("touchmove", move, { passive: true });
    overlay.addEventListener("touchend", leave);

    // performance summary
    const first = vals[0], last = vals[vals.length - 1];
    const chg = ((last / first) - 1) * 100;
    const sumEl = document.getElementById("price-range-perf");
    sumEl.textContent = `${currentRange}: ${fmtPctShort(chg)}`;
    sumEl.className = "range-perf " + (chg >= 0 ? "up" : "down");
  }

  // range buttons
  const btns = document.querySelectorAll("#price-range-buttons button");
  btns.forEach(b => {
    b.addEventListener("click", () => {
      currentRange = b.dataset.range;
      btns.forEach(x => x.classList.toggle("active", x === b));
      draw();
    });
  });
  window._redrawPriceChart = draw;
  draw();
}

/* ---------- 52-week range meter ---------- */
function renderRangeMeter() {
  const q = STB_DATA.quote;
  const track = document.getElementById("range-track");
  const pct = v => ((v - q.week52Low) / (q.week52High - q.week52Low)) * 100;
  const currentPct = Math.max(0, Math.min(100, pct(q.price)));

  const fill = document.createElement("div");
  fill.className = "meter-fill";
  fill.style.width = currentPct + "%";
  track.appendChild(fill);

  const marker = document.createElement("div");
  marker.className = "meter-current";
  marker.style.left = currentPct + "%";
  marker.title = `Dagens kurs: ${fmtKr(q.price)}`;
  track.appendChild(marker);

  if (q.analystTarget >= q.week52Low && q.analystTarget <= q.week52High) {
    const target = document.createElement("div");
    target.className = "meter-target";
    target.style.left = pct(q.analystTarget) + "%";
    target.title = `Analytikernes kursmål: ${fmtKr(q.analystTarget)}`;
    track.appendChild(target);
  }
  document.getElementById("range-low").textContent = fmtKr(q.week52Low);
  document.getElementById("range-high").textContent = fmtKr(q.week52High);
}

/* ---------- Generic vertical column chart ---------- */
function columnChart(svg, items, opts) {
  // items: [{label, value, accent?, sub?}]
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const width = 640, height = opts.height || 240;
  const padL = 44, padR = 16, padT = 24, padB = 34;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const maxVal = Math.max(...items.map(d => d.value)) * 1.15 || 1;
  const colW = innerW / items.length;
  const barW = Math.min(opts.barW || 34, colW * 0.55);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.classList.add("chart-svg");

  [0, 0.5, 1].forEach(f => {
    const yy = padT + innerH * (1 - f);
    svg.appendChild(el("line", { x1: padL, x2: width - padR, y1: yy, y2: yy, class: "chart-gridline" }));
  });

  items.forEach((d, i) => {
    const cx = padL + colW * i + colW / 2;
    const barH = Math.max((d.value / maxVal) * innerH, 2);
    const x = cx - barW / 2;
    const y = padT + innerH - barH;
    const cls = "chart-bar" + (d.accent ? " accent" : "");

    const rect = el("rect", { x, y, width: barW, height: barH, rx: 4, ry: 4, class: cls, tabindex: "0", role: "img", "aria-label": `${d.label}: ${opts.fmt(d.value)}` });
    const sq = el("rect", { x, y: padT + innerH - 5, width: barW, height: 5, class: cls });
    const tip = e => showTooltip(e, `<strong>${d.label}</strong><br>${opts.fmt(d.value)}${d.sub ? "<br>" + d.sub : ""}`);
    rect.addEventListener("mousemove", tip);
    rect.addEventListener("mouseenter", tip);
    rect.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(rect); svg.appendChild(sq);

    const vl = el("text", { x: cx, y: y - 8, "text-anchor": "middle", class: "chart-value-text" });
    vl.textContent = opts.labelFmt ? opts.labelFmt(d.value) : opts.fmt(d.value);
    svg.appendChild(vl);

    const al = el("text", { x: cx, y: height - 10, "text-anchor": "middle", class: "chart-axis-text" });
    al.textContent = d.label;
    svg.appendChild(al);
  });
}

/* ---------- Dividend chart ---------- */
function renderDividendChart() {
  const data = STB_DATA.dividends;
  columnChart(document.getElementById("dividend-chart"),
    data.map(d => ({ label: String(d.year), value: d.amount, accent: true, sub: d.amount === 0 ? "Utbytte kuttet (covid-19)" : "per aksje" })),
    { fmt: v => fmtKr(v), labelFmt: v => nf2.format(v), height: 240, barW: 26 });

  const tbody = document.getElementById("dividend-table-body");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.year}</td><td class="num">${d.amount === 0 ? "0,00 kr" : fmtKr(d.amount)}</td><td class="num">${d.exDate}</td><td class="num">${d.payDate}</td>`;
    tbody.appendChild(tr);
  });
  const ds = STB_DATA.dividendStats;
  document.getElementById("div-yield").textContent = nf2.format(ds.yield) + " %";
  document.getElementById("div-payout").textContent = nf2.format(ds.payoutRatio) + " %";
  document.getElementById("div-growth").textContent = fmtPct(ds.oneYearGrowthPct);
}

/* ---------- Segment + AUM charts ---------- */
function renderSegments() {
  const s = STB_DATA.segments;
  columnChart(document.getElementById("segment-chart"),
    s.map(d => ({ label: d.name, value: d.value, accent: true, sub: d.growth ? "Vekst " + d.growth : null })),
    { fmt: v => nf0.format(v) + " mill. kr", labelFmt: v => nf0.format(v), height: 240, barW: 40 });
}
function renderAum() {
  const a = STB_DATA.aumHistory;
  columnChart(document.getElementById("aum-chart"),
    a.map((d, i) => ({ label: String(d.year), value: d.value, accent: i === a.length - 1 })),
    { fmt: v => nf0.format(v) + " mrd kr", labelFmt: v => nf0.format(v), height: 240, barW: 34 });
}

/* ---------- KPI + targets ---------- */
function renderKpis() {
  const k = STB_DATA.kpis;
  const tiles = [
    ["Solvensmargin (Q2 2026)", k.solvency + " %", `Mål: minst ${k.solvencyTarget} %`],
    ["Combined ratio (Q2)", k.combinedRatioQ + " %", "Under 100 % = lønnsom drift"],
    ["Egenkapitalavkastning", k.roeTtm + " %", `Kontant-ROE annualisert: ${k.roeCashAnnualized} %`],
    ["Forvaltningskapital", nf0.format(k.aum) + " mrd kr", "Rekordnivå"],
    ["Markedsandel skade (privat)", nf1.format(k.retailPcMarketShare) + " %", "Opp fra 7,5 %"],
    ["Beta", nf2.format(STB_DATA.quote.beta), "Mindre svingete enn markedet"],
  ];
  const grid = document.getElementById("kpi-grid");
  tiles.forEach(([label, value, sub]) => {
    const tile = document.createElement("div");
    tile.className = "stat-tile";
    tile.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div><div class="tile-sub">${sub}</div>`;
    grid.appendChild(tile);
  });

  const t = STB_DATA.targets;
  document.getElementById("targets-note").textContent = t.note;
  const tg = document.getElementById("targets-grid");
  t.items.forEach(it => {
    const row = document.createElement("div");
    row.className = "target-row";
    row.innerHTML = `<span class="target-v">${it.value}</span><span class="target-l">${it.label}</span>`;
    tg.appendChild(row);
  });
  document.getElementById("dividend-policy").textContent = t.dividendPolicy;
}

/* ---------- Horizontal peer comparison ---------- */
function renderPeerChart(svgId, valueKey, valueLabelFn) {
  const data = STB_DATA.peers;
  const svg = document.getElementById(svgId);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const rowH = 40, barH = 20, width = 640;
  const padL = 150, padR = 66, padT = 10;
  const height = padT + rowH * data.length + 10;
  const innerW = width - padL - padR;
  const maxVal = Math.max(...data.map(d => d[valueKey])) * 1.15;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.classList.add("chart-svg");

  data.forEach((d, i) => {
    const y = padT + rowH * i + (rowH - barH) / 2;
    const barLen = Math.max((d[valueKey] / maxVal) * innerW, 2);

    const nameLabel = el("text", { x: padL - 10, y: y + barH / 2 + 4, "text-anchor": "end", class: "chart-axis-text", style: d.isSubject ? "font-weight:700;" : "" });
    nameLabel.textContent = d.name;
    svg.appendChild(nameLabel);

    const cls = "chart-bar" + (d.isSubject ? " accent" : "");
    const rect = el("rect", { x: padL, y, width: barLen, height: barH, rx: 4, ry: 4, class: cls, tabindex: "0", role: "img", "aria-label": `${d.name}: ${valueLabelFn(d[valueKey])}` });
    const sq = el("rect", { x: padL, y, width: 5, height: barH, class: cls });
    const tip = e => showTooltip(e, `<strong>${d.name}</strong><br>${valueLabelFn(d[valueKey])}`);
    rect.addEventListener("mousemove", tip);
    rect.addEventListener("mouseenter", tip);
    rect.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(rect); svg.appendChild(sq);

    const vl = el("text", { x: padL + barLen + 8, y: y + barH / 2 + 4, class: "chart-value-text" });
    vl.textContent = valueLabelFn(d[valueKey]);
    svg.appendChild(vl);
  });

  const tbody = document.getElementById("peer-table-body");
  if (tbody && tbody.childElementCount === 0) {
    data.forEach(d => {
      const tr = document.createElement("tr");
      if (d.isSubject) tr.className = "subject";
      tr.innerHTML = `
        <td>${d.name} <span class="chart-axis-text">(${d.ticker})</span></td>
        <td class="num">${nf2.format(d.price)} ${d.currency}</td>
        <td class="num">${nf1.format(d.marketCap)} mrd ${d.currency}</td>
        <td class="num">${nf2.format(d.pe)}</td>
        <td class="num">${nf2.format(d.dividendYield)} %</td>
        <td class="num">${d.oneYearPct === null ? "–" : fmtPctShort(d.oneYearPct)}</td>`;
      tbody.appendChild(tr);
    });
  }
}

/* ---------- Reports ---------- */
function renderReports() {
  const r = STB_DATA.reports;
  document.getElementById("report-period").textContent = r.latest.period;
  document.getElementById("report-date").textContent = r.latest.reportDate;
  const ul = document.getElementById("report-highlights");
  r.latest.highlights.forEach(h => { const li = document.createElement("li"); li.textContent = h; ul.appendChild(li); });
  const cal = document.getElementById("report-calendar");
  r.calendar.forEach(c => {
    const row = document.createElement("div");
    row.className = "calendar-row";
    row.innerHTML = `<span>${c.label}</span><span class="status${c.status === "Publisert" ? " done" : ""}">${c.date} · ${c.status}</span>`;
    cal.appendChild(row);
  });
  const links = document.getElementById("report-links");
  r.links.forEach(l => {
    const a = document.createElement("a");
    a.href = l.url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = l.label + " ↗";
    links.appendChild(a);
  });
}

/* ---------- Insiders ---------- */
function renderInsiders() {
  const data = STB_DATA.insiders;
  document.getElementById("insider-note").textContent = data.note;
  const tbody = document.getElementById("insider-table-body");
  data.transactions.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.date}</td><td>${t.name}</td><td>${t.type}</td>
      <td class="num">${nf0.format(t.shares)}</td>
      <td class="num">${fmtKr(t.price)}</td>
      <td class="num">${nf0.format(t.shares * t.price)} kr</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("buyback-desc").textContent = data.buyback.description;
  document.getElementById("buyback-treasury").textContent = data.buyback.treasurySharesNote;
  document.getElementById("ownership-note").textContent = STB_DATA.ownership.note;
}

/* ---------- News ---------- */
const TAG_LABEL = { positivt: "positivt", risiko: "risiko", folgemedpaa: "å følge med på" };
function renderNews() {
  const grid = document.getElementById("news-grid");
  STB_DATA.news.forEach(n => {
    const card = document.createElement("div");
    card.className = "news-item";
    card.innerHTML = `
      <span class="tag ${n.tag}"><span class="dot"></span>${TAG_LABEL[n.tag] || n.tag}</span>
      <h3>${n.title}</h3><p>${n.body}</p>`;
    grid.appendChild(card);
  });
}

/* ---------- Sources ---------- */
function renderSources() {
  const ol = document.getElementById("sources-list");
  STB_DATA.sources.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`;
    ol.appendChild(li);
  });
  document.getElementById("footer-updated").textContent = STB_DATA.meta.updated;
}

renderHeader();
renderHero();
renderCompany();
renderPriceChart();
renderRangeMeter();
renderDividendChart();
renderSegments();
renderAum();
renderKpis();
renderPeerChart("pe-chart", "pe", v => nf2.format(v));
renderPeerChart("yield-chart", "dividendYield", v => nf2.format(v) + " %");
renderReports();
renderInsiders();
renderNews();
renderSources();
