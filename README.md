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
  - [`js/prices.js`](js/prices.js) — historiske kursserier (1 år / 5 år / maks)
  - [`js/live.js`](js/live.js) — siste kurs-snapshot for STB og sammenlignbare selskaper
- **Håndkuratert**: [`js/data.js`](js/data.js) — utbytte, rapporter, innsidehandel, nyheter, selskapsfakta og nøkkeltall som ikke finnes i kurs-API-et. `main.js` legger de auto-genererte tallene oppå denne ved innlasting.

### Slik holdes kursene oppdatert

En GitHub Actions-jobb ([`.github/workflows/update-stock-data.yml`](.github/workflows/update-stock-data.yml)) kjører hver ukedag kl. 16:00 UTC (etter at Oslo Børs har stengt). Den henter ferske kurser fra Yahoo Finance sitt chart-API via [`scripts/update-data.mjs`](scripts/update-data.mjs), skriver `js/prices.js` og `js/live.js`, og pusher til `main` **kun hvis noe er endret**. Vercel bygger da siden på nytt automatisk.

Kjør manuelt lokalt med:

```
node scripts/update-data.mjs
```

eller trigg jobben manuelt fra **Actions**-fanen på GitHub (`workflow_dispatch`).

> Nøkkeltall som P/E, direkteavkastning, solvensmargin og segmentresultat oppdateres ikke automatisk — de ligger i `js/data.js` og bør oppdateres for hånd ved nye kvartalsrapporter.

**Dette er ikke investeringsrådgivning.**
