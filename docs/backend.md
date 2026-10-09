# Backend – beslutning

Besluttet 2026-10-09.

## Beslutning

**ASP.NET Core (minimal API, .NET 10) + EF Core (Npgsql) + PostgreSQL.** Én tjeneste som både har API-et og
serverer den bygde Vue-appen (`dist/`). Frontend bygges fortsatt mot mock-API først (se `plan.md`); backend kobles
på uten å endre skjermene.

## Hvorfor

- **Dobbeltbooking stoppes i databasen.** PostgreSQL kan nekte overlappende bekreftede bookinger i samme rom med en
  exclusion constraint, også når to forespørsler kommer samtidig.
- **Personvern håndheves på serveren.** Medlemmer skal aldri få navn eller formål på andres bookinger (spec §3.3), og
  begrensede rom skal være skjult (§9.2). Egne DTO-er per rolle gjør det vanskelig å lekke data ved et uhell.
- **Innlogging er bare tokenvalidering.** Kirkens innlogging brukes via OIDC; vi lagrer ingen passord.
- **Bakgrunnsjobber** (utløpte forslag, samlet SMS) klares med det som følger med .NET, uten ekstra infrastruktur.
- Lav trafikk (ett senter), så én liten tjeneste og én database holder lenge.

**Vurdert, ikke valgt:** TypeScript-backend (Hono/Fastify + Drizzle), som kunne importert `availability.ts`
direkte. Logikken som må dupliseres er liten, og den avgjørende overlappsjekken ligger uansett i databasen.

## Arkitektur

### Mappestruktur

```
server/
  Jarlsberg.Rombooking.Api/        endepunkter, autentisering, DTO-er per rolle, bakgrunnsjobber
  Jarlsberg.Rombooking.Domain/     regler: status, overlapp, utfall, gjentakelser (ingen EF/ASP.NET)
  Jarlsberg.Rombooking.Data/       EF Core DbContext, konfigurasjon, migreringer
  Jarlsberg.Rombooking.Tests/      xUnit: domenetester + integrasjonstester mot Postgres
```

Frontend blir liggende i roten (`src/`, `package.json`) som i `CLAUDE.md`.

### Data

- Tabellene følger `datamodell.md`. Id-er er `uuid`.
- Tidspunkt lagres som `timestamptz`. Omregning til Europe/Oslo skjer i kanten (API og UI), med NodaTime for
  sommertid og ISO-uker.
- Ingen overlapp mellom bekreftede bookinger i samme rom:
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;
  ALTER TABLE booking ADD CONSTRAINT booking_no_overlap
    EXCLUDE USING gist (room_id WITH =, tstzrange(start_at, end_at) WITH &&)
    WHERE (status = 'confirmed');
  ```
  Ventende forespørsler kan overlappe – de blir konflikter for romansvarlig (spec §8.1). Brudd på regelen gir
  `409 Conflict`.
- Rom slettes aldri (spec §9.1), bare `active = false`.
- Skjemaendringer gjøres med EF Core-migreringer.

### API

- REST/JSON med minimal API. **OpenAPI** genereres fra koden og er kontrakten.
- Frontend genererer typer fra OpenAPI med `openapi-typescript` til `src/api/generated/`. En HTTP-implementasjon i
  `src/api/http/` implementerer de samme grensesnittene som mocken. Valg med `VITE_API=mock|http`.
- Svar formes etter rolle:
  - Medlem: status per rom og tidsrom, «Opptatt til», egne bookinger. Aldri navn, formål eller antall på andres.
  - Romansvarlig/admin: i tillegg navn, formål, antall og kontaktperson.
  - Begrensede rom filtreres bort i spørringen for alle uten tilgang (romansvarlig ser alltid alt).
- Feil returneres som `ProblemDetails`. Valideringsfeil har feltnavn, så skjemaene kan vise dem ved feltet.

### Innlogging og roller

- Kirkens innlogging via OIDC; API-et validerer JWT (`AddJwtBearer`).
- Medlemskap og mobilnummer leses fra claims der de finnes (spec §11). Hvilke claims er åpent spørsmål (spec §14
  spm. 3).
- Roller (konferanse, romansvarlig, admin) lagres i vår database og gis av admin (spec §2).
- Lokal utvikling: en dev-innlogging med rollevalg, tilsvarende mock-innloggingen i fase 1. Kun aktiv i Development.

### Domenelogikk

- `Jarlsberg.Rombooking.Domain` porterer reglene serveren må avgjøre fra `reference/availability.ts`: status med
  prioritet, overlapp/konflikt, utfall (bekreftes / går til romansvarlig), datoer i serie (maks 26, ett år frem,
  måneder uten datoen hoppes over).
- Testene i `availability.test.ts` speiles som xUnit-tester, så frontend og backend er enige.
- Frontend beholder `src/domain/availability.ts` for umiddelbar tilbakemelding. Serveren har siste ord.

### Bakgrunnsjobber og SMS

- `BackgroundService` (eller Hangfire på Postgres ved behov) for:
  - forslag som utløper ved fristen (spec §6.1),
  - samling av beslutninger i serier og hele bygg til én SMS (spec §8.1, §10).
- SMS sendes via `ISmsSender`. Leverandør er åpent (spec §14 spm. 1); til da logger en implementasjon meldingen i
  SMS-loggen uten å sende.

### Kvalitet

- `dotnet build`, `dotnet test` og `dotnet format --verify-no-changes` skal være grønne.
- Integrasjonstester kjører mot ekte Postgres (Testcontainers), så exclusion constraint og spørringer testes på ordentlig.

## Drift

- Ett Docker-image, bygget i flere steg: `npm run build` → `dotnet publish`, med `dist/` servert som statiske filer.
- PostgreSQL ved siden av. Aktuelt (full sammenligning i `hosting.md`):
  - **Hetzner Cloud-VPS** (ca. €4–5/mnd) med app og Postgres i Docker Compose, og nattlig `pg_dump` til ekstern lagring.
  - **Render + Neon** for å starte gratis (kald start etter inaktivitet).
- Migreringer kjøres ved utrulling (`dotnet ef migrations bundle`), ikke automatisk ved oppstart.

## Åpne punkter som påvirker backend

- Hvilke claims innloggingen gir (medlemskap, mobilnummer) – spec §14 spm. 3.
- Hvilke felter medlems-API-et returnerer og hvordan det søkes – spec §14 spm. 9.
- SMS-leverandør – spec §14 spm. 1.
- Endelig valg av hosting – se `hosting.md` for alternativer og kostnad.
