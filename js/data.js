// Kildedata for Storebrand-oversikten.
// Hentet fra offentlig tilgjengelige markedsdata- og nyhetskilder (se kildeliste nederst på siden).
// "asOf" viser datoen tallene ble hentet inn — aksjekurser og nøkkeltall endrer seg kontinuerlig.
const STB_DATA = {
  meta: {
    updated: "15. juli 2026",
    ticker: "STB",
    exchange: "Oslo Børs",
    isin: "NO0003053605",
    currency: "NOK",
  },

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
    week52High: 199.40,
    volume: 1407167,
    beta: 0.52,
    analystRating: "Kjøp",
    analystTarget: 184.10,
    revenueTtm: 108.29, // mrd NOK
    netIncomeTtm: 4.85, // mrd NOK
    sharesOutstanding: 420.25, // millioner
  },

  dividends: [
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
        "Rekordresultat: konsernresultat på 1,80 mrd. kr, opp fra 1,43 mrd. kr for ett år siden",
        "Resultat etter skatt opp 19 % til 1,38 mrd. kr",
        "Driftsresultat opp 17 % til 1,12 mrd. kr, drevet av forsikring og bedre finansavkastning",
        "Kostnadsvekst på 2,8 %, godt under ledelsens mål om maks 5 % årlig vekst",
        "Forvaltningskapital nådde rekordhøye 1 660 mrd. kr, opp 10 % fra året før",
        "Fondsforsikringsreserver (unit-linked) opp 19 % fra året før",
        "Nytt tilbakekjøpsprogram på 1 mrd. kr annonsert sammen med kvartalsresultatet",
      ],
    },
    calendar: [
      { label: "2. kvartal 2026", date: "15. juli 2026", status: "Publisert" },
      { label: "3. kvartal 2026", date: "Oktober 2026 (se finanskalender)", status: "Kommer" },
      { label: "Årsrapport 2026", date: "Februar 2027 (se finanskalender)", status: "Kommer" },
    ],
    links: [
      { label: "Kvartalsrapporter", url: "https://www.storebrand.no/en/investor-relations/quarterly-reporting/storebrand-asa" },
      { label: "Årsrapporter", url: "https://www.storebrand.no/en/investor-relations/annual-reports" },
      { label: "Børsmeldinger", url: "https://www.storebrand.no/en/investor-relations/borsmeldinger" },
      { label: "Investor relations", url: "https://www.storebrand.no/en/investor-relations" },
    ],
  },

  insiders: {
    note: "Primærinnsidere i Storebrand har i hovedsak vært nettokjøpere det siste året — et signal markedet gjerne tolker som positivt, men det er ikke en garanti for fremtidig kursutvikling.",
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
      description: "Storebrand har et løpende tilbakekjøpsprogram for egne aksjer. Et nytt program på 1 mrd. kr ble lansert sammen med Q2 2026-resultatene, i tillegg til status­rapportering om tidligere tilbakekjøp (senest 18. mai 2026).",
      treasurySharesNote: "Selskapet satt på 14 398 905 egne aksjer (3,21 % av aksjekapitalen) ifølge melding fra februar 2025 — antallet endres løpende med tilbakekjøp og tildelinger.",
    },
  },

  ownership: {
    note: "Folketrygdfondet er den klart største aksjonæren i Storebrand, med en eierandel på rundt 10 %. Se Storebrands investor-relations-sider for fullstendig og oppdatert aksjonærliste.",
  },

  peers: [
    {
      name: "Storebrand",
      ticker: "STB.OL",
      currency: "NOK",
      price: 198.80,
      marketCap: 79.26,
      pe: 16.48,
      dividendYield: 2.86,
      oneYearPct: 34,
      isSubject: true,
    },
    {
      name: "Gjensidige Forsikring",
      ticker: "GJF.OL",
      currency: "NOK",
      price: 275.00,
      marketCap: 141.19,
      pe: 22.09,
      dividendYield: 5.13,
      oneYearPct: 26,
      isSubject: false,
    },
    {
      name: "Protector Forsikring",
      ticker: "PROT.OL",
      currency: "NOK",
      price: 486.40,
      marketCap: 40.13,
      pe: 19.69,
      dividendYield: 2.88,
      oneYearPct: 70,
      isSubject: false,
    },
    {
      name: "Tryg",
      ticker: "TRYG.CO",
      currency: "DKK",
      price: 153.40,
      marketCap: 92.36,
      pe: 20.70,
      dividendYield: 5.55,
      oneYearPct: null,
      isSubject: false,
    },
    {
      name: "Sampo",
      ticker: "SAMPO.HE",
      currency: "EUR",
      price: 9.52,
      marketCap: 25.51,
      pe: 15.49,
      dividendYield: 3.73,
      oneYearPct: null,
      isSubject: false,
    },
  ],

  news: [
    {
      tag: "positivt",
      title: "Rekordresultat i Q2 2026",
      body: "Storebrand la frem sitt sterkeste kvartal noensinne 15. juli 2026, med resultatvekst drevet av forsikring, kostnadskontroll og bedre finansavkastning. Aksjen steg på nyheten.",
    },
    {
      tag: "positivt",
      title: "Nytt tilbakekjøpsprogram på 1 mrd. kr",
      body: "Sammen med kvartalsrapporten annonserte selskapet et nytt tilbakekjøpsprogram, som reduserer antall utestående aksjer og normalt støtter opp under kursen.",
    },
    {
      tag: "positivt",
      title: "Oppkjøp av Knif Trygghet",
      body: "Storebrand har inngått avtale om å kjøpe forsikringsselskapet Knif Trygghet for 560 mill. kr, oppgjort i nyutstedte Storebrand-aksjer — en styrking av skadeforsikringsvirksomheten.",
    },
    {
      tag: "å følge med på",
      title: "Skadeforsikringsprisene normaliseres",
      body: "Analytikere peker på at 2026 kan bli året hvor prisveksten på skadeforsikring flater ut etter flere år med kraftig prisøkning, noe som kan påvirke marginene fremover.",
    },
    {
      tag: "å følge med på",
      title: "Analytikernes kursmål under dagens kurs",
      body: "Konsensus blant analytikere er «Kjøp», men gjennomsnittlig kursmål har historisk ligget noe under dagens kurs etter den siste kursoppgangen — et tegn på at aksjen kan oppfattes som mer fullpriset på kort sikt.",
    },
    {
      tag: "risiko",
      title: "Rente- og finansmarkedseksponering",
      body: "Storebrands inntjening fra livsforsikring, pensjon og kapitalforvaltning er følsom for renteendringer og svingninger i aksje- og kredittmarkedene. Et markedsfall vil normalt slå negativt ut på forvaltningskapital og resultat.",
    },
    {
      tag: "risiko",
      title: "Regulatoriske krav (Solvens II) og pensjonsreform",
      body: "Endringer i kapitalkrav (Solvens II) og norsk pensjonspolitikk kan påvirke både kapitalbehov og fremtidig premievolum for Storebrand.",
    },
  ],

  sources: [
    { label: "stockanalysis.com — STB.OL nøkkeltall og utbyttehistorikk", url: "https://stockanalysis.com/quote/osl/STB/" },
    { label: "stockanalysis.com — GJF.OL", url: "https://stockanalysis.com/quote/osl/GJF/" },
    { label: "stockanalysis.com — PROT.OL", url: "https://stockanalysis.com/quote/osl/PROT/" },
    { label: "stockanalysis.com — TRYG.CO", url: "https://stockanalysis.com/quote/cph/TRYG/" },
    { label: "stockanalysis.com — SAMPO.HE", url: "https://stockanalysis.com/quote/hel/SAMPO/" },
    { label: "Investing.com — Storebrand Q2 2026-resultater", url: "https://www.investing.com/news/earnings/storebrand-q2-profit-up-26-as-insurance-growth-drives-results-launches-buybac-4792217" },
    { label: "MFN.se — Meldepliktig handel for primærinnsidere (Storebrand)", url: "https://mfn.se/ob/a/storebrand/storebrand-asa-meldepliktig-handel-for-primaerinnsidere-660b0d62" },
    { label: "MFN.se — Status tilbakekjøp av egne aksjer", url: "https://www.mfn.se/cis/a/storebrand/storebrand-asa-storebrand-asa-status-tilbakekjop-av-egne-aksjer-bb54a84d" },
    { label: "Storebrand Investor Relations", url: "https://www.storebrand.no/en/investor-relations" },
    { label: "The Insurer — Storebrand outperforms Nordic peers", url: "https://www.theinsurer.com/ti/analysis/storebrand-outperforms-nordic-peers-as-gjensidige-hit-by-one-off-and-tryg-holds-2025-10-29/" },
    { label: "E24 — Storebrand vil kjøpe skadeforsikringsselskap", url: "https://e24.no/bors/nyheter/a/304763" },
  ],
};
