# Decisions
- Preserve Willie thesis and owner accounts; only dedicated Willie resources.
- Pure TypeScript domain shared with isolated Judge replay.
- Version represents committed custody transitions; all writes still serialize through the database transaction.
- Browser-compatible deterministic SHA-256, verified against Node crypto test vectors.
- Default 120-second preparation; allowed 30–300 seconds.
- First 20 unique contributors per community contribute 2 points each; next 80 contribute 0.25; later contributors 0.025. One accepted contribution per user per custody community. Repeat requests have a 30-second cooldown and never multiply progress. Progress capped at100.
- Local execution unavailable; resumed dedicated owner-authorized Willie Vercel build sandbox instead.
