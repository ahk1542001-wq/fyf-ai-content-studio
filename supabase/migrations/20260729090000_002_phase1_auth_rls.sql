-- Phase 1: Supabase Auth mapping and tenant RLS policies.
-- This migration is local-only until the owner explicitly approves a DB push.

CREATE OR REPLACE FUNCTION app.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app, public
AS $$
  SELECT id
  FROM app.users
  WHERE auth_provider = 'supabase'
    AND auth_subject = auth.uid()::TEXT
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app.is_workspace_member(
  target_workspace_id UUID,
  allowed_roles TEXT[] DEFAULT ARRAY['owner', 'editor', 'viewer']
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app.memberships
    WHERE workspace_id = target_workspace_id
      AND user_id = app.current_app_user_id()
      AND role = ANY(allowed_roles)
  )
$$;

ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.brand_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.model_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workflow_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.content_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.research_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.review_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.human_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.export_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.model_call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.budget_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA app FROM anon, public;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM anon, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM anon, public;

GRANT USAGE ON SCHEMA app TO authenticated;
GRANT EXECUTE ON FUNCTION app.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_workspace_member(UUID, TEXT[]) TO authenticated;
GRANT SELECT ON app.users TO authenticated;
GRANT SELECT ON app.workspaces TO authenticated;
GRANT SELECT ON app.memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.brand_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app.brand_examples TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.model_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.budget_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.content_briefs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.workflow_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.workflow_commands TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.content_artifacts TO authenticated;
GRANT SELECT, INSERT ON app.draft_versions TO authenticated;
GRANT SELECT, INSERT ON app.research_cache TO authenticated;
GRANT SELECT, INSERT ON app.research_sources TO authenticated;
GRANT SELECT, INSERT ON app.review_results TO authenticated;
GRANT SELECT, INSERT ON app.human_approvals TO authenticated;
GRANT SELECT, INSERT ON app.export_records TO authenticated;
GRANT SELECT ON app.model_call_attempts TO authenticated;
GRANT SELECT ON app.budget_reservations TO authenticated;
GRANT SELECT ON app.usage_ledger TO authenticated;
GRANT SELECT, INSERT ON app.audit_events TO authenticated;

CREATE POLICY users_select_self ON app.users
  FOR SELECT TO authenticated
  USING (id = app.current_app_user_id());

CREATE POLICY workspaces_select_members ON app.workspaces
  FOR SELECT TO authenticated
  USING (app.is_workspace_member(id));

CREATE POLICY memberships_select_self ON app.memberships
  FOR SELECT TO authenticated
  USING (user_id = app.current_app_user_id());

CREATE POLICY memberships_owner_manage ON app.memberships
  FOR ALL TO authenticated
  USING (app.is_workspace_member(workspace_id, ARRAY['owner']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner']));

CREATE POLICY brand_profiles_member_select ON app.brand_profiles
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY brand_profiles_editor_write ON app.brand_profiles
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY brand_examples_member_select ON app.brand_examples
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY brand_examples_editor_write ON app.brand_examples
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY model_profiles_member_select ON app.model_profiles
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY model_profiles_editor_write ON app.model_profiles
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY budget_policies_member_select ON app.budget_policies
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY budget_policies_owner_write ON app.budget_policies
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner']));

CREATE POLICY content_briefs_member_select ON app.content_briefs
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY content_briefs_editor_write ON app.content_briefs
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY workflow_runs_member_select ON app.workflow_runs
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY workflow_runs_editor_write ON app.workflow_runs
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY workflow_commands_member_select ON app.workflow_commands
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY workflow_commands_editor_write ON app.workflow_commands
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY content_artifacts_member_select ON app.content_artifacts
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY content_artifacts_editor_write ON app.content_artifacts
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY draft_versions_member_select ON app.draft_versions
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY draft_versions_editor_write ON app.draft_versions
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY research_cache_member_select ON app.research_cache
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY research_cache_editor_write ON app.research_cache
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY research_sources_member_select ON app.research_sources
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY research_sources_editor_write ON app.research_sources
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY review_results_member_select ON app.review_results
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY review_results_editor_write ON app.review_results
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY human_approvals_member_select ON app.human_approvals
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY human_approvals_editor_write ON app.human_approvals
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY export_records_member_select ON app.export_records
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY export_records_editor_write ON app.export_records
  FOR ALL TO authenticated USING (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY model_call_attempts_member_select ON app.model_call_attempts
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY budget_reservations_member_select ON app.budget_reservations
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY usage_ledger_member_select ON app.usage_ledger
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY audit_events_member_select ON app.audit_events
  FOR SELECT TO authenticated USING (app.is_workspace_member(workspace_id));
CREATE POLICY audit_events_editor_insert ON app.audit_events
  FOR INSERT TO authenticated WITH CHECK (app.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));
