# PostgreSQL Logical Data Model Specification

**Project:** FYF AI Content Studio (`fyf-ai-content-studio`) — deferred hosted model
**Phase:** Phase 0A (Implementation Specification)
**Date:** July 23, 2026

---

## 1. Schema Ownership & Partitioning Boundaries

To prevent migration conflicts and data corruption across system layers, schema ownership is explicitly partitioned into isolated namespaces:

1. **Application Domain Schema (`app.*`):**
   - **Owner:** Application Migration Layer / Owner-Approved ORM.
   - **Tables (21 Total):** `app.users`, `app.workspaces`, `app.memberships`, `app.brand_profiles`, `app.brand_examples`, `app.content_briefs`, `app.workflow_runs`, `app.workflow_commands`, `app.content_artifacts`, `app.draft_versions`, `app.research_cache`, `app.research_sources`, `app.review_results`, `app.human_approvals`, `app.model_profiles`, `app.model_call_attempts`, `app.budget_policies`, `app.budget_reservations`, `app.usage_ledger`, `app.audit_events`, `app.export_records`.
2. **LangGraph Checkpointer Schema:**
   - **Owner:** Installed LangGraph `PostgresSaver` library (`@langchain/langgraph-checkpoint-postgres`).
   - **Expected Table Concepts:** `checkpoints`, `checkpoint_blobs`, `checkpoint_writes`.
   - **Phase 0B Spike Rule:** Specific installed schema/table names and migration behavior must be discovered and verified during the Phase 0B connection spike. Application migrations must never create, rename, or alter LangGraph checkpointer tables.
3. **Authentication Provider Schema:**
   - **Owner:** Selected Authentication Provider.
   - **Phase 0B Spike Rule:** Table names, schema boundaries, and session/identity structures depend on the owner's final DB/Auth decision and will be verified in Phase 0B. Application schema references external identities via provider-neutral mapping.
4. **LiteLLM Gateway Schema:**
   - **Owner:** LiteLLM Proxy Gateway container (when DB logging or virtual key persistence is enabled).
   - **Phase 0B Spike Rule:** Managed independently by LiteLLM container configurations when activated.

*Note:* Database, Authentication Provider, and ORM selection remain open owner decisions. Supabase, Drizzle, Clerk, Auth.js, Neon, and Cloud SQL are candidates under review, not approved production selections.

---

## 2. Tenant Isolation & Composite Tenant Key Architecture

- **Global Identity:** `app.users` is a global identity table mapping external auth credentials to internal application identity.
- **Tenant Scope:** Every tenant-owned application table MUST include `workspace_id` and define `UNIQUE (workspace_id, id)`.
- **Composite Tenant Consistency:** Cross-table tenant relationships enforce tenant boundary matching using composite foreign keys: `(workspace_id, child_reference_id) REFERENCES app.parent_table(workspace_id, id) ON DELETE RESTRICT`. Global identity references (`memberships.user_id`, `human_approvals.actor_id`, `audit_events.actor_id`, `export_records.exporter_id`) remain single-column references to `app.users.id`.
- **No Cascading Deletes:** Default relationship deletion behavior is strictly `ON DELETE RESTRICT` (or `ON DELETE NO ACTION`). Deleting a workspace, run, command, artifact, model attempt, reservation, user, or other parent must not silently erase immutable workflow, approval, provenance, financial, export, or audit history. No raw cascade chain is approved for V1. Workspace deletion and data archival must use a future explicit, owner-approved archival/retention workflow.
- **Multi-Layer Defense:** Server-side session verification and future database Row-Level Security (RLS) policies act as secondary defense layers. Presence of `workspace_id` alone is necessary but not sufficient for tenant isolation.
- **Phase 0B Gate:** The specific RLS policy definitions and authentication engine integration remain blocked pending the owner's DB/Auth stack choice and Phase 0B verification spike.

---

## 3. Logical Entity-Relationship Overview

```
app.workspaces (1) ───< app.memberships (N) >─── app.users (1)
   │
   ├───< app.brand_profiles (1)
   ├───< app.brand_examples (N)
   ├───< app.model_profiles (N) ───< app.model_call_attempts (N)
   ├───< app.budget_policies (1)
   │
   └───< app.content_briefs (1) ───< app.workflow_runs (1)
                                        │
                                        ├───< app.workflow_commands (N)
                                        ├───< app.research_sources (N) >─── app.research_cache (0..1)
                                        ├───< app.content_artifacts (1) ───< app.draft_versions (N)
                                        │                                       │
                                        │                                       ├───< app.review_results (N)
                                        │                                       ├───< app.human_approvals (N)
                                        │                                       └───< app.export_records (N)
                                        ├───< app.model_call_attempts (N)
                                        │         │
                                        │         ├───< app.budget_reservations (1)
                                        │         └───< app.usage_ledger (1)
                                        │
                                        └───< app.audit_events (N)
```

---

## 4. Detailed Entity Definitions

### 4.1 `app.users`
- **Purpose:** Provider-neutral user profile mapping external authentication subjects to internal application identity.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `auth_provider` (TEXT, NOT NULL) -- e.g., 'auth0', 'clerk', 'supabase_auth'
  - `auth_subject` (TEXT, NOT NULL) -- Authoritative subject identifier from auth provider
  - `email` (TEXT, NOT NULL) -- Application profile data, not authoritative auth identity
  - `full_name` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:** `UNIQUE (auth_provider, auth_subject)`, `UNIQUE (email)`

### 4.2 `app.workspaces`
- **Purpose:** Historical root workspace-isolation boundary for a future hosted FYF design; the current runtime uses local SQLite.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `name` (TEXT, NOT NULL)
  - `page_name` (TEXT, NOT NULL)
  - `risk_sensitivity` (TEXT, NOT NULL, Default: `'standard'`, Enum: `'standard'`, `'strict'`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)

### 4.3 `app.memberships`
- **Purpose:** User role assignments per workspace.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `user_id` (UUID, NOT NULL, FK ➔ `app.users.id` ON DELETE RESTRICT) -- Global identity reference
  - `role` (TEXT, NOT NULL, Enum: `'owner'`, `'editor'`, `'viewer'`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:** `UNIQUE (workspace_id, id)`, `UNIQUE (workspace_id, user_id)`

### 4.4 `app.brand_profiles`
- **Purpose:** Structured brand identity and tone rules per workspace.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `description` (TEXT, NOT NULL)
  - `target_audience` (TEXT, NOT NULL)
  - `tone_rules` (JSONB, NOT NULL, Default: `'[]'`)
  - `forbidden_phrases` (JSONB, NOT NULL, Default: `'[]'`)
  - `preferred_ctas` (JSONB, NOT NULL, Default: `'[]'`)
  - `voice_notes` (TEXT, NOT NULL, Default: `''`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:** `UNIQUE (workspace_id, id)`, `UNIQUE (workspace_id)`

### 4.5 `app.brand_examples`
- **Purpose:** Approved post examples for few-shot prompt context.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `pillar` (TEXT, NOT NULL, Default: `'general'`)
  - `topic` (TEXT, NOT NULL)
  - `content` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:** `UNIQUE (workspace_id, id)`

### 4.6 `app.content_briefs`
- **Purpose:** Content creation briefs submitted by operators.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `topic` (TEXT, NOT NULL)
  - `business_goal` (TEXT, NOT NULL)
  - `target_audience` (TEXT)
  - `format` (TEXT, NOT NULL, Default: `'facebook_post'`)
  - `angle` (TEXT)
  - `cta` (TEXT)
  - `research_required` (BOOLEAN, NOT NULL, Default: `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:** `UNIQUE (workspace_id, id)`

### 4.7 `app.workflow_runs`
- **Purpose:** Business status, versioning, and execution tracking for LangGraph workflow runs.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `brief_id` (UUID, NOT NULL)
  - `status` (TEXT, NOT NULL, Enum: `'BRIEF_SUBMITTED'`, `'VALIDATING'`, `'READY_FOR_STRATEGY'`, `'RESEARCHING'`, `'STRATEGIZING'`, `'DRAFTING'`, `'REVIEWING'`, `'REVISING'`, `'PENDING_HUMAN_APPROVAL'`, `'NEEDS_HUMAN_REVIEW'`, `'APPROVED'`, `'READY_FOR_EXPORT'`, `'EXPORTED'`, `'FAILED'`, `'NEEDS_ATTENTION'`, `'CANCELLED'`)
  - `version` (INTEGER, NOT NULL, Default: `1`) -- Optimistic Concurrency Version Lock
  - `revision_count` (INTEGER, NOT NULL, Default: `0`)
  - `current_node` (TEXT)
  - `failure_reason` (TEXT)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK: `FOREIGN KEY (workspace_id, brief_id) REFERENCES app.content_briefs(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - `CHECK (version >= 1)`
  - `CHECK (revision_count >= 0)`

### 4.8 `app.workflow_commands`
- **Purpose:** Durable transactional outbox and command queue log for async dispatch and idempotency.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `command_type` (TEXT, NOT NULL)
  - `idempotency_key` (TEXT, NOT NULL)
  - `request_hash` (TEXT, NOT NULL)
  - `expected_state_version` (INTEGER, NOT NULL)
  - `payload` (JSONB, NOT NULL, Default: `'{}'`)
  - `status` (TEXT, NOT NULL, Enum: `'PENDING_ENQUEUE'`, `'ENQUEUED'`, `'CLAIMED'`, `'COMPLETED'`, `'FAILED'`, `'STALE'`, `'NEEDS_ATTENTION'`)
  - `task_name` (TEXT) -- Complete deterministic Cloud Tasks resource identity
  - `trace_correlation_id` (TEXT, NOT NULL)
  - `worker_lease_owner` (TEXT)
  - `worker_lease_expires_at` (TIMESTAMPTZ)
  - `result_reference` (JSONB)
  - `failure_code` (TEXT)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `completed_at` (TIMESTAMPTZ)
- **Constraints:**
  - Composite Tenant FK: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Idempotency Scope: `UNIQUE (workspace_id, command_type, idempotency_key)`
  - Deterministic Cloud Task Identity: Partial Unique Index `UNIQUE (task_name) WHERE task_name IS NOT NULL`
  - `CHECK (expected_state_version >= 1)`
  - Lease Consistency: `CHECK (status != 'CLAIMED' OR (worker_lease_owner IS NOT NULL AND worker_lease_expires_at IS NOT NULL))`
  - Active Status Completion Check: `CHECK (status NOT IN ('PENDING_ENQUEUE', 'ENQUEUED', 'CLAIMED') OR completed_at IS NULL)`
  - Terminal Status Completion Check: `CHECK (status NOT IN ('COMPLETED', 'FAILED', 'STALE', 'NEEDS_ATTENTION') OR completed_at IS NOT NULL)`
  - Result Reference Check: `CHECK (status != 'COMPLETED' OR result_reference IS NOT NULL)`
  - Failure Code Check: `CHECK (failure_code IS NULL OR status IN ('FAILED', 'NEEDS_ATTENTION'))`
  - Failure Code Security Rule: `failure_code` contains only a bounded sanitized error code and must never contain secrets, credentials, authorization headers, raw provider payloads, stack traces containing sensitive data, or raw prompts or completions. Lease expiry permits reconciler recovery; it does not authorize creating a duplicate command or a differently named task.

### 4.9 `app.content_artifacts`
- **Purpose:** Unique content package root owned by a workflow run. The database permits at most one root per run; deterministic application code creates that root before the first draft is persisted.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `current_version` (INTEGER, NOT NULL, Default: `1`)
  - `content` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Draft Ownership Reference Target: `UNIQUE (workspace_id, workflow_run_id, id)`
  - Single Artifact Root per Workflow Run: `UNIQUE (workspace_id, workflow_run_id)`
  - `CHECK (current_version >= 1)`
- **Existence Rule:** SQL uniqueness enforces at most one artifact root per run, not existence. Before any draft-producing transition commits, deterministic application code must create or load the run's single artifact root in the same transaction.

### 4.10 `app.draft_versions`
- **Purpose:** Immutable version history of generated draft content, identified by canonical content hash and version lock.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `artifact_id` (UUID, NOT NULL)
  - `version` (INTEGER, NOT NULL)
  - `content` (TEXT, NOT NULL)
  - `content_hash` (TEXT, NOT NULL) -- Server-computed SHA-256 hash of canonical draft text
  - `reason` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Run-Bound Artifact FK: `FOREIGN KEY (workspace_id, workflow_run_id, artifact_id) REFERENCES app.content_artifacts(workspace_id, workflow_run_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Run-Bound Draft Identity Target: `UNIQUE (workspace_id, workflow_run_id, id, version)`
  - Run-Bound Draft Content Target: `UNIQUE (workspace_id, workflow_run_id, id, version, content_hash)`
  - `UNIQUE (workspace_id, artifact_id, version)`
  - `UNIQUE (artifact_id, version)`
  - `CHECK (version >= 1)`
  - `CHECK (length(content_hash) > 0)`
- **Content Hash Rules:**
  - `content_hash` is computed exclusively by deterministic server code from the canonical stored draft content string.
  - The LLM, browser, or external caller cannot supply an authoritative content hash.
  - The hash is persisted with the immutable draft version before the transaction commits.
  - Replay compares the stored `content_hash` with trusted request/command hash evidence.
  - Same command identity plus same request hash and content hash returns the existing stored draft version.
  - Same command identity with a different request hash or content hash yields a version conflict error.
  - `content_hash` must never be altered or updated after insertion.

### 4.11 `app.research_cache`
- **Purpose:** Workspace-scoped reusable cache of validated research fetches to prevent duplicate external calls.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `provider` (TEXT, NOT NULL) -- Provider-neutral identifier
  - `query_hash` (TEXT, NOT NULL)
  - `request_descriptor` (TEXT, NOT NULL)
  - `source_url` (TEXT, NOT NULL)
  - `source_domain` (TEXT, NOT NULL)
  - `title` (TEXT)
  - `content_hash` (TEXT, NOT NULL)
  - `sanitized_content` (TEXT, NOT NULL) -- Untrusted data, sanitized for safety
  - `validation_status` (TEXT, NOT NULL, Enum: `'valid'`, `'untrusted'`, `'rejected'`)
  - `retrieved_at` (TIMESTAMPTZ, NOT NULL)
  - `expires_at` (TIMESTAMPTZ, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - `UNIQUE (workspace_id, id)`
  - `UNIQUE (workspace_id, provider, query_hash, source_url, content_hash)`
- **Security Rule:** Untrusted content storage. Must NEVER store secrets, credentials, API keys, system instructions, or raw auth headers.

### 4.12 `app.research_sources`
- **Purpose:** Immutable run-specific provenance record linking workflow runs to validated factual sources with replay idempotency.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `research_cache_id` (UUID) -- Nullable if provider bypasses cache
  - `source_url` (TEXT, NOT NULL)
  - `title` (TEXT)
  - `content_hash` (TEXT, NOT NULL)
  - `citation_metadata` (JSONB, NOT NULL, Default: `'{}'`)
  - `validation_status` (TEXT, NOT NULL, Enum: `'valid'`, `'untrusted'`, `'rejected'`)
  - `retrieved_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK to Workflow Run: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - Composite Tenant FK to Research Cache: `FOREIGN KEY (workspace_id, research_cache_id) REFERENCES app.research_cache(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Run Provenance Uniqueness: `UNIQUE (workspace_id, workflow_run_id, source_url, content_hash)`
- **Provenance Rules:**
  - `app.research_cache` stores reusable validated retrieval content; `app.research_sources` stores immutable run-specific provenance.
  - Replay with identical workspace, workflow run, source URL, and content hash returns the existing provenance record.
  - Same source URL with a changed content hash creates a distinct provenance version; it must not overwrite the previous immutable record.
  - Credentials, authorization headers, cookies, raw provider payloads, and secrets are never stored.
  - Full research bodies remain in the bounded research cache field, not audit logs.
  - Research-source records remain untrusted provenance data even after validation.

### 4.13 `app.review_results`
- **Purpose:** Audit findings recorded by parallel ephemeral review checks during the `REVIEWING` state, bound to specific draft version identity.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `draft_version_id` (UUID, NOT NULL) -- Authoritative immutable draft version FK
  - `draft_version` (INTEGER, NOT NULL) -- Display / optimistic version number
  - `reviewer_role` (TEXT, NOT NULL, Enum: `'brand_voice'`, `'fact_check'`, `'risk_policy'`, `'format_platform'`)
  - `result_schema_version` (INTEGER, NOT NULL, Default: `1`)
  - `result_hash` (TEXT, NOT NULL) -- Server-computed SHA-256 hash of structured review issues
  - `passed` (BOOLEAN, NOT NULL)
  - `issues` (JSONB, NOT NULL, Default: `'[]'`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Exact Run-Bound Draft FK: `FOREIGN KEY (workspace_id, workflow_run_id, draft_version_id, draft_version) REFERENCES app.draft_versions(workspace_id, workflow_run_id, id, version) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Review Result Identity Uniqueness: `UNIQUE (workspace_id, workflow_run_id, draft_version_id, reviewer_role, result_schema_version)`
  - `CHECK (draft_version >= 1)`
  - `CHECK (result_schema_version >= 1)`
  - `CHECK (length(result_hash) > 0)`
- **Review Identity & Replay Rules:**
  - `result_hash` is computed by deterministic server code from the complete canonical validated review result, including the schema version, reviewer role, draft identity, pass/fail value, and normalized issues.
  - Same logical identity plus same `result_hash` returns the stored review result.
  - Same logical identity with a different `result_hash` returns a result conflict error.
  - A stale or mismatched `draft_version_id` / `draft_version` reference is rejected.
  - Inserting a review result does not directly transition workflow state.
  - Deterministic aggregation loads exactly four valid results for the same `draft_version_id` and `result_schema_version`.

### 4.14 `app.human_approvals`
- **Purpose:** Immutable audit log of human operator approval decisions (`approve`, `revise`, `cancel`) bound to exact draft version identity.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `draft_version_id` (UUID, NOT NULL) -- Authoritative immutable draft version FK
  - `draft_version` (INTEGER, NOT NULL) -- Display / optimistic version number
  - `actor_id` (UUID, NOT NULL, FK ➔ `app.users.id` ON DELETE RESTRICT) -- Global identity reference
  - `decision` (TEXT, NOT NULL, Enum: `'approve'`, `'revise'`, `'cancel'`)
  - `feedback` (TEXT)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Exact Run-Bound Draft FK: `FOREIGN KEY (workspace_id, workflow_run_id, draft_version_id, draft_version) REFERENCES app.draft_versions(workspace_id, workflow_run_id, id, version) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - `CHECK (draft_version >= 1)`
- **Approval Integrity Rules:**
  - Approval applies ONLY to the exact `draft_version_id` and matching `draft_version`.
  - Stale or mismatched approvals are rejected.
  - Direct content editing uses `SAVE_HUMAN_EDIT` and creates a new draft version.
  - An approval does not remain valid after a new draft version is created.
  - Approval records are append-only.
  - Never stores edited draft text inside `app.human_approvals`.

### 4.15 `app.model_profiles`
- **Purpose:** Workspace-scoped, versioned model configuration profiles per agent role.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `role_id` (TEXT, NOT NULL, Enum: `'strategy-primary'`, `'research-primary'`, `'writer-primary'`, `'review-primary'`)
  - `model_alias` (TEXT, NOT NULL)
  - `provider` (TEXT, NOT NULL, Default: `'vertex_ai'`)
  - `provider_model_id` (TEXT) -- Nullable until Phase 3 selects and pins model
  - `lifecycle_stage` (TEXT) -- Nullable until Phase 3 selects and verifies model; no default while provider_model_id is unset
  - `capability_requirements` (JSONB, NOT NULL, Default: `'[]'`)
  - `temperature` (NUMERIC(3,2), NOT NULL, Default: `0.70`)
  - `max_output_tokens` (INTEGER, NOT NULL, Default: `2048`)
  - `estimated_max_cost` (NUMERIC(10,4), NOT NULL, Default: `0.0500`)
  - `enabled` (BOOLEAN, NOT NULL, Default: false)
  - `config_version` (INTEGER, NOT NULL, Default: `1`)
  - `fallback_profile_id` (UUID) -- Nullable self-reference, MUST be NULL in V1
- **Constraints:**
  - `UNIQUE (workspace_id, id)`
  - `UNIQUE (workspace_id, id, config_version)`
  - Version Configuration Uniqueness: `UNIQUE (workspace_id, role_id, config_version)`
  - At Most One Active Profile Index: Partial Unique Index `UNIQUE (workspace_id, role_id) WHERE enabled = TRUE` (enforces at most one enabled profile per workspace and role)
  - Paired Selection Constraint: `CHECK ((provider_model_id IS NULL AND lifecycle_stage IS NULL) OR (provider_model_id IS NOT NULL AND lifecycle_stage IS NOT NULL))`
  - Activation Constraint: `CHECK (enabled = FALSE OR (provider_model_id IS NOT NULL AND lifecycle_stage IS NOT NULL))`
  - Composite Tenant Self-FK: `FOREIGN KEY (workspace_id, fallback_profile_id) REFERENCES app.model_profiles(workspace_id, id) ON DELETE RESTRICT`
  - V1 Constraints: `CHECK (provider = 'vertex_ai')`, `CHECK (fallback_profile_id IS NULL)`
  - Metric Range Checks: `CHECK (config_version >= 1)`, `CHECK (temperature >= 0.00 AND temperature <= 1.00)`, `CHECK (max_output_tokens > 0)`, `CHECK (estimated_max_cost >= 0.0000)`
- **V1 Selection & Deterministic Preflight Rules:**
  - The database partial unique index (`UNIQUE (workspace_id, role_id) WHERE enabled = TRUE`) enforces at most one enabled profile per workspace and role.
  - Before a workflow begins model execution, deterministic application code must verify that every required agent role has exactly one enabled model profile.
  - Zero enabled profiles is a configuration error and transitions the run safely to `NEEDS_ATTENTION` before any model request.
  - The deterministic preflight prevents zero enabled profiles, while the DB index prevents more than one enabled profile.
  - Profiles remain disabled until the Phase 3 model-selection gate pins `provider_model_id` and `lifecycle_stage`.
  - `fallback_profile_id` is present as a self-referential UUID schema placeholder, but MUST remain NULL in V1 because Vertex AI is the exclusive enabled provider.

### 4.16 `app.model_call_attempts`
- **Purpose:** Granular attempt-level tracking of external model calls for execution non-stacking and reconciliation.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `model_profile_id` (UUID, NOT NULL)
  - `model_profile_config_version` (INTEGER, NOT NULL)
  - `agent_role` (TEXT, NOT NULL)
  - `call_key` (TEXT, NOT NULL) -- Logical call identifier within the workflow step
  - `attempt_number` (INTEGER, NOT NULL, Default: `1`)
  - `request_hash` (TEXT, NOT NULL)
  - `trace_correlation_id` (TEXT, NOT NULL)
  - `provider_request_id` (TEXT) -- Upstream provider request ID retrieved during execution/reconciliation
  - `requested_alias` (TEXT, NOT NULL)
  - `actual_provider` (TEXT, NOT NULL, Default: `'vertex_ai'`)
  - `actual_model_id` (TEXT)
  - `status` (TEXT, NOT NULL, Enum: `'RESERVED'`, `'IN_FLIGHT'`, `'SUCCEEDED'`, `'FAILED_CONFIRMED'`, `'OUTCOME_UNKNOWN'`, `'RECONCILED'`)
  - `transmitted_at` (TIMESTAMPTZ)
  - `completed_at` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK to Workflow Run: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - Composite Versioned Model Profile Reference: `FOREIGN KEY (workspace_id, model_profile_id, model_profile_config_version) REFERENCES app.model_profiles(workspace_id, id, config_version) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Attempt Uniqueness: `UNIQUE (workspace_id, workflow_run_id, call_key, attempt_number)`
  - `CHECK (attempt_number >= 1)`
- **Retry Rule:** `OUTCOME_UNKNOWN` must never trigger an automatic duplicate model call without prior reconciliation.

### 4.17 `app.budget_policies`
- **Purpose:** Per-workspace spend policies and hard budget limits for pilot safety.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, UNIQUE, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `max_cost_per_run` (NUMERIC(10,4), NOT NULL, Default: `0.5000`)
  - `max_daily_budget` (NUMERIC(10,4), NOT NULL, Default: `5.0000`)
  - `max_monthly_budget` (NUMERIC(10,4), NOT NULL, Default: `50.0000`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - `UNIQUE (workspace_id, id)`
  - `CHECK (max_cost_per_run >= 0.0000)`
  - `CHECK (max_daily_budget >= 0.0000)`
  - `CHECK (max_monthly_budget >= 0.0000)`
- **Owner Review Note:** Default monetary values are proposed structural placeholders for specification completeness. Final production budget limits require explicit owner approval prior to pilot launch.

### 4.18 `app.budget_reservations`
- **Purpose:** Atomic cost reservation tied directly to a specific model call attempt before transmission.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `model_call_attempt_id` (UUID, NOT NULL, UNIQUE)
  - `agent_role` (TEXT, NOT NULL)
  - `reserved_amount` (NUMERIC(10,4), NOT NULL)
  - `committed_amount` (NUMERIC(10,4), NOT NULL, Default: `0.0000`)
  - `currency` (TEXT, NOT NULL, Default: `'USD'`)
  - `status` (TEXT, NOT NULL, Enum: `'RESERVED'`, `'COMMITTED'`, `'RELEASED'`, `'EXPIRED'`)
  - `expires_at` (TIMESTAMPTZ, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK to Workflow Run: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - Composite Tenant FK to Model Call Attempt: `FOREIGN KEY (workspace_id, model_call_attempt_id) REFERENCES app.model_call_attempts(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - `CHECK (reserved_amount >= 0.0000)`
  - `CHECK (committed_amount >= 0.0000)`
- **Atomicity:** Model call attempt and budget reservation creation MUST occur in a single database transaction prior to model request transmission.

### 4.19 `app.usage_ledger`
- **Purpose:** Immutable financial product ledger recording finalized token consumption and costs per attempt.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `model_call_attempt_id` (UUID, NOT NULL, UNIQUE)
  - `budget_reservation_id` (UUID)
  - `agent_role` (TEXT, NOT NULL)
  - `requested_alias` (TEXT, NOT NULL)
  - `actual_provider` (TEXT, NOT NULL)
  - `actual_model_id` (TEXT, NOT NULL)
  - `provider_request_id` (TEXT)
  - `trace_correlation_id` (TEXT, NOT NULL)
  - `input_tokens` (INTEGER, NOT NULL)
  - `output_tokens` (INTEGER, NOT NULL)
  - `estimated_cost` (NUMERIC(10,4), NOT NULL)
  - `currency` (TEXT, NOT NULL, Default: `'USD'`)
  - `latency_ms` (INTEGER, NOT NULL)
  - `status` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK to Workflow Run: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - Composite Tenant FK to Model Call Attempt: `FOREIGN KEY (workspace_id, model_call_attempt_id) REFERENCES app.model_call_attempts(workspace_id, id) ON DELETE RESTRICT`
  - Composite Tenant FK to Budget Reservation: `FOREIGN KEY (workspace_id, budget_reservation_id) REFERENCES app.budget_reservations(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - `CHECK (input_tokens >= 0)`
  - `CHECK (output_tokens >= 0)`
  - `CHECK (estimated_cost >= 0.0000)`
  - `CHECK (latency_ms >= 0)`
- **Data Protection:** Stores token metrics, latency, and cost estimates. Never stores raw prompts or completion response bodies.

### 4.20 `app.audit_events`
- **Purpose:** Immutable security and operational audit log using structured JSONB metadata.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `event_type` (TEXT, NOT NULL) -- e.g., 'command_received', 'state_transition', 'human_approval'
  - `actor_type` (TEXT, NOT NULL, Enum: `'user'`, `'system'`, `'worker'`)
  - `actor_id` (UUID, FK ➔ `app.users.id` ON DELETE RESTRICT) -- Global identity reference, nullable for system events
  - `workflow_run_id` (UUID)
  - `command_id` (UUID)
  - `trace_correlation_id` (TEXT, NOT NULL)
  - `metadata` (JSONB, NOT NULL, Default: `'{}'`) -- Structured metadata matching explicit allowlist
  - `created_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Composite Tenant FK to Workflow Run: `FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT`
  - Composite Tenant FK to Workflow Command: `FOREIGN KEY (workspace_id, command_id) REFERENCES app.workflow_commands(workspace_id, id) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
- **Sanitization Allowlist:** `metadata` MUST contain only approved operational keys (e.g. `action`, `previous_status`, `new_status`, `error_code`, `draft_version`). NEVER store secrets, API credentials, bearer tokens, raw prompts, full research bodies, or model completions. Append-only immutable table.

### 4.21 `app.export_records`
- **Purpose:** Immutable audit record of manual operator exports bound to exact draft version identity and content hash.
- **Columns:**
  - `id` (UUID, PK, Default: `gen_random_uuid()`)
  - `workspace_id` (UUID, NOT NULL, FK ➔ `app.workspaces.id` ON DELETE RESTRICT)
  - `workflow_run_id` (UUID, NOT NULL)
  - `draft_version_id` (UUID, NOT NULL) -- Authoritative immutable draft version FK
  - `draft_version` (INTEGER, NOT NULL) -- Display / optimistic version number
  - `exporter_id` (UUID, NOT NULL, FK ➔ `app.users.id` ON DELETE RESTRICT) -- Global identity reference
  - `content_hash` (TEXT, NOT NULL)
  - `exported_at` (TIMESTAMPTZ, NOT NULL, Default: `now()`)
- **Constraints:**
  - Exact Run-Bound Draft Content FK: `FOREIGN KEY (workspace_id, workflow_run_id, draft_version_id, draft_version, content_hash) REFERENCES app.draft_versions(workspace_id, workflow_run_id, id, version, content_hash) ON DELETE RESTRICT`
  - `UNIQUE (workspace_id, id)`
  - Export Uniqueness: `UNIQUE (workspace_id, workflow_run_id, draft_version_id, content_hash)`
  - `CHECK (draft_version >= 1)`
- **Export Rule & Integrity:**
  - Valid ONLY when `workflow_runs.status = 'READY_FOR_EXPORT'`.
  - The export transaction verifies workspace, workflow run, `draft_version_id`, `draft_version`, `content_hash`, and expected state version.
  - Replay with identical parameters returns the existing export record without creating duplicate audit records.
  - Supports manual operator export only (no automatic social posting or tokens).

---

## 5. Indexes, Data Types, and Retention Rules

### 5.1 Data Types & Standards
- Primary Keys: `UUID` generated via `gen_random_uuid()`.
- Timestamps: `TIMESTAMPTZ` with timezone preservation.
- Strict Constraints: Explicit `CHECK` constraints for all enum strings, non-negative numeric metrics, and positive counters.

### 5.2 Required Operational Indexes
- `app.workflow_runs`: Index on `(workspace_id, status)`.
- `app.workflow_commands`: Index on `(status, created_at, worker_lease_expires_at)` for outbox and reconciler scans.
- `app.content_artifacts`: Index on `(workspace_id, workflow_run_id)`.
- `app.draft_versions`: Index on `(workspace_id, workflow_run_id, artifact_id, version)` and `(workspace_id, content_hash)`.
- `app.review_results`: Index on `(workspace_id, workflow_run_id, draft_version_id)` and `(workspace_id, workflow_run_id, reviewer_role, result_schema_version)`.
- `app.research_sources`: Index on `(workspace_id, workflow_run_id)` and `(workspace_id, source_url, content_hash)`.
- `app.human_approvals`: Index on `(workspace_id, workflow_run_id, draft_version_id)`.
- `app.export_records`: Index on `(workspace_id, workflow_run_id, draft_version_id)`.
- `app.model_call_attempts`: Index on `(status, provider_request_id, trace_correlation_id)` for async reconciliation.
- `app.research_cache`: Index on `(workspace_id, provider, query_hash, source_url)` and `(expires_at)`.
- `app.usage_ledger`: Index on `(workspace_id, created_at)`.
- `app.audit_events`: Index on `(workspace_id, workflow_run_id, event_type, created_at)`.

### 5.3 Retention & Immutability Rules
- Append-Only Tables: `app.draft_versions`, `app.review_results`, `app.human_approvals`, `app.usage_ledger`, `app.audit_events`, and `app.export_records` are immutable audit logs.
- Relationship Deletion Protection: All parent-child relationships enforce `ON DELETE RESTRICT` (or `ON DELETE NO ACTION`). Deleting a workspace, run, command, artifact, model attempt, reservation, user, or other parent must not silently erase immutable workflow, approval, provenance, financial, export, or audit history. No raw cascade chain is approved for V1. Soft-delete or policy-governed archival processes must be approved by the owner before implementation. Retention periods remain subject to policy configuration and owner review.

---

## 6. Cross-Document Contract Resolution

- **Draft Version Content Hash Resolution:** The draft version content-hash requirement is fully resolved by `app.draft_versions.content_hash` (server-computed SHA-256 string, non-nullable, non-modifiable after insertion).
- **Review Result Schema & Hash Resolution:** The review result schema and hash requirement is fully resolved by `app.review_results.result_schema_version`, `app.review_results.result_hash`, and the logical uniqueness constraint `UNIQUE (workspace_id, workflow_run_id, draft_version_id, reviewer_role, result_schema_version)`.
- **Research Provenance Replay Resolution:** The research provenance replay requirement is fully resolved by `app.research_sources` uniqueness constraint `UNIQUE (workspace_id, workflow_run_id, source_url, content_hash)`.
- **Cross-Run Draft Integrity Resolution:** Reviews and approvals reference the exact `(workspace_id, workflow_run_id, draft_version_id, draft_version)` tuple. Exports additionally bind the exact `content_hash`. A draft from another run, a stale display version, or a mismatched export hash is rejected by database foreign-key constraints rather than application convention alone.
- **Catalog Alignment Resolution:** `docs/tool-catalog.md` now uses the same immutable draft identity, result schema/hash, and research provenance replay contracts defined here.
- **Specification Status:** No code implementations or SQL migrations exist yet. All constraints remain logical specifications pending Phase 0B validation.
