# Security review evidence

Independent reviewers were Codex subagents. Their reviews inspected inherited excerpts, proposed repairs and actual test evidence; they were context reviews, not a complete independent source audit. The final external reviewer must verify these claims from source.

Repaired findings:
- P1 account-deletion/OAuth race: account epoch and deletion timestamp under user lock, issue-time checks, hashed identity tombstones, transactional OAuth persistence, post-identity-insert freshness recheck. Actual stale callback, stale epoch after reactivation, cross-account replay and two-client unique-wait regressions pass.
- P1 pooled transport scheduling: replaced session advisory locks with transaction-scoped locks; full cross-platform repeated-poll integration passes through the real pooled Neon endpoint.
- Worker pool starvation: capacity bound workers*2+1<=poolMaximum, rejects pools below3. Guard regression passes.
- Old worker checkpoint/emit: generation fence and encrypted-config CAS. Actual delayed response/new generation fixture verifies no progress, envelope or checkpoint regression.
- Outbox single-connection deadlock: retry metadata uses retained client; failure/retry/exact delivery regression passes.
- Optional OAuth grants: allowlist preservation and both enablement orders, minimum scopes, cross-creator isolation and unrelated-scope rejection pass.
- Expiry/decline: inclusive boundary, replay, unauthorized decline and committed terminal-history tests pass.
- Overlay privilege/token rotation: read-only credentials, redacted projection, owner-only rotation, revoked URL denial and other creator URL preservation pass.

## M17–M28 winner-release focused review

The winner surfaces were reviewed as an extension of the existing custody authority rather than a second authority engine.

- Relay: the Relay is derived from authoritative campaign/custody state. Database constraints prevent negative progress, duplicate campaign relays and invalid mission bounds. Receipt-driven advancement is transactional; Relay progress cannot transfer custody.
- Permanent marks: mark IDs and visual signatures are deterministic. The database enforces one primary mark per Relay chapter and unique provenance per Relay. Stale Willie versions, wrong communities, duplicate selection and cross-Relay references are rejected before persistence.
- Votes: ballots are unique per voter/session and provider event. Open sessions are bounded by a partial unique index, candidate lists are validated, stale versions fail, and ties remain unresolved until creator authority chooses an eligible candidate. Chat votes never call custody commit paths.
- Passport Chapters: chapters have Relay-scoped uniqueness, durable before/after versions, provider verification and Receipt linkage. Receipt-triggered chapter advancement runs under a locked Relay row and the existing Receipt transaction, preventing duplicate chapters from replayed custody evidence.
- Clip Memory: `clips:edit` is requested through a separate optional OAuth path and stored as a separately encrypted token. Core Twitch onboarding is not scope-expanded. OAuth state is single-use and bound to the existing Willie session identity. Clip URLs are accepted only from HTTPS Twitch hosts. Clip create/poll failure updates clip state only and never mutates custody, Relay progress, marks, Passport proof or Receipts.
- Public Willie/Legacy pages: public identifiers are bounded, database reads are parameterized, data is rendered by React escaping, and no raw HTML from communities is emitted. Share artifacts are derived from authoritative Passport Chapters rather than caller-supplied counters.
- SSE: the existing membership/authenticated stream limits and bounded listener count remain in force. The public story route is request/response only and exposes no creator token or secret material.
- OAuth/open redirects: callback destinations are fixed Willie routes; Twitch reconnect URLs remain restricted to `wss://eventsub.wss.twitch.tv`. The CLI simulator does not weaken that production allowlist.
- Rate limits: Fastify global read/write limits remain active for winner routes; vote and contribution domain cooldown/deduplication add protocol-level abuse resistance.
- Runtime isolation: Vercel preview `DATABASE_URL` is separated from production. Winner preview validation runs on a fresh Neon branch cloned from Willie production and migrated through schema version 9. No unrelated database is used.
- Runtime readiness: `/release-ready` independently requires schema migration version 9 and all winner tables before a deployment can be treated as winner-release ready.

Regression evidence includes Relay authority/progress, duplicate marks, stale marks/votes, candidate bounds, voter/event deduplication, creator approval, Passport chapter uniqueness, mark/Relay/Passport handoff preservation, restart/failure acceptance, concurrent custody receive behavior, clip-failure isolation and the 10,000-sequence property suite. GitHub CI also runs lint, typecheck, unit, integration, contract, browser E2E, M9, failure/restart and Docker build gates.

Remaining P2 validation limits:
- Real Twitch OAuth and two-broadcaster raid acceptance still require real broadcaster accounts and a configured Twitch application. The official Twitch CLI WebSocket raid path is separately CLI_ACCEPTED and is not represented as live acceptance.
- Shared Chat, Power-Up/Bits and Hype remain contract-tested until real-account eligibility is confirmed after the flagship raid acceptance.
- Actual SIGKILL and two disposable Postgres restarts pass the dedicated failure acceptance script. The stale-worker generation test is separate; broader multi-replica stress remains a scoped review limit.
- Automated keyboard/reduced-motion/responsive checks and a desktop screenshot review do not certify every WCAG criterion or every possible device.
- Historical provenance and hashed revocation records are retained after deletion as disclosed.

No unresolved P0/P1 is established by the current scoped reviews after the documented repairs. This statement is not a guarantee that no undiscovered issue exists.

Real failure acceptance: pnpm test:failure creates only its own loopback Postgres17 container, migrates it, starts the fixture-configured real HTTP server, signs provider-shaped messages, kills/restarts the server and restarts Postgres twice. Five printed gates passed: pending custody pause, readiness recovery without process exit, one fresh committed proof, durable proof after restart, and duplicate/stale rejection. Provider data stays SIMULATED_CONTRACT. The server idle-pool error listener logs only a structured connection-loss event and allows replacement connections.

Revocation timing: deletion now acquires the user FOR UPDATE lock explicitly before clock_timestamp(). The integration test holds a reader lock, observes deletion waiting, initiates OAuth during the wait, releases the lock, and proves the callback cannot resurrect the account.
