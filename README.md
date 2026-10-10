# Jarlsberg rombooking – overleveringspakke

Alt som trengs for å gå fra design til kode i et GitHub-repo.

## Innhold

```
CLAUDE.md                 Instruksjoner Claude Code leser automatisk (stack, regler, arbeidsmåte)
docs/
  spec.md                 Funksjonell spesifikasjon, utkast 2
  plan.md                 Byggeplan i 7 faser med akseptansekriterier og ferdige forespørsler
  komponentkart.md        Prototype → BCC-komponenter + egne komponenter, type-farger
  datamodell.md           Forslag til domenemodell og API-grensesnitt (TypeScript)
  backend.md              Backend-beslutning: ASP.NET Core + EF Core + PostgreSQL
  design/                 Prototypens kildefiler (.dc.html) + README om hvordan de leses
src/                      Vue-appen (fase 0 er satt opp)
  domain/availability.ts  Ferdig logikk: status, ledig tid, «Opptatt til», gjentakelser, utfall (21 tester)
```

## Slik kommer du i gang

1. **Lag repoet** på GitHub (tomt) og klon det.
2. **Pakk ut** innholdet i denne mappen i roten av repoet (så `CLAUDE.md` ligger i roten). Commit: «Legg til spesifikasjon og design».
3. **Åpne repoet i Claude Code** (terminal: `claude` i mappen, eller desktop-appen / claude.ai/code koblet til GitHub).
4. **Lim inn forespørselen for fase 0** fra `docs/plan.md`. Gå gjennom endringene, kjør appen, og lag en pull request.
5. **Fortsett fase for fase.** Start hver nye økt med «Les CLAUDE.md», og lim inn forespørselen for neste fase.

## Utvikling

Krever Node 22 eller nyere.

```bash
npm install
npm run dev        # utviklingsserver
npm run lint       # ESLint
npm run typecheck  # vue-tsc
npm run test       # Vitest
npm run build      # produksjonsbygg til dist/
```

`/demo` viser BCC-komponentene i lys og mørk modus (bytt med knappen øverst til høyre).

## Tips

- Hold én fase per pull request – da er det enkelt å se gjennom og rette.
- Er noe uklart i spesifikasjonen, avgjør det og oppdater `docs/spec.md` i samme pull request, så den forblir fasit.
- Prototypen på lerretet (lenke i `docs/design/README.md`) er nyttig å ha oppe ved siden av når du ser gjennom.
- Backend er ASP.NET Core + EF Core + PostgreSQL (se `docs/backend.md`). Appen bygges mot et mock-API først; i backend-fasen kobles et HTTP-API på uten å endre skjermene.
- Åpne spørsmål står i `docs/spec.md` §14 – noen av dem (SMS-leverandør, medlems-API) bør avklares før fase 6.
