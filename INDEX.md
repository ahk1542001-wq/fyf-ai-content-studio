# FYF AI Content Studio

Local-first workspace for turning FYF brand guidance into reviewed Burmese content,
manual exports, and an explicit handoff to a separate video renderer.

- **Runtime:** Next.js, React, TypeScript, LangGraph.js, Vertex AI / Gemini 3.7 Flash
- **Storage:** Local SQLite for operator-controlled state
- **Quality boundary:** Deterministic checks plus human approval before export
- **Distribution:** Public reference snapshot; hosted auth, cloud storage, and automatic publishing are out of scope

See [README.md](README.md) for setup, architecture, verification, and release boundaries.
