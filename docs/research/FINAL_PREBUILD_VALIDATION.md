# Final prebuild validation
Official sources researched2026-10-25 by independent Codex research. Capability documentation is not live acceptance.

Hackathon: https://twitchcon-codex.devpost.com/rules — October23–November2 2026 build window, working Twitch-connected experience, repository/setup, Codex usage/session ID and public YouTube video under3min. Four criteria equal. Judging dates conflict with schedule https://twitchcon-codex.devpost.com/details/dates; verify before submission; rules govern. No Devpost submission authorized without review.

Tiltify v5: https://developers.tiltify.com/api-reference/public — GET https://v5api.tiltify.com/api/public/campaigns/{campaign_id}/donations, Bearer token scope public, completed_after/before ISO8601 and after/before cursors, limit1..100, metadata.after. OAuth https://v5api.tiltify.com/oauth/token supports client_credentials/authorization_code/refresh_token. Omit donor names/comments. Signed webhooks DO exist: https://developers.tiltify.com/docs/webhooks ; deliberate polling is supported. Signature timestamp+'.'+rawBody base64HMACSHA256; one-minute freshness.

YouTube: https://developers.google.com/youtube/data/live/reference/rest/v3/liveBroadcasts/list — youtube.readonly, exactly one of mine/broadcastStatus/id filters; snippet.liveChatId. Chat https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/list returns nextPageToken and pollingIntervalMillis. Recommended streaming https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList supports resumption. No native raid primitive verified; DUAL_CONSENT.

Kick: https://github.com/KickEngineering/KickDevDocs — OAuth state plus PKCES256 required; user:read channel:read events:subscribe. POST /public/v1/events/subscriptions chat.message.sent v1. RSA PKCS1v1.5SHA256 signs id+'.'+timestamp+'.'+rawBody. Fetch rotatable public key https://api.kick.com/public/v1/public-key. Dedupe delivery IDs. No native handoff evidence verified.

No fact invalidates Willie. Provider eligibility/credentials/live acceptance remain separate. Trademark/domain clearance outside scope. Research fetched primary references; OAuth code/refresh links below serve implementation references and were not each independently fetched in the final pass.
