# Willie milestone status

Accepted locally/contracts to the available environment. No provider is LIVE_ACCEPTED. See FINAL_REVIEW_PACKET.md for evidence, limitations and exact external actions.

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
