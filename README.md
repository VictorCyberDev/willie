# Willie

**One live thing. Many communities. One continuing story.**

Willie is a persistent social object that Twitch communities shape together and safely pass between live streams.

**Twitch moves audiences. Willie gives them something worth following.**

[Watch the winner experience](https://willie-winner-release-start-up16.vercel.app/) · [Judge Mode V2](https://willie-winner-release-start-up16.vercel.app/judge-v2) · [Final review packet](FINAL_REVIEW_PACKET.md)

## What Willie does

Chat changes Willie. Community moments transform it. A creator chooses where Willie should travel. A Twitch raid can move the audience, but the raid itself never transfers custody. Willie waits for matching Twitch evidence and explicit destination acceptance. Only then does authoritative custody commit.

Nothing resets: identity, Relay mission, progress, permanent community marks, Passport Chapters, Receipts and provenance continue into the next community.

The authority chain is:

**COMMUNITY INFLUENCES → CREATOR AUTHORIZES → DESTINATION PREPARES → TWITCH PROVIDES EVIDENCE → DESTINATION ACCEPTS → ENGINE COMMITS**

## Winner routes

- `/` — product hero and Relay story.
- `/willie/:id` — public **Watch Willie** journey view.
- `/stage` — room-scale Stage Mode.
- `/judge-v2` — explicitly labelled simulated Winner Release replay.
- `/legacy/:willieId/:chapter` — shareable community legacy artifact.
- `/app` — authenticated creator operations.
- `/health` — process health.
- `/ready` — database/provider readiness.
- `/release-ready` — Winner Release schema/runtime gate (requires migrations through v9).

## Runtime

The Winner Release uses a persistent Vercel container service built from the repository `Dockerfile`. The same Fastify process serves the built React frontend, OAuth/API routes, SSE, database authority and Twitch EventSub worker lifecycle. Preview and production database targets are isolated; the winner preview uses a fresh Willie-only Neon branch cloned from production and migrated through schema version 9.

The canonical production origin is `https://willie-phi.vercel.app`. Production promotion is gated on production migrations, Twitch application credentials, real two-broadcaster acceptance and final release review. Until that gate passes, the stable winner preview above is the engineering acceptance surface.

## Run locally

Use Node 24, pnpm 10.18.3 and Docker. Copy `.env.example` to `.env`, set a random `SESSION_SECRET` and 64-character hexadecimal `TOKEN_ENCRYPTION_KEY`, and keep `DATABASE_URL` and `TEST_DATABASE_URL` separate. Never commit provider secrets.

```sh
corepack enable
pnpm install --frozen-lockfile
docker compose -f docker-compose.dev.yml up -d
pnpm migrate
pnpm seed
pnpm build
pnpm dev
```

The seed is explicitly simulated. Real Twitch operation requires a configured Twitch application and broadcaster OAuth; Judge Mode remains `SIMULATED REPLAY`.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:property
pnpm test:integration
pnpm test:contracts
pnpm test:e2e
pnpm test:m9
pnpm adapter:test
pnpm test:failure
pnpm build
pnpm docker:build
```

Integration tests require an isolated `TEST_DATABASE_URL`. The failure script creates/removes only its own loopback Postgres container and exercises process/database restarts. The official Twitch CLI acceptance harness is `scripts/twitch-cli-acceptance.ts`; its raid path is `CLI_ACCEPTED`, not live-provider acceptance.

## Evidence and operation

- [Winner Product Constitution](PRODUCT_CONSTITUTION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Twitch CLI acceptance](docs/execution/TWITCH_CLI_ACCEPTANCE.md)
- [Twitch Clip Memory contract](docs/TWITCH_CLIP_MEMORY.md)
- [Real versus simulated](REAL_VS_SIMULATED.md)
- [Codex build evidence](docs/BUILT_WITH_CODEX.md)
- [Demo runbook](DEMO_RUNBOOK.md)
- [Video script](VIDEO_SCRIPT.md)
- [Devpost checklist](DEVPOST_CHECKLIST.md)

No provider is `LIVE_ACCEPTED` without genuine external behavior. The authoritative M0–M28 status, blockers and checkpoint commits live only in [FINAL_REVIEW_PACKET.md](FINAL_REVIEW_PACKET.md).
