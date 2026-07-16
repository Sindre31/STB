# Storebrand-aksjen (STB) — oversiktsside

En enkel, selvstendig nettside (ren HTML/CSS/JS, ingen byggeprosess) som gir en samlet oversikt over Storebrand-aksjen (STB, Oslo Børs):

- Aksjekurs og nøkkeltall (P/E, markedsverdi, 52-ukers spenn, beta m.m.)
- Utbyttehistorikk
- Kvartalsrapporter og finanskalender
- Innsidehandel og tilbakekjøpsprogram
- Sammenligning med lignende nordiske forsikringsselskaper (Gjensidige, Protector, Tryg, Sampo)
- Nyheter og faktorer som kan påvirke kursen

## Kjøre lokalt

Siden er statisk og krever ingen avhengigheter. Åpne `index.html` direkte i nettleseren, eller kjør en enkel lokal server, f.eks.:

```
python3 -m http.server 8000
```

og gå til `http://localhost:8000`.

## Data og automatisk oppdatering

Dataene er delt i to:

- **Auto-generert** (ikke rediger for hånd):
  - [`js/prices.js`](js/prices.js) — historiske kursserier for STB (1 år / 5 år / maks) og for peers (`STB_PEER_PRICES`, brukt til den indekserte sammenligningsgrafen)
  - [`js/live.js`](js/live.js) — siste snapshot: kurs, dagens endring, 52-ukers spenn, **og nøkkeltall (P/E, forward-P/E, direkteavkastning, markedsverdi, EPS, beta)** for STB og de sammenlignbare selskapene. Feltet `dataDate` (siste handelsdato) brukes til å vise et varsel på siden hvis dataene blir utdaterte.
- **Håndkuratert**: [`js/data.js`](js/data.js) — utbytte, rapporter, innsidehandel, nyheter, selskapsfakta, solvens og segmenttall som ikke finnes i API-et. `main.js` legger de auto-genererte tallene oppå denne ved innlasting.

Hvis auto-oppdateringen stopper (f.eks. hvis Yahoo-API-et endrer seg), viser siden automatisk et gult varsel når siste handelsdato er mer enn 5 dager gammel.

### Slik holdes kursene oppdatert

En GitHub Actions-jobb ([`.github/workflows/update-stock-data.yml`](.github/workflows/update-stock-data.yml)) kjører hver ukedag kl. 16:00 UTC (etter at Oslo Børs har stengt). Den henter ferske kurser fra Yahoo Finance sitt chart-API via [`scripts/update-data.mjs`](scripts/update-data.mjs), skriver `js/prices.js` og `js/live.js`, og pusher til `main` **kun hvis noe er endret**. Vercel bygger da siden på nytt automatisk.

Kjør manuelt lokalt med:

```
node scripts/update-data.mjs
```

eller trigg jobben manuelt fra **Actions**-fanen på GitHub (`workflow_dispatch`). Manuell kjøring har et valg **`force_commit`** som tvinger en commit selv om dataene er uendret — nyttig for å teste at hele push → Vercel-kjeden virker.

> Kurs, P/E, direkteavkastning, markedsverdi og EPS oppdateres automatisk (også etter kvartalsrapporter, siden de kommer fra markedsdata). Solvensmargin, combined ratio, segmentresultat, utbyttehistorikk, innsidehandel og nyhetstekst finnes ikke i API-et og må fortsatt oppdateres for hånd i `js/data.js` ved nye rapporter.

**Dette er ikke investeringsrådgivning.**
