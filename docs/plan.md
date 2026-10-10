# Byggeplan

Én fase = én eller flere pull requests. Hver fase har akseptansekriterier og en ferdig forespørsel du kan lime inn i
Claude Code. Start alltid en ny økt med «Les CLAUDE.md».

---

## Fase 0 – Oppsett

**Mål:** Tomt prosjekt som bygger, med BCC-biblioteket, ruter og testoppsett.

**Akseptanse**
- `npm run dev`, `lint`, `typecheck`, `test` fungerer.
- `BccComponentLibrary` er registrert; en testside viser `BccButton` og `BccMessage` i lys og mørk modus.
- `reference/availability.ts` er flyttet til `src/domain/availability.ts` med testene grønne.
- `src/locales/nb.json` og vue-i18n er satt opp.

> **Forespørsel:** Les CLAUDE.md. Sett opp fase 0 fra docs/plan.md: Vue 3 + Vite + TypeScript, vue-router, Pinia,
> vue-i18n (nb), Vitest, ESLint/Prettier og @bcc-code/component-library-vue. Flytt reference/availability.ts og
> testene til src/domain/. Lag en enkel layout med BccTopNavigation (desktop) og BccAppNavigation (mobil) og
> tomme ruter for skjermene i plan.md. Ikke bygg funksjoner ennå.

---

## Fase 1 – Grunnmur

**Mål:** Innlogging (mock), roller, mock-API og testdata.

**Akseptanse**
- Mock-innlogging med valg av rolle (medlem, konferanse, romansvarlig, admin) for utvikling.
- «Ikke medlem» og «ikke innlogget» viser riktige skjermer (spec §2).
- `src/api/` har grensesnitt og in-memory mock med rommene og bookingene fra prototypen (`docs/design/Main.dc.html`,
  `ROOMS`) og typene fra `komponentkart.md`.
- Begrensede rom filtreres bort for brukere uten tilgang i alle API-kall.

> **Forespørsel:** Les CLAUDE.md og docs/datamodell.md. Bygg fase 1: typer i src/domain/, API-grensesnitt i src/api/
> med in-memory mock seedet fra ROOMS-dataene i docs/design/Main.dc.html, mock-innlogging med rollevalg, og
> tilgangsskjermene i spec §2. Skriv tester for at begrensede rom er skjult.

---

## Fase 2 – Mobilflyt for booking (spec §4)

**Mål:** Hovedflyten for medlemmer på mobil. Prototype: `docs/design/Mobil.dc.html` (alle `Mobil*.dc.html` viser
samme komponent fra ulike steg).

**Akseptanse**
- Finn rom viser resultater med en gang (i kveld, forrige antall), gruppert *Ledig hele tiden / Delvis ledig /
  Ikke tilgjengelig* med årsak («Opptatt til 19:00», «For lite»).
- `WhenSummary` åpner et bunnark med dag, periode, «Velg tid selv» (halvtimer, fra 30 min) og antall.
- Trykk på delvis ledig rom åpner romsiden med det ledige vinduet valgt.
- Romsiden: tidslinje for dagen, hurtigvalg, `TimeStepper`, melding om ledig/konflikt/utenfor åpningstid (kan ikke gå
  videre ved stengt).
- Detaljer: type (påkrevd), formål (påkrevd, 200), antall (≤ kapasitet), gjentakelse med til-og-med, datoliste med
  avkrysning for å hoppe over, mobilnummer kun når det mangler. Utfallsmelding før sending (spec §4.3).
- Kvittering med riktig variant. Hele bygget (§4.5) og kart (§4.6) fungerer på mobil.
- Fungerer fra 360 px, trykkflater ≥ 44 px, ark lukkes med Esc og gir fokus tilbake.

> **Forespørsel:** Les CLAUDE.md, spec §3–4 og docs/design/README.md. Bygg fase 2, mobilflyten, etter
> docs/design/Mobil.dc.html: skjermene find, room, details, done, part og map, med komponentene RoomCard,
> TimelineBar, WhenSummary, PeriodPicker, TimeStepper, TypeTag og OccurrenceList. Bruk src/domain/availability.ts
> for all statuslogikk. Skriv komponenttester for akseptansekriteriene i plan.md fase 2.

---

## Fase 3 – Mine bookinger (spec §6)

**Akseptanse**
- Mobil: «Trenger ditt svar» med godta/avslå og frist; kommende med type, status og Praktisk info; handlingsark med
  Hopp over denne datoen / Avbestill.
- Desktop: nøkkeltall som filtre, filter på type, liste per uke og kalendervisning, sideskuff med handlinger, Mine
  serier med hopp over / ta med igjen, Mine maler, avslått/avbestilt siste 30 dager.
- Avbestilling og hopp over frigjør rommet med en gang og logger en SMS-kvittering (mock).

> **Forespørsel:** Les CLAUDE.md og spec §6. Bygg fase 3 etter docs/design/MineBookinger.dc.html (desktop) og
> mine-skjermen i docs/design/Mobil.dc.html. Bruk BccDataTable for listen og BccDrawer for sideskuffen.

---

## Fase 4 – Desktop Book og Dagsoversikt (spec §5)

**Akseptanse**
- Tre kolonner: når og hvor (kan foldes sammen), rom gruppert per bygg med tidslinje og avkrysning, sticky bookingpanel.
- Flere rom samtidig; «Velg hele bygget» setter hele-bygg-modus.
- Bookingpanelet regner konflikt/stengt per dato og rom med `occurrences` og viser riktig utfall.
- Slutt på gjentakelse: antall ganger eller til dato. Datoer kan velges bort.
- Maler: lagre, bruke; «Fortsett der du slapp» når ingenting er valgt.
- Dagsoversikt: rutenett med tastaturnavigasjon (spec §12), «Opptatt til»-etiketter, fornuftig standardlengde ved klikk.

> **Forespørsel:** Les CLAUDE.md og spec §5. Bygg fase 4 etter docs/design/Main.dc.html og
> docs/design/Dagsoversikt.dc.html: BookingPanel, desktop-romliste og AvailabilityGrid med full tastaturstøtte.

---

## Fase 5 – Romansvarlig (spec §8)

**Akseptanse**
- Forespørsler: grupper (konflikter, hele bygg, serier, enkle), side-ved-side-visning av konflikt, forslag til ledige
  rom, alle handlinger med påkrevd begrunnelse der spec krever det, svarfrist 24 t / 48 t / 3 dager.
- Alle bookinger: per bygg, konferanse markert, varsel om konferanse/kveld-konflikter, dra og slipp + Flytt… for tastatur.
- Admin-meny gruppert (spec §8.3).

> **Forespørsel:** Les CLAUDE.md og spec §8. Bygg fase 5 etter docs/design/Foresporsler.dc.html og
> docs/design/Oversikt.dc.html.

---

## Fase 6 – Admin og varsler (spec §9–10)

**Akseptanse**
- Romoppsett med bygg, etasje, kartplassering, kapasitet, godkjenning, tilgang, åpningstider, Praktisk info, rekkefølge.
- Begrensede rom: `MemberSearch` mot medlems-API (mock), legg til/fjern personer.
- Stengte tider for rom / helt bygg / hele Jarlsberg, med antall berørte bookinger.
- Typer: liste, aktiv/inaktiv, statistikk siste 30 dager.
- SMS-logg. SMS-utsending bak et grensesnitt (leverandør er åpent spørsmål).

> **Forespørsel:** Les CLAUDE.md og spec §9–10. Bygg fase 6 etter docs/design/Rom.dc.html.

---

## Fase 7 – WordPress-plugin (docs/backend.md)

**Mål:** Ekte API og database i en WordPress-plugin, bak de samme grensesnittene som mocken.

**Akseptanse**
- `plugin/jarlsberg-rombooking/` med Domain, Data, Rest, Jobs og Sms som beskrevet i `docs/backend.md`;
  `composer lint` og `composer test` er grønne.
- `.wp-env.json` starter WordPress lokalt med pluginen aktivert, testbrukere for hver rolle og Xdebug (`--xdebug`).
- Tabeller via `dbDelta` med skjemaversjon. Bekrefting av bookinger låser rommet i en transaksjon; en test viser at
  to samtidige bekreftelser av samme tid gir én booking og én `409`.
- Domeneregler portert fra `src/domain/availability.ts`, med testene speilet i PHPUnit.
- Rollebaserte svar: medlemmer får aldri navn/formål på andres bookinger; begrensede rom er skjult. Testet.
- `src/api/http/` implementerer grensesnittene mot `jarlsberg-rombooking/v1` med nonce; `VITE_API=mock|http`.
- Sidemalen «Rombooking (fullskjerm)» viser appen uten temaet, med dype lenker som virker.
- GitHub Actions bygger en installerbar zip.

> **Forespørsel:** Les CLAUDE.md og docs/backend.md. Bygg fase 7: WordPress-pluginen i plugin/jarlsberg-rombooking/,
> tabeller og skjemaversjon, domeneregler med speilede PHPUnit-tester, REST-ruter med rollebaserte svar og låsing mot
> dobbeltbooking, HTTP-implementasjon av API-grensesnittene, sidemalen som laster Vite-bygget, wp-env-oppsett og
> zip-bygg i GitHub Actions.

---

## Etter fase 7

- Koble medlemskap og mobilnummer fra nettstedets innlogging, medlems-API og SMS-leverandør (spec §14).
- Installer pluginen på nettstedet og sett opp ekte cron hos vertskapet.
- Erstatt eksempelkartet med ekte plantegning (spec §14 spm. 8).
- Playwright-tester for: booke en kveld på mobil, gjentakende booking med hoppede datoer på desktop, godkjenne en
  konflikt som romansvarlig.
