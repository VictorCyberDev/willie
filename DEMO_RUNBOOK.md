# Willie — final winner demo runbook

## Preflight

1. Confirm the demo commit is the same SHA deployed to the Willie environment.
2. `/health` must return `status: ok`.
3. `/release-ready` must return `status: ready`, migration version 9 and no missing winner tables.
4. Confirm source and destination Twitch accounts show healthy Willie connections.
5. Confirm overlays are loaded and the destination is eligible/ready.
6. Confirm one active Relay exists and Willie is in source custody.
7. Keep `/stage`, `/willie/:id`, the destination creator console, and Judge Mode V2 open in separate tabs.
8. Never substitute simulated evidence into the live campaign if Twitch is unavailable.

## Flagship real flow

1. **Source contribution** — send a real supported Twitch chat contribution. Confirm authoritative progress changes once and the overlay updates.
2. **Mutation ritual** — open/close the Mutation vote, let chat influence the result, then have the creator approve the permanent mark. Confirm the mark appears in Willie and Passport data.
3. **Next Stop ritual** — open/close the destination vote. Creator approves only an eligible member.
4. **Prepare destination** — destination is connected, active, overlay-seen and ready. Prepare the handoff.
5. **Arm source** — verify the current version/custodian and arm the Twitch-native handoff.
6. **Perform the real Twitch raid** — source raids the exact prepared destination.
7. **Evidence gate** — Willie must receive genuine `channel.raid` EventSub evidence matching source, destination, timing and version. The raid MUST NOT commit custody.
8. **Arrival state** — Stage/overlay shows ARRIVED / AWAITING ACCEPTANCE while authoritative custody remains source.
9. **Hold to Receive** — destination performs the 750 ms hold. Server revalidates authority and commits exactly once.
10. **Post-commit proof** — verify new custodian, incremented version, preserved Relay progress, preserved marks, Passport Chapter, Receipt, source/destination overlay updates and Watch Willie.
11. **Continue story** — destination community makes one valid contribution, proving the object continued rather than reset.

Use `LIVE_ACCEPTED` only after all steps above complete with real Twitch accounts.

## Real safe-rejection demo

Prefer one of:

- stale/wrong destination evidence;
- interrupted provider state; or
- prepared destination followed by a provider gap.

Acceptance:

- visible narrative says Willie will not jump / stopped mid-journey;
- custody version and owner remain unchanged;
- no duplicate Passport Chapter or Receipt;
- recovery returns to a valid state before the demo ends.

## Twitch CLI evidence

The persisted harness is `scripts/twitch-cli-acceptance.ts`. Official Twitch CLI 1.1.24 has already driven Willie's real WebSocket parser with a `channel.raid`; that evidence is `CLI_ACCEPTED`, not live.

## Judge Mode V2 fallback

If a provider or venue issue prevents live footage during an in-person demo, open `/judge-v2` and keep the `SIMULATED REPLAY` label visible throughout. Demonstrate Relay → contribution → Mutation vote → mark → Next Stop → raid-shaped evidence → Hold to Receive → Passport Chapter → Receipt → Watch Willie → safe rejection.

Judge Mode is a presentation fallback only; it does not upgrade Twitch status.

## Stage Mode

Use `/stage` for the room-scale view. It should show only the information needed across a room: Willie, current community, mission/progress, destination/handoff state and Passport stamp. Avoid architecture/raw database screens until the final technical-depth segment.

## Recording order

Capture the real raid/receive sequence first, then the contribution/ritual shots, Watch Willie, Passport, safe rejection, architecture/CI and closing hero. Assemble to the timings in `VIDEO_SCRIPT.md`. Do not exceed three minutes.
