# Jarlsberg rombooking – instruksjoner for Claude Code

Webapp der medlemmer booker rom på Jarlsberg (konferansesenter, to bygg: Nybygget og AK-bygget, to etasjer hver),
og romansvarlige godkjenner, flytter og avbestiller. Mobil er hovedflaten for vanlige medlemmer; desktop er for
ledere («power users») og romansvarlige/admin.

## Kilder – les disse før du endrer noe

| Fil | Hva |
| --- | --- |
| `docs/spec.md` | Funksjonell spesifikasjon (fasit for oppførsel). Paragrafnumre (§) brukes i oppgaver |
| `docs/plan.md` | Fasene vi bygger i, med akseptansekriterier |
| `docs/komponentkart.md` | Hvilken BCC-komponent som brukes for hva, og hvilke egne komponenter vi lager |
| `docs/datamodell.md` | Domenemodellen (TypeScript-typer) |
| `docs/backend.md` | Backend-beslutning: ASP.NET Core + EF Core + PostgreSQL, arkitektur og drift |
| `docs/design/*.dc.html` | Klikkbar prototype (fasit for utseende og flyt). Se `docs/design/README.md` |
| `src/domain/availability.ts` | Ferdig, testet logikk for status, ledig tid, konflikter og gjentakelser. Bruk den |

Er spesifikasjonen og prototypen uenige, gjelder spesifikasjonen. Spør heller enn å gjette når begge er uklare.

## Stack

- Vue 3 (`<script setup lang="ts">`), Vite, TypeScript (strict), vue-router, Pinia.
- UI: **`@bcc-code/component-library-vue`** – eneste UI-bibliotek. `app.use(BccComponentLibrary)` og
  `import '@bcc-code/component-library-vue/style.css'`. Ikoner fra `@bcc-code/icons-vue` / Material Symbols slik
  biblioteket gjør det. Dokumentasjon: https://components.bcc.no (og `llms-full.txt` der).
- Tekst: `vue-i18n`, norsk bokmål i `src/locales/nb.json`. Ingen hardkodet brukertekst i komponenter.
- Test: Vitest + @vue/test-utils for logikk og komponenter. Playwright for de viktigste flytene når fase 2 er ferdig.
- Backend: **ASP.NET Core (minimal API, .NET 10) + EF Core + PostgreSQL** i `server/`, se `docs/backend.md`.
  All datatilgang i frontend går gjennom grensesnitt i `src/api/`, med en in-memory mock (`src/api/mock/`) basert på
  testdataene i prototypen. Frontend bygges mot mocken til backend-fasen; ikke finn opp endepunkter utenom det
  `docs/backend.md` og OpenAPI-kontrakten beskriver.

## Regler

1. **Bruk BCC-komponenter** for alt de dekker (se komponentkartet). Ikke bygg egne knapper, dialoger, inputs osv.
   Sjekk props i Storybook før bruk; ikke anta.
2. **Ingen hardkodede farger.** Bruk bibliotekets tokens/CSS-variabler. Unntaket er type-fargene i
   `komponentkart.md`, som legges som egne tokens i `src/styles/tokens.css`.
3. **Statusordene** er faste (spec §3.3): Ledig, Opptatt, Forespurt, Stengt, Din booking, Venter på svar
   (+ «· konflikt»). Bruk dem likt overalt, også i SMS-tekster.
4. **Type ≠ status.** Typer vises som kontur-pille med farget ikon (`TypeTag`); status som fylt `BccTag`.
5. **Personvern:** medlemmer ser aldri navn eller formål på andres bookinger. «Opptatt til 17:00» er lov.
6. **Begrensede rom** er skjult for alle uten tilgang, også i kart og hele-bygg-lister for medlemmer.
7. **Mobil først:** alt skal fungere fra 360 px. Trykkflater minst 44 × 44 px på mobil.
8. **Tilgjengelighet (WCAG 2.1 AA):** status aldri bare med farge (ikon + tekst, mønster på tidslinjer); dialoger og
   ark fanger fokus, lukkes med Esc og gir fokus tilbake; skjemafeil øverst og ved feltet; resultatlister med
   `aria-live`.
9. **Lys og mørk modus** via bibliotekets mekanisme.
10. Tid er halvtimer 08:00–22:00 (indeks 0–28 i `availability.ts`). Uker følger ISO 8601. Tidssone Europe/Oslo.

## Arbeidsmåte

- Én fase (eller del av fase) per branch og pull request. Små, beskrivende commits.
- Før du sier at noe er ferdig: `npm run lint`, `npm run typecheck`, `npm run test` skal være grønne. Endringer i
  `server/`: også `dotnet build`, `dotnet test` og `dotnet format --verify-no-changes`.
- Skriv tester for domenelogikk og for akseptansekriteriene i `docs/plan.md`.
- Sidetittelen settes i rutens `meta.titleKey` og vises av `BccTopNavigation` som sidens `h1`. Sidene lager ikke
  egen `h1`.
- Mappestruktur:
  ```
  src/
    api/            grensesnitt + mock
    domain/         availability.ts, typer, regler (ren TS, ingen Vue)
    components/     egne komponenter (TimelineBar, RoomCard, TypeTag, ...)
    features/       booking-mobile/, booking-desktop/, my-bookings/, manager/, admin/
    locales/nb.json
    router/  stores/  styles/
  server/           .NET-backend (se docs/backend.md)
  ```
