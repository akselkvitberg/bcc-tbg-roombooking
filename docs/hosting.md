# Hosting – alternativer og kostnad

Utredet 2026-10-09. Grunnlag for det åpne punktet «Endelig valg av hosting» i `backend.md`. **Ikke besluttet.**

Prisene er listepriser per måned uten mva., hentet fra leverandørenes sider og prissammenligninger i oktober 2026.
Flere av dem er endret i løpet av 2026 (Hetzner to ganger, Render 1. august) og kilder er uenige i detaljer – sjekk
leverandørens kalkulator før beslutning.

## Hva vi må ha

- **Ett Docker-image** (ASP.NET Core .NET 10 som også serverer `dist/`). Lav trafikk – 0,5 vCPU / 512 MB holder.
- **PostgreSQL med `btree_gist`** (exclusion constraint mot dobbeltbooking). Støttes av alle managed-tilbudene under;
  på Azure må utvidelsen slås på i `azure.extensions`.
- **Planlagte jobber utenfra.** Utløpte forslag (spec §6.1) og samlet SMS (§8.1, §10) startes av hostingens
  planlegger, ikke av en `BackgroundService` (se `backend.md`). Appen trenger derfor ikke stå på, og kan skalere til
  null.
- **Backup** med mulighet for å gjenopprette; bookinger er data vi ikke kan gjenskape.
- **Personvern.** Medlemskap i et trossamfunn er en særlig kategori personopplysninger (GDPR art. 9). Vi bør ligge i
  EU/EØS med databehandleravtale. Alle alternativene under har EU-region; Azure har også Norge.
- **Lite drift.** Prosjektet har ikke en egen driftsperson; OS-patching og Postgres-oppgraderinger er en reell kostnad.

## Jobber utenfor appen

Når jobbene trigges utenfra, betaler vi bare for tiden appen faktisk svarer. Det gjør at databasen blir den største
kostnaden.

- **Planlegger per plattform:** Azure Container Apps Jobs (cron), Google Cloud Scheduler (3 jobber gratis), Fly
  `fly machine run --schedule` (bare timer/dag/uke) eller GitHub Actions `schedule` (minst 5 min, kan bli forsinket),
  vanlig `cron` på en VPS.
- **Jobben** er et beskyttet `POST /internal/jobs/{navn}` eller `--job {navn}` i samme image, idempotent og med lås i
  Postgres. Et forslag med passert frist regnes som utløpt ved lesing, så en forsinket jobb gir aldri feil status –
  bare litt senere SMS.
- **Hyppighet påvirker pris.** Hver kjøring vekker app og database. Hvert 15. minutt kl. 07–22 (`*/15 7-22 * * *`,
  Europe/Oslo) er nok for SMS-samling og holder Neon innenfor gratiskvoten (≈ 60 av 100 CU-timer ved 0,25 CU).
- **Nattlig backup** kan være en egen planlagt jobb (`postgres`-image med `pg_dump` til objektlagring) – nyttig når
  databasens egen gjenoppretting er kort.
- **Ulempe: kald start.** Første forespørsel etter stillhet tar noen sekunder (.NET-container 1–3 s, Neon ≈ 0,5 s).
  Kan reduseres med ReadyToRun og lite image, eller fjernes med én instans alltid på (≈ $5–10 ekstra).

## Alternativer

### Skalering til null (jobber utenfra)

| # | Oppsett | Region | Ca. pris/mnd | Drift |
| --- | --- | --- | --- | --- |
| A | **Google Cloud Run** + Cloud Scheduler + **Neon** Postgres | Finland + Frankfurt | **$0–5** (Cloud Run og Scheduler innenfor gratiskvote; Neon gratis eller Launch) | Lav |
| B | **Azure Container Apps** (skalerer til null) + Container Apps Job + PostgreSQL Flexible B1ms | Norway East | **≈ $20** (app innenfor gratiskvote; database ≈ $16 + lagring ≈ $4) | Lav |
| C | **Fly.io** med `auto_stop_machines` + **Neon**, cron via GitHub Actions | Stockholm + Frankfurt | **$0–5** | Lav–middels |

### Alltid på

| # | Oppsett | Region | Ca. pris/mnd | Drift |
| --- | --- | --- | --- | --- |
| 1 | **Hetzner Cloud CX23** (2 vCPU/4 GB), app + Postgres i Docker Compose, Caddy for TLS, `cron` for jobber | Tyskland/Finland | **€7–12** (€5,49 + IPv4 €0,50 + backup 20 % + ekstern lagring for `pg_dump`) | Høy: vi eier OS, Postgres, backup, overvåking |
| 2 | **Railway** Hobby, app + Postgres | Amsterdam | **$5–10** ($5 inkl. $5 bruk, deretter målt) | Lav |
| 3 | **DigitalOcean** App Platform + Managed Postgres (1 GB) | Amsterdam/Frankfurt | **≈ $20** ($5 + $15) | Lav |
| 4 | **Render** Starter web + Postgres Basic-1gb | Frankfurt | **≈ $26** ($7 + $19; Basic-256mb gir ≈ $13) | Lav |
| 5 | **Azure** App Service B1 Linux + PostgreSQL Flexible B1ms | Norway East | **≈ $33** | Lav |

Ikke anbefalt: **Render gratis** (gratis Postgres slettes etter 30–90 dager) og **Fly Managed Postgres** (fra ≈ $38).

## Vurdering

**A. Cloud Run + Neon** – nesten gratis. Cloud Run har gratiskvote på 180 000 vCPU-sekunder, 360 000 GiB-sekunder og
2 mill. forespørsler i måneden, og ved forespørselsbasert fakturering betales det ikke for instanser som venter.
Neon gratis (0,5 GB, sover etter 5 min) holder lenge for ett senter, men har bare 6 timers gjenoppretting – legg på
nattlig `pg_dump` eller gå til Launch. To leverandører, og database i en annen region enn appen (Finland–Frankfurt,
noen titalls ms per spørring).

**B. Azure Container Apps** – samme modell i Norway East, og alt hos én leverandør. Postgres Flexible kan ikke skalere
til null, så databasen koster ≈ $20 uansett. Naturlig dersom BCC/kirken allerede har en Azure-tenant (felles
fakturering, tilgangsstyring, evt. nonprofit-kreditter).

**C. Fly.io + Neon** – like billig som A, men planleggeren er svakere: Fly kan bare kjøre jobber hver time eller
sjeldnere, og GitHub Actions-cron kan bli forsinket eller hoppet over. Greit for SMS-samling, mindre greit for
backup.

**1. Hetzner VPS** – billigst blant alltid-på, men vi må selv patche OS, oppgradere Postgres, sette opp og *teste*
gjenoppretting, og overvåke. Hetzner hadde i 2026 kapasitetsbegrensninger og merket CX-planene «ikke tilgjengelig» i
perioder.

**2–5. Administrert, alltid på** – ingen kald start, men $13–33 i måneden for en app som står ubrukt det meste av
døgnet. Railway er billigst og passer for test/staging; DigitalOcean og Render har mer etablert managed Postgres.

## Anbefaling

1. **Spør først om BCC har Azure (eller annen plattform) vi skal bruke.** Har de det, velg **B: Azure Container Apps +
   PostgreSQL Flexible B1ms i Norway East** (≈ $20/mnd, mulig dekket av eksisterende avtale, data i Norge).
2. Ellers: **A: Cloud Run + Cloud Scheduler + Neon** (≈ $0–5/mnd), med nattlig `pg_dump` som egen jobb. Gå til
   Neon Launch hvis gratisgrensene eller den korte gjenopprettingen blir et problem.
3. Er kald start uakseptabel for medlemmene, velg én instans alltid på i A/B (≈ $5–10 ekstra) eller **DigitalOcean**
   (≈ $20/mnd).

Uansett valg holder Docker-imaget, jobbene som endepunkter og `dotnet ef migrations bundle` oss flyttbare –
leverandørbytte er en `pg_dump`/`pg_restore`, ny deploy og ny cron.

## Kilder

- Hetzner: [prisendring juni 2026](https://privatedevops.com/news/hetzner-june-2026-cloud-price-increase-what-to-do),
  [prisoversikt aug. 2026](https://kimmo.suominen.com/stuff/cpc-2026-08.txt),
  [kapasitet](https://pingoru.io/providers/hetzner/incidents/1006802), [changelog](https://docs.hetzner.cloud/whats-new)
- Render: [kuberns.com](https://kuberns.com/blogs/render-pricing/), [budgetforge.dev](https://www.budgetforge.dev/tools/render-pricing-2026),
  [livemy.app](https://livemy.app/blog/render-pricing)
- Railway: [livemy.app](https://livemy.app/blog/railway-pricing), [budgetforge.dev](https://www.budgetforge.dev/tools/railway-pricing-2026)
- DigitalOcean: [kuberns.com](https://kuberns.com/blogs/digitalocean-pricing/),
  [infratally.com](https://infratally.com/articles/railway-vs-render-vs-fly-vs-digitalocean-paas-2026/)
- Fly.io: [fly.io/docs/about/pricing](https://fly.io/docs/about/pricing/), [temps.sh](https://temps.sh/blog/fly-io-pricing-2026)
- Neon: [jetadmin.io](https://www.jetadmin.io/blog/neon-pricing/)
- Google Cloud: [Cloud Run](https://cloud.google.com/run/pricing), [Cloud Scheduler](https://cloud.google.com/scheduler/pricing)
- Azure: [PostgreSQL Flexible B1ms](https://www.bytebase.com/dbcost/azure-flexible/instance/B1ms/),
  [Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/),
  [App Service B1](https://learn.microsoft.com/en-us/answers/questions/1328931/how-azure-cost-for-an-appservice)
