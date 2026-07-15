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

## Oppdatere data

Alle tall ligger samlet i [`js/data.js`](js/data.js) med kilder oppgitt nederst på siden. Dataene er et øyeblikksbilde (se "Sist oppdatert" på siden) og bør oppdateres jevnlig — dette er ikke en sanntidsintegrasjon mot børsen.

**Dette er ikke investeringsrådgivning.**
