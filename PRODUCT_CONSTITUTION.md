# Willie — Winner Release Product Constitution

**One live thing. Many communities. One continuing story.**

Willie is a persistent social object that Twitch communities shape together and safely pass between live streams.

Twitch moves audiences. Willie gives them something worth following.

## Experience hierarchy

The primary product experience is deliberately ordered:

1. Willie
2. Current community
3. Relay mission
4. Community contribution
5. Community mark
6. Next destination
7. Raid / handoff
8. Receive
9. Passport memory
10. Receipt / technical proof

Database terminology, SDKs, provider architecture and forensic dashboards are supporting proof, not the first impression. A new viewer should understand the object, its community and its continuing mission in 10–15 seconds.

## Authority kernel — never weaken this

Exactly one creator has custody at a time. Community activity can shape Willie and influence a vote, but cannot transfer custody.

The binding chain is:

**COMMUNITY INFLUENCES → CREATOR AUTHORIZES → DESTINATION PREPARES → TWITCH PROVIDES EVIDENCE → DESTINATION ACCEPTS → ENGINE COMMITS**

A Twitch raid is evidence, not authority by itself. A valid handoff requires the current custodian, current Willie version, active membership, explicit prepare, matching provider evidence, explicit destination acceptance and non-expired state. Provider gaps freeze the transition. Duplicate or stale evidence cannot recommit. Every custody commit creates a new version, Passport proof and Receipt.

Protocol: `IDLE → PREPARED → PROVIDER_VERIFIED → AWAITING_ACCEPTANCE → COMMITTING → COMMITTED`, with `ABORTED` and `PAUSED` as safe failure paths. `COMMITTED` history is immutable.

## Winner Release object model

### Relay

A Relay is the user-facing continuation of the existing authoritative campaign. It has an identity, mission, origin, current holder, mission target, progress, communities visited, successful handoffs, status, timestamps and current Willie version. Relay progress comes from authoritative custody history; no fake counters are permitted.

Flagship Relay: **THE FIRST WILLIE RELAY — Take Willie through 10 Twitch communities without breaking the chain.**

### Living Willie

Willie has no face, eyes, emoji personality or chatbot persona. Life is expressed through material, light, pulse, surface response, compression/reconstruction and restrained sound. Narrative states are `SLEEPING`, `WAKING`, `ALIVE`, `CHARGING`, `READY`, `PREPARING`, `IN_TRANSIT`, `ARRIVED`, `AWAITING_ACCEPTANCE`, `RECEIVED`, `PAUSED`, `RECOVERING`, `EVOLVED`.

Hero transition: **LOCK → COMPRESS → TRANSIT → ARRIVE → RECONSTRUCT → RECEIVE → STAMP**. Reduced motion, mute, keyboard operation and OBS compatibility remain mandatory.

### Permanent community marks

A completed community visit may leave one primary deterministic mark under Relay rules. The minimum mark vocabulary is `BAND`, `GLYPH`, `SCAR`, `RING`, `GLOW_PATTERN`. Marks carry campaign/Relay/Willie/community/creator identity, deterministic visual output, selection method, Willie version, Passport chapter and provenance hash. Database uniqueness prevents duplicate marks for a chapter or replayed provenance.

### Community decision rituals

Mutation Vote and Next Stop Vote are bounded, versioned, deduplicated and time-boxed. Chat chooses influence; the creator must explicitly approve the winning result. Next Stop approval only records an intended destination. It never prepares, verifies or commits a handoff.

### Passport V2

Forensic stamps and Receipts remain intact. The primary Passport is a human-readable sequence of Chapters describing arrival, departure, contribution, mark, Willie before/after, Relay progress, next destination, provider verification, Receipt and optional clip status.

## Scope freeze

Before submission do not add blockchain, NFTs, tokens, a generic LLM/chatbot, a mobile app, Discord, new YouTube/Kick functionality, payments, marketplace, enterprise control plane, fundraising systems, a new microservice architecture, a new database platform or a Twitch Extension. Existing YouTube/Kick/Tiltify work stays but does not expand.

## Honesty and acceptance

Use only these release statuses: `NOT_STARTED`, `IMPLEMENTED`, `LOCAL_ACCEPTED`, `CONTRACT_TESTED`, `CLI_ACCEPTED`, `LIVE_ACCEPTED`, `EXTERNAL_ACCEPTANCE_PENDING`, `SUBMISSION_READY`, `SUBMITTED`.

`LOCAL_ACCEPTED`, `CONTRACT_TESTED` and `CLI_ACCEPTED` are not live proof. `LIVE_ACCEPTED` requires genuine Twitch behavior. Judge Mode must remain explicitly simulated. No clip URL, Twitch acceptance, deployment or submission may be fabricated.

The remote GitHub repository is the source of truth. Substantial checkpoints are committed, pushed, remotely verified and CI-inspected before the next checkpoint proceeds.
