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

Remaining P2 validation limits:
- No live provider credentials/accounts were available; real OAuth/raid/reconnect acceptance is pending.
- Actual SIGKILL and two disposable Postgres restarts now pass the dedicated failure acceptance script. The stale-worker generation test is separate; broader multi-replica stress remains a scoped review limit.
- Automated keyboard/reduced-motion/responsive checks and a desktop screenshot review do not certify every WCAG criterion or every possible device.
- Historical provenance and hashed revocation records are retained after deletion as disclosed.

No unresolved P0/P1 is established by the current scoped reviews after the documented repairs. This statement is not a guarantee that no undiscovered issue exists.

Real failure acceptance: pnpm test:failure creates only its own loopback Postgres17 container, migrates it, starts the fixture-configured real HTTP server, signs provider-shaped messages, kills/restarts the server and restarts Postgres twice. Five printed gates passed: pending custody pause, readiness recovery without process exit, one fresh committed proof, durable proof after restart, and duplicate/stale rejection. Provider data stays SIMULATED_CONTRACT. The server idle-pool error listener logs only a structured connection-loss event and allows replacement connections.

Revocation timing: deletion now acquires the user FOR UPDATE lock explicitly before clock_timestamp(). The integration test holds a reader lock, observes deletion waiting, initiates OAuth during the wait, releases the lock, and proves the callback cannot resurrect the account.
