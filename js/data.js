// Kildedata for Storebrand-oversikten.
// Hentet fra offentlig tilgjengelige markedsdata- og selskapskilder (se kildeliste nederst på siden).
// Kursserier ligger i js/prices.js (ekte historiske sluttkurser via Yahoo Finance chart-API).
// "updated" viser datoen tallene ble hentet inn — aksjekurser og nøkkeltall endrer seg kontinuerlig.
const STB_DATA = {
  meta: {
    updated: "15. juli 2026",
    ticker: "STB",
    exchange: "Oslo Børs",
    isin: "NO0003053605",
    currency: "NOK",
    indices: "OSEBX · OBX",
  },

  company: {
    name: "Storebrand ASA",
    tagline: "Nordisk konsern innen langsiktig sparing, pensjon, forsikring og kapitalforvaltning.",
    founded: "Røtter tilbake til 1767 (dagens konsern etablert 1991)",
    hq: "Lysaker, Bærum (Norge)",
    ceo: "Odd Arild Grefstad (konsernsjef siden 2012)",
    employees: "2 541 årsverk (2025)",
    markets: "Norge og Sverige",
    subsidiaries: ["Storebrand Livsforsikring", "SPP (Sverige)", "Storebrand Asset Management", "SKAGEN Fondene", "Storebrand Bank", "Kron"],
    subsidiariesDetailed: [
      { name: "Storebrand Livsforsikring", desc: "pensjon og livsforsikring i Norge" },
      { name: "SPP", desc: "livsforsikring og tjenestepensjon i Sverige" },
      { name: "Storebrand Asset Management", desc: "kapitalforvaltning – Norges største private forvalter" },
      { name: "SKAGEN Fondene", desc: "aktivt forvaltede aksje- og rentefond" },
      { name: "Storebrand Bank", desc: "bank- og sparetjenester til privatkunder" },
      { name: "Kron", desc: "digital spare- og fondsplattform" },
    ],
    description:
      "Storebrand (grunnlagt 1767, hovedkontor på Lysaker) er blant Nordens ledende innen livsforsikring og pensjon, og Norges største private kapitalforvalter med rundt 1 660 mrd. kroner til forvaltning og over to millioner kunder i Norge og Sverige. Inntjeningen kombinerer volumbaserte forvaltningshonorarer med risikobaserte inntekter fra forsikring. Folketrygdfondet er største aksjonær med rundt 11 %.",
  },

  // Eierstruktur – kun det som er offentlig kjent presenteres som eksakt.
  ownershipBreakdown: [
    { name: "Folketrygdfondet", pct: 11 },
    { name: "Øvrige og frittflytende aksjonærer", pct: 89 },
  ],

  quote: {
    price: 198.80,
    change: 10.20,
    changePct: 5.41,
    marketCap: 79.26, // mrd NOK
    peTtm: 16.48,
    peForward: 15.92,
    epsTtm: 11.44,
    dividendYield: 2.86,
    week52Low: 144.60,
    week52High: 199.50,
    volume: 1407167,
    beta: 0.52,
    analystRating: "Kjøp",
    analystTarget: 184.10,
    revenueTtm: 108.29, // mrd NOK
    netIncomeTtm: 4.85, // mrd NOK
    sharesOutstanding: 420.25, // millioner
    perf: { oneY: 36.5, fiveY: 158.2, sinceGraph: 369 },
  },

  // Nøkkeltall for forsikrings-/finanskonsern
  kpis: {
    solvency: 200, // % Q2 2026
    solvencyPrev: 206, // Q1 2026
    solvencyTarget: 130, // langsiktig minstemål
    combinedRatioQ: 87, // % (under 100 = lønnsom forsikringsdrift)
    combinedRatioYtd: 90,
    roeTtm: 16, // %
    roeCashAnnualized: 20, // %
    aum: 1658, // mrd NOK Q2 2026
    retailPcMarketShare: 8.1, // %
  },

  targets: {
    note: "På kapitalmarkedsdagen (Q4 2025) løftet Storebrand resultatmålene. Selskapet legger vekt på økende utbytte og store tilbakekjøp.",
    items: [
      { label: "Resultatmål 2028", value: "7 mrd. kr" },
      { label: "Kontant-ROE 2028", value: "17 %" },
      { label: "ROE-ambisjon 2035", value: "over 20 %" },
      { label: "Solvensmål (langsiktig)", value: "minst 130 %" },
      { label: "Tilbakekjøp 2026", value: "2 mrd. kr" },
      { label: "Tilbakekjøp 2027–2030", value: "minst 1,5 mrd. kr/år" },
    ],
    dividendPolicy:
      "Styrets ambisjon er å betale et ordinært utbytte per aksje på minst samme nominelle beløp som året før, forutsatt en bærekraftig solvensmargin over 150 %. Er solvensmarginen over 175 %, vil styret vurdere ekstraordinært utbytte eller tilbakekjøp av aksjer.",
  },

  // Driftsresultat per segment, Q2 2026 (mill. kr)
  segments: [
    { name: "Sparing", value: 708, growth: "+12 %" },
    { name: "Forsikring", value: 480, growth: "+66 %" },
    { name: "Garantert pensjon", value: 424, growth: "+19 %" },
    { name: "Øvrig", value: 187, growth: null },
  ],

  // Forvaltningskapital (AUM) per år, mrd NOK
  aumHistory: [
    { year: 2021, value: 1097 },
    { year: 2022, value: 1020 },
    { year: 2023, value: 1212 },
    { year: 2024, value: 1469 },
    { year: 2025, value: 1609 },
    { year: "Q2 2026", value: 1658 },
  ],

  // Utbytte per aksje (kr). Merk: utbyttet ble kuttet til 0 i 2020 (covid-19).
  dividends: [
    { year: 2017, amount: 1.55, exDate: "06.04.2017", payDate: "—" },
    { year: 2018, amount: 2.50, exDate: "12.04.2018", payDate: "—" },
    { year: 2019, amount: 3.00, exDate: "11.04.2019", payDate: "—" },
    { year: 2020, amount: 0.00, exDate: "Utsatt/kuttet (covid-19)", payDate: "—" },
    { year: 2021, amount: 3.25, exDate: "09.04.2021", payDate: "—" },
    { year: 2022, amount: 3.50, exDate: "07.04.2022", payDate: "21.04.2022" },
    { year: 2023, amount: 3.70, exDate: "14.04.2023", payDate: "25.04.2023" },
    { year: 2024, amount: 4.10, exDate: "05.04.2024", payDate: "16.04.2024" },
    { year: 2025, amount: 4.70, exDate: "10.04.2025", payDate: "24.04.2025" },
    { year: 2026, amount: 5.40, exDate: "10.04.2026", payDate: "21.04.2026" },
  ],
  dividendStats: {
    yield: 2.86,
    payoutRatio: 47.24,
    oneYearGrowthPct: 14.89,
  },

  reports: {
    latest: {
      period: "2. kvartal 2026",
      reportDate: "15. juli 2026",
      highlights: [
        "Rekordresultat: kontantresultat på 1,8 mrd. kr, opp 26 % fra året før",
        "Driftsresultat opp 17 % til 1,12 mrd. kr",
        "Resultat per aksje på 3,03 kr, opp 19 % år over år",
        "Forvaltningskapital nådde rekordhøye 1 658 mrd. kr, opp 10 %",
        "Fondsforsikringsreserver (unit-linked) opp 19 % fra året før",
        "Combined ratio i forsikring på 87 % i kvartalet (90 % hittil i år) — godt under 100 %",
        "Solvensmargin på solide 200 %",
        "Nytt tilbakekjøpsprogram på 1 mrd. kr for andre halvår, etter 1 mrd. kr allerede fullført i Q2",
        "Kostnadsguiding for 2026 opprettholdt på 7,3–7,4 mrd. kr",
      ],
    },
    calendar: [
      { label: "1. kvartal 2026", date: "April 2026", status: "Publisert" },
      { label: "2. kvartal 2026", date: "15. juli 2026", status: "Publisert" },
      { label: "3. kvartal 2026", date: "Oktober 2026 (se finanskalender)", status: "Kommer" },
      { label: "Årsrapport 2026", date: "Februar 2027 (se finanskalender)", status: "Kommer" },
    ],
    links: [
      { label: "Kvartalsrapporter", url: "https://www.storebrand.no/en/investor-relations/quarterly-reporting/storebrand-asa" },
      { label: "Årsrapporter", url: "https://www.storebrand.no/en/investor-relations/annual-reports" },
      { label: "Børsmeldinger", url: "https://www.storebrand.no/en/investor-relations/borsmeldinger" },
      { label: "Investor relations", url: "https://www.storebrand.no/en/investor-relations" },
      { label: "Strategi og forretningsmodell", url: "https://www.storebrand.no/en/investor-relations/our-strategy-and-business-model" },
    ],
  },

  insiders: {
    note: "Primærinnsidere i Storebrand har i hovedsak vært nettokjøpere det siste året — et signal markedet gjerne tolker som positivt, men det er ingen garanti for fremtidig kursutvikling.",
    transactions: [
      {
        date: "22.10.2025",
        name: "Janne Flessum",
        role: "Primærinnsider",
        type: "Kjøp",
        shares: 650,
        price: 157.00,
      },
      {
        date: "26.02.2025",
        name: "Odd Arild Grefstad (konsernsjef) m.fl. (8 ledere)",
        role: "Konsernledelse",
        type: "Aksjelønnsprogram (tildeling)",
        shares: 121365,
        price: 123.33,
      },
    ],
    buyback: {
      description:
        "Storebrand kjøper tilbake egne aksjer i stor skala. Planen er 2 mrd. kr i 2026 og minst 1,5 mrd. kr årlig fra 2027 til 2030 — samlet ventes over 12 mrd. kr i tilbakekjøp i perioden 2022–2030. Tilbakekjøp reduserer antall utestående aksjer og løfter normalt resultat per aksje.",
      treasurySharesNote:
        "Selskapet satt på 14 398 905 egne aksjer (3,21 % av aksjekapitalen) ifølge melding fra februar 2025 — antallet endres løpende med tilbakekjøp og tildelinger.",
    },
  },

  ownership: {
    note: "Folketrygdfondet er den klart største aksjonæren i Storebrand, med en eierandel på rundt 11 %. Se Storebrands investor-relations-sider for fullstendig og oppdatert aksjonærliste.",
  },

  peers: [
    { name: "Storebrand", ticker: "STB.OL", currency: "NOK", price: 198.80, marketCap: 79.26, pe: 16.48, dividendYield: 2.86, oneYearPct: 34, isSubject: true },
    { name: "Gjensidige Forsikring", ticker: "GJF.OL", currency: "NOK", price: 275.00, marketCap: 141.19, pe: 22.09, dividendYield: 5.13, oneYearPct: 26, isSubject: false },
    { name: "Protector Forsikring", ticker: "PROT.OL", currency: "NOK", price: 486.40, marketCap: 40.13, pe: 19.69, dividendYield: 2.88, oneYearPct: 70, isSubject: false },
    { name: "Tryg", ticker: "TRYG.CO", currency: "DKK", price: 153.40, marketCap: 92.36, pe: 20.70, dividendYield: 5.55, oneYearPct: null, isSubject: false },
    { name: "Sampo", ticker: "SAMPO.HE", currency: "EUR", price: 9.52, marketCap: 25.51, pe: 15.49, dividendYield: 3.73, oneYearPct: null, isSubject: false },
  ],

  news: [
    { tag: "positivt", title: "Rekordresultat i Q2 2026", body: "Storebrand la frem sitt sterkeste kvartal noensinne 15. juli 2026, med kontantresultat på 1,8 mrd. kr (+26 %). Aksjen steg på nyheten." },
    { tag: "positivt", title: "Nytt tilbakekjøpsprogram på 1 mrd. kr", body: "For andre halvår 2026 annonserte selskapet et nytt tilbakekjøp, etter at 1 mrd. kr allerede var fullført i Q2. Tilbakekjøp reduserer antall aksjer og støtter normalt kursen." },
    { tag: "positivt", title: "Hevet resultatmål og store tilbakekjøp mot 2030", body: "På kapitalmarkedsdagen løftet Storebrand målene: 7 mrd. kr i resultat i 2028, og samlet over 12 mrd. kr i tilbakekjøp fram til 2030." },
    { tag: "positivt", title: "Oppkjøp av Knif Trygghet", body: "Storebrand har inngått avtale om å kjøpe forsikringsselskapet Knif Trygghet for 560 mill. kr, oppgjort i nyutstedte Storebrand-aksjer — en styrking av skadeforsikringsvirksomheten." },
    { tag: "positivt", title: "Solid solvens gir rom for utdeling", body: "Solvensmarginen på 200 % ligger godt over selskapets minstemål på 130 % og over terskelen på 175 % som utløser ekstrautbytte eller tilbakekjøp." },
    { tag: "folgemedpaa", title: "Skadeforsikringsprisene normaliseres", body: "Analytikere peker på at 2026 kan bli året hvor prisveksten på skadeforsikring flater ut etter flere år med kraftig økning, noe som kan påvirke marginene fremover." },
    { tag: "folgemedpaa", title: "Analytikernes kursmål under dagens kurs", body: "Konsensus er «Kjøp», men gjennomsnittlig kursmål har ligget under dagens kurs etter kursoppgangen — et tegn på at aksjen kan oppfattes som mer fullpriset på kort sikt." },
    { tag: "risiko", title: "Rente- og finansmarkedseksponering", body: "Inntjening fra livsforsikring, pensjon og kapitalforvaltning er følsom for renteendringer og svingninger i aksje- og kredittmarkedene. Et markedsfall slår normalt negativt ut på forvaltningskapital og resultat." },
    { tag: "risiko", title: "Regulatoriske krav (Solvens II) og pensjonsreform", body: "Endringer i kapitalkrav (Solvens II) og norsk pensjonspolitikk kan påvirke både kapitalbehov og fremtidig premievolum for Storebrand." },
  ],

  sources: [
    { label: "Yahoo Finance — STB.OL kurshistorikk (chart-API)", url: "https://finance.yahoo.com/quote/STB.OL/" },
    { label: "stockanalysis.com — STB.OL nøkkeltall og utbyttehistorikk", url: "https://stockanalysis.com/quote/osl/STB/" },
    { label: "stockanalysis.com — peers (GJF, PROT, TRYG, SAMPO)", url: "https://stockanalysis.com/quote/osl/GJF/" },
    { label: "Investing.com — Storebrand Q2 2026 earnings call & resultater", url: "https://www.investing.com/news/transcripts/earnings-call-transcript-storebrand-posts-record-q2-2026-results-shares-rise-49-93CH-4792451" },
    { label: "Investing.com — Storebrand Q4 2025: rekordresultat og 2028-mål", url: "https://www.investing.com/news/company-news/storebrand-q4-2025-presentation-record-results-and-ambitious-2028-targets-93CH-4499067" },
    { label: "MFN.se — Meldepliktig handel for primærinnsidere (Storebrand)", url: "https://mfn.se/ob/a/storebrand/storebrand-asa-meldepliktig-handel-for-primaerinnsidere-660b0d62" },
    { label: "Storebrand — Strategi og forretningsmodell", url: "https://www.storebrand.no/en/investor-relations/our-strategy-and-business-model" },
    { label: "Storebrand — Årsrapporter", url: "https://www.storebrand.no/en/investor-relations/annual-reports" },
    { label: "Wikipedia — Storebrand (selskapsfakta)", url: "https://en.wikipedia.org/wiki/Storebrand" },
    { label: "E24 — Storebrand vil kjøpe skadeforsikringsselskap", url: "https://e24.no/bors/nyheter/a/304763" },
  ],
};
