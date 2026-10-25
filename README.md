# Willie

One live thing. Many communities.

Willie is a shared live object that communities change together and creators can safely hand from one live stream to another.

## Run
Node 24 and pnpm 10.18.3. Copy .env.example to .env, start isolated Postgres with docker compose -f docker-compose.dev.yml up -d, pnpm install, pnpm migrate, pnpm seed, pnpm build, pnpm dev. Visit /judge for a clearly simulated replay. Twitch LIVE requires configured credentials and actual OAuth/EventSub acceptance. See MILESTONE_STATUS.md for evidence.

A raid shouldn't reset the story.
