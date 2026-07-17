// Røyktest for Storebrand-oversikten: laster siden i en ekte nettleser, sjekker at
// nøkkelseksjonene rendrer, at popups åpner, og at det ikke oppstår konsoll-/JS-feil.
// Kjøres av .github/workflows/smoke.yml ved hver push. Lokalt: `cd tests && npm i && npm test`.
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = pathToFileURL(join(ROOT, "index.html")).href;
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); };

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) pageErrors.push("console: " + m.text()); });

await page.goto(PAGE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);

// --- Kjerneseksjoner rendrer ---
check((await page.$eval("#head-price", (e) => e.textContent)).includes("kr"), "header-kurs mangler");
check((await page.$$eval("#stat-grid .stat", (e) => e.length)) >= 6, "stat-grid ikke fylt");
check((await page.$$eval("#ai-signals .ai-chip", (e) => e.length)) >= 6, "AI-signaler mangler");
check((await page.$$eval("#ai-track .ministat", (e) => e.length)) === 4, "AI-track mangler");
check((await page.$eval("#ai-badge", (e) => e.textContent)).includes("AI-ekspert"), "AI-badge mangler");
check((await page.$$eval("#insider-table-body tr", (e) => e.length)) >= 1, "innsidetabell tom");
check((await page.$$eval("#analyst-table-body tr", (e) => e.length)) === 3, "analytikertabell mangler");
check((await page.$$eval("#div-bars .colbar", (e) => e.length)) >= 5, "utbyttegraf mangler");
check((await page.$$eval("#cmp-table-body tr", (e) => e.length)) >= 5, "sammenligningstabell mangler");
check((await page.$$eval("#news-list .news-row", (e) => e.length)) >= 5, "nyheter mangler");
check((await page.$$eval("#price-chart path", (e) => e.length)) >= 1, "prisgraf tegnet ikke");
check((await page.$$eval("#ai-chart path", (e) => e.length)) >= 2, "AI-graf tegnet ikke");

// --- Popups åpner og lukker ---
async function popup(clickSel, expectTitleIncludes) {
  await page.click(clickSel);
  await page.waitForTimeout(150);
  const open = await page.$eval("#modal", (e) => !e.hidden);
  const title = await page.$eval("#modal-title", (e) => e.textContent);
  check(open && title.length > 0, `popup åpnet ikke: ${clickSel}`);
  if (expectTitleIncludes) check(title.includes(expectTitleIncludes), `feil popup-tittel for ${clickSel}: ${title}`);
  await page.click("#modal-close");
  await page.waitForTimeout(80);
  check(await page.$eval("#modal", (e) => e.hidden), `popup lukket ikke: ${clickSel}`);
}
await popup('.stat.clickable:has-text("P/E")', "P/E");
await popup('.stat.clickable:has-text("Markedsverdi")', "Markedsverdi");
await popup("#ai-method-btn", "AI-modellen");
await popup("#segment-title", "segment");
await popup("#buyback-title", "Tilbakekjøp");
await popup("#analyst-firms-title", "kursmål");

// --- Prisgraf: bytt periode ---
await page.click('#period-buttons .tbtn:has-text("1 uke")');
await page.waitForTimeout(120);
check((await page.$$eval("#price-chart path", (e) => e.length)) >= 1, "prisgraf tom etter 1 uke");

check(pageErrors.length === 0, "JS-/konsollfeil: " + pageErrors.join(" | "));

await browser.close();
if (fails.length) {
  console.error("RØYKTEST FEILET:\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log("Røyktest OK – alle seksjoner rendrer, popups virker, ingen JS-feil.");
