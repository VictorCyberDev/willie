# Willie

**One live thing. Many communities.**

Willie is a shared live object that communities change together and creators can safely hand from one live stream to another.

[Open simulated Judge Mode](https://willie-phi.vercel.app/judge) · [Review packet](FINAL_REVIEW_PACKET.md) · [Milestone evidence](MILESTONE_STATUS.md)

## Run locally

Use Node 24, pnpm 10.18.3 and Docker. Copy `.env.example` to `.env`, set a random SESSION_SECRET and 64-character hexadecimal TOKEN_ENCRYPTION_KEY, and keep DATABASE_URL and TEST_DATABASE_URL separate. Generate each secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

```sh
corepack enable
pnpm install --frozen-lockfile
docker compose -f docker-compose.dev.yml up -d
pnpm migrate
pnpm seed
pnpm build
pnpm dev
```

The seed is explicitly simulated. Visit /judge, /judge/campaigns or /dev/design. Creator controls under /app need the server and real provider configuration. The public Vercel deployment serves the frontend/Judge; it does not pretend to host persistent provider workers.

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

Integration tests require an isolated TEST_DATABASE_URL. The failure script creates/removes only its own loopback Postgres container and exercises real process/database restarts. See [testing instructions](TESTING_INSTRUCTIONS.md).

## Operate and extend

- [Architecture](docs/ARCHITECTURE.md), [security review](docs/SECURITY_REVIEW.md), [deployment](docs/DEPLOYMENT.md)
- [SDK](docs/SDK.md), [adapter authoring](docs/ADAPTER_AUTHORING.md), [adapter security](docs/ADAPTER_SECURITY.md)
- [Real versus simulated](REAL_VS_SIMULATED.md), [Codex build evidence](docs/BUILT_WITH_CODEX.md), [demo runbook](DEMO_RUNBOOK.md)

No provider is LIVE_ACCEPTED without real external evidence. Exact credential/hosting/submission actions are isolated in the review packet. Trademark/domain clearance is outside this build.

**A raid shouldn't reset the story.**
