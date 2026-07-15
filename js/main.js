const nf0 = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf1 = new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function fmtKr(v, decimals = 2) {
  const f = decimals === 2 ? nf2 : nf1;
  return f.format(v) + " kr";
}
function fmtPct(v) {
  return (v > 0 ? "+" : "") + nf2.format(v) + " %";
}

/* ---------- Theme toggle ---------- */
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("stb-theme");
  if (saved) root.setAttribute("data-theme", saved);
  const btn = document.getElementById("theme-toggle");
  const setLabel = () => {
    const current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    btn.textContent = current === "dark" ? "☀ Lyst" : "● Mørkt";
  };
  setLabel();
  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("stb-theme", next);
    setLabel();
  });
})();

/* ---------- Shared tooltip ---------- */
const tooltip = document.getElementById("tooltip");
function showTooltip(evt, text) {
  tooltip.textContent = text;
  tooltip.style.left = evt.clientX + "px";
  tooltip.style.top = evt.clientY + "px";
  tooltip.classList.add("show");
}
function hideTooltip() {
  tooltip.classList.remove("show");
}

const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

/* ---------- Header live price ---------- */
function renderHeader() {
  const q = STB_DATA.quote;
  const up = q.change >= 0;
  document.getElementById("live-price-value").textContent = fmtKr(q.price);
  const chgEl = document.getElementById("live-price-change");
  chgEl.textContent = `${up ? "▲" : "▼"} ${fmtKr(Math.abs(q.change))} (${fmtPct(q.changePct)})`;
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
  document.getElementById("hero-asof").textContent = `Sist oppdatert ${STB_DATA.meta.updated} · ${STB_DATA.meta.ticker} · ${STB_DATA.meta.exchange}`;

  const tiles = [
    ["Markedsverdi", `${nf1.format(q.marketCap)} mrd kr`],
    ["P/E (siste 12 mnd)", nf2.format(q.peTtm)],
    ["P/E (forward)", nf2.format(q.peForward)],
    ["Direkteavkastning", nf2.format(q.dividendYield) + " %"],
    ["52-ukers spenn", `${fmtKr(q.week52Low)} – ${fmtKr(q.week52High)}`],
    ["Volum (siste dag)", nf0.format(q.volume)],
    ["Beta", nf2.format(q.beta)],
    ["Analytikerkonsensus", `${q.analystRating} · mål ${fmtKr(q.analystTarget)}`],
  ];
  const grid = document.getElementById("stat-grid");
  tiles.forEach(([label, value]) => {
    const tile = document.createElement("div");
    tile.className = "stat-tile";
    tile.innerHTML = `<div class="label">${label}</div><div class="value small">${value}</div>`;
    grid.appendChild(tile);
  });
}

/* ---------- 52-week range meter ---------- */
function renderRangeMeter() {
  const q = STB_DATA.quote;
  const track = document.getElementById("range-track");
  const pct = (v) => ((v - q.week52Low) / (q.week52High - q.week52Low)) * 100;
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
    const targetPct = pct(q.analystTarget);
    const target = document.createElement("div");
    target.className = "meter-target";
    target.style.left = targetPct + "%";
    target.title = `Analytikernes kursmål: ${fmtKr(q.analystTarget)}`;
    track.appendChild(target);
  }

  document.getElementById("range-low").textContent = fmtKr(q.week52Low);
  document.getElementById("range-high").textContent = fmtKr(q.week52High);
}

/* ---------- Column chart (dividend history) ---------- */
function renderDividendChart() {
  const data = STB_DATA.dividends;
  const svg = document.getElementById("dividend-chart");
  const width = 640, height = 240;
  const padL = 40, padR = 16, padT = 20, padB = 34;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const maxVal = Math.max(...data.map(d => d.amount)) * 1.15;
  const colW = innerW / data.length;
  const barW = Math.min(24, colW * 0.5);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.classList.add("chart-svg");

  // gridlines (0, mid, max)
  [0, 0.5, 1].forEach(f => {
    const y = padT + innerH * (1 - f);
    svg.appendChild(el("line", { x1: padL, x2: width - padR, y1: y, y2: y, class: "chart-gridline" }));
  });

  data.forEach((d, i) => {
    const cx = padL + colW * i + colW / 2;
    const barH = (d.amount / maxVal) * innerH;
    const x = cx - barW / 2;
    const y = padT + innerH - barH;

    const rect = el("rect", {
      x, y, width: barW, height: Math.max(barH, 2),
      rx: 4, ry: 4,
      class: "chart-bar accent",
      tabindex: "0",
      role: "img",
      "aria-label": `Utbytte ${d.year}: ${fmtKr(d.amount)} per aksje`,
    });
    // square baseline: draw a second rect to square off bottom corners under the rounding
    const squareBottom = el("rect", { x, y: padT + innerH - 5, width: barW, height: 5, class: "chart-bar accent" });

    const showTip = (evt) => showTooltip(evt, `${d.year}: ${fmtKr(d.amount)} per aksje`);
    rect.addEventListener("mousemove", showTip);
    rect.addEventListener("mouseenter", showTip);
    rect.addEventListener("mouseleave", hideTooltip);
    rect.addEventListener("focus", (e) => showTooltip({ clientX: x + padL, clientY: y }, `${d.year}: ${fmtKr(d.amount)} per aksje`));
    rect.addEventListener("blur", hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(squareBottom);

    const valueLabel = el("text", {
      x: cx, y: y - 8, "text-anchor": "middle", class: "chart-value-text",
    });
    valueLabel.textContent = nf2.format(d.amount);
    svg.appendChild(valueLabel);

    const axisLabel = el("text", {
      x: cx, y: height - 10, "text-anchor": "middle", class: "chart-axis-text",
    });
    axisLabel.textContent = d.year;
    svg.appendChild(axisLabel);
  });

  const table = document.getElementById("dividend-table-body");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.year}</td><td class="num">${fmtKr(d.amount)}</td><td class="num">${d.exDate}</td><td class="num">${d.payDate}</td>`;
    table.appendChild(tr);
  });

  const ds = STB_DATA.dividendStats;
  document.getElementById("div-yield").textContent = nf2.format(ds.yield) + " %";
  document.getElementById("div-payout").textContent = nf2.format(ds.payoutRatio) + " %";
  document.getElementById("div-growth").textContent = fmtPct(ds.oneYearGrowthPct);
}

/* ---------- Horizontal peer comparison bar chart ---------- */
function renderPeerChart(svgId, tableBodyId, valueKey, valueLabelFn) {
  const data = STB_DATA.peers;
  const svg = document.getElementById(svgId);
  const rowH = 40, barH = 20;
  const width = 640;
  const padL = 150, padR = 60, padT = 10;
  const height = padT + rowH * data.length + 10;
  const innerW = width - padL - padR;
  const maxVal = Math.max(...data.map(d => d[valueKey])) * 1.15;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.classList.add("chart-svg");

  data.forEach((d, i) => {
    const y = padT + rowH * i + (rowH - barH) / 2;
    const barLen = Math.max((d[valueKey] / maxVal) * innerW, 2);

    const nameLabel = el("text", {
      x: padL - 10, y: y + barH / 2 + 4, "text-anchor": "end", class: "chart-axis-text",
      style: d.isSubject ? "font-weight:700;" : "",
    });
    nameLabel.textContent = d.name;
    svg.appendChild(nameLabel);

    const rect = el("rect", {
      x: padL, y, width: barLen, height: barH, rx: 4, ry: 4,
      class: "chart-bar" + (d.isSubject ? " accent" : ""),
      tabindex: "0",
      role: "img",
      "aria-label": `${d.name}: ${valueLabelFn(d[valueKey])}`,
    });
    const squareLeft = el("rect", { x: padL, y, width: 5, height: barH, class: "chart-bar" + (d.isSubject ? " accent" : "") });

    const tip = (evt) => showTooltip(evt, `${d.name}: ${valueLabelFn(d[valueKey])}`);
    rect.addEventListener("mousemove", tip);
    rect.addEventListener("mouseenter", tip);
    rect.addEventListener("mouseleave", hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(squareLeft);

    const valueLabel = el("text", {
      x: padL + barLen + 8, y: y + barH / 2 + 4, class: "chart-value-text",
    });
    valueLabel.textContent = valueLabelFn(d[valueKey]);
    svg.appendChild(valueLabel);
  });

  if (tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (tbody.childElementCount === 0) {
      data.forEach(d => {
        const tr = document.createElement("tr");
        if (d.isSubject) tr.className = "subject";
        tr.innerHTML = `
          <td>${d.name} <span class="chart-axis-text">(${d.ticker})</span></td>
          <td class="num">${nf2.format(d.price)} ${d.currency}</td>
          <td class="num">${nf1.format(d.marketCap)} mrd ${d.currency}</td>
          <td class="num">${nf2.format(d.pe)}</td>
          <td class="num">${nf2.format(d.dividendYield)} %</td>
          <td class="num">${d.oneYearPct === null ? "–" : fmtPct(d.oneYearPct)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

/* ---------- Reports ---------- */
function renderReports() {
  const r = STB_DATA.reports;
  document.getElementById("report-period").textContent = r.latest.period;
  document.getElementById("report-date").textContent = r.latest.reportDate;
  const ul = document.getElementById("report-highlights");
  r.latest.highlights.forEach(h => {
    const li = document.createElement("li");
    li.textContent = h;
    ul.appendChild(li);
  });

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
    const value = t.shares * t.price;
    tr.innerHTML = `
      <td>${t.date}</td>
      <td>${t.name}</td>
      <td>${t.type}</td>
      <td class="num">${nf0.format(t.shares)}</td>
      <td class="num">${fmtKr(t.price)}</td>
      <td class="num">${nf0.format(value)} kr</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("buyback-desc").textContent = data.buyback.description;
  document.getElementById("buyback-treasury").textContent = data.buyback.treasurySharesNote;
  document.getElementById("ownership-note").textContent = STB_DATA.ownership.note;
}

/* ---------- News ---------- */
const TAG_SLUGS = { "positivt": "positivt", "risiko": "risiko", "å følge med på": "folgemedpaa" };
function renderNews() {
  const grid = document.getElementById("news-grid");
  STB_DATA.news.forEach(n => {
    const card = document.createElement("div");
    card.className = "news-item";
    const slug = TAG_SLUGS[n.tag] || "folgemedpaa";
    card.innerHTML = `
      <span class="tag ${slug}"><span class="dot"></span>${n.tag}</span>
      <h3>${n.title}</h3>
      <p>${n.body}</p>
    `;
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
renderRangeMeter();
renderDividendChart();
renderPeerChart("pe-chart", "peer-table-body", "pe", (v) => nf2.format(v));
renderPeerChart("yield-chart", null, "dividendYield", (v) => nf2.format(v) + " %");
renderReports();
renderInsiders();
renderNews();
renderSources();
