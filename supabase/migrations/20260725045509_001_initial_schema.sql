-- FYF-AI-Content-Agent-Service Initial Schema (Phase 0A Data Model)
-- Ensure extension exists for uuid generation (though native in modern pg)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the dedicated application schema
CREATE SCHEMA IF NOT EXISTS app;

--------------------------------------------------------------------------------
-- 1. GLOBAL IDENTITY
--------------------------------------------------------------------------------

CREATE TABLE app.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider TEXT NOT NULL,
  auth_subject TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_auth_unique UNIQUE (auth_provider, auth_subject),
  CONSTRAINT users_email_unique UNIQUE (email)
);

--------------------------------------------------------------------------------
-- 2. TENANT ISOLATION
--------------------------------------------------------------------------------

CREATE TABLE app.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  page_name TEXT NOT NULL,
  risk_sensitivity TEXT NOT NULL DEFAULT 'standard' CHECK (risk_sensitivity IN ('standard', 'strict')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_tenant_key UNIQUE (id)
);

CREATE TABLE app.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT memberships_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT memberships_user_fk FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE RESTRICT,
  CONSTRAINT memberships_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT memberships_tenant_user_unique UNIQUE (workspace_id, user_id)
);

--------------------------------------------------------------------------------
-- 3. BRAND CONFIGURATION
--------------------------------------------------------------------------------

CREATE TABLE app.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  tone_rules JSONB NOT NULL DEFAULT '[]',
  forbidden_phrases JSONB NOT NULL DEFAULT '[]',
  preferred_ctas JSONB NOT NULL DEFAULT '[]',
  voice_notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT brand_profiles_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT brand_profiles_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT brand_profiles_tenant_unique UNIQUE (workspace_id)
);

CREATE TABLE app.brand_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  pillar TEXT NOT NULL DEFAULT 'general',
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT brand_examples_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT brand_examples_tenant_id_unique UNIQUE (workspace_id, id)
);

--------------------------------------------------------------------------------
-- 4. MODEL & BUDGET CONFIGURATION
--------------------------------------------------------------------------------

CREATE TABLE app.model_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  role_id TEXT NOT NULL CHECK (role_id IN ('strategy-primary', 'research-primary', 'writer-primary', 'review-primary')),
  model_alias TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'vertex_ai' CHECK (provider = 'vertex_ai'),
  provider_model_id TEXT,
  lifecycle_stage TEXT,
  capability_requirements JSONB NOT NULL DEFAULT '[]',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.70 CHECK (temperature >= 0.00 AND temperature <= 1.00),
  max_output_tokens INTEGER NOT NULL DEFAULT 2048 CHECK (max_output_tokens > 0),
  estimated_max_cost NUMERIC(10,4) NOT NULL DEFAULT 0.0500 CHECK (estimated_max_cost >= 0.0000),
  enabled BOOLEAN NOT NULL DEFAULT false,
  config_version INTEGER NOT NULL DEFAULT 1 CHECK (config_version >= 1),
  fallback_profile_id UUID CHECK (fallback_profile_id IS NULL),
  CONSTRAINT model_profiles_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT model_profiles_fallback_fk FOREIGN KEY (workspace_id, fallback_profile_id) REFERENCES app.model_profiles(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT model_profiles_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT model_profiles_tenant_id_version_unique UNIQUE (workspace_id, id, config_version),
  CONSTRAINT model_profiles_version_config_unique UNIQUE (workspace_id, role_id, config_version),
  CONSTRAINT model_profiles_selection_check CHECK ((provider_model_id IS NULL AND lifecycle_stage IS NULL) OR (provider_model_id IS NOT NULL AND lifecycle_stage IS NOT NULL)),
  CONSTRAINT model_profiles_activation_check CHECK (enabled = false OR (provider_model_id IS NOT NULL AND lifecycle_stage IS NOT NULL))
);
CREATE UNIQUE INDEX model_profiles_active_idx ON app.model_profiles (workspace_id, role_id) WHERE enabled = true;

CREATE TABLE app.budget_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE,
  max_cost_per_run NUMERIC(10,4) NOT NULL DEFAULT 0.5000 CHECK (max_cost_per_run >= 0.0000),
  max_daily_budget NUMERIC(10,4) NOT NULL DEFAULT 5.0000 CHECK (max_daily_budget >= 0.0000),
  max_monthly_budget NUMERIC(10,4) NOT NULL DEFAULT 50.0000 CHECK (max_monthly_budget >= 0.0000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budget_policies_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT budget_policies_tenant_id_unique UNIQUE (workspace_id, id)
);

--------------------------------------------------------------------------------
-- 5. WORKFLOW & CONTENT CORE
--------------------------------------------------------------------------------

CREATE TABLE app.content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  topic TEXT NOT NULL,
  business_goal TEXT NOT NULL,
  target_audience TEXT,
  format TEXT NOT NULL DEFAULT 'facebook_post',
  angle TEXT,
  cta TEXT,
  research_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_briefs_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT content_briefs_tenant_id_unique UNIQUE (workspace_id, id)
);

CREATE TABLE app.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  brief_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('BRIEF_SUBMITTED', 'VALIDATING', 'READY_FOR_STRATEGY', 'RESEARCHING', 'STRATEGIZING', 'DRAFTING', 'REVIEWING', 'REVISING', 'PENDING_HUMAN_APPROVAL', 'NEEDS_HUMAN_REVIEW', 'APPROVED', 'READY_FOR_EXPORT', 'EXPORTED', 'FAILED', 'NEEDS_ATTENTION', 'CANCELLED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  revision_count INTEGER NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  current_node TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workflow_runs_brief_fk FOREIGN KEY (workspace_id, brief_id) REFERENCES app.content_briefs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT workflow_runs_tenant_id_unique UNIQUE (workspace_id, id)
);
CREATE INDEX workflow_runs_status_idx ON app.workflow_runs (workspace_id, status);

CREATE TABLE app.workflow_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  command_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  expected_state_version INTEGER NOT NULL CHECK (expected_state_version >= 1),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('PENDING_ENQUEUE', 'ENQUEUED', 'CLAIMED', 'COMPLETED', 'FAILED', 'STALE', 'NEEDS_ATTENTION')),
  task_name TEXT,
  trace_correlation_id TEXT NOT NULL,
  worker_lease_owner TEXT,
  worker_lease_expires_at TIMESTAMPTZ,
  result_reference JSONB,
  failure_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT workflow_commands_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT workflow_commands_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT workflow_commands_idempotency_unique UNIQUE (workspace_id, command_type, idempotency_key),
  CONSTRAINT workflow_commands_lease_check CHECK (status != 'CLAIMED' OR (worker_lease_owner IS NOT NULL AND worker_lease_expires_at IS NOT NULL)),
  CONSTRAINT workflow_commands_active_check CHECK (status NOT IN ('PENDING_ENQUEUE', 'ENQUEUED', 'CLAIMED') OR completed_at IS NULL),
  CONSTRAINT workflow_commands_terminal_check CHECK (status NOT IN ('COMPLETED', 'FAILED', 'STALE', 'NEEDS_ATTENTION') OR completed_at IS NOT NULL),
  CONSTRAINT workflow_commands_result_check CHECK (status != 'COMPLETED' OR result_reference IS NOT NULL),
  CONSTRAINT workflow_commands_failure_check CHECK (failure_code IS NULL OR status IN ('FAILED', 'NEEDS_ATTENTION'))
);
CREATE UNIQUE INDEX workflow_commands_task_name_idx ON app.workflow_commands (task_name) WHERE task_name IS NOT NULL;
CREATE INDEX workflow_commands_queue_idx ON app.workflow_commands (status, created_at, worker_lease_expires_at);

CREATE TABLE app.content_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version >= 1),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_artifacts_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT content_artifacts_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT content_artifacts_draft_target_unique UNIQUE (workspace_id, workflow_run_id, id),
  CONSTRAINT content_artifacts_single_root_unique UNIQUE (workspace_id, workflow_run_id)
);

CREATE TABLE app.draft_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  artifact_id UUID NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK (length(content_hash) > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT draft_versions_artifact_fk FOREIGN KEY (workspace_id, workflow_run_id, artifact_id) REFERENCES app.content_artifacts(workspace_id, workflow_run_id, id) ON DELETE RESTRICT,
  CONSTRAINT draft_versions_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT draft_versions_identity_target_unique UNIQUE (workspace_id, workflow_run_id, id, version),
  CONSTRAINT draft_versions_content_target_unique UNIQUE (workspace_id, workflow_run_id, id, version, content_hash),
  CONSTRAINT draft_versions_artifact_version_unique UNIQUE (workspace_id, artifact_id, version),
  CONSTRAINT draft_versions_global_artifact_version_unique UNIQUE (artifact_id, version)
);
CREATE INDEX draft_versions_hash_idx ON app.draft_versions (workspace_id, content_hash);

--------------------------------------------------------------------------------
-- 6. RESEARCH & PROVENANCE
--------------------------------------------------------------------------------

CREATE TABLE app.research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  request_descriptor TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  title TEXT,
  content_hash TEXT NOT NULL,
  sanitized_content TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'untrusted', 'rejected')),
  retrieved_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_cache_tenant_fk FOREIGN KEY (workspace_id) REFERENCES app.workspaces(id) ON DELETE RESTRICT,
  CONSTRAINT research_cache_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT research_cache_identity_unique UNIQUE (workspace_id, provider, query_hash, source_url, content_hash)
);
CREATE INDEX research_cache_expires_idx ON app.research_cache (expires_at);

CREATE TABLE app.research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  research_cache_id UUID,
  source_url TEXT NOT NULL,
  title TEXT,
  content_hash TEXT NOT NULL,
  citation_metadata JSONB NOT NULL DEFAULT '{}',
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'untrusted', 'rejected')),
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_sources_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT research_sources_cache_fk FOREIGN KEY (workspace_id, research_cache_id) REFERENCES app.research_cache(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT research_sources_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT research_sources_provenance_unique UNIQUE (workspace_id, workflow_run_id, source_url, content_hash)
);

--------------------------------------------------------------------------------
-- 7. REVIEWS, APPROVALS & EXPORTS
--------------------------------------------------------------------------------

CREATE TABLE app.review_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  draft_version_id UUID NOT NULL,
  draft_version INTEGER NOT NULL CHECK (draft_version >= 1),
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('brand_voice', 'fact_check', 'risk_policy', 'format_platform')),
  result_schema_version INTEGER NOT NULL DEFAULT 1 CHECK (result_schema_version >= 1),
  result_hash TEXT NOT NULL CHECK (length(result_hash) > 0),
  passed BOOLEAN NOT NULL,
  issues JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_results_draft_fk FOREIGN KEY (workspace_id, workflow_run_id, draft_version_id, draft_version) REFERENCES app.draft_versions(workspace_id, workflow_run_id, id, version) ON DELETE RESTRICT,
  CONSTRAINT review_results_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT review_results_identity_unique UNIQUE (workspace_id, workflow_run_id, draft_version_id, reviewer_role, result_schema_version)
);

CREATE TABLE app.human_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  draft_version_id UUID NOT NULL,
  draft_version INTEGER NOT NULL CHECK (draft_version >= 1),
  actor_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'revise', 'cancel')),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT human_approvals_draft_fk FOREIGN KEY (workspace_id, workflow_run_id, draft_version_id, draft_version) REFERENCES app.draft_versions(workspace_id, workflow_run_id, id, version) ON DELETE RESTRICT,
  CONSTRAINT human_approvals_actor_fk FOREIGN KEY (actor_id) REFERENCES app.users(id) ON DELETE RESTRICT,
  CONSTRAINT human_approvals_tenant_id_unique UNIQUE (workspace_id, id)
);

CREATE TABLE app.export_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  draft_version_id UUID NOT NULL,
  draft_version INTEGER NOT NULL CHECK (draft_version >= 1),
  exporter_id UUID NOT NULL,
  content_hash TEXT NOT NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT export_records_draft_fk FOREIGN KEY (workspace_id, workflow_run_id, draft_version_id, draft_version, content_hash) REFERENCES app.draft_versions(workspace_id, workflow_run_id, id, version, content_hash) ON DELETE RESTRICT,
  CONSTRAINT export_records_exporter_fk FOREIGN KEY (exporter_id) REFERENCES app.users(id) ON DELETE RESTRICT,
  CONSTRAINT export_records_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT export_records_identity_unique UNIQUE (workspace_id, workflow_run_id, draft_version_id, content_hash)
);

--------------------------------------------------------------------------------
-- 8. COST & TELEMETRY
--------------------------------------------------------------------------------

CREATE TABLE app.model_call_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  model_profile_id UUID NOT NULL,
  model_profile_config_version INTEGER NOT NULL,
  agent_role TEXT NOT NULL,
  call_key TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  request_hash TEXT NOT NULL,
  trace_correlation_id TEXT NOT NULL,
  provider_request_id TEXT,
  requested_alias TEXT NOT NULL,
  actual_provider TEXT NOT NULL DEFAULT 'vertex_ai',
  actual_model_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('RESERVED', 'IN_FLIGHT', 'SUCCEEDED', 'FAILED_CONFIRMED', 'OUTCOME_UNKNOWN', 'RECONCILED')),
  transmitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT model_call_attempts_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT model_call_attempts_profile_fk FOREIGN KEY (workspace_id, model_profile_id, model_profile_config_version) REFERENCES app.model_profiles(workspace_id, id, config_version) ON DELETE RESTRICT,
  CONSTRAINT model_call_attempts_tenant_id_unique UNIQUE (workspace_id, id),
  CONSTRAINT model_call_attempts_identity_unique UNIQUE (workspace_id, workflow_run_id, call_key, attempt_number)
);
CREATE INDEX model_call_attempts_reconciliation_idx ON app.model_call_attempts (status, provider_request_id, trace_correlation_id);

CREATE TABLE app.budget_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  model_call_attempt_id UUID NOT NULL UNIQUE,
  agent_role TEXT NOT NULL,
  reserved_amount NUMERIC(10,4) NOT NULL CHECK (reserved_amount >= 0.0000),
  committed_amount NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (committed_amount >= 0.0000),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('RESERVED', 'COMMITTED', 'RELEASED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budget_reservations_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT budget_reservations_attempt_fk FOREIGN KEY (workspace_id, model_call_attempt_id) REFERENCES app.model_call_attempts(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT budget_reservations_tenant_id_unique UNIQUE (workspace_id, id)
);

CREATE TABLE app.usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  workflow_run_id UUID NOT NULL,
  model_call_attempt_id UUID NOT NULL UNIQUE,
  budget_reservation_id UUID,
  agent_role TEXT NOT NULL,
  requested_alias TEXT NOT NULL,
  actual_provider TEXT NOT NULL,
  actual_model_id TEXT NOT NULL,
  provider_request_id TEXT,
  trace_correlation_id TEXT NOT NULL,
  input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0),
  estimated_cost NUMERIC(10,4) NOT NULL CHECK (estimated_cost >= 0.0000),
  currency TEXT NOT NULL DEFAULT 'USD',
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usage_ledger_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT usage_ledger_attempt_fk FOREIGN KEY (workspace_id, model_call_attempt_id) REFERENCES app.model_call_attempts(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT usage_ledger_reservation_fk FOREIGN KEY (workspace_id, budget_reservation_id) REFERENCES app.budget_reservations(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT usage_ledger_tenant_id_unique UNIQUE (workspace_id, id)
);
CREATE INDEX usage_ledger_created_idx ON app.usage_ledger (workspace_id, created_at);

CREATE TABLE app.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'worker')),
  actor_id UUID,
  workflow_run_id UUID,
  command_id UUID,
  trace_correlation_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_actor_fk FOREIGN KEY (actor_id) REFERENCES app.users(id) ON DELETE RESTRICT,
  CONSTRAINT audit_events_run_fk FOREIGN KEY (workspace_id, workflow_run_id) REFERENCES app.workflow_runs(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT audit_events_command_fk FOREIGN KEY (workspace_id, command_id) REFERENCES app.workflow_commands(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT audit_events_tenant_id_unique UNIQUE (workspace_id, id)
);
CREATE INDEX audit_events_timeline_idx ON app.audit_events (workspace_id, workflow_run_id, event_type, created_at);
