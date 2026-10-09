# Hosting – alternativer og kostnad

Utredet 2026-10-09. Grunnlag for det åpne punktet «Endelig valg av hosting» i `backend.md`. **Ikke besluttet.**

Prisene er listepriser per måned uten mva., hentet fra leverandørenes sider og prissammenligninger i oktober 2026.
Flere av dem er endret i løpet av 2026 (Hetzner to ganger, Render 1. august) og kilder er uenige i detaljer – sjekk
leverandørens kalkulator før beslutning.

## Hva vi må ha

Fra `backend.md`:

- **Ett Docker-image** (ASP.NET Core .NET 10 som også serverer `dist/`). Lav trafikk – 0,5 vCPU / 512 MB holder.
- **PostgreSQL med `btree_gist`** (exclusion constraint mot dobbeltbooking). Støttes av alle managed-tilbudene under;
  på Azure må utvidelsen slås på i `azure.extensions`.
- **Alltid på.** `BackgroundService` håndterer utløpte forslag (spec §6.1) og samlet SMS (§8.1, §10). Tjenester som
  skalerer til null stopper jobbene – da trengs en ekstern cron som vekker appen, eller minst én instans som alltid
  kjører.
- **Backup** med mulighet for å gjenopprette; bookinger er data vi ikke kan gjenskape.
- **Personvern.** Medlemskap i et trossamfunn er en særlig kategori personopplysninger (GDPR art. 9). Vi bør ligge i
  EU/EØS med databehandleravtale. Alle alternativene under har EU-region; Azure har også Norge.
- **Lite drift.** Prosjektet har ikke en egen driftsperson; OS-patching og Postgres-oppgraderinger er en reell kostnad.

## Alternativer

| # | Oppsett | Region | Ca. pris/mnd | Drift |
| --- | --- | --- | --- | --- |
| 1 | **Hetzner Cloud CX23** (2 vCPU/4 GB), app + Postgres i Docker Compose, Caddy for TLS | Tyskland/Finland | **€7–12** (€5,49 + IPv4 €0,50 + backup 20 % + ekstern lagring for `pg_dump`) | Høy: vi eier OS, Postgres, backup, overvåking |
| 2 | **Railway** Hobby, app + Postgres | Amsterdam | **$5–10** ($5 inkl. $5 bruk, deretter målt) | Lav |
| 3 | **Render** Starter web + Postgres Basic-1gb | Frankfurt | **≈ $26** ($7 + $19; Basic-256mb gir ≈ $13) | Lav |
| 4 | **DigitalOcean** App Platform + Managed Postgres (1 GB) | Amsterdam/Frankfurt | **≈ $20** ($5 + $15) | Lav |
| 5 | **Fly.io** shared-cpu-1x 512 MB + **Neon** Postgres | Stockholm + Frankfurt | **$4–25** (app $3–4; Neon gratis eller Launch $0,106/CU-time) | Lav–middels |
| 6 | **Azure** App Service B1 Linux + PostgreSQL Flexible Server B1ms | Norway East | **≈ $33** (≈ $13 + ≈ $16 + lagring ≈ $4) | Lav |
| 7 | **Azure** Container Apps (min. 1 replika) + PostgreSQL Flexible B1ms | Norway East | **≈ $25–35** | Lav |

Ikke anbefalt: **Render gratis** (sover etter 15 min, gratis Postgres slettes etter 30–90 dager) og **Fly Managed
Postgres** (fra ≈ $38, dyrere enn resten for vårt behov).

## Vurdering

**1. Hetzner VPS** – billigst, og passer `backend.md` slik den er skrevet. Men vi må selv patche OS, oppgradere
Postgres, sette opp og *teste* gjenoppretting, og overvåke. Hetzner hadde i 2026 kapasitetsbegrensninger på nye
servere og merket CX-planene «ikke tilgjengelig» i perioder; sjekk at det går an å bestille.

**2. Railway** – billigst blant de administrerte. Bruksbasert pris gjør regningen mindre forutsigbar, og backup på
Hobby er enkel. Greit for test/staging.

**3. Render** – enklest å komme i gang med: Docker-deploy fra GitHub, alltid på fra Starter, managed Postgres med
daglig backup. Point-in-time recovery krever dyrere databaseplan.

**4. DigitalOcean** – tilsvarende Render, litt billigere, mer etablert managed Postgres (daglig backup + PITR på
alle planer).

**5. Fly.io + Neon** – Neon gratis (0,5 GB, sover etter 5 min, vekkes på første spørring) holder lenge for ett
senter. Appen må stå på (`min_machines_running = 1`) for bakgrunnsjobbene. To leverandører å forholde seg til.

**6–7. Azure Norway East** – dyrest på papiret, men data i Norge, og naturlig dersom BCC/kirken allerede har en
Azure-tenant (felles fakturering, tilgangsstyring, evt. nonprofit-kreditter). Container Apps er bare billigere
enn App Service hvis vi godtar skalering til null og flytter jobbene til en planlagt Container Apps Job.

## Anbefaling

1. **Spør først om BCC har Azure (eller annen plattform) vi skal bruke.** Har de det, velg **Azure App Service B1 +
   PostgreSQL Flexible B1ms i Norway East** (≈ $33/mnd, mulig dekket av eksisterende avtale). Det løser også
   datalagring i Norge.
2. Ellers: **DigitalOcean (≈ $20/mnd) eller Render (≈ $26/mnd) i EU** – administrert Postgres med backup, alltid på,
   ingen servere å patche. Forskjellen på noen titalls kroner i måneden er mindre enn tiden en VPS koster i drift.
3. **Hetzner VPS (≈ €10/mnd)** bare hvis noen tar ansvar for drift og har testet gjenoppretting fra backup.

Uansett valg holder Docker-imaget og `dotnet ef migrations bundle` oss flyttbare – leverandørbytte er en
`pg_dump`/`pg_restore` og ny deploy.

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
- Azure: [PostgreSQL Flexible B1ms](https://www.bytebase.com/dbcost/azure-flexible/instance/B1ms/),
  [Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/),
  [App Service B1](https://learn.microsoft.com/en-us/answers/questions/1328931/how-azure-cost-for-an-appservice)
