# Willie

**A raid shouldn't reset the story.**

Willie is a persistent social object that Twitch communities shape together, safely pass between live streams, and inherit without resetting.

**Twitch moves audiences. Willie gives them something worth following.**

## Judge Willie in 90 seconds

- **Live product:** https://willie-phi.vercel.app
- **Demo video:** https://youtu.be/6O7GZceaUxU
- **Judge Mode V2:** https://willie-phi.vercel.app/judge-v2
- **Stage Mode:** https://willie-phi.vercel.app/stage
- **Source:** https://github.com/VictorCyberDev/willie

The core loop is simple:

1. A community shapes Willie through bounded participation.
2. The creator approves the next destination.
3. Twitch provides matching raid evidence.
4. Willie does **not** transfer automatically.
5. The destination creator must explicitly **Hold to Receive**.
6. Custody commits exactly once.
7. Marks, Relay progress, Passport Chapters, Receipts and provenance survive into the next community.

**Most Twitch tools make one stream more interactive. Willie makes continuity between streams the interaction.**

> **Follow the object, not only the creator.**

The authority chain is:

**COMMUNITY INFLUENCES → CREATOR AUTHORIZES → DESTINATION PREPARES → TWITCH PROVIDES EVIDENCE → DESTINATION ACCEPTS → ENGINE COMMITS**

## Why Willie is different

A raid already moves people between creators. Willie turns that transition into a persistent social mechanic.

Instead of resetting at the channel boundary, the same shared object keeps travelling. Viewers can encounter Willie again later, recognize the history previous communities left behind, and continue the same Relay.

This opens the door to formats such as:

- creator relays;
- charity journeys;
- game-launch relays;
- community quests;
- convention/event journeys;
- collaborative campaigns where every community permanently changes the same artifact.

The product is not a poll, chatbot or cosmetic overlay. The product is the persistent object and the trusted handoff between communities.

## What Willie does

Chat changes Willie. Community moments transform it. A creator chooses where Willie should travel. A Twitch raid can move the audience, but the raid itself never transfers custody. Willie waits for matching Twitch evidence and explicit destination acceptance. Only then does authoritative custody commit.

Nothing resets: identity, Relay mission, progress, permanent community marks, Passport Chapters, Receipts and provenance continue into the next community.

## Winner experience

- **Living Willie V2** — a visual object whose state changes with the community.
- **Willie Relay** — one shared mission spanning multiple Twitch communities.
- **Permanent Community Marks** — durable marks with provenance from each community.
- **Community Decision Rituals** — viewers influence the next chapter while creators retain control.
- **Passport Chapters** — every accepted handoff becomes part of Willie's history.
- **Watch Willie** — follow the current community, Relay and journey.
- **Stage Mode** — a room-scale presentation surface for live viewing.
- **Community Legacy** — a shareable artifact of what one community contributed.
- **Judge Mode V2** — a clearly labelled simulated replay for inspecting the full lifecycle without confusing simulation with provider evidence.

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

## Built with Twitch

Willie connects to Twitch through:

- Twitch OAuth for creator identity and authorization;
- Twitch EventSub for provider events;
- Twitch chat participation for bounded community influence;
- `channel.raid` evidence for handoff verification;
- OBS-friendly presentation surfaces for live streams.

The official Twitch CLI acceptance harness exercises the real Willie transport/parser path for `channel.raid` events. That evidence is labelled **CLI_ACCEPTED** and is not represented as a live broadcaster run.

## Built with OpenAI Codex

OpenAI Codex was central to the engineering foundation, not just used for snippets.

Codex helped design and implement:

- the deterministic custody state machine;
- PostgreSQL authority and outbox persistence;
- Twitch provider integration;
- replay and duplicate protection;
- concurrency and race-condition repairs;
- property-based testing;
- failure/restart acceptance;
- security review;
- SDK and adapter contracts.

We also used Codex adversarially: it helped run **10,000 randomized authority sequences**, investigate failure modes, surface race conditions and verify the resulting fixes.

Canonical Codex Session ID: `01a171fa-0ed6-750c-8ed5-4ac1c6eab04b`

## Safety and authority

A cross-community object is only interesting if normal social activity cannot hijack it.

Willie's invariants include:

- chat cannot transfer custody;
- a raid cannot automatically transfer custody;
- destination acceptance is mandatory;
- duplicate or stale evidence cannot recommit custody;
- exactly one authoritative owner exists per version;
- provider gaps pause rather than guess;
- permanent marks and Passport Chapters are replay-safe;
- successful handoffs produce durable Receipts.

## Engineering proof

The Winner Release on `main` is covered by acceptance checks for:

- lint and TypeScript typecheck;
- unit tests;
- 10,000-sequence property tests;
- PostgreSQL integration and concurrency tests;
- Twitch/provider contract tests;
- browser E2E;
- failure and restart acceptance;
- production build;
- Docker build.

The production Willie runtime exposes health/readiness gates and is migrated through database version 9.

## Runtime

The Winner Release uses a persistent Vercel container service built from the repository `Dockerfile`. The same Fastify process serves the built React frontend, OAuth/API routes, SSE, database authority and Twitch EventSub worker lifecycle. Preview and production database targets are isolated.

The canonical production origin is:

**https://willie-phi.vercel.app**

Real broadcaster commissioning requires a configured Twitch application and broadcaster OAuth. Until genuine external Twitch behavior is observed, Willie keeps the evidence boundary explicit rather than claiming `LIVE_ACCEPTED`.

## Real vs simulated evidence

Willie deliberately separates provider evidence from simulation:

- **LIVE_ACCEPTED** — reserved for genuine external Twitch behavior.
- **CLI_ACCEPTED** — Twitch CLI EventSub evidence exercised through the real transport/parser path.
- **CONTRACT-TESTED** — provider behavior verified in automated contracts.
- **SIMULATED REPLAY** — Judge Mode lifecycle replay.

Judge Mode visibly identifies itself as simulated. No provider is described as live without genuine external behavior.

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
- [Final review packet](FINAL_REVIEW_PACKET.md)

---

## The idea

**A raid shouldn't reset the story.**

**One live thing. Many communities. One continuing story.**