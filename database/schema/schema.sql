CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pageName TEXT NOT NULL,
  demoMode INTEGER NOT NULL DEFAULT 1,
  riskSensitivity TEXT NOT NULL DEFAULT 'standard'
);

CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  userId TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL
);

CREATE TABLE brand_profiles (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  description TEXT NOT NULL,
  audience TEXT NOT NULL,
  toneRules TEXT NOT NULL,
  forbiddenPhrases TEXT NOT NULL,
  preferredCtas TEXT NOT NULL,
  voiceNotes TEXT NOT NULL
);

CREATE TABLE style_examples (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  topic TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  riskLevel TEXT NOT NULL,
  score INTEGER NOT NULL,
  scheduledFor TEXT,
  version INTEGER NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE draft_versions (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  draftId TEXT NOT NULL REFERENCES drafts(id),
  content TEXT NOT NULL,
  reason TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  draftId TEXT REFERENCES drafts(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size TEXT NOT NULL
);

CREATE TABLE prompt_versions (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE publish_jobs (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  draftId TEXT NOT NULL REFERENCES drafts(id),
  status TEXT NOT NULL,
  fakePostId TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE schedule_jobs (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  draftId TEXT NOT NULL REFERENCES drafts(id),
  scheduledFor TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE analytics_snapshots (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  draftId TEXT REFERENCES drafts(id),
  views INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  reactions INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  pillar TEXT,
  capturedAt TEXT NOT NULL
);

CREATE TABLE integration_settings (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  maskedSecret TEXT,
  lastChecked TEXT NOT NULL
);

CREATE TABLE integration_logs (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE content_ideas (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE onboarding_checklist_items (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL REFERENCES workspaces(id),
  label TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);
