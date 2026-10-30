# Built with Codex

## Status

Codex was the primary implementation/review environment for the substantial M0–M16 foundation. M17–M28 winner-release continuation was completed in normal ChatGPT after the prior Codex session became unavailable.

**HUMAN ACTION REQUIRED — CODEX SESSION ID**

The canonical Codex Session ID is not available through this conversation or repository metadata and must never be invented.

1. Open the main Codex project thread used for most of Willie.
2. Run `/status`.
3. Copy the canonical session ID exactly.
4. Put that exact value into the Devpost `Codex Session ID` field.

Do not substitute a Git commit, ChatGPT conversation ID, repository ID or another identifier.

## Genuine Codex contribution — M0–M16

Observed/persisted engineering evidence includes:

- Recovered and structured the Willie engineering foundation and build constitution.
- Designed the deterministic custody authority and explicit state machine: PREPARED → provider verification → awaiting acceptance → commit, with abort/pause/failure paths.
- Implemented canonical deterministic state hashing and validated the portable SHA-256 implementation against Node cryptography.
- Built transactional PostgreSQL authority, append-only domain events, snapshots, Receipts, Passport proof, replay protection and durable outbox behavior.
- Implemented Twitch OAuth and EventSub transport, native raid evidence handling, chat participation paths, reconnect/gap/revocation safety and explicit destination receive consent.
- Added OBS/read-only overlays, Creator Console and explicitly simulated Judge Mode.
- Added Shared Chat, declarative campaign templates, Tiltify paths, bounded Power-Up/Bits and Hype mappings, brand/campaign tooling, a public SDK and YouTube/Kick adapters without weakening Twitch-native custody rules.
- Wrote and executed 10,000 randomized property/attack sequences against the pure domain engine.
- Ran independent security/reliability reviews and converted findings into source/test repairs.

## Concrete Codex findings and repairs

A cross-platform server/Postgres fixture exposed intermittent polling stalls through the actual Neon pooled endpoint. Codex traced session advisory locks to transaction-pooling incompatibility, replaced them with transaction-scoped locks, added an explicit worker/pool headroom bound, and reran the server → adapter → domain → Receipt integration. The complete Twitch → dual-consent → YouTube fixture then passed. This did not imply live YouTube acceptance.

An independent Codex review found an account-deletion/OAuth completion race. The repair added persisted revocation epochs, transactional user locks, OAuth issue times and hashed identity tombstones. Regression evidence covers stale transactions after intentional reactivation, an old OAuth callback after deletion, cross-account identity replay and allowlisted optional Twitch-grant preservation.

Codex also added and executed real process/database failure acceptance: SIGKILL during a verified-but-unaccepted Handoff, server restart/freeze, disposable PostgreSQL restart, recovery and one successful commit, a second DB restart and replay rejection. This exposed the need for a safe idle-pool error listener, which was added without logging secrets. The five failure gates passed while provider evidence remained synthetic.

## Winner-release continuation disclosure

The later winner experience — Relay, Living Willie V2, permanent community marks, decision rituals, Passport Chapters, Watch Willie, Clip Memory, Legacy, persistent deployment commissioning, official Twitch CLI acceptance and submission packaging — is tracked separately in the M17–M28 acceptance matrix. Normal ChatGPT continuing the work does not erase or overstate Codex's genuine contribution.
