# Real versus simulated — winner release

Willie uses explicit evidence classes. A stronger-looking demo must never silently upgrade a weaker class.

## LIVE_ACCEPTED

Requires genuine provider behavior with real accounts. For the flagship Twitch gate this means two real Twitch broadcasters authenticate, a real source chat contribution is observed, a prepared source performs a real Twitch raid to the exact destination, genuine `channel.raid` EventSub evidence arrives, Willie waits for destination consent, Hold to Receive commits once, progress/marks/Relay/Passport survive, duplicate evidence cannot recommit, overlays update, and the destination community can continue.

No fixture, replay or CLI simulator can produce `LIVE_ACCEPTED`.

## CLI_ACCEPTED

Official Twitch CLI 1.1.24 and its mock EventSub WebSocket server drove Willie's real `TwitchEventSub` transport with `channel.raid`. Willie reached `HEALTHY` and emitted the normalized raid notice for the requested source/destination. Evidence is persisted in `docs/execution/TWITCH_CLI_ACCEPTANCE.md`.

This validates the Twitch WebSocket transport/parser against Twitch's official simulator. It is not a real broadcaster raid.

## CONTRACT_TESTED

Provider contracts, OAuth behavior, EventSub normalization/filtering, Shared Chat, Power-Up/Bits, Hype, replay/gap handling and other integrations may be covered by unit/integration/contract tests without having passed real-account provider acceptance. `CONTRACT_TESTED` is never described as live.

## SIMULATED REPLAY

Judge Mode V2 and development fixtures such as Maya/Victor/Lex are explicitly simulated. Their receipts use `SIMULATED_JUDGE_REPLAY`. Raid-shaped Judge events exercise the same pure custody engine but are presentation/test fixtures.

## Clip Memory

The Twitch Create Clip integration is implemented with separate optional `clips:edit` OAuth and asynchronous poll/failure handling. It remains non-live until a real authorized live broadcaster creates a clip and Twitch returns it through Get Clips. Failed/unavailable clips do not alter custody.

## Public story data

Watch Willie and Community Legacy are real views of the database state they are pointed at. On preview/test deployments the underlying campaign may still be simulated/test state. Public UI truthfulness is therefore determined by the provider evidence stored in each chapter/Receipt, not merely by the route being public.

## Current release rule

The authoritative M0–M28 status is maintained in `FINAL_REVIEW_PACKET.md`. If a provider gate is pending, video and Devpost copy must say so. Never replace a failed live event with synthetic native evidence.
