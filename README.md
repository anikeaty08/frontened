# AquaReserve

AquaReserve is a privacy-preserving reserve-assurance product built on Midnight. Custodial platforms publish scoped reserve snapshots, independent attesters record coverage outcomes, and customers privately verify that their balance was included without exposing account data publicly.

## Repository layout

- `frontend/` - the production Next.js product experience, including public reserve evidence, private customer verification, and role-scoped operator workspaces.
- `backend/` - the API, PostgreSQL persistence, Compact contract, Midnight lifecycle worker, tests, and deployment evidence.

Each application keeps its own package manifest and can be installed and run independently from its directory.

The public frontend never receives operator credentials in browser-readable storage. Its same-origin gateway retains bearer credentials in secure HttpOnly cookies and forwards only explicitly allowlisted AquaReserve API routes.
