# FYF approved video content contract

**Contract:** `fyf.video-content.v1`

**Owner:** FYF AI Content Studio → separate FYF Video Pipeline

**Consumer:** the separate `fyf-video-pipeline` repository

**Status:** The local contract endpoint is implemented. Automated cross-repository execution and rendering remain deferred; the renderer stays in the separate repository.

This contract is the boundary between the content product and the video product. The content service remains the source of truth for the approved Burmese script, FYF brand rules, voice choice, and human approval state. The video pipeline owns scene planning, voice generation, visual assets, lip-sync cues, and rendering.

## Handoff rule

Only a draft with `status: approved` and a matching `approve clicked` audit event can be handed off. A draft that is `draft`, `needs_review`, `risk_blocked`, `rejected`, or `failed` must be refused.

```text
GET /api/workspaces/{workspaceId}/drafts/{draftId}/video-contract?voice=ai|victor|dual
```

The response is JSON and contains:

- `contractVersion` — exact schema version.
- `workspace` — FYF workspace identity only.
- `content` — approved Burmese script, topic, language (`my`), and draft version.
- `brand` — approved description, audience, tone rules, forbidden phrases, CTAs, voice notes, and optional colors.
- `voice.mode` — `ai`, `victor`, or `dual`.
- `approval` — approver and timestamp.

It must never contain credentials, provider tokens, local file paths, SQLite payloads, or private runtime configuration.

## Consumer responsibilities

The video pipeline must:

1. Preserve the script text unless a new content approval is recorded.
2. Treat brand fields as constraints, not as permission to publish.
3. Keep voice and visual generation resumable and separately verifiable.
4. Return render metadata and QA evidence without writing into this repository's local state.
5. Require a new approval when the narration, script, or meaning changes.

This contract is intentionally small. Scene schemas, asset manifests, narration timing, mouth cues, and render checkpoints belong to the video repository and must be versioned there.
