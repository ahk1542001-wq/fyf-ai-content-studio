export type DraftStatus =
  | "draft"
  | "needs_review"
  | "risk_blocked"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "failed"
  | "archived";

export type Workspace = {
  id: string;
  name: string;
  pageName: string;
  demoMode: boolean;
  riskSensitivity: "standard" | "strict" | "relaxed";
  industry?: string;
  targetAudience?: string;
  brandSummary?: string;
  createdAt?: string;
};

export type DemoUser = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
};

export type DemoSession = {
  user: DemoUser;
  member: WorkspaceMember;
  workspaceId: string;
  mode: "demo";
};

export type StyleExample = {
  id: string;
  workspaceId: string;
  topic: string;
  content: string;
};

export type MediaAsset = {
  id: string;
  workspaceId: string;
  draftId?: string;
  name: string;
  type: "image" | "video";
  size: string;
};

export type DraftRevision = {
  version: number;
  instruction: string;
  previousContent: string;
  newContent: string;
  timestamp: string;
};

export type Draft = {
  id: string;
  workspaceId: string;
  topic: string;
  content: string;
  status: DraftStatus;
  riskLevel: "safe" | "review" | "blocked";
  score: number;
  scheduledFor?: string;
  media?: MediaAsset[];
  version: number;
  updatedAt: string;
  revisions?: DraftRevision[];
};

export type AuditEvent = {
  id: string;
  workspaceId: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type IntegrationSetting = {
  workspaceId: string;
  provider: IntegrationProvider;
  status: "healthy" | "demo" | "needs_setup" | "failed";
  maskedSecret?: string;
  lastChecked: string;
  config?: IntegrationConfig;
};

export type IntegrationProvider = "gemini" | "sheets" | "facebook";

export type IntegrationLog = {
  id: string;
  workspaceId: string;
  provider: IntegrationProvider;
  action: string;
  status: "success" | "failed" | "demo";
  createdAt: string;
};

export type IntegrationConfig = {
  model?: string;
  demoMode?: boolean;
  sheetUrl?: string;
  sheetId?: string;
  range?: string;
  pageId?: string;
  permissions?: string[];
  mockPublishReady?: boolean;
};

export type DraftVersion = {
  id: string;
  workspaceId: string;
  draftId: string;
  version: number;
  content: string;
  reason: string;
  createdAt: string;
};

export type PromptVersion = {
  id: string;
  workspaceId: string;
  name: string;
  prompt: string;
  createdAt: string;
};

export type PublishJob = {
  id: string;
  workspaceId: string;
  draftId: string;
  status: "blocked" | "queued" | "published" | "failed";
  idempotencyKey: string;
  fakePostId?: string;
  externalPostId?: string;
  reason?: string;
  createdAt: string;
};

export type ScheduleJob = {
  id: string;
  workspaceId: string;
  draftId: string;
  scheduledFor: string;
  status: "scheduled" | "cancelled" | "published";
};

export type AnalyticsSnapshot = {
  id: string;
  workspaceId: string;
  draftId?: string;
  views?: number;
  reach: number;
  reactions: number;
  comments?: number;
  shares: number;
  clicks?: number;
  pillar?: string;
  engagementRate?: number;
  capturedAt: string;
};

export type PillarPerformance = {
  pillar: string;
  pillarName?: string;
  views: number;
  reach: number;
  reactions: number;
  comments?: number;
  shares: number;
  clicks: number;
  compositeScore: number;
  postCount: number;
  avgEngagementRate: number;
  topPillar?: boolean;
};

export type TopicRecommendation = {
  id: string;
  pillar: string;
  pillarKey: string;
  topic: string;
  topicBurmese: string;
  angle: string;
  tone: string;
  targetAudience: string;
  performanceRationale: string;
  suggestedVisualFamily?: "system_story" | "framework_mascot" | "editorial_split" | "fact_analysis";
  targetWordCount?: string;
  leadCta?: string;
  metrics: {
    compositeScore: number;
    historicalReach?: number;
    historicalShares?: number;
    engagementBoost?: string;
  };
  suggestedCta?: string;
};


export type ContentIdea = {
  id: string;
  workspaceId: string;
  title: string;
  source: "manual" | "mock_ai" | "calendar";
  status: "new" | "used" | "archived";
};

export type OnboardingChecklistItem = {
  id: string;
  workspaceId: string;
  label: string;
  completed: boolean;
  detail: string;
};

export type ContentPillarKey =
  | "risk_story"
  | "workflow_breakdown"
  | "reality_vs_hype"
  | "framework_education";

export type WeeklyBufferDay = "monday" | "wednesday" | "friday" | "sunday";

export type WeeklyBufferSlot = {
  id: string;
  day: WeeklyBufferDay;
  dayLabel: string;
  targetTime: string;
  pillar: ContentPillarKey;
  pillarLabel: string;
  pillarBurmese: string;
  recommendedFormat: "single" | "album";
  targetWordCount: string;
  draftId?: string;
  draftTopic?: string;
  draftStatus?: DraftStatus;
  draftWordCount?: number;
  scheduledFor?: string;
  status: "empty" | "drafting" | "ready" | "scheduled" | "published";
};

export type WeeklyBufferState = {
  weekLabel: string;
  startDate: string;
  endDate: string;
  slots: WeeklyBufferSlot[];
  healthScore: number;
  readyCount: number;
  totalSlots: number;
  statusMessage: string;
};

export type BrandTonePersona =
  | "friendly_disciplined"
  | "energetic_bold"
  | "luxury_prestigious"
  | "formal_technical";

export type BrandProfile = {
  id: string;
  workspaceId: string;
  description: string;
  targetAudience: string;
  toneRules: string[];
  forbiddenPhrases: string[];
  preferredCtas: string[];
  voiceNotes: string;
  tonePersona?: BrandTonePersona;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  customCta?: string;
};

export type DemoAppState = {
  users: DemoUser[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  styleExamples: StyleExample[];
  drafts: Draft[];
  draftVersions: DraftVersion[];
  mediaAssets: MediaAsset[];
  promptVersions: PromptVersion[];
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  auditEvents: AuditEvent[];
  integrationSettings: IntegrationSetting[];
  integrationLogs: IntegrationLog[];
  analyticsSnapshots: AnalyticsSnapshot[];
  contentIdeas: ContentIdea[];
  onboardingChecklistItems: OnboardingChecklistItem[];
  brandProfiles: BrandProfile[];
};
