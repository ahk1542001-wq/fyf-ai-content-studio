> [!WARNING]
> **LEGACY PROTOTYPE DOCUMENTATION**
> This document describes the earlier mock prototype and is preserved only as migration evidence. It is not the current FYF AI V1 architecture.

All V1 external integrations are mocked. `.env.example` contains placeholders only.

Demo API safety:

- `/api/workspaces/**` is the local V1 demo namespace.
- It is available during development and tests, but production middleware returns a non-disclosing 404 unless the server-only `FYF_DEMO_API_ENABLED=true` flag is deliberately set for a controlled staging environment.
- This flag is not authentication and must not replace Supabase workspace authorization.

Important rules:

- Do not commit `.env` or `.env.local`.
- Do not hardcode API keys in TypeScript, React, docs, tests, or seed data.
- UI credential fields show masked values only.
- Real production credential storage must be encrypted in a later version.

Demo persistence:

- `FYF_DEMO_PERSISTENCE=sqlite` enables the default local SQLite-backed demo snapshot store.
- `FYF_DEMO_DB_PATH=./database/local/demo-state.sqlite` is the default local path.
- `FYF_DEMO_PERSISTENCE=memory` can be used for temporary non-durable local runs.
- Local SQLite files are ignored by Git and must not be committed.
