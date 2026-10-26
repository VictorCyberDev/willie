# Twitch current API
Research verified2026-10-25. Official references:
https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/
https://dev.twitch.tv/docs/eventsub/eventsub-reference/
https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
https://dev.twitch.tv/docs/eventsub/handling-webhook-events/
https://dev.twitch.tv/docs/authentication/validate-tokens/
Implementation references: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow and https://dev.twitch.tv/docs/authentication/refresh-tokens/

|Event|Version|Scope|
|---|---|---|
|channel.raid|1|None; from_broadcaster_user_id OR to_broadcaster_user_id, not both|
|channel.chat.message|1|user:read:chat|
|channel.shared_chat.begin/update/end|1|None|
|channel.custom_power_up_redemption.add|1|bits:read|
|channel.hype_train.begin/progress/end|2|channel:read:hype_train|

WebSocket uses user access tokens. Webhook app-token chat additionally needs user:bot plus broadcaster channel:bot/mod. Initial Willie onboarding requests user:read:chat only, never channel:manage:raids. Creators perform their own raid.
Raid fields from/to broadcaster IDs, viewer count. Only raids appearing in chat notify. Count never authorizes custody.
Shared chat source_broadcaster_user_id ?? broadcaster_user_id; semantic source_message_id ?? message_id prevents duplicate credit. Hype progress may precede begin; preserve documented shared-train metadata. Avoid overlap with channel.bits.use credits.

Delivery at least once; duplicate message IDs retained. Controlled session_reconnect reconnect_url must be used unchanged while old socket overlaps until new welcome; subscriptions transfer. Hard loss has no missed-event replay; pause active handoffs. Welcome-to-subscribe deadline10s. Honor actual keepalive_timeout_seconds; ping/pong is not application keepalive. Revocation clears readiness and sessions.

Webhook signature SHA256HMAC raw id+timestamp+body with sha256=hex, timing safe; reject older10min and unreasonable future skew. Verify challenge/revocation too. Return plain challenge. Persist dedupe+effects atomically before acknowledgment.
Validate OAuth startup/hourly, bind client/user/scopes, refresh rotated credentials, revoke on disconnect. No credential in OBS URL/logs. Fixtures are CONTRACT_TESTED at most; actual OAuth/EventSub/chat/native raid acceptance recorded separately.
