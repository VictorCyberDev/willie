# Production marker scan

Scan: rg -n 'TODO|FIXME|HACK|TEMP|STUB|MOCK|PLACEHOLDER|NOT_IMPLEMENTED' apps packages docs.
Five initial matches were TEMP substrings inside TEMPLATE identifiers/copy in packages/campaigns/src/index.ts, apps/web/src/ExtensionsConsole.tsx, apps/server/src/campaign-extensions.ts (two lines) and apps/server/src/app.ts. All are ordinary template identifiers or simulated template preview labels; none is an unimplemented production stub.
Fixtures and Judge Mode remain explicitly simulated. Provider acceptance blockers are documented in FINAL_REVIEW_PACKET.md. Re-run the scan on the final commit; documentation may legitimately mention the search terms.
