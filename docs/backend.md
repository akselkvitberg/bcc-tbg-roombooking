# Backend – beslutning

Besluttet 2026-10-10. Erstatter beslutningen fra 2026-10-09 (ASP.NET Core + EF Core + PostgreSQL).

## Beslutning

**WordPress-plugin (PHP 8.1+) på kirkens eksisterende WordPress-nettsted.** Pluginen har REST-API-et, lagrer data i
egne tabeller i WordPress-databasen (MySQL/MariaDB) og serverer den bygde Vue-appen på en egen side. Frontend bygges
fortsatt mot mock-API først (se `plan.md`); backend kobles på uten å endre skjermene.

## Hvorfor

- **Ingen ekstra hosting.** Nettstedet finnes og driftes allerede. En egen tjeneste med database ville kostet penger
  og drift hver måned for ett senter med lav trafikk.
- **Innlogging finnes.** Brukerne logger allerede inn på nettstedet med BCC Login; pluginen leser hvem personen er fra
  innloggingen og trenger ingen egen tokenvalidering.
- **Pluginen har vært i bruk før.** Funksjonene i spesifikasjonen er prøvd ut i den forrige pluginen (fase 0–9).
- **Lokal feilsøking løses med `@wordpress/env`** (Docker) med Xdebug, i stedet for en manuell WordPress-installasjon
  på Windows. Det var grunnen til at vi gikk bort fra WordPress sist.

**Vurdert, ikke valgt:** ASP.NET Core + PostgreSQL (forrige beslutning). Bedre overlappsjekk i databasen
(exclusion constraint) og sterkere typer, men krever egen hosting (ca. €4–5/mnd eller en gratis tjeneste med kald
start) og egen drift.

**Hva vi gir fra oss:** MySQL har ingen exclusion constraint, så dobbeltbooking må stoppes med låsing i PHP (se
under). Domenereglene må finnes både i TypeScript (frontend) og PHP (server).

## Arkitektur

### Mappestruktur

```
plugin/jarlsberg-rombooking/
  jarlsberg-rombooking.php      plugin-header, oppstart, aktivering/deaktivering
  src/
    Domain/                     regler: status, overlapp, utfall, gjentakelser (ren PHP, ingen WordPress-kall)
    Data/                       tabeller, migreringer (dbDelta), repositorier mot $wpdb
    Rest/                       REST-ruter, tilgangssjekk, svar formet per rolle
    Jobs/                       WP-Cron-jobber (utløpte forslag, samlet SMS)
    Sms/                        SmsSender-grensesnitt + logg-implementasjon
    Admin/                      sideoppsett, innstillinger i wp-admin
  templates/app.php             sidemal som bare viser appen (uten temaets topp og bunn)
  assets/app/                   Vite-bygget (genereres, sjekkes ikke inn)
  tests/                        PHPUnit
  composer.json  phpcs.xml
.wp-env.json                    lokal WordPress i Docker
```

Frontend blir liggende i roten (`src/`, `package.json`) som i `CLAUDE.md`. `npm run build` legger bygget i
`plugin/jarlsberg-rombooking/assets/app/`.

### Hvordan appen vises

- Pluginen registrerer en sidemal, «Rombooking (fullskjerm)», som bare skriver ut `<div id="app">` og Vue-appen, uten
  temaets topp, bunn eller CSS. Slik er BCC-komponentene, mobiloppsettet og lys/mørk modus uavhengige av temaet.
- Admin velger hvilken side som er appen i innstillingene. Vue-ruteren bruker `createWebHistory` med sidens sti som
  base; pluginen legger inn en rewrite-regel så dype lenker (`/rombooking/mine`) treffer samme side.
- PHP leser Vites `manifest.json` og laster riktige filer med `wp_enqueue_script_module` / `wp_enqueue_style`.
- Oppstartsdata (REST-adresse, nonce, innlogget bruker og roller) legges inn med `wp_add_inline_script`, så appen
  slipper et ekstra kall ved oppstart.

### Data

- Egne tabeller med WordPress-prefiks (`{prefix}rb_person`, `rb_person_role`, `rb_room`, `rb_booking`, `rb_booking_group`, `rb_series`,
  `rb_proposal`, `rb_decision`, `rb_template`, `rb_closure`, `rb_room_access`, `rb_booking_type`, `rb_sms_log`).
  Tabellene følger `datamodell.md`. Ikke custom post types: overlappspørringer og indekser trenger egne kolonner.
- Personer identifiseres med `personUid` fra BCC-innloggingen, ikke WordPress-brukerens id (se «Innlogging og roller»).
  `memberId` er `personUid`. Tabellen `rb_person` (`person_uid`, navn, e-post, mobilnummer, sist sett) fylles ved
  første besøk og oppdateres fra tokenet.
- Id-er er `BIGINT UNSIGNED AUTO_INCREMENT`; API-et sender dem som strenger, så `Id = string` i frontend gjelder fortsatt.
- Tidspunkt lagres som `DATETIME` i UTC. Omregning til Europe/Oslo skjer i kanten (API og UI) med
  `DateTimeImmutable` og `DateTimeZone('Europe/Oslo')`, uavhengig av nettstedets tidssoneinnstilling.
- Krever InnoDB (MySQL 8 / MariaDB 10.6+) for transaksjoner og radlås.
- Skjema opprettes og oppgraderes med `dbDelta` ved aktivering og når pluginens skjemaversjon (lagret i `wp_options`)
  er lavere enn kodens.
- Rom slettes aldri (spec §9.1), bare `active = 0`.

### Ingen dobbeltbooking

MySQL kan ikke nekte overlappende rader med en constraint. I stedet går all bekrefting av bookinger (ny booking med
automatisk godkjenning, godkjenning, flytt, godta forslag) gjennom én funksjon som:

1. starter en transaksjon,
2. låser rommets rad med `SELECT … FROM rb_room WHERE id IN (…) ORDER BY id FOR UPDATE` (fast rekkefølge, så to
   forespørsler ikke låser hverandre fast),
3. sjekker overlapp mot bekreftede bookinger i rommet (`start_at < :end AND end_at > :start`),
4. skriver og committer, eller ruller tilbake og svarer `409 Conflict`.

Indeks på `(room_id, status, start_at, end_at)`. Ventende forespørsler kan overlappe – de blir konflikter for
romansvarlig (spec §8.1). Integrasjonstester kjører to samtidige bekreftelser og sjekker at bare én går gjennom.

### API

- WordPress REST API, navnerom `jarlsberg-rombooking/v1`, registrert med `register_rest_route`.
- Hver rute har `permission_callback` som sjekker innlogging, medlemskap og rolle. Ingen rute er åpen for ikke-innloggede.
- Autentisering med WordPress-informasjonskapselen + `X-WP-Nonce` (nonce fra oppstartsdataene).
- Kontrakten er TypeScript-grensesnittene i `src/api/` (se `datamodell.md`). Hver rute har et JSON-schema i `args`
  for validering. En HTTP-implementasjon i `src/api/http/` implementerer de samme grensesnittene som mocken. Valg med
  `VITE_API=mock|http`.
- Svar formes etter rolle i egne funksjoner per rolle:
  - Medlem: status per rom og tidsrom, «Opptatt til», egne bookinger. Aldri navn, formål eller antall på andres.
  - Romansvarlig/admin: i tillegg navn, formål, antall og kontaktperson.
  - Begrensede rom filtreres bort i spørringen for alle uten tilgang (romansvarlig ser alltid alt).
- Feil returneres som `WP_Error` med HTTP-status. Valideringsfeil har feltnavn i `data.params`, så skjemaene kan vise
  dem ved feltet.

### Innlogging og roller

Nettstedet bruker **BCC Login** (`bcc-code/bcc-wp`, `plugins/bcc-login`). Det styrer hvordan vi vet hvem brukeren er:

- **WordPress-brukeren er ikke personen.** Med standardoppsettet logger BCC Login alle medlemmer inn som én felles
  WordPress-bruker (`bcc-login-member`), og andre med medlemskap som `bcc-login-subscriber`. Egne WordPress-brukere
  per person finnes bare hvis innstillingen «opprett manglende brukere» er på. Derfor brukes aldri
  `get_current_user_id()` eller capabilities til å identifisere en person eller gi roller.
- **Personen leses fra tokenet.** BCC Login lagrer ID-tokenet i en transient (`oidc_id_token_{id}`), der `{id}` står i
  den httpOnly-informasjonskapselen `oidc_token_id`. Tokenet er validert av BCC Login ved innlogging. Pluginen leser
  claims derfra bak et eget grensesnitt (`CurrentPerson`), så bare én klasse må endres om BCC Login endrer seg:
  - `https://login.bcc.no/claims/personUid` → `memberId`,
  - `name`, `email`,
  - medlemskap: samme regel som BCC Login bruker for synlighetsnivå «medlem» (medlemsorganisasjons-claim lik
    nettstedets organisasjon). `hasMembership` uten riktig organisasjon gir skjermen «ikke medlem» (spec §2).
- Mangler transienten (utløpt), er brukeren logget ut for oss: API-et svarer `401`, og appen sender brukeren til
  BCC Logins innlogging/`/bcc-login/refresh-login`.
- **Mobilnummer** er ikke i tokenet med standard scope (`email openid profile church`). Til medlems-API-et er avklart
  (spec §14 spm. 3 og 9) spør appen én gang og lagrer nummeret i `rb_person`.
- **Roller** (konferanse, romansvarlig, admin) lagres i `rb_person_role` per `personUid` og gis av admin i appen
  (spec §2). WordPress-administratorer (individuelle brukere med `manage_options`) kan alltid åpne admin-skjermen i
  wp-admin og gi den første admin-rollen.
- **Begrensede rom** gis til personer (`personUid`). BCC Login har en klient mot Core API med
  `checkGroupMemberships`; tilgang via BCC-grupper kan legges til senere uten å endre modellen.
- **Ingen hurtigbuffer.** Alle medlemmer deler samme WordPress-bruker, så en sidebuffer kan vise én persons data til en
  annen. REST-svar sendes med `Cache-Control: private, no-store`, og appsiden ekskluderes fra sidebuffer.
- Nonce (`X-WP-Nonce`) beskytter fortsatt mot CSRF; den er knyttet til innloggingsøkten, ikke til personen.
- Lokal utvikling: BCC Login er ikke med i `wp-env`. I utvikling byttes `CurrentPerson` ut med en dev-implementasjon
  med rollevalg (medlem, konferanse, romansvarlig, admin, ikke medlem), tilsvarende mock-innloggingen i fase 1.

### Domenelogikk

- `src/Domain/` porterer reglene serveren må avgjøre fra `src/domain/availability.ts`: status med prioritet,
  overlapp/konflikt, utfall (bekreftes / går til romansvarlig), datoer i serie (maks 26, ett år frem, måneder uten
  datoen hoppes over).
- Testene i `availability.test.ts` speiles som PHPUnit-tester, så frontend og backend er enige.
- Frontend beholder `src/domain/availability.ts` for umiddelbar tilbakemelding. Serveren har siste ord.

### Bakgrunnsjobber og SMS

- WP-Cron for:
  - forslag som utløper ved fristen (spec §6.1),
  - samling av beslutninger i serier og hele bygg til én SMS (spec §8.1, §10).
- WP-Cron kjører bare når noen besøker nettstedet. På produksjon settes `DISABLE_WP_CRON` og en ekte cron som kaller
  `wp-cron.php` hvert 5. minutt, hvis vertskapet tillater det. Jobbene må tåle å kjøre sent og to ganger.
- SMS sendes via `SmsSender`. Leverandør er åpent (spec §14 spm. 1); til da logger en implementasjon meldingen i
  SMS-loggen uten å sende.

### Kvalitet

- `composer test` (PHPUnit) og `composer lint` (PHPCS med WordPress Coding Standards) skal være grønne.
- Domenetester kjører uten WordPress. Integrasjonstester kjører i `wp-env` mot ekte MySQL, så låsing, spørringer og
  rollebaserte svar testes på ordentlig.
- Lokal feilsøking: `npx wp-env start --xdebug`, og VS Code-utvidelsen «PHP Debug» kobles til.

## Drift

- Pluginen leveres som zip (`plugin/jarlsberg-rombooking` med ferdig bygget `assets/app/`, uten tester og
  utviklingsfiler), laget av en GitHub Actions-jobb, og installeres via wp-admin.
- Skjemaendringer kjøres automatisk ved første forespørsel etter oppdatering (skjemaversjon i `wp_options`).
- Backup følger nettstedets eksisterende database-backup. Sjekk at den tar med `rb_`-tabellene.
- Krav til vertskapet: PHP 8.1+, MySQL 8 / MariaDB 10.6+ med InnoDB, helst ekte cron.

## Åpne punkter som påvirker backend

- Hvilken medlemsorganisasjon og innstillinger BCC Login har på nettstedet (felles bruker eller én bruker per person).
- Mobilnummer: fra Core API (krever scope for personer) eller spurt i appen – spec §14 spm. 3.
- Hvilke felter medlems-API-et returnerer og hvordan det søkes – spec §14 spm. 9.
- SMS-leverandør – spec §14 spm. 1. BCC har en varslingstjeneste (brukt av BCC Login for gruppevarsler); sjekk om den
  kan sende SMS til én person.
- PHP- og MySQL-versjon og om ekte cron er tilgjengelig hos nettstedets vertskap.
