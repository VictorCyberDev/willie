# Deployment
Dedicated Vercel project: willie / prj_DDMlTddjDuuEzkQpPTSZFawNlAsu. Owner team team_gn8cWAsH7Qmm2KQMl4sHat6f. Dedicated Neon project green-hall-57124021, production database willie, branch production; acceptance branch willie-acceptance-test. No owner pre-existing database is used. Credentials are stored privately and must be configured in deployment secret storage; never paste into repository or logs.

Run a persistent Node server with Postgres and externally reachable HTTPS EventSub callback. Build with pnpm build; start with pnpm dev (tsx runtime) in prepared Docker image. Apply migrations before admitting traffic. /health reports process status; /ready reports dependency readiness. A Vercel static Judge deployment alone does not provide persistent provider connections. Record actual deployment URLs and health in final review packet.

Supabase refused creation due existing account free-project quota; no existing project was paused, deleted or upgraded. A separate dedicated Neon project was created instead. Do not use production branch for integration tests.
