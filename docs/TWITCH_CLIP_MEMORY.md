# Twitch clip memory — M23

Verified against Twitch's official developer documentation on 2026-10-30.

## Provider contract

Willie uses Twitch **Create Clip** (`POST /helix/clips`) only when a creator separately authorizes the optional `clips:edit` scope. Core Twitch onboarding does not require this scope.

Twitch documents clip creation as asynchronous. A successful create request returns HTTP 202 and a clip ID; availability must be checked with **Get Clips**. If Get Clips still does not return the clip after 60 seconds, Twitch recommends treating creation as failed.

Official references:

- https://dev.twitch.tv/docs/api/reference#create-clip
- https://dev.twitch.tv/docs/api/clips
- https://dev.twitch.tv/docs/authentication/scopes/

## Willie behavior

1. The creator connects Clip Memory separately at `/auth/twitch/clip-memory`.
2. Willie stores the optional token encrypted in a dedicated table rather than replacing the core EventSub token.
3. During a prepared/verified/awaiting-acceptance handoff — or immediately after a verified completed chapter — the source creator may request a clip.
4. The Passport Chapter moves through `PENDING` to `AVAILABLE` or `FAILED`.
5. Successful URLs are accepted only when they are HTTPS Twitch clip URLs returned by Twitch.
6. Clip failure never changes custody, Relay progress, Passport proof, or Receipt state.
7. No clip URL is fabricated.

## Live acceptance

`IMPLEMENTED` and automated tests do not mean the Twitch provider accepted a real clip. M23 may be marked `LIVE_ACCEPTED` only after a real authorized creator requests a clip from a live Twitch broadcast and Get Clips returns the resulting clip.
