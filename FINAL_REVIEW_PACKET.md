# Willie independent review packet
Implementation evidence and acceptance boundaries. Milestone labels are not proof; external provider acceptance remains pending.

## A — Repository
Repository: https://github.com/VictorCyberDev/willie
Owner: VictorCyberDev
Default branch: main
Authoritative branch: integration/willie-m0-m16 before PR#1 merge; main after merge.
Integration branch: integration/willie-m0-m16
Starting authority HEAD: e7e6672a1457c956d3340632a27dafdc03ff0924
Accepted implementation HEAD: b4d75739ac5285c7400fafd67c685ab7d406e6fe
Final PR: https://github.com/VictorCyberDev/willie/pull/1
Final repository HEAD and merge status: the linked PR's merge metadata and the final execution report are authoritative. This evidence file is committed after the implementation checkpoint, so its own commit is resolved from Git rather than embedded recursively.
M9 contract checkpoint: hackathon-m9-contract-accepted at adfe8ade1a693a8fc69357259f6092bfb2b09728. This is a frozen branch reference, not a Git tag or a live Twitch acceptance claim.

## B — Milestone matrix
|Milestone|Status|Commit|Code|Tests|Live acceptance|Docs|Blockers|
|---|---|---|---|---|---|---|---|
|M0 — Foundation|LOCAL_ACCEPTED|2548829|Implemented|install/migrate/seed/lint/types/tests/build/Docker|Not required for local gate|docs/execution/M0.md|None|
|M1 — Brand, motion, sound|LOCAL_ACCEPTED|e8113ac|Implemented|12 visual states, responsive/OBS and saved mute controls|Not required for local gate|docs/execution/M1.md|Scoped visual/accessibility limits|
|M2 — Deterministic authority|LOCAL_ACCEPTED|c9b985a|Implemented|10,000 sequences, hashes, DB races/outbox/replay|Not required for local gate|docs/execution/M2.md|None|
|M3 — Twitch foundation|CONTRACT_TESTED / EXTERNAL_ACCEPTANCE_PENDING|f07a253|Implemented|OAuth, EventSub (12 tests), provider contracts|Pending|docs/execution/M3.md|Real Twitch credentials/consent|
|M4 — Creator orchestration|LOCAL_ACCEPTED|be480f6|Implemented|two-context UI, readiness, invite ledger, route/rotation|Not required for local gate|docs/execution/M4.md|Live use depends on M3|
|M5 — Community participation|LOCAL_ACCEPTED|bce238e|Implemented|bounded/cooldown/unique-origin contribution tests|Not required for local gate|docs/execution/M5.md|Live chat depends on M3|
|M6 — Signature Handoff|LOCAL_ACCEPTED / EXTERNAL_ACCEPTANCE_PENDING|07aaa36|Implemented|dual overlay, race receive, unchanged progress/proof|Pending|docs/execution/M6.md|Real two-account raid|
|M7 — Failure/security|LOCAL_ACCEPTED|b4d7573|Implemented|revocation races, fencing, signatures, pause, failure checks|Not required for local gate|docs/execution/M7.md|Scoped review limits|
|M8 — Passport, Receipt, Judge|LOCAL_ACCEPTED|07aaa36|Implemented|public replay, attacks and durable proof|Not required for local gate|docs/execution/M8.md|None|
|M9 — Hackathon checkpoint|LOCAL_ACCEPTED / EXTERNAL_ACCEPTANCE_PENDING|0aa5991|Implemented|M9 domain plus 12 browser checks|Pending|docs/execution/M9.md|Live Twitch/video/session ID|
|M10 — Shared Chat co-op|LOCAL_ACCEPTED / EXTERNAL_ACCEPTANCE_PENDING|f5fa8fa|Implemented|server origin attribution, concurrent co-op/dedupe/end|Pending|docs/execution/M10.md|Real Shared Chat session|
|M11 — Declarative templates|LOCAL_ACCEPTED|f07a253|Implemented|validated import/export/preview, policy-driven engine|Not required for local gate|docs/execution/M11.md|None|
|M12 — Tiltify adapter|CONTRACT_TESTED / EXTERNAL_ACCEPTANCE_PENDING|f07a253|Implemented|v5 contract and actual host→domain→Postgres fixture|Pending|docs/execution/M12.md|Real read credential|
|M13 — Power-Ups/Hype|CONTRACT_TESTED / EXTERNAL_ACCEPTANCE_PENDING|4670fec|Implemented|official shapes, optional scopes and bounded paid policy|Pending|docs/execution/M13.md|Eligible channel/grants/events|
|M14 — Brand orchestration|LOCAL_ACCEPTED|ec891b1|Implemented|operator replay/export proof, roster and emergency stop|Not required for local gate|docs/execution/M14.md|None|
|M15 — Public adapter SDK|LOCAL_ACCEPTED|f07a253|Implemented|public imports, two example adapters, conformance (4 tests)|Not required for local gate|docs/execution/M15.md|None|
|M16 — Cross-platform transport|LOCAL_ACCEPTED / EXTERNAL_ACCEPTANCE_PENDING|4e30b9c|Implemented|ordered dual consent, YouTube poll and stale generation|Pending|docs/execution/M16.md|Real YouTube/Kick credentials|


## C — Product
Willie is a shared live object that communities change together and creators can safely hand from one live stream to another.
Handoff moves custody only through the authoritative engine. Passport records its journey. Receipt records provider evidence, consent, versions and hashes. Route organizes participating creators. Bounded contributions change progress; declarative templates configure stages and rules. Adapters normalize external events.

## D — Innovation claim
«Willie turns creator-to-creator live transitions into explicit, consent-driven, verifiable state transitions for one shared live experience. A participating creator can transfer custody of Willie to another participating creator while Willie retains its authoritative state, provenance, campaign progress and visible history.»
«A Twitch raid is evidence that the creator-to-creator transition occurred. The raid itself does not automatically transfer Willie.»
Willie does not claim to have invented Twitch interactivity, persistent livestream progression, raids, overlays, multiplayer stream games, shared viewer identity, rewards, creator collaboration or broad cross-channel state. No blockchain claim.

## E — Architecture
React/Vite web application; Fastify long-running TypeScript server; pure deterministic domain; normalized Postgres authority; durable outbox; SSE snapshot gateway.
Packages: domain, db, twitch, adapters, campaigns, sdk.
Provider adapters cannot directly assign custody. Browsers request authorized commands. Domain validation and row-locked database transactions commit custody.
State progression: IDLE → PREPARED → PROVIDER_VERIFIED → AWAITING_ACCEPTANCE → COMMITTING → COMMITTED. Abort and pause are safety branches; committed history is terminal.
See docs/ARCHITECTURE.md.

## F — Data model
Versioned migrations:
- 001: normalized authority, provenance, contributions, envelopes, append-only domain events and outbox.
- 002: operational sessions, invitations, membership readiness/heartbeat/route ordering and composite membership FKs.
- 003: adapter ownership/health, dual-consent records, Shared Chat sessions and campaign settings.
- 004: account epochs/deletion timestamps, OAuth issue timestamps and hashed identity revocation tombstones.

Tables include users, provider_connections, campaigns, campaign_members, willies, willie_snapshots, custodies, handoffs, handoff_evidence, passport_stamps, receipts, contributions, milestones, event_envelopes, domain_events, outbox_events, overlay_sessions, campaign_templates, adapter_connections, brand_briefs, brand_deliverables, external_platform_identities, creator_sessions, oauth_states, invitations, dual_consents, shared_sessions, campaign_settings and account_identity_tombstones.
Custody mutation locks the current snapshot and validates version, membership, proof and hashes. Provider envelopes, handoff receipts and stamps are unique. Domain event update/delete is rejected by DB trigger. Logical invitation issuance and token creation now commit together.
Production and acceptance databases are separate. Tests refuse DATABASE_URL as fallback for TEST_DATABASE_URL.

## G — Twitch
Initial OAuth scope: user:read:chat. Optional explicit capability grants: bits:read and channel:read:hype_train. No channel:manage:raids.
WebSocket EventSub: channel.raid, channel.chat.message, channel.shared_chat.begin/update/end; optional documented custom Power-Up and Hype Train v2 paths when grants exist. Authorization revocation freezes affected handoffs. Chat commands are recognized deterministically; full chat is not archived.
Raid source/destination/time/version/member/consent checks all apply. Viewer count grants no authority. Controlled reconnect overlaps sockets; hard loss and startup evidence gaps pause handoffs. Lifecycle heartbeats bypass bounded database notification work. Startup/hourly token validation, refresh, encrypted persistence and disconnect exist.
Status: CONTRACT_TESTED / EXTERNAL_ACCEPTANCE_PENDING. No real OAuth, live EventSub or raid has been accepted.

## H — Tiltify
Official v5 API polling implementation, opaque pagination, overlap/deduplication, encrypted credentials, bounded paid contribution, retry/disconnect and health.
Contract and server→Postgres→domain fixture acceptance passed. Donor names/email are excluded.
Status: CONTRACT_TESTED / EXTERNAL_ACCEPTANCE_PENDING. No real provider read recorded.

## I — YouTube
YouTube implements OAuth/PKCE, owned identity/broadcast discovery, REST live-chat consumption, page tokens, documented polling intervals, encrypted token refresh, connection health and disconnect.
The server/Postgres fixture proves Twitch contribution → ordered destination confirmation/source send/destination receive → DUAL_CONSENT receipt and verified YouTube Passport identity → continued YouTube contribution through the actual poller.
A delayed in-flight response after adapter generation replacement produces no contribution/envelope and cannot overwrite the newer checkpoint.
Status: LOCAL_ACCEPTED / EXTERNAL_ACCEPTANCE_PENDING. No live YouTube connection is claimed. No native YouTube raid primitive is invented.

## J — Kick
OAuth/PKCE, owned identity, event subscription, official public-key RSA verification, normalized recognized chat, encrypted credentials, health and disconnect.
No native raid evidence claimed. Remote subscription/grant revocation cannot be claimed from local disconnect alone.
Status: CONTRACT_TESTED / EXTERNAL_ACCEPTANCE_PENDING.

## K — Actual test evidence
Counts are actual, not estimates. Vitest categories below partition the 94-test regression; dedicated commands repeat subsets.

| Category | Count | Evidence |
|---|---:|---|
| Unit and component/service logic | 62 | domain9, security14, EventSub (12 tests), HTTP7, M9 domain1, campaigns7, initialization3, expiry2, adapter conformance (4 tests), time2, worker capacity1 |
| Property | 1 | 10,000 randomized handoff sequences |
| Database/server integration | 17 | database5, orchestration7, cross-platform2, revocation3 |
| Provider contracts | 14 | Twitch, Tiltify, YouTube, Kick, OAuth/signature shapes |
| Total Vitest | 94 | 17 test files |
| Browser E2E | 12 | authenticated two-creator journey, public replay/failure/responsive/OBS, brand proof, unavailable service, saved audio preferences |
| M9 protection | 1 domain + 12 browser | pnpm test:m9 |
| Deployed public browser checks | 11 | same public suite against https://willie-phi.vercel.app |

Clean-checkout acceptance: install, clean migration/seed, lint, typecheck, full regression, dedicated property/integration/contracts, build, E2E, M9 and Docker build have passed at recorded checkpoints. Final source CI is linked in section L.
Authenticated evidence captures 23 screenshots: console/armed/arrival/Passport/Receipt at 375/768/1440 and sleeping/active/awaiting-receive/paused OBS at 1920×1080 and 1280×720.
Failure injection: five actual SIGKILL/Postgres-restart gates passed via pnpm test:failure on its own disposable loopback Postgres 17 container. Provider messages remain SIMULATED_CONTRACT. See docs/SECURITY_REVIEW.md.

## L — CI
Workflow: .github/workflows/ci.yml
Clean Ubuntu checkout, Node 24/pnpm 10, Postgres 17 service, Chromium install, explicit migrations and deterministic seed, lint, typecheck, all tests, production build, browser/M9 checks, real process/database failure acceptance and Docker build. Browser evidence is uploaded as browser-evidence.
Verified source checkpoint run: [Willie acceptance run 40668357076](https://github.com/VictorCyberDev/willie/actions/runs/40668357076) — success, final source b4d7573.
Final packet-only commit checks and merge result are linked from PR#1. A local run is never represented as hosted CI success.

## M — Security
Controls: OAuth state; PKCE where supported; HttpOnly/SameSite cookies; Origin-based CSRF defense; strict env/input validation; separate read/write rate budgets; signed fresh provider envelopes; dedupe; AES-256-GCM token encryption; role/membership authorization; user-epoch and snapshot row locks; CSP/security headers; expiring read-only overlay tokens and owner-only rotation.
Account deletion increments a persisted epoch, removes local credentials/sessions/overlay access, clears adapter config and pauses affected campaigns. Stale transactions remain rejected after reactivation. OAuth issue-time/tombstone checks run before persistence and after identity insertion, catching cross-account uniqueness waits. Historical provenance and hashed revocation records are disclosed as retained.
Independent scoped Codex review established no remaining P0/P1 from its identified concerns after repairs and tests. It was a context/excerpt review, not a full independent source certification. See docs/SECURITY_REVIEW.md for findings and limits.
Repaired: pooled-session advisory lock stalls, worker headroom, generation/checkpoint fencing, outbox single-connection deadlock, nonfinite times, source/destination proof identity, OAuth deletion replay, optional grant preservation, overlay pause priority and invitation audit transaction.
Production dependency audit: no known vulnerabilities at the final recorded audit. No secrets are committed or logged.

## N — Design
Willie is a nonhuman six-segment physical capsule with luminous core and permanent Passport marks. Graphite, warm bone and orange preserve a deliberate identity; sans copy and selective monospace distinguish operational/protocol language.
Motion uses authoritative timestamps and graceful interpolation. Hold to Receive is750ms; partial holds do not authorize receipt. Reduced motion, keyboard focus and muted operation remain functional.
Generated Wake/Send/Receive Web Audio now observes authoritative creator/overlay snapshots. Global and independent overlay mute preferences are saved and start muted.
Independent desktop landing review found no P0/P1; annotation overlap and small labels were repaired. Automated responsive, keyboard, reduced-motion and dual-overlay acceptance passed. These checks do not certify every WCAG criterion or every device.
Committed screenshots: docs/screenshots/landing.jpg, judge.jpg, design.jpg.
Generated authenticated evidence: test-results/acceptance/*.png, available in CI browser-evidence artifacts. The suite captures console, armed, arrival, Passport, Receipt and four OBS states at the required sizes.

## O — Deployment
Dedicated Vercel project: prj_DDMlTddjDuuEzkQpPTSZFawNlAsu
Public frontend/Judge: https://willie-phi.vercel.app/judge
Deployment: dpl_55dXcxAdSKGvD98vrYAw9safW4Xm, source b4d75739ac5285c7400fafd67c685ab7d406e6fe.
The public static deployment is not the persistent provider backend. Creator-service absence is explained in the UI.
Long-running container is built and smoke-tested: direct compiled Node startup, nonroot runtime, configured-port health check, /health200 and /ready200, no runtime package download. Stable backend hosting remains an external configuration action.
Dedicated Neon project: green-hall-57124021. Production branch br-rough-block-za7tcppl/database willie. Acceptance branch br-red-dew-zaric03h uses separate disposable databases. Production migrations001–004 applied; integration tests never use the production DB.
Other owner projects/databases were not modified. Supabase free quota prevented separate creation; no existing project was paused/deleted.

## P — Hackathon
M9 local/contract/browser acceptance passed and remains protected by pnpm test:m9. Real Twitch OAuth/two-account raid acceptance remains EXTERNAL_ACCEPTANCE_PENDING.
Judge Mode requires no account and visibly states SIMULATED REPLAY. Brand/operator replay and proof exports are also explicitly simulated.
Submission assets: SUBMISSION_DESCRIPTION.md, DEVPOST_CHECKLIST.md, VIDEO_SCRIPT.md, VIDEO_SHOTLIST.md, DEMO_RUNBOOK.md, TESTING_INSTRUCTIONS.md, JUDGE_RUBRIC_MAP.md and REAL_VS_SIMULATED.md.
Video script/shot list are prepared; a live Twitch demonstration video is not fabricated. No Devpost submission occurred.
Codex engineering/review evidence: docs/BUILT_WITH_CODEX.md. Canonical session ID is not exposed by this environment; it remains a submission metadata blocker. Sandbox/agent IDs are not substituted.

## Q — Real versus simulated
Real infrastructure and engineering acceptance: deployed frontend, Postgres migrations/transactions, server HTTP/SSE implementation, container build/start/health, actual browser operation, process/database failure checks where recorded.
Simulated/provider-contract data: Judge seed WILLIE-7, development Maya/Victor/Lex, fixture authenticated creators, raid-shaped events, charity donation fixtures, Shared Chat copies, optional paid events and cross-platform messages.
No external provider is LIVE_ACCEPTED. Twitch, Shared Chat, Power-Ups, Hype Train, Tiltify, YouTube and Kick all require real provider acceptance. A fixture receipt exercising the native protocol is labelled SIMULATED CONTRACT by its test environment; public Judge receipts use SIMULATED_JUDGE_REPLAY.

## R — Unavoidable external owner actions
1. Persistent backend hosting
ACTION: Deploy the supplied container on a long-running host.
WHY: Vercel's static frontend does not host the persistent provider workers.
EXACT STEPS: Build Dockerfile; configure dedicated Willie DATABASE_URL, SESSION_SECRET, TOKEN_ENCRYPTION_KEY, APP_URL and PORT; run pnpm migrate; start the container; verify /health and /ready. Prefer a region near the dedicated Neon database. Serve the frontend and API under the configured application origin.
UNLOCKS: stable creator/OBS/provider operation.

2. Real provider credentials and consent
ACTION: Register/configure the intended provider applications and grant minimum permissions.
EXACT STEPS: Configure TWITCH_CLIENT_ID/SECRET with /auth/twitch/callback; YOUTUBE_CLIENT_ID/SECRET with /auth/youtube/callback; KICK_CLIENT_ID/SECRET with /auth/kick/callback. Configure the Kick webhook URL to /api/kick/eventsub. Connect Tiltify from the campaign Adapters UI using its campaign ID and read credential. Keep secrets in the host secret store or encrypted adapter config. Enable optional Twitch scopes only through explicit Power-Up/Hype controls.
WHY: No real provider credentials were available.
UNLOCKS: each provider's LIVE_ACCEPTED path.

3. Native Twitch demonstration
ACTION: Two participating creators authorize, connect OBS, ready/arm, perform the native Twitch raid and Hold to Receive.
WHY: Fixture evidence cannot prove a real raid.
EXACT STEPS: Follow DEMO_RUNBOOK.md, save real Receipt/Passport evidence and record the prepared under-three-minute shot list.
UNLOCKS: M3/M6/M9 live acceptance and live video evidence.

4. Canonical session/submission review
ACTION: Retrieve the primary Codex session's canonical ID from its UI/export and add it to docs/BUILT_WITH_CODEX.md; owner-review the submission package.
WHY: Session metadata is not exposed through the available execution environment.
UNLOCKS: complete hackathon metadata. Devpost final submission remains owner-reviewed.

## S — Known limitations and unfinished gates
- Real provider acceptance and stable persistent backend hosting remain external-only actions; the deployed Judge is a simulation.
- Canonical Codex session ID and a real Twitch video are not available. No Devpost submission was made.
- Independent reviews were scoped context/excerpt reviews. Broader multi-replica stress and comprehensive independent source/accessibility audits remain review limits, not established P0/P1 vulnerabilities.
- Performance evidence includes bundle sizes and browser operation; a publication-quality 60fps benchmark across all laptops is not claimed. Cross-region Postgres round trips affect operational latency.
- Account deletion retains disclosed immutable provenance and hashed revocation records.
- Milestones share coherent implementation commits. Per-milestone historical starts were not all captured contemporaneously; execution documents identify retrospective Git baselines rather than inventing chronology.
- Trademark/domain clearance is explicitly outside this build.

## T — ChatGPT review prompt
«Review the Willie M0–M16 implementation independently. Do not trust milestone labels without checking evidence. Verify repository state, commits, architecture, tests, CI, migrations, Twitch integration, EventSub semantics, concurrency guarantees, security, external-adapter honesty, M9 hackathon readiness, visual coherence, accessibility, deployment and every stated blocker. Return P0, P1 and P2 findings. For every finding provide evidence and an exact repair recommendation.»
