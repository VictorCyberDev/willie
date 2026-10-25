# Willie architecture
```mermaid
flowchart TD
  Twitch & Tiltify & YouTube & Kick --> Adapters[Provider adapters]
  Adapters --> Normalize[Normalized events]
  Normalize --> Policy[Authentication and policy]
  Policy --> Domain[Pure deterministic domain engine]
  Domain --> Ledger[Postgres event ledger and snapshots]
  Ledger --> Outbox[Durable outbox]
  Outbox --> Realtime[Realtime gateway]
  Realtime --> Overlay & Console
  Domain --> Judge[Simulated Judge replay]
```

The browser may request a transition but cannot establish native evidence or authoritative custody. Judge Mode uses the same pure engine in an isolated simulated world. Domain hashing uses canonical JSON and portable SHA-256; tests compare with Node crypto. Postgres transactions serialize custody and associated proof. Vercel can host the public web surface; a persistent Node process is required for ongoing provider transports. Deployment status is recorded separately from code.
