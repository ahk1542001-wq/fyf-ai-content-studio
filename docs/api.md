> [!WARNING]
> **CURRENT LOCAL API WITH LEGACY COMPATIBILITY NAMES**
> These route contracts describe the private local FYF Studio. Some environment variables, adapter names, and historical examples retain legacy identifiers for state compatibility; they are not the product name or a current Studio runtime dependency.

This document captures the current local API boundary for FYF AI Content Studio. The Studio owns brand context, writing, review, and approval; the separate FYF Video Pipeline owns voice, visuals, motion, and final rendering. External client workflow files are reference residue only and are not called by this runtime.

The route list below is a **local route surface**, not a public network API. The demo workspace routes are operator-only and fail closed in production unless explicitly enabled; the enable flag is not authentication. The `FYF_*` and `brand_style` names that remain below are legacy compatibility identifiers only and are not FYF product names or runtime integrations.

## Runtime Boundary

- Framework: Next.js App Router API routes under `app/api`.
- Data source: shared `DemoRepository`, seeded from `database/demo-data/demoData.ts` and backed by a local SQLite demo snapshot outside tests.
- Persistence mode: SQLite-backed demo snapshot by default in local/dev API runtime. Route changes survive server restarts through `database/local/demo-state.sqlite` unless `FYF_DEMO_PERSISTENCE=memory` is set.
- External integrations: mocked adapters only. Gemini, Google Sheets, and Facebook are represented by local mocks or integration settings, not live network calls.

## Current Local Route Surface

### `GET /api/workspaces/:workspaceId/drafts`

Returns the workspace's demo drafts, audit events, analytics snapshots, publish jobs, schedule jobs, ideas, and workspace-scoped runtime support records.

Response shape:

```ts
{
  session: DemoSession;
  drafts: Draft[];
  auditEvents: AuditEvent[];
  analytics: AnalyticsSnapshot[];
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  ideas: ContentIdea[];
  styleExamples: StyleExample[];
  mediaAssets: MediaAsset[];
  promptVersions: PromptVersion[];
  integrationLogs: IntegrationLog[];
  onboardingChecklistItems: OnboardingChecklistItem[];
  brandProfile: BrandProfile;
}
```

Boundary notes:

- Validates workspace existence through `DemoRepository` workspace-scoped list helpers.
- Does not paginate or filter beyond workspace scoping.
- Returns a JSON `not_found` envelope if the workspace is unknown.

### `POST /api/workspaces/:workspaceId/drafts`

Generates a new Burmese demo draft with mock Gemini and mock Sheets style examples.

Request shape:

```ts
{
  topic: string;
  tone?: string;
  length?: string;
  angle?: string;
  audience?: string;
  cta?: string;
  mediaName?: string;
}
```

Boundary notes:

- Requires a non-empty topic.
- Creates a draft, initial draft version, prompt version, optional standalone media asset metadata, and audit event in the shared demo repository, then persists the updated demo snapshot.
- Returns refreshed workspace-scoped media assets and prompt versions for the UI/runtime state.
- Never calls live Gemini, Google Sheets, Facebook, or Telegram.

### `GET/PATCH /api/workspaces/:workspaceId/drafts/:draftId`

`GET` returns the draft and version history for the requested workspace. `PATCH` saves manual draft edits, recalculates quality/risk, increments version history, and records an audit event. If the draft was already approved, scheduled, published, rejected, risk-blocked, or failed, the edit-lock moves it back to `"needs_review"`, clears `scheduledFor`, and cancels active schedule jobs for that draft so it must be reviewed again before publish or schedule.

### `DELETE /api/workspaces/:workspaceId/drafts/:draftId`

Archives a draft in demo mode instead of hard-deleting it. This is the V1-safe delete behavior: the draft status becomes `"archived"`, any active schedule jobs for that draft are cancelled, and a `"draft archived"` audit event is recorded.

Boundary notes:

- Returns HTTP `404` if the draft does not belong to the requested workspace.
- Does not delete Facebook posts, uploaded files, analytics, or any external records.
- The dashboard exposes this as a two-step action: `Archive` then `Confirm archive`.
- Archived drafts remain visible in Drafts history but are hidden from active Pipeline lanes.

### `DELETE /api/workspaces/:workspaceId/drafts/:draftId/media/:mediaId`

Removes a demo media attachment from the requested draft, increments draft version history, and records a `"media removed"` audit event.

Boundary notes:

- Returns HTTP `404` if the draft or media asset does not belong to the requested workspace.
- Detaches local demo metadata only; no external storage, Facebook media, or filesystem object is deleted.
- The dashboard exposes this as a two-step action: `Remove` then `Confirm remove media`.

### `POST /api/workspaces/:workspaceId/drafts/:draftId/approve`

Runs Risk Guard and marks the draft approved, or returns HTTP `409` with the blocked issues.

### `POST /api/workspaces/:workspaceId/drafts/:draftId/fix`

Applies an API-backed AI Fix to the current draft content, persists the fixed draft, increments draft version history, and records an audit event.

Request shape:

```ts
{
  mode: "safer" | "hook" | "shorter" | "professional" | "emotional" | "brand_style" | "cta";
  content?: string;
  topic?: string;
}
```

Boundary notes:

- Does not call live AI providers.
- Saves the AI Fix result through the same repository boundary as manual draft edits.
- If the draft was already approved, scheduled, published, rejected, risk-blocked, or failed, the edit-lock moves it back to `"needs_review"`, clears `scheduledFor`, and cancels active schedule jobs for that draft so it must be reviewed again before publish or schedule.
- Returns `before`, `after`, `reason`, refreshed versions, and refreshed audit events for UI review.

### `POST /api/workspaces/:workspaceId/drafts/:draftId/reject`

Marks the draft rejected and records the provided reason or a demo default reason.

### `POST /api/workspaces/:workspaceId/drafts/:draftId/schedule`

Schedules an already approved, Risk Guard-clean draft in demo state, persists/reuses a schedule job, and records an audit event.

Request shape:

```ts
{
  scheduledFor: string;
}
```

Boundary notes:

- The `scheduledFor` field accepts free-form time strings (e.g., `"Monday, 6:00 AM"`, `"2025-12-31 23:59"`, `"End of this month, 11:00 PM"`). No format validation is enforced beyond non-empty.
- Returns HTTP `409 conflict` if the draft has not been approved first.
- Returns HTTP `409 conflict` if Risk Guard still finds risky wording.
- The schedule job is persisted with the exact `scheduledFor` string and workspace-scoped.
- `addOrReuseScheduleJob` is idempotent: if a scheduled job already exists for the same workspace+draft, the existing job id is reused and the scheduled time is updated instead of creating a duplicate.
- Schedule jobs are reported in the health endpoint queue summary and the drafts list response.

### `POST /api/workspaces/:workspaceId/drafts/:draftId/publish`

Attempts a mock Facebook publish for an already approved, Risk Guard-clean draft.

Success response shape:

```ts
{
  ok: true;
  job: PublishJob;
}
```

Blocked response shape:

```ts
{
  ok: false;
  error: {
    code: "conflict";
    message: string;
    details: {
      draft: Draft;
      issues: RiskIssue[];
      job: PublishJob;
    };
  };
}
```

Boundary notes:

- Approval is a separate prerequisite; publish does not auto-approve drafts.
- Any remaining Risk Guard issue returns HTTP `409`.
- Mock publish requires the draft to be approved and returns a fake Facebook post ID on success.
- Demo-mode workspaces may use the mock Facebook path without live credentials; future non-demo workspaces must have a configured Facebook integration first.
- Idempotency is represented as `${workspaceId}:${draftId}:${draft.version}` and reuses an existing publish job from the demo repository state.
- Failed or blocked publish jobs are recorded and surfaced in the health endpoint and dashboard; recovery is handled by the dedicated recovery route below.

### `POST /api/workspaces/:workspaceId/drafts/:draftId/recover`

Moves a failed or risk-blocked draft back to `needs_review` status and sets any associated failed/blocked publish job back to `queued` for manual recovery tracking. This is the failed job recovery action used by the Pipeline UI.

Request: no body required.

Success response shape:

```ts
{
  ok: true;
  draft: Draft;
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  auditEvents: AuditEvent[];
}
```

Boundary notes:

- Only drafts with status `"failed"` or `"risk_blocked"`, or drafts that have an associated `"failed"` or `"blocked"` publish job, are recoverable.
- Returns HTTP `409` if the draft is not in a recoverable state.
- Returns HTTP `404` if the draft does not belong to the requested workspace (tenant isolation).
- The recovered draft is reset to `needs_review` with `scheduledFor` cleared, risk level recalculated, and a `"recovery queued"` audit event recorded.
- Any linked failed/blocked publish job is updated to `"queued"` status with a recovery reason; no background worker consumes that queued state in V1.
- Any active schedule job for the recovered draft is marked `"cancelled"` so the Calendar does not show stale planned publish slots.
- There is no automatic retry queue or cron-based recovery; recovery is a manual action triggered through the Pipeline UI or this route.

### `POST /api/workspaces/:workspaceId/reset`

Restores the requested workspace's demo state back to seeded V1 data while leaving other workspaces untouched. This route is intended for demo recovery after testing drafts, settings, scheduling, and mock publish flows.

Response shape:

```ts
{
  ok: true;
  drafts: Draft[];
  auditEvents: AuditEvent[];
  analytics: AnalyticsSnapshot[];
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  ideas: ContentIdea[];
  settings: IntegrationSetting[];
}
```

Boundary notes:

- Calls the repository reset boundary for the requested workspace only.
- Restores seeded drafts, draft versions, publish jobs, schedule jobs, audit events, integration settings, analytics snapshots, content ideas, and brand profile data for that workspace.
- Records a `"demo data reset"` audit event after restoring the seed data.
- Does not delete or reset records belonging to another workspace.
- Returns the standard JSON `not_found` envelope if the workspace is unknown.

### `GET /api/workspaces/:workspaceId/brand-profile`

Returns the current workspace-scoped Brand Voice OS profile used by prompt previews and mock Gemini draft generation.

Response shape:

```ts
{
  brandProfile: {
    id: string;
    workspaceId: string;
    description: string;
    targetAudience: string;
    toneRules: string[];
    forbiddenPhrases: string[];
    preferredCtas: string[];
    voiceNotes: string;
  };
}
```

Boundary notes:

- The response is scoped to the requested workspace through `DemoRepository.getBrandProfile`.
- It returns demo brand rules only; no secrets or live provider credentials are included.
- The returned `toneRules`, `forbiddenPhrases`, `preferredCtas`, and `voiceNotes` feed the prompt builder alongside mock Sheets few-shot examples.
- Unknown workspaces return the standard JSON `not_found` envelope.

### `PATCH /api/workspaces/:workspaceId/brand-profile`

Updates the requested workspace's editable Brand Voice OS profile in demo state and records a `"brand profile updated"` audit event.

Request shape:

```ts
{
  description?: string;
  targetAudience?: string;
  toneRules?: string[];
  forbiddenPhrases?: string[];
  preferredCtas?: string[];
  voiceNotes?: string;
}
```

Response shape:

```ts
{
  ok: true;
  brandProfile: BrandProfile;
  auditEvents: AuditEvent[];
}
```

Boundary notes:

- Updates are workspace-scoped and must not mutate another tenant's profile.
- Missing or blank text fields fall back to the existing profile values.
- List fields are normalized as rule arrays for prompt use.
- The route is demo-safe and does not call Gemini, Google Sheets, Facebook, or Telegram.
- The audit action for a successful save is exactly `"brand profile updated"`.

### `GET/PATCH /api/workspaces/:workspaceId/integrations`

`GET` returns integration settings for Gemini, Google Sheets, and Facebook Pages in demo form. `PATCH` saves a provider credential placeholder as a masked demo setting and records an audit event.

Response shape:

```ts
{
  settings: IntegrationSetting[];
}
```

Boundary notes:

- Uses masked or demo configuration only.
- Does not test live credentials.
- Does not return raw secret values.
- Current save support accepts `{ provider, secret?, config? }`.
- Provider metadata is saved as safe demo settings while keeping the same no-live-call contract.
- Metadata that is safe to expose/edit includes Gemini model and demo mode, Google Sheets sheet URL or ID and range, and Facebook Page ID with required permissions.
- Any secret-like field must be accepted only as a write-only replacement value and returned only as a masked display value or setup status.

### `POST /api/workspaces/:workspaceId/integrations/test`

Runs a mock connection test for one provider and logs the action. It does not call live provider endpoints.

Request shape:

```ts
{
  provider: "gemini" | "sheets" | "facebook";
}
```

Expected response shape:

```ts
{
  ok: boolean;
  result: {
    provider: "gemini" | "sheets" | "facebook";
    ok: boolean;
    status: "healthy" | "demo" | "needs_setup" | "failed" | "demo-ready" | "not-configured";
    message: string;
    checkedAt: string;
  };
  auditEvents: AuditEvent[];
}
```

Boundary notes:

- Results are provider-specific readiness checklists, not live network probes.
- Gemini readiness can verify model selection, demo mode, and masked key status.
- Google Sheets readiness can verify sheet URL/range presence and style-memory demo availability.
- Facebook readiness can verify Page ID, required permissions metadata, approval gate awareness, and masked token status.
- Response messages, audit details, logs, and UI state must never include raw API keys, tokens, webhook signing secrets, or other credential material.

### `GET /api/workspaces/:workspaceId/logs`

Returns audit events, publish jobs, and schedule jobs for the workspace.

### `GET /api/workspaces/:workspaceId/health`

Returns the workspace demo session, demo-mode status, integration readiness counts, and queue summaries for the workspace.

Response includes:

```ts
{
  session: DemoSession;
  workspace: Workspace;
  integrations: {
    ready: number;
    total: number;
    settings: IntegrationSetting[];
  };
  queues: {
    failedJobs: number;
    scheduledJobs: number;
    publishJobs: number;
  };
}
```

## Onboarding Checklist

Each workspace carries a set of onboarding checklist items that track first-screen setup progress. Items are workspace-scoped and seeded per workspace in demo data.

### Data shape

```ts
type OnboardingChecklistItem = {
  id: string;
  workspaceId: string;
  label: string;
  completed: boolean;
  detail: string;
};
```

### Included in existing routes

- `GET /api/workspaces/:workspaceId/drafts` returns `onboardingChecklistItems` in the response alongside drafts, audit events, analytics, publish jobs, schedule jobs, and ideas.
- `GET /api/workspaces/:workspaceId/health` returns an `onboarding` summary object:

```ts
{
  onboarding: {
    completed: number;
    total: number;
    items: OnboardingChecklistItem[];
  }
}
```

Boundary notes:

- Onboarding items are workspace-scoped; cross-tenant items are never returned.
- The `completed` count is derived from `items.filter(i => i.completed).length`.
- The `total` count is the total number of onboarding items for the workspace.
- `POST /api/workspaces/:workspaceId/reset` restores onboarding items to seed data.
- The `DemoRepository.listOnboardingChecklistItems(workspaceId)` method enforces workspace ownership.

## ScheduleJobs-Backed Calendar

Schedule jobs are the execution backbone of the calendar feature:

- Each `ScheduleJob` links a `workspaceId`, `draftId`, `scheduledFor` time, and `status`.
- The `DemoRepository.addOrReuseScheduleJob` method is idempotent: it reuses an existing scheduled job id for the same workspace+draft and updates the scheduled time rather than creating duplicates.
- Schedule jobs are listed per workspace via `DemoRepository.listScheduleJobs` and surfaced in the health endpoint queue counts.
- The dashboard Calendar screen renders scheduled slots from `scheduleJobs` matched back to their workspace draft records.
- There is no background cron or timer runner; schedule jobs represent planned intent, not executed publishes.

## Failed Job Recovery

Failed or blocked publish jobs are tracked as `PublishJob` records with status `"failed"` or `"blocked"`. The system provides visibility and manual recovery:

- The health endpoint reports `queues.failedJobs` as a count of drafts with status `"failed"`.
- The `POST /recover` route moves a failed/blocked draft back to `needs_review` and sets any associated publish job back to `"queued"` for manual recovery tracking.
- Recovery also cancels active schedule jobs for the draft because the draft is no longer approved for scheduled publishing.
- There is no automatic retry queue, exponential backoff, or cron-based recovery. Recovery is a manual action.
- The Pipeline recovery queue exposes a manual Recover to Review action that calls the recovery route.
- The `recoverDraft` lifecycle function validates that the draft is in a recoverable state before proceeding.
- A `"recovery queued"` audit event is recorded for every successful recovery.

## Service Layer Boundaries

### Repository

`DemoRepository` owns demo app state for:

- workspaces
- drafts
- draft versions
- audit events
- integration settings
- analytics snapshots
- content ideas
- brand profiles

The repository enforces workspace ownership for reads and writes by checking workspace IDs before returning or mutating records.

Outside Vitest, the repository loads and saves its full demo snapshot through `database/sqliteDemo.ts`. The snapshot table is intentionally simple for V1 demo durability; the normalized schema remains the contract for later production-grade adapters.

### Draft Lifecycle

`draftLifecycle.ts` owns draft state transitions:

- `saveDraftEdit`: updates content, recalculates score, increments version, writes a draft version, and logs an audit event.
- `generateDraft`: creates a Burmese mock Gemini draft from topic/options and mock Sheets examples.
- `approveDraft`: runs Risk Guard, blocks severe issues, or marks the draft approved.
- `rejectDraft`: marks a draft rejected and logs the reason.
- `scheduleDraft`: marks a draft scheduled and persists/reuses a schedule job.
- `publishDraft`: calls the mock Facebook adapter and marks a successful draft published.

### Prompt and Burmese Content Support

`promptBuilder.ts` creates a Gemini prompt with:

- topic, tone, length, angle, audience, and CTA
- brand profile rules
- forbidden phrases
- few-shot examples from mock Google Sheets
- an explicit instruction to return only the final Burmese draft

The current V1 app documents and tests the prompt contract, but no live Gemini route is exposed yet.

### Integration Settings

`integrationSettings.ts` masks secrets and marks settings as `demo` when a raw value is present. Raw secret values are not returned by the helper.

### Risk Guard

`riskGuard.ts` detects unsafe forex and affiliate marketing language, including guaranteed profit claims, unrealistic income claims, direct buy/sell advice, high-pressure wording, misleading accuracy/certainty claims, and unsafe trading promises such as risk-free, copy-trade, double-money, passive-income guarantee, get-rich-quick, and extreme leverage language. Blocked issues stop approval and publishing; review-level issues can still block mock publish because publishing requires a clean Risk Guard pass.

### `GET /api/workspaces/:workspaceId/buffer`

Returns the `WeeklyBufferState` containing 4 weekly slots (Monday, Wednesday, Friday, Sunday), buffer health score (0-100%), and slot assignment statuses.

### `POST /api/workspaces/:workspaceId/buffer`

Assigns or updates a scheduled draft to a specific weekly buffer slot.

### `POST /api/workspaces/:workspaceId/buffer/summary`

Generates an aggregated Sunday Weekly Executive Summary post synthesizing the week's approved/published posts for SME founders with Rule #10 Zero-Jargon and Messenger CTA.

### `POST /api/workspaces/:workspaceId/analytics`

Triple-intake endpoint supporting direct JSON form input, Facebook CSV table upload, and mobile screenshot/plain-text metrics parsing with automatic Post ID deduplication.

### `GET /api/workspaces/:workspaceId/topic-recommendations`

Returns performance-grounded topic recommendations filtered against past published/approved drafts to prevent duplicate topic ideas.

### SQLite Demo Schema

`database/sqliteDemo.ts` can create an in-memory SQLite database from `database/schema/schema.sql`, verify that workspace-owned tables include `workspaceId`, and open the active local SQLite demo snapshot store used by API routes outside tests.

## Known V1 Limitations

- API state is durable for the local V1 demo through a SQLite JSON snapshot, but this is not production-grade relational persistence.
- There is no authentication, authorization, rate limiting, or tenant membership check beyond workspace ID filtering.
- Current routes map not-found, bad request, and Risk Guard conflicts to JSON error envelopes; future write routes must use the same pattern.
- Live Gemini, Google Sheets, Telegram, and Facebook Pages API execution are not connected in the codebase app.
- Publish jobs and schedule jobs are saved in the demo snapshot and remain mock-only.
- The V1 contract is intended for builder-side demo and verification, not client production delivery.
- Tenant isolation is enforced at the repository level via workspace ID checks on every read and write; cross-tenant draft, job, and idea access returns 404 or throws before any mutation occurs.
- The recovery route enforces tenant isolation by verifying draft ownership before allowing recovery actions.
