# Willie — Final Review Packet

**Authoritative Winner Release acceptance record — M0–M28**

Product: **Willie — One live thing. Many communities. One continuing story.**

Category: persistent social object for live communities.

Primary strategic line: **Twitch moves audiences. Willie gives them something worth following.**

This file is the single authoritative milestone/status record. Historical milestone notes remain evidence, but they do not override this matrix.

## Repository authority

- Repository: `VictorCyberDev/willie`
- Release branch: `integration/willie-winner-release`
- Main baseline: `c6d42b19b0daf8cd0fd58d56f3b14d1702928610`
- Main remains the M0–M16 accepted foundation until the Winner Release passes its real Twitch gate and release PR is accepted.
- Winner-release work is persisted remotely after every substantial checkpoint; no release milestone depends on an uncommitted sandbox state.

## Remote checkpoint anchors

| Checkpoint | Remote anchor | Evidence |
|---|---|---|
| A — M17–M22 core winner experience | `86cf674222630e3a30959b5ecff743e6cfe6d648` | Relay/marks/votes/Passport transactional APIs on top of `1dad0da9b2196f6a5d4801cb53d2829b5180d8e1`; later persistence fixes retained. |
| B — M24 + winner visual experience | `6f6630f62d62d73a5b158f4c49a71f8bea9cd990` | Watch Willie, Stage Mode, Judge Mode V2, narrative-state presentation, simulated evidence label. |
| C — M23 + M25 | `f0d20a1f42d38b7b7c9864b900f0f1b8d563942e` | Clip Memory + Legacy; full GitHub acceptance run `41018300879` passed. |
| D1 — official Twitch CLI | `1421b5fa59daf2fb86484c930b7531c7edbb2037` | Twitch CLI 1.1.24 drove Willie's real EventSub WebSocket raid path; `CLI_ACCEPTED`. |
| D2 — persistent service architecture | `6b3d2667e705e982a1dbac5462db768594e42161` | Vercel Services/container routing; Fastify `/health` and DB `/ready` accepted on isolated preview. |
| F — focused security/regression closeout | `20fbe738e3a4b53447fe8660c7d6686da489eb3f` | Winner surface security review after runtime-readiness and regression additions. |
| G — winner presentation package | `405b1b95a0646a8dcfbeb2d56e4b12e9c057014e` plus subsequent release-doc consolidation | 2:58 script, shot list, live runbook, Codex disclosure, Devpost requirements and truth classes. |

## M0–M28 acceptance matrix

`LIVE_ACCEPTED` is deliberately absent unless genuine provider behavior has occurred. `CLI_ACCEPTED` is not live proof.

| Milestone | Status | Primary commit/evidence | Tests / provider evidence | Live evidence | Known limitation / blocker |
|---|---|---|---|---|---|
| M0 — Foundation/research | CONTRACT_TESTED | M0–M16 baseline `c6d42b19…` | clean install/build/CI foundation | Not required | Historical research remains bounded by its cited sources. |
| M1 — Artifact design/motion/audio | LOCAL_ACCEPTED | M0–M16 baseline | browser/OBS/reduced-motion/mute acceptance | Not required | Visual review is not a full WCAG certification. |
| M2 — Deterministic authority/Postgres | CONTRACT_TESTED | M0–M16 baseline | unit, integration, concurrency, replay, 10,000 randomized sequences | Not required | None established. |
| M3 — Twitch OAuth/EventSub foundation | CONTRACT_TESTED | M0–M16 baseline | OAuth/EventSub contracts, parser, reconnect/gap/revocation tests | None | Real Twitch application credentials/accounts still required. |
| M4 — Creator orchestration | CONTRACT_TESTED | M0–M16 baseline | readiness/member/route/rotation integration | None | Live operation depends on real Twitch OAuth. |
| M5 — Bounded community participation | CONTRACT_TESTED | M0–M16 baseline | cooldown, dedupe, fairness, community bounds | None | Real chat acceptance is part of M26 live gate. |
| M6 — Signature Handoff | CONTRACT_TESTED | M0–M16 baseline | prepare/evidence/receive races, immutable proof | None | Real two-broadcaster raid/receive pending. |
| M7 — Security/failure/restart | CONTRACT_TESTED | M0–M16 baseline | revocation races, stale worker fencing, SIGKILL/Postgres restart acceptance | None | Broader multi-replica stress remains outside hackathon scope. |
| M8 — Passport/Receipt/Judge | LOCAL_ACCEPTED | M0–M16 baseline | browser replay + durable proof + attack lab | None | Judge data is explicitly simulated. |
| M9 — Hackathon checkpoint | CONTRACT_TESTED | M0–M16 baseline | domain + browser acceptance | None | Final live Twitch/video/submission gates supersede it. |
| M10 — Shared Chat | CONTRACT_TESTED | M0–M16 baseline | normalized Shared Chat begin/update/end + attribution/dedupe | None | Real channel eligibility/session not yet accepted. |
| M11 — Declarative templates | CONTRACT_TESTED | M0–M16 baseline | schema/import/export/preview/policy tests | Not required | None established. |
| M12 — Tiltify adapter | CONTRACT_TESTED | M0–M16 baseline | adapter contracts + host/domain/Postgres fixture | None | Real provider credential not commissioned for this release. |
| M13 — Power-Up/Bits + Hype | CONTRACT_TESTED | M0–M16 baseline | optional-scope + bounded paid-event contracts | None | Real eligible Twitch channel/event acceptance deferred until after flagship raid. |
| M14 — Brand orchestration | CONTRACT_TESTED | M0–M16 baseline | roster/control/export/stop proof | Not required | Future commercial Relay concepts are not submission-critical live claims. |
| M15 — Public SDK | CONTRACT_TESTED | M0–M16 baseline | public imports/examples/conformance | Not required | None established. |
| M16 — YouTube/Kick dual-consent adapters | CONTRACT_TESTED | M0–M16 baseline | ordered dual consent, polling, stale generation tests | None | No new YouTube/Kick work is being added under scope freeze. |
| M17 — Winner Product Constitution | CONTRACT_TESTED | `1dad0da9…` + `PRODUCT_CONSTITUTION.md` | hierarchy/scope/authority reviewed in winner suite | Not required | None established. |
| M18 — Willie Relay | CONTRACT_TESTED | `1dad0da9…`, `86cf6742…` | authority, monotonic progress, DB persistence, receipt-driven advancement | None | Real Relay will be commissioned during M26 live flow. |
| M19 — Living Willie V2 | LOCAL_ACCEPTED | `28ebb77a…` | browser/responsive/reduced-motion/keyboard/Stage acceptance | None | Real provider state animation awaits M26 live run. |
| M20 — Permanent Community Marks | CONTRACT_TESTED | `1dad0da9…`, `86cf6742…` | deterministic mark/provenance, duplicate/stale/cross-Relay guards | None | Real chat-selected mark awaits M26 live run. |
| M21 — Community Decision Rituals | CONTRACT_TESTED | `1dad0da9…`, `86cf6742…` | candidate bounds, windows, dedupe, tie, stale, creator approval | None | Chat never has custody authority by design. |
| M22 — Passport V2 / Chapters | CONTRACT_TESTED | `1dad0da9…`, persistence fixes through `f26ba397…` | chapter uniqueness, before/after version, Receipt/provider proof, preservation | None | Real Twitch chapter evidence awaits M26 live run. |
| M23 — Twitch Clip Memory | CONTRACT_TESTED | `f0d20a1f…` | separate `clips:edit` OAuth, async create/poll, URL allowlist, failure isolation | None | Real live broadcaster clip not yet returned by Twitch. |
| M24 — Watch Willie / Stage / Judge V2 | LOCAL_ACCEPTED | `6f6630f6…` | browser E2E, public story API, room-scale mode, explicit simulated Judge label | None | Public real journey awaits a commissioned real Relay. |
| M25 — Community Legacy | CONTRACT_TESTED | `f0d20a1f…` | authoritative chapter-derived legacy artifact + URL/test coverage | None | Real chapter content awaits M26 live run. |
| M26 — Twitch commissioning | CLI_ACCEPTED | `1421b5fa…`, persistent runtime `6b3d2667…` | official Twitch CLI raid; container health/readiness; OAuth/EventSub contracts | No real two-account raid yet | Production DB migration approval + Twitch client credentials + two broadcaster logins/streams/real raid are required. |
| M27 — Native Twitch enrichment | CONTRACT_TESTED | inherited M10/M13 provider paths | Shared Chat/Bits/Hype contracts | None | Per scope, real enrichment is attempted only after M26 real raid acceptance and only where account eligibility allows. |
| M28 — Winner presentation + submission | EXTERNAL_ACCEPTANCE_PENDING | script/shotlist/runbook/Devpost draft | submission requirements verified; project draft exists; Codex Session ID recorded | No final video/submission confirmation | Real footage/YouTube URL, submitter questionnaire/legal answers, and final Devpost submit remain. |

## Test acceptance

The release branch acceptance workflow covers:

- lint
- TypeScript typecheck
- unit tests
- 10,000-sequence property tests
- PostgreSQL integration/concurrency tests
- provider contract tests
- browser E2E
- M9 regression
- failure/restart acceptance
- production build
- Docker non-root image build

Checkpoint C's complete remote run is green. Winner runtime readiness adds an explicit `/release-ready` gate requiring migration version 9 plus `relays`, `passport_chapters`, `community_marks`, `relay_votes` and `winner_clip_requests`.

## Twitch acceptance

### Official CLI — CLI_ACCEPTED

Twitch CLI `1.1.24` and its official mock EventSub WebSocket server drove Willie's real `TwitchEventSub` transport. Willie reached `HEALTHY` and emitted the normalized `channel.raid` notice for source `111` → destination `222`. See `docs/execution/TWITCH_CLI_ACCEPTANCE.md`.

This proves the supported raid WebSocket transport/parser against Twitch's simulator. It does **not** prove a real broadcaster raid.

### OAuth/EventSub — CONTRACT_TESTED

OAuth state, token validation/refresh/revocation, encrypted token storage, EventSub subscription logic, deduplication, stale/future filtering, provider gaps and recovery are contract/integration tested. Vercel Willie currently has no `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`, so real OAuth is not commissioned yet.

### Real two-broadcaster gate — EXTERNAL_ACCEPTANCE_PENDING

`LIVE_ACCEPTED` requires all of the following genuine behavior:

1. source broadcaster authenticates;
2. destination broadcaster authenticates;
3. both are healthy/ready;
4. active Relay + source custody;
5. real Twitch chat changes Willie;
6. permanent mark/ritual works where practical;
7. destination is creator-approved and prepared;
8. source performs a real Twitch raid;
9. genuine `channel.raid` evidence matches source/destination/timing/version;
10. custody remains source while Willie is awaiting acceptance;
11. destination performs Hold to Receive;
12. exactly one custody commit occurs;
13. progress, marks, Relay and Passport survive;
14. Receipt + Chapter write;
15. duplicate raid cannot recommit;
16. source/destination overlays and Watch Willie update;
17. destination community can continue the story.

At least one real failure/recovery demonstration must also leave custody unchanged.

## Persistent backend / database commissioning

### Vercel preview — LOCAL_ACCEPTED

The Willie project uses the repository Dockerfile through Vercel Services/container routing. A winner preview built the actual container image, then:

- `/health` returned the Fastify Willie service;
- `/ready` confirmed database connectivity/migrations for that preview;
- the root served the winner React experience from the same process;
- a stable winner preview alias is configured for same-origin CSRF/OAuth testing.

Preview and production database targets are separated.

### Neon preview schema — LOCAL_ACCEPTED

A fresh Willie-only Neon branch was cloned from production and migrations 5–9 were applied successfully. It reports migrations 1–9. An older stale acceptance branch was rejected rather than force-migrated over schema drift.

### Production schema — EXTERNAL_ACCEPTANCE_PENDING

Production Willie remains at migrations 1–4. The exact winner migration has been validated on the fresh child branch, but Neon requires explicit user approval before applying the production migration. Production is intentionally not promoted while this gate is pending.

## Winner experience

- Relay — CONTRACT_TESTED
- Living Willie V2 — LOCAL_ACCEPTED
- Permanent Marks — CONTRACT_TESTED
- Mutation Vote — CONTRACT_TESTED
- Next Stop Vote — CONTRACT_TESTED
- Passport Chapters — CONTRACT_TESTED
- Clip Memory — CONTRACT_TESTED
- Watch Willie — LOCAL_ACCEPTED
- Community Legacy — CONTRACT_TESTED
- Stage Mode — LOCAL_ACCEPTED
- Judge Mode V2 — LOCAL_ACCEPTED (`SIMULATED REPLAY`)

## Security closeout

The focused winner review covers Relay authority, voting, permanent marks, Passport Chapters, clip OAuth/URLs, public identifiers, parameterized SQL, React escaping, SSE boundaries, rate limits, CSRF/origin validation, OAuth fixed redirects, idempotency/concurrency and database/runtime isolation.

No unresolved P0/P1 is established by the scoped review after documented repairs. This is not a guarantee that no undiscovered issue exists. See `docs/SECURITY_REVIEW.md`.

Key invariants retained:

- chat cannot transfer custody;
- raid evidence cannot auto-transfer custody;
- destination acceptance is required;
- one owner per version;
- duplicate/stale evidence cannot recommit;
- permanent marks and chapters cannot duplicate under replay;
- clip failure cannot roll back or block custody;
- provider gaps pause rather than guess;
- secrets are redacted/encrypted and not exposed in public story responses.

## Codex evidence

Codex's genuine M0–M16 contribution is preserved in `docs/BUILT_WITH_CODEX.md`: architecture, authority state machine, deterministic hashing, Postgres/outbox, Twitch provider implementation, property tests, security/reliability reviews, race fixes, failure acceptance, SDK and cross-platform adapters.

**Canonical Codex Session ID:** `01a171fa-0ed6-750c-8ed5-4ac1c6eab04b`

This is the exact identifier supplied from the primary Willie Codex thread and is the value to use in Devpost field `29289`.

## Video

- Narration: ready — `VIDEO_SCRIPT.md`
- Recording order/required shots: ready — `VIDEO_SHOTLIST.md`
- Runbook: ready — `DEMO_RUNBOOK.md`
- Target duration: `2:58`; hard maximum `3:00`
- Required real footage: source chat, two-broadcaster raid, EventSub arrival, Hold to Receive, preserved post-commit state; rejection/recovery where practical.
- YouTube URL: **not yet available**.

If real Twitch acceptance has not passed, the final video must not label CLI/Judge footage as live.

## Devpost

- Hackathon: Codex x TwitchCon Hackathon (`twitchcon-codex`)
- Willie project: exists
- Project state: draft
- Public project URL: `https://devpost.com/software/willie`
- Repository requirement: ready
- Description/technology package: can be updated from this release
- Final demo video: missing
- Canonical Codex Session ID: `01a171fa-0ed6-750c-8ed5-4ac1c6eab04b` — ready
- Submitter-specific country/survey/legal answers: must be supplied truthfully by the submitter
- Submission state: **not submitted**

`SUBMITTED` may only be used after Devpost explicitly confirms `Submitted`.

## Final commercial future — documented, not built

Creator Relay, Game Launch Relay, Charity Relay, Music Relay, Sports Relay, Brand Relay and TwitchCon Relay remain future concepts. The shared business mechanic is one campaign object traveling through multiple creators; every community changes it; each transition produces memory/content; the final artifact represents the complete campaign.

No future concept may delay the Twitch flagship, video or submission.

## Unavoidable human/external actions remaining

1. Approve the already-validated Willie production migrations 5–9 before production promotion.
2. Configure the Willie Twitch application/client credentials directly in Vercel secrets; never paste the client secret into chat.
3. Authenticate two broadcaster accounts, start the required broadcasts, and perform the genuine Twitch raid/receive flow.
4. Record/upload the final ≤3:00 public YouTube demo after real acceptance.
5. Supply the Devpost submitter-specific country, self-report and legal-attestation answers.

Everything else should be automated or executed through the connected tools.

## Current release verdict

**ENGINEERING_READY**

Meaning: the Winner Release engineering, simulator/provider contracts, official Twitch CLI raid path, persistent container preview, isolated v9 preview database and presentation/submission package are in place. This does **not** mean `TWITCH_LIVE_ACCEPTED`, `SUBMISSION_READY` or `SUBMITTED`.
