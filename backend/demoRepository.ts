import type {
  AnalyticsSnapshot,
  AuditEvent,
  BrandProfile,
  ContentIdea,
  DemoAppState,
  DemoSession,
  DemoUser,
  Draft,
  DraftVersion,
  IntegrationLog,
  IntegrationSetting,
  MediaAsset,
  OnboardingChecklistItem,
  PillarPerformance,
  PromptVersion,
  PublishJob,
  ScheduleJob,
  StyleExample,
  WorkspaceMember,
  Workspace
} from "@/backend/types";
import { aggregatePillarPerformance } from "@/backend/topicEngine";

import { createSqliteDemoStateStore, defaultDemoDatabasePath, type DemoStateStore } from "@/database/sqliteDemo";
import {
  analyticsSnapshots,
  auditEvents,
  brandProfiles,
  contentIdeas,
  demoUsers,
  demoWorkspaces,
  draftVersions,
  integrationLogs,
  integrationSettings,
  mediaAssets,
  onboardingChecklistItems,
  promptVersions,
  publishJobs,
  scheduleJobs,
  seedDrafts,
  styleExamples,
  workspaceMembers
} from "@/database/demo-data/demoData";

export function createDemoState(): DemoAppState {
  return {
    users: structuredClone(demoUsers),
    workspaces: structuredClone(demoWorkspaces),
    workspaceMembers: structuredClone(workspaceMembers),
    styleExamples: structuredClone(styleExamples),
    drafts: structuredClone(seedDrafts),
    draftVersions: structuredClone(draftVersions),
    mediaAssets: structuredClone(mediaAssets),
    promptVersions: structuredClone(promptVersions),
    publishJobs: structuredClone(publishJobs),
    scheduleJobs: structuredClone(scheduleJobs),
    auditEvents: structuredClone(auditEvents),
    integrationSettings: structuredClone(integrationSettings),
    integrationLogs: structuredClone(integrationLogs),
    analyticsSnapshots: structuredClone(analyticsSnapshots),
    contentIdeas: structuredClone(contentIdeas),
    onboardingChecklistItems: structuredClone(onboardingChecklistItems),
    brandProfiles: structuredClone(brandProfiles)
  };
}

type WorkspaceScopedRecord = { workspaceId: string };

function migrateConfiguredLegacyWorkspace(state: DemoAppState): DemoAppState {
  const legacyWorkspaceId = process.env.FYF_LEGACY_WORKSPACE_ID?.trim();
  if (
    !legacyWorkspaceId ||
    legacyWorkspaceId === "ws-fyf" ||
    state.workspaces.some((workspace) => workspace.id === "ws-fyf") ||
    !state.workspaces.some((workspace) => workspace.id === legacyWorkspaceId)
  ) {
    return state;
  }

  const remapWorkspaceRecords = <T extends WorkspaceScopedRecord>(records: T[]) =>
    records.map((record) =>
      record.workspaceId === legacyWorkspaceId ? { ...record, workspaceId: "ws-fyf" } : record
    );

  return {
    ...state,
    workspaces: state.workspaces.map((workspace) =>
      workspace.id === legacyWorkspaceId ? { ...workspace, id: "ws-fyf" } : workspace
    ),
    workspaceMembers: remapWorkspaceRecords(state.workspaceMembers),
    styleExamples: remapWorkspaceRecords(state.styleExamples),
    drafts: remapWorkspaceRecords(state.drafts),
    draftVersions: remapWorkspaceRecords(state.draftVersions),
    mediaAssets: remapWorkspaceRecords(state.mediaAssets),
    promptVersions: remapWorkspaceRecords(state.promptVersions),
    publishJobs: remapWorkspaceRecords(state.publishJobs),
    scheduleJobs: remapWorkspaceRecords(state.scheduleJobs),
    auditEvents: remapWorkspaceRecords(state.auditEvents),
    integrationSettings: remapWorkspaceRecords(state.integrationSettings),
    integrationLogs: remapWorkspaceRecords(state.integrationLogs),
    analyticsSnapshots: remapWorkspaceRecords(state.analyticsSnapshots),
    contentIdeas: remapWorkspaceRecords(state.contentIdeas),
    onboardingChecklistItems: remapWorkspaceRecords(state.onboardingChecklistItems),
    brandProfiles: remapWorkspaceRecords(state.brandProfiles)
  };
}

export function normalizeDemoState(state: DemoAppState): DemoAppState {
  const seed = createDemoState();
  return migrateConfiguredLegacyWorkspace({
    ...seed,
    ...state,
    users: Array.isArray(state.users) ? state.users : seed.users,
    workspaces: Array.isArray(state.workspaces) ? state.workspaces : seed.workspaces,
    workspaceMembers: Array.isArray(state.workspaceMembers) ? state.workspaceMembers : seed.workspaceMembers,
    styleExamples: Array.isArray(state.styleExamples) ? state.styleExamples : seed.styleExamples,
    drafts: Array.isArray(state.drafts) ? state.drafts : seed.drafts,
    draftVersions: Array.isArray(state.draftVersions) ? state.draftVersions : seed.draftVersions,
    mediaAssets: Array.isArray(state.mediaAssets) ? state.mediaAssets : seed.mediaAssets,
    promptVersions: Array.isArray(state.promptVersions) ? state.promptVersions : seed.promptVersions,
    publishJobs: Array.isArray(state.publishJobs) ? state.publishJobs : seed.publishJobs,
    scheduleJobs: Array.isArray(state.scheduleJobs) ? state.scheduleJobs : seed.scheduleJobs,
    auditEvents: Array.isArray(state.auditEvents) ? state.auditEvents : seed.auditEvents,
    integrationSettings: Array.isArray(state.integrationSettings) ? state.integrationSettings : seed.integrationSettings,
    integrationLogs: Array.isArray(state.integrationLogs) ? state.integrationLogs : seed.integrationLogs,
    analyticsSnapshots: Array.isArray(state.analyticsSnapshots) ? state.analyticsSnapshots : seed.analyticsSnapshots,
    contentIdeas: Array.isArray(state.contentIdeas) ? state.contentIdeas : seed.contentIdeas,
    onboardingChecklistItems: Array.isArray(state.onboardingChecklistItems)
      ? state.onboardingChecklistItems
      : seed.onboardingChecklistItems,
    brandProfiles: Array.isArray(state.brandProfiles) ? state.brandProfiles : seed.brandProfiles
  });
}

export class DemoRepository {
  private state: DemoAppState;
  private store?: DemoStateStore;

  constructor(seedState: DemoAppState = createDemoState(), store?: DemoStateStore) {
    this.state = seedState;
    this.store = store;
  }

  snapshot(): DemoAppState {
    return structuredClone(this.state);
  }

  persist() {
    this.store?.save(this.snapshot());
  }

  listWorkspaces(): Workspace[] {
    return this.state.workspaces;
  }

  getWorkspace(workspaceId: string): Workspace {
    const workspace = this.state.workspaces.find((item) => item.id === workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    return workspace;
  }

  createWorkspace(input: {
    name: string;
    pageName: string;
    industry?: string;
    targetAudience?: string;
    brandDescription?: string;
    riskSensitivity?: "standard" | "strict" | "relaxed";
  }): { workspace: Workspace; brandProfile: BrandProfile } {
    const trimmedName = input.name.trim();
    const trimmedPageName = input.pageName.trim();
    if (!trimmedName) throw new Error("Workspace name is required");
    if (!trimmedPageName) throw new Error("Page name is required");

    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
    let id = `ws-${slug}`;
    let counter = 1;
    while (this.state.workspaces.some((w) => w.id === id)) {
      id = `ws-${slug}-${counter++}`;
    }

    const newWorkspace: Workspace = {
      id,
      name: trimmedName,
      pageName: trimmedPageName,
      demoMode: true,
      riskSensitivity: input.riskSensitivity || "standard",
      industry: input.industry?.trim() || "General SME",
      targetAudience: input.targetAudience?.trim() || "Target Audience & Customers",
      brandSummary: input.brandDescription?.trim() || `Official content studio for ${trimmedName}`,
      createdAt: new Date().toISOString()
    };

    const newBrandProfile: BrandProfile = {
      id: `brand-${id}`,
      workspaceId: id,
      description: input.brandDescription?.trim() || `Official brand voice and content operations for ${trimmedName}.`,
      targetAudience: input.targetAudience?.trim() || "Local business buyers and audience.",
      toneRules: [
        "Calm, practitioner-grounded tone",
        "Zero-jargon: avoid developer jargon and use plain business terms",
        "Clear value proposition and operational clarity"
      ],
      forbiddenPhrases: ["အမြတ် အာမခံ", "100% automated", "easy money"],
      preferredCtas: [
        `အသေးစိတ် စုံစမ်းမေးမြန်းလိုပါက ${trimmedPageName} Messenger သို့ ဆက်သွယ်နိုင်ပါသည်`
      ],
      voiceNotes: `Tailored voice for ${trimmedName} (${newWorkspace.industry}). Focus on clear customer trust and safe operations.`
    };

    const newMember: WorkspaceMember = {
      id: `member-${id}-owner`,
      workspaceId: id,
      userId: this.state.users[0]?.id || "user-demo-owner",
      role: "owner"
    };

    this.state.workspaces.push(newWorkspace);
    this.state.brandProfiles.push(newBrandProfile);
    this.state.workspaceMembers.push(newMember);
    this.persist();

    return { workspace: newWorkspace, brandProfile: newBrandProfile };
  }

  updateWorkspace(workspaceId: string, patch: Pick<Workspace, "pageName">): Workspace {
    const workspace = this.getWorkspace(workspaceId);
    const trimmedPageName = patch.pageName.trim();
    if (!trimmedPageName) throw new Error("Page name is required");
    const existingIndex = this.state.workspaces.findIndex((item) => item.id === workspaceId);
    const updated = { ...workspace, pageName: trimmedPageName };
    this.state.workspaces[existingIndex] = updated;
    this.persist();
    return updated;
  }

  listUsers(): DemoUser[] {
    return this.state.users;
  }

  listWorkspaceMembers(workspaceId: string): WorkspaceMember[] {
    this.getWorkspace(workspaceId);
    return this.state.workspaceMembers.filter((member) => member.workspaceId === workspaceId);
  }

  getDemoSession(workspaceId: string): DemoSession {
    this.getWorkspace(workspaceId);
    const member = this.state.workspaceMembers.find((item) => item.workspaceId === workspaceId);
    if (!member) throw new Error("Workspace member not found");
    const user = this.state.users.find((item) => item.id === member.userId);
    if (!user) throw new Error("Demo user not found");
    return { user, member, workspaceId, mode: "demo" };
  }

  listStyleExamples(workspaceId: string): StyleExample[] {
    this.getWorkspace(workspaceId);
    return this.state.styleExamples.filter((example) => example.workspaceId === workspaceId);
  }

  addStyleExample(example: StyleExample): StyleExample {
    this.getWorkspace(example.workspaceId);
    if (this.state.styleExamples.some((e) => e.id === example.id)) {
      throw new Error("Style example already exists");
    }
    this.state.styleExamples.unshift(example);
    this.persist();
    return example;
  }

  deleteStyleExample(workspaceId: string, exampleId: string): StyleExample {
    this.getWorkspace(workspaceId);
    const exampleIndex = this.state.styleExamples.findIndex(
      (example) => example.id === exampleId && example.workspaceId === workspaceId
    );
    if (exampleIndex === -1) {
      throw new Error("Style example not found");
    }
    const [deleted] = this.state.styleExamples.splice(exampleIndex, 1);
    this.persist();
    return deleted;
  }

  listDrafts(workspaceId: string): Draft[] {
    this.getWorkspace(workspaceId);
    return this.state.drafts.filter((draft) => draft.workspaceId === workspaceId);
  }

  getDraft(workspaceId: string, draftId: string): Draft {
    const draft = this.state.drafts.find((item) => item.id === draftId);
    if (!draft || draft.workspaceId !== workspaceId) throw new Error("Draft not found in workspace");
    return draft;
  }

  upsertDraft(draft: Draft): Draft {
    this.getWorkspace(draft.workspaceId);
    const conflictingWorkspace = this.state.drafts.find(
      (item) => item.id === draft.id && item.workspaceId !== draft.workspaceId
    );
    if (conflictingWorkspace) {
      throw new Error("Draft ID already belongs to another workspace");
    }

    const existingIndex = this.state.drafts.findIndex(
      (item) => item.id === draft.id && item.workspaceId === draft.workspaceId
    );
    if (existingIndex === -1) {
      this.state.drafts.unshift(draft);
    } else {
      this.state.drafts[existingIndex] = draft;
    }
    this.persist();
    return draft;
  }

  addDraftVersion(version: DraftVersion): DraftVersion {
    this.getWorkspace(version.workspaceId);
    this.state.draftVersions.unshift(version);
    this.persist();
    return version;
  }

  addMediaAsset(asset: MediaAsset): MediaAsset {
    this.getWorkspace(asset.workspaceId);
    this.state.mediaAssets.unshift(asset);
    this.persist();
    return asset;
  }

  listMediaAssets(workspaceId: string): MediaAsset[] {
    this.getWorkspace(workspaceId);
    return this.state.mediaAssets.filter((asset) => asset.workspaceId === workspaceId);
  }

  removeMediaAsset(workspaceId: string, mediaId: string): MediaAsset | undefined {
    this.getWorkspace(workspaceId);
    const media = this.state.mediaAssets.find((asset) => asset.workspaceId === workspaceId && asset.id === mediaId);
    if (!media) return undefined;
    this.state.mediaAssets = this.state.mediaAssets.filter((asset) => !(asset.workspaceId === workspaceId && asset.id === mediaId));
    this.persist();
    return media;
  }

  addPromptVersion(version: PromptVersion): PromptVersion {
    this.getWorkspace(version.workspaceId);
    this.state.promptVersions.unshift(version);
    this.persist();
    return version;
  }

  listPromptVersions(workspaceId: string): PromptVersion[] {
    this.getWorkspace(workspaceId);
    return this.state.promptVersions.filter((version) => version.workspaceId === workspaceId);
  }

  addOrReusePublishJob(job: PublishJob): PublishJob {
    this.getWorkspace(job.workspaceId);
    const existingIndex = this.state.publishJobs.findIndex((item) => item.workspaceId === job.workspaceId && item.idempotencyKey === job.idempotencyKey);
    if (existingIndex !== -1) {
      const existing = this.state.publishJobs[existingIndex];
      if (existing.status !== job.status || existing.reason !== job.reason || existing.fakePostId !== job.fakePostId) {
        this.state.publishJobs[existingIndex] = { ...existing, ...job };
        this.persist();
        return this.state.publishJobs[existingIndex];
      }
      return existing;
    }
    this.state.publishJobs.unshift(job);
    this.persist();
    return job;
  }

  findPublishJobByIdempotencyKey(workspaceId: string, idempotencyKey: string): PublishJob | undefined {
    this.getWorkspace(workspaceId);
    return this.state.publishJobs.find((job) => job.workspaceId === workspaceId && job.idempotencyKey === idempotencyKey);
  }

  listPublishJobs(workspaceId: string) {
    this.getWorkspace(workspaceId);
    return this.state.publishJobs.filter((job) => job.workspaceId === workspaceId);
  }

  updatePublishJob(job: PublishJob): PublishJob {
    this.getWorkspace(job.workspaceId);
    const existingIndex = this.state.publishJobs.findIndex((item) => item.workspaceId === job.workspaceId && item.id === job.id);
    if (existingIndex === -1) throw new Error("Publish job not found");
    this.state.publishJobs[existingIndex] = job;
    this.persist();
    return job;
  }

  listPublishJobsForDraft(workspaceId: string, draftId: string) {
    this.getDraft(workspaceId, draftId);
    return this.state.publishJobs.filter((job) => job.workspaceId === workspaceId && job.draftId === draftId);
  }

  addOrReuseScheduleJob(job: ScheduleJob): ScheduleJob {
    this.getWorkspace(job.workspaceId);
    const existingIndex = this.state.scheduleJobs.findIndex((item) => item.workspaceId === job.workspaceId && item.draftId === job.draftId && item.status === "scheduled");
    if (existingIndex !== -1) {
      const existing = this.state.scheduleJobs[existingIndex];
      if (existing.scheduledFor !== job.scheduledFor || existing.status !== job.status) {
        this.state.scheduleJobs[existingIndex] = { ...existing, ...job, id: existing.id };
        this.persist();
        return this.state.scheduleJobs[existingIndex];
      }
      return existing;
    }
    this.state.scheduleJobs.unshift(job);
    this.persist();
    return job;
  }

  listScheduleJobs(workspaceId: string) {
    this.getWorkspace(workspaceId);
    return this.state.scheduleJobs.filter((job) => job.workspaceId === workspaceId);
  }

  cancelScheduleJobsForDraft(workspaceId: string, draftId: string): ScheduleJob[] {
    this.getDraft(workspaceId, draftId);
    const cancelled: ScheduleJob[] = [];
    this.state.scheduleJobs = this.state.scheduleJobs.map((job) => {
      if (job.workspaceId !== workspaceId || job.draftId !== draftId || job.status !== "scheduled") return job;
      const next = { ...job, status: "cancelled" as const };
      cancelled.push(next);
      return next;
    });
    if (cancelled.length) this.persist();
    return cancelled;
  }

  listDraftVersions(workspaceId: string, draftId: string): DraftVersion[] {
    this.getDraft(workspaceId, draftId);
    return this.state.draftVersions.filter((version) => version.workspaceId === workspaceId && version.draftId === draftId);
  }

  addAuditEvent(event: AuditEvent): AuditEvent {
    this.getWorkspace(event.workspaceId);
    this.state.auditEvents.unshift(event);
    this.persist();
    return event;
  }

  listAuditEvents(workspaceId: string): AuditEvent[] {
    this.getWorkspace(workspaceId);
    return this.state.auditEvents.filter((event) => event.workspaceId === workspaceId);
  }

  listIntegrationSettings(workspaceId: string): IntegrationSetting[] {
    this.getWorkspace(workspaceId);
    return this.state.integrationSettings.filter((setting) => setting.workspaceId === workspaceId);
  }

  getIntegrationSetting(workspaceId: string, provider: IntegrationSetting["provider"]): IntegrationSetting {
    this.getWorkspace(workspaceId);
    const setting = this.state.integrationSettings.find((item) => item.workspaceId === workspaceId && item.provider === provider);
    if (!setting) throw new Error("Integration setting not found");
    return setting;
  }

  upsertIntegrationSetting(setting: IntegrationSetting): IntegrationSetting {
    this.getWorkspace(setting.workspaceId);
    const existingIndex = this.state.integrationSettings.findIndex(
      (item) => item.workspaceId === setting.workspaceId && item.provider === setting.provider
    );
    if (existingIndex === -1) {
      this.state.integrationSettings.push(setting);
    } else {
      this.state.integrationSettings[existingIndex] = setting;
    }
    this.persist();
    return setting;
  }

  addIntegrationLog(log: IntegrationLog): IntegrationLog {
    this.getWorkspace(log.workspaceId);
    this.state.integrationLogs.unshift(log);
    this.persist();
    return log;
  }

  listIntegrationLogs(workspaceId: string): IntegrationLog[] {
    this.getWorkspace(workspaceId);
    return this.state.integrationLogs.filter((log) => log.workspaceId === workspaceId);
  }

  listAnalytics(workspaceId: string): AnalyticsSnapshot[] {
    this.getWorkspace(workspaceId);
    return this.state.analyticsSnapshots.filter((snapshot) => snapshot.workspaceId === workspaceId);
  }

  ingestAnalyticsSnapshot(snapshot: AnalyticsSnapshot): AnalyticsSnapshot {
    this.getWorkspace(snapshot.workspaceId);
    const existingIndex = this.state.analyticsSnapshots.findIndex(
      (item) => item.workspaceId === snapshot.workspaceId && item.id === snapshot.id
    );
    if (existingIndex === -1) {
      this.state.analyticsSnapshots.push(snapshot);
    } else {
      this.state.analyticsSnapshots[existingIndex] = snapshot;
    }
    this.persist();
    return snapshot;
  }

  listAnalyticsByPillar(workspaceId: string, pillar: string): AnalyticsSnapshot[] {
    this.getWorkspace(workspaceId);
    const targetPillar = pillar.toLowerCase().trim();
    return this.state.analyticsSnapshots.filter(
      (snapshot) => snapshot.workspaceId === workspaceId && snapshot.pillar?.toLowerCase().trim() === targetPillar
    );
  }

  getPillarPerformanceSummary(workspaceId: string): PillarPerformance[] {
    this.getWorkspace(workspaceId);
    const snapshots = this.listAnalytics(workspaceId);
    return aggregatePillarPerformance(snapshots);
  }

  getTopPerformingPillars(workspaceId: string, limit = 3): PillarPerformance[] {
    const summary = this.getPillarPerformanceSummary(workspaceId);
    return summary.slice(0, limit);
  }


  listIdeas(workspaceId: string): ContentIdea[] {
    this.getWorkspace(workspaceId);
    return this.state.contentIdeas.filter((idea) => idea.workspaceId === workspaceId);
  }

  listOnboardingChecklistItems(workspaceId: string): OnboardingChecklistItem[] {
    this.getWorkspace(workspaceId);
    return this.state.onboardingChecklistItems.filter((item) => item.workspaceId === workspaceId);
  }

  getBrandProfile(workspaceId: string): BrandProfile {
    this.getWorkspace(workspaceId);
    const profile = this.state.brandProfiles.find((item) => item.workspaceId === workspaceId);
    if (!profile) throw new Error("Brand profile not found");
    return profile;
  }

  updateBrandProfile(profile: BrandProfile): BrandProfile {
    this.getWorkspace(profile.workspaceId);
    const existingIndex = this.state.brandProfiles.findIndex((item) => item.workspaceId === profile.workspaceId && item.id === profile.id);
    if (existingIndex === -1) throw new Error("Brand profile not found");
    this.state.brandProfiles[existingIndex] = profile;
    this.persist();
    return profile;
  }

  resetWorkspace(workspaceId: string, actor = "Demo API"): DemoAppState {
    this.getWorkspace(workspaceId);
    const seed = createDemoState();
    const replaceWorkspaceRecords = <T extends { workspaceId: string }>(
      current: T[],
      seeded: T[],
      preserveWhenNoSeed = false
    ) => {
      const currentForWorkspace = current.filter((item) => item.workspaceId === workspaceId);
      const seededForWorkspace = seeded.filter((item) => item.workspaceId === workspaceId);
      const replacement = seededForWorkspace.length > 0
        ? structuredClone(seededForWorkspace)
        : preserveWhenNoSeed
          ? structuredClone(currentForWorkspace)
          : [];

      return [
        ...replacement,
        ...current.filter((item) => item.workspaceId !== workspaceId)
      ];
    };

    const seedUserIds = new Set(seed.users.map((user) => user.id));

    this.state = {
      users: [...structuredClone(seed.users), ...this.state.users.filter((user) => !seedUserIds.has(user.id))],
      workspaces: this.state.workspaces.map((workspace) => seed.workspaces.find((item) => item.id === workspace.id) ?? workspace),
      workspaceMembers: replaceWorkspaceRecords(this.state.workspaceMembers, seed.workspaceMembers, true),
      styleExamples: replaceWorkspaceRecords(this.state.styleExamples, seed.styleExamples),
      drafts: replaceWorkspaceRecords(this.state.drafts, seed.drafts),
      draftVersions: replaceWorkspaceRecords(this.state.draftVersions, seed.draftVersions),
      mediaAssets: replaceWorkspaceRecords(this.state.mediaAssets, seed.mediaAssets),
      promptVersions: replaceWorkspaceRecords(this.state.promptVersions, seed.promptVersions),
      publishJobs: replaceWorkspaceRecords(this.state.publishJobs, seed.publishJobs),
      scheduleJobs: replaceWorkspaceRecords(this.state.scheduleJobs, seed.scheduleJobs),
      auditEvents: replaceWorkspaceRecords(this.state.auditEvents, seed.auditEvents),
      integrationSettings: replaceWorkspaceRecords(this.state.integrationSettings, seed.integrationSettings),
      integrationLogs: replaceWorkspaceRecords(this.state.integrationLogs, seed.integrationLogs),
      analyticsSnapshots: replaceWorkspaceRecords(this.state.analyticsSnapshots, seed.analyticsSnapshots),
      contentIdeas: replaceWorkspaceRecords(this.state.contentIdeas, seed.contentIdeas),
      onboardingChecklistItems: replaceWorkspaceRecords(this.state.onboardingChecklistItems, seed.onboardingChecklistItems),
      brandProfiles: replaceWorkspaceRecords(this.state.brandProfiles, seed.brandProfiles, true)
    };

    this.state.auditEvents.unshift({
      id: `audit-${Date.now()}`,
      workspaceId,
      actor,
      action: "demo data reset",
      detail: "Workspace demo drafts, jobs, settings, analytics, ideas, and logs were restored to seed data.",
      createdAt: "Just now"
    });
    this.persist();
    return this.snapshot();
  }
}

const globalForDemoRepository = globalThis as typeof globalThis & {
  __fyfDemoRepository?: DemoRepository;
  __fyfDemoStateStore?: DemoStateStore;
  __fyfDemoDatabasePath?: string;
};

function shouldUseSqlitePersistence() {
  return process.env.FYF_DEMO_PERSISTENCE === "sqlite" || (!process.env.VITEST && process.env.FYF_DEMO_PERSISTENCE !== "memory");
}

function getDemoStateStore() {
  const dbPath = defaultDemoDatabasePath();
  if (!globalForDemoRepository.__fyfDemoStateStore || globalForDemoRepository.__fyfDemoDatabasePath !== dbPath) {
    globalForDemoRepository.__fyfDemoStateStore?.close();
    globalForDemoRepository.__fyfDemoStateStore = createSqliteDemoStateStore(dbPath);
    globalForDemoRepository.__fyfDemoDatabasePath = dbPath;
  }
  return globalForDemoRepository.__fyfDemoStateStore;
}

export function getDemoRepository() {
  if (!globalForDemoRepository.__fyfDemoRepository) {
    if (shouldUseSqlitePersistence()) {
      const store = getDemoStateStore();
      const state = normalizeDemoState(store.load() ?? createDemoState());
      store.save(state);
      globalForDemoRepository.__fyfDemoRepository = new DemoRepository(state, store);
    } else {
      globalForDemoRepository.__fyfDemoRepository = new DemoRepository();
    }
  }
  return globalForDemoRepository.__fyfDemoRepository;
}

export function resetDemoRepository(seedState: DemoAppState = createDemoState()) {
  if (shouldUseSqlitePersistence()) {
    const store = getDemoStateStore();
    store.reset(seedState);
    globalForDemoRepository.__fyfDemoRepository = new DemoRepository(seedState, store);
    return globalForDemoRepository.__fyfDemoRepository;
  }

  globalForDemoRepository.__fyfDemoRepository = new DemoRepository(seedState);
  return globalForDemoRepository.__fyfDemoRepository;
}
