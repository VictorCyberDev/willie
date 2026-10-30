# Twitch CLI acceptance — M26 D1

Status: **CLI_ACCEPTED** for the Twitch CLI WebSocket raid transport path.

Executed: 2026-10-30 in a clean Vercel Sandbox against `integration/willie-winner-release`.

## Tooling

- Official Twitch CLI: `twitch-cli/1.1.24`
- Official mock EventSub WebSocket server: `twitch event websocket start-server`
- Willie implementation under test: `apps/server/src/eventsub.ts` (`TwitchEventSub`)
- Persisted harness: `scripts/twitch-cli-acceptance.ts`

Official references verified the same day:

- https://dev.twitch.tv/docs/cli/
- https://dev.twitch.tv/docs/cli/websocket-event-command
- https://dev.twitch.tv/docs/cli/event-command

## Commands executed

```bash
# Start Twitch's official mock WebSocket server.
twitch event websocket start-server --ip 127.0.0.1 --port 8080

# Start Willie's real TwitchEventSub transport through the acceptance harness.
node --import tsx scripts/twitch-cli-acceptance.ts

# From another terminal, send a Twitch CLI raid.
twitch event trigger channel.raid -f 111 -t 222 -T websocket
```

## Observed provider evidence

Twitch CLI reported:

```text
✔ Forwarded for use in mock EventSub WebSocket server
```

Willie reported:

```text
HEALTH HEALTHY
NOTICE ... "type":"channel.raid" ...
```

The normalized notice contained:

- `from_broadcaster_user_id`: `111`
- `to_broadcaster_user_id`: `222`
- a Twitch CLI generated viewer count
- a unique EventSub message ID and timestamp

The final harness result was healthy with exactly one observed raid in that run.

## What this proves

The official Twitch CLI WebSocket server can drive Willie's production `TwitchEventSub` parser/transport and Willie receives a correctly normalized `channel.raid` event. This is stronger than an internal fixture and qualifies this supported path as `CLI_ACCEPTED`.

## Deliberate limits

This is **not** `LIVE_ACCEPTED`. No real Twitch broadcaster raid happened in this run.

Twitch CLI 1.1.24 does not expose Willie's newer chat/shared-chat subscription types in its trigger list. The acceptance harness therefore isolates official CLI WebSocket transport delivery while Willie's actual Helix subscription creation, chat filtering, Shared Chat, reconnect, duplicate delivery, stale/out-of-order handling, provider-gap behavior and recovery remain covered by the repository's contract/unit/integration/failure tests.

The CLI mock reconnect URL is localhost, while production Willie intentionally rejects reconnect URLs that are not `wss://eventsub.wss.twitch.tv`. That security invariant is not weakened for the simulator.

Real OAuth, real EventSub subscription acceptance, two broadcaster accounts and a real Twitch raid remain separate M26 live gates.
