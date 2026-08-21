import { describe, expect, it } from "vitest";
import { GET as getDrafts, POST as generateDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/route";
import { POST as resetWorkspaceRoute } from "@/app/api/workspaces/[workspaceId]/reset/route";
import { POST as testIntegrationRoute } from "@/app/api/workspaces/[workspaceId]/integrations/test/route";
import { createDemoState, DemoRepository, normalizeDemoState, resetDemoRepository } from "@/backend/demoRepository";
import { generateDraft } from "@/backend/draftLifecycle";
import type { DemoAppState, DemoSession, IntegrationLog, MediaAsset, PromptVersion, StyleExample } from "@/backend/types";

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

type DraftsResponse = {
  session: DemoSession;
  styleExamples: StyleExample[];
  mediaAssets: MediaAsset[];
  promptVersions: PromptVersion[];
  integrationLogs: IntegrationLog[];
};

type GenerateResponse = {
  ok: true;
  draft: { id: string; workspaceId: string; media?: MediaAsset[] };
  mediaAssets: MediaAsset[];
  promptVersions: PromptVersion[];
};

type IntegrationTestResponse = {
  ok: boolean;
  auditEvents: Array<{ workspaceId: string; action: string }>;
};

describe("demo runtime data model", () => {
  it("normalizes a configured legacy workspace across every scoped collection", () => {
    const legacyWorkspaceId = "legacy-workspace";
    const state = createDemoState();
    state.workspaces = state.workspaces.filter((workspace) => workspace.id !== "ws-fyf");
    state.workspaces.push({
      id: legacyWorkspaceId,
      name: "Legacy FYF workspace",
      pageName: "FYF",
      demoMode: true,
      riskSensitivity: "strict",
      industry: "Enterprise AI Systems",
      targetAudience: "Creators",
      brandSummary: "Legacy local state"
    });

    const scopedCollections: Array<Array<{ workspaceId: string }>> = [
      state.workspaceMembers,
      state.styleExamples,
      state.drafts,
      state.draftVersions,
      state.mediaAssets,
      state.promptVersions,
      state.publishJobs,
      state.scheduleJobs,
      state.auditEvents,
      state.integrationSettings,
      state.integrationLogs,
      state.analyticsSnapshots,
      state.contentIdeas,
      state.onboardingChecklistItems,
      state.brandProfiles
    ];
    for (const collection of scopedCollections) {
      for (const item of collection) {
        if (item.workspaceId === "ws-fyf") item.workspaceId = legacyWorkspaceId;
      }
    }

    const previousAlias = process.env.FYF_LEGACY_WORKSPACE_ID;
    process.env.FYF_LEGACY_WORKSPACE_ID = legacyWorkspaceId;
    try {
      const normalized = normalizeDemoState(state);
      expect(normalized.workspaces.some((workspace) => workspace.id === "ws-fyf")).toBe(true);
      expect(normalized.workspaces.some((workspace) => workspace.id === legacyWorkspaceId)).toBe(false);
      const normalizedCollections: Array<Array<{ workspaceId: string }>> = [
        normalized.workspaceMembers,
        normalized.styleExamples,
        normalized.drafts,
        normalized.draftVersions,
        normalized.mediaAssets,
        normalized.promptVersions,
        normalized.publishJobs,
        normalized.scheduleJobs,
        normalized.auditEvents,
        normalized.integrationSettings,
        normalized.integrationLogs,
        normalized.analyticsSnapshots,
        normalized.contentIdeas,
        normalized.onboardingChecklistItems,
        normalized.brandProfiles
      ];
      for (const collection of normalizedCollections) {
        expect(collection.every((item) => item.workspaceId !== legacyWorkspaceId)).toBe(true);
      }
      expect(normalized.workspaces.some((workspace) => workspace.id === "ws-agency")).toBe(true);
    } finally {
      if (previousAlias === undefined) delete process.env.FYF_LEGACY_WORKSPACE_ID;
      else process.env.FYF_LEGACY_WORKSPACE_ID = previousAlias;
    }
  });

  it("preserves a legacy workspace when the canonical workspace already exists", () => {
    const legacyWorkspaceId = "legacy-workspace";
    const state = createDemoState();
    state.workspaces.push({
      id: legacyWorkspaceId,
      name: "Legacy workspace",
      pageName: "Legacy",
      demoMode: true,
      riskSensitivity: "standard",
      industry: "Other",
      targetAudience: "Operators",
      brandSummary: "Review-only legacy state"
    });
    state.drafts.push({ ...state.drafts[0], id: "legacy-draft", workspaceId: legacyWorkspaceId });

    const previousAlias = process.env.FYF_LEGACY_WORKSPACE_ID;
    process.env.FYF_LEGACY_WORKSPACE_ID = legacyWorkspaceId;
    try {
      const normalized = normalizeDemoState(state);
      expect(normalized.workspaces.some((workspace) => workspace.id === "ws-fyf")).toBe(true);
      expect(normalized.workspaces.some((workspace) => workspace.id === legacyWorkspaceId)).toBe(true);
      expect(normalized.drafts.find((draft) => draft.id === "legacy-draft")?.workspaceId).toBe(legacyWorkspaceId);
    } finally {
      if (previousAlias === undefined) delete process.env.FYF_LEGACY_WORKSPACE_ID;
      else process.env.FYF_LEGACY_WORKSPACE_ID = previousAlias;
    }
  });

  it("carries every V1 core entity in DemoAppState", () => {
    const state = createDemoState();

    expect(Object.keys(state).sort()).toEqual([
      "analyticsSnapshots",
      "auditEvents",
      "brandProfiles",
      "contentIdeas",
      "draftVersions",
      "drafts",
      "integrationLogs",
      "integrationSettings",
      "mediaAssets",
      "onboardingChecklistItems",
      "promptVersions",
      "publishJobs",
      "scheduleJobs",
      "styleExamples",
      "users",
      "workspaceMembers",
      "workspaces"
    ]);
    expect(state.users).toHaveLength(1);
    expect(state.workspaceMembers.every((member) => member.workspaceId && member.userId)).toBe(true);
    expect(state.styleExamples.every((example) => example.workspaceId)).toBe(true);
    expect(state.mediaAssets.every((asset) => asset.workspaceId)).toBe(true);
    expect(state.promptVersions.every((version) => version.workspaceId)).toBe(true);
    expect(state.integrationLogs.every((log) => log.workspaceId)).toBe(true);
  });

  it("repository list methods keep new workspace-owned entities tenant-scoped", () => {
    const repository = new DemoRepository();

    expect(repository.listWorkspaceMembers("ws-fyf").every((member) => member.workspaceId === "ws-fyf")).toBe(true);
    expect(repository.listStyleExamples("ws-fyf").every((example) => example.workspaceId === "ws-fyf")).toBe(true);
    expect(repository.listMediaAssets("ws-fyf").every((asset) => asset.workspaceId === "ws-fyf")).toBe(true);
    expect(repository.listPromptVersions("ws-fyf").every((version) => version.workspaceId === "ws-fyf")).toBe(true);
    expect(repository.listIntegrationLogs("ws-fyf").every((log) => log.workspaceId === "ws-fyf")).toBe(true);
    expect(repository.listStyleExamples("ws-fyf").some((example) => example.workspaceId === "ws-agency")).toBe(false);
  });

  it("repository returns a demo session scoped to the selected workspace", () => {
    const repository = new DemoRepository();
    const session = repository.getDemoSession("ws-fyf");

    expect(session).toMatchObject({
      workspaceId: "ws-fyf",
      mode: "demo",
      user: { id: "user-demo-owner", name: "Demo User", email: "demo@fyf.local" },
      member: { workspaceId: "ws-fyf", userId: "user-demo-owner", role: "owner" }
    });
    expect(JSON.stringify(session)).not.toContain("ws-agency");
  });

  it("repository fails clearly when demo session member or user data is incomplete", () => {
    const missingMemberState = createDemoState();
    missingMemberState.workspaceMembers = missingMemberState.workspaceMembers.filter((member) => member.workspaceId !== "ws-fyf");
    expect(() => new DemoRepository(missingMemberState).getDemoSession("ws-fyf")).toThrow("Workspace member not found");

    const missingUserState = createDemoState();
    missingUserState.users = missingUserState.users.filter((user) => user.id !== "user-demo-owner");
    expect(() => new DemoRepository(missingUserState).getDemoSession("ws-fyf")).toThrow("Demo user not found");
  });

  it("draft generation stores prompt versions and standalone media assets in the workspace snapshot", () => {
    const repository = new DemoRepository();
    const beforePromptCount = repository.listPromptVersions("ws-fyf").length;
    const beforeMediaCount = repository.listMediaAssets("ws-fyf").length;

    const result = generateDraft(
      repository,
      "ws-fyf",
      { topic: "Beginner risk checklist", mediaName: "risk-checklist.png" },
      { actor: "Tester" }
    );

    const promptVersions = repository.listPromptVersions("ws-fyf");
    const mediaAssets = repository.listMediaAssets("ws-fyf");

    expect(promptVersions).toHaveLength(beforePromptCount + 1);
    expect(promptVersions[0].prompt).toContain("Beginner risk checklist");
    expect(mediaAssets).toHaveLength(beforeMediaCount + 1);
    expect(mediaAssets[0]).toMatchObject({
      workspaceId: "ws-fyf",
      draftId: result.draft.id,
      name: "risk-checklist.png"
    });
    expect(result.examplesUsed).toBe(repository.listStyleExamples("ws-fyf").length);
  });

  it("resetWorkspace restores the selected workspace entities without leaking across tenants", () => {
    const state = createDemoState();
    state.users.push({ id: "user-extra", name: "Extra Demo User", email: "extra@fyf.local" });
    state.styleExamples.push({ id: "custom-fyf", workspaceId: "ws-fyf", topic: "Custom", content: "Custom style" });
    state.styleExamples.push({ id: "custom-agency", workspaceId: "ws-agency", topic: "Agency custom", content: "Agency style" });
    state.promptVersions.push({ id: "custom-prompt", workspaceId: "ws-fyf", name: "Custom prompt", prompt: "custom", createdAt: "Now" });
    const repository = new DemoRepository(state);

    repository.resetWorkspace("ws-fyf", "Tester");
    const snapshot = repository.snapshot();

    expect(snapshot.styleExamples.some((example) => example.id === "custom-fyf")).toBe(false);
    expect(snapshot.promptVersions.some((version) => version.id === "custom-prompt")).toBe(false);
    expect(snapshot.styleExamples.some((example) => example.id === "custom-agency")).toBe(true);
    expect(snapshot.users.some((user) => user.id === "user-extra")).toBe(true);
    expect(snapshot.auditEvents[0]).toMatchObject({ workspaceId: "ws-fyf", action: "demo data reset" });
  });

  it("drafts API returns new workspace-scoped runtime entities", async () => {
    resetDemoRepository();
    const response = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as DraftsResponse;

    expect(response.status).toBe(200);
    expect(body.session).toMatchObject({
      workspaceId: "ws-fyf",
      mode: "demo",
      user: { name: "Demo User" },
      member: { role: "owner" }
    });
    expect(body.styleExamples.every((example) => example.workspaceId === "ws-fyf")).toBe(true);
    expect(body.mediaAssets.every((asset) => asset.workspaceId === "ws-fyf")).toBe(true);
    expect(body.promptVersions.every((version) => version.workspaceId === "ws-fyf")).toBe(true);
    expect(body.integrationLogs.every((log) => log.workspaceId === "ws-fyf")).toBe(true);
  });

  it("generate and connection-test API routes update prompt/media/integration log state", async () => {
    resetDemoRepository();
    const generateResponse = await generateDraftRoute(
      request("/api/workspaces/ws-fyf/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "Risk journal routine", mediaName: "journal.png" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const generateBody = (await generateResponse.json()) as GenerateResponse;

    expect(generateResponse.status).toBe(200);
    expect(generateBody.promptVersions[0].workspaceId).toBe("ws-fyf");
    expect(generateBody.mediaAssets[0]).toMatchObject({
      workspaceId: "ws-fyf",
      draftId: generateBody.draft.id,
      name: "journal.png"
    });

    const integrationResponse = await testIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations/test", {
        method: "POST",
        body: JSON.stringify({ provider: "facebook" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const integrationBody = (await integrationResponse.json()) as IntegrationTestResponse;
    const draftsResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const draftsBody = (await draftsResponse.json()) as DraftsResponse;

    expect(integrationResponse.status).toBe(200);
    expect(integrationBody.auditEvents.some((event) => event.action === "connection test run")).toBe(true);
    expect(draftsBody.integrationLogs[0]).toMatchObject({
      workspaceId: "ws-fyf",
      provider: "facebook",
      action: "connection test run"
    });
  });

  it("reset API returns restored workspace-scoped runtime entities", async () => {
    resetDemoRepository();
    const response = await resetWorkspaceRoute(request("/api/workspaces/ws-fyf/reset", { method: "POST" }), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as DraftsResponse & Pick<DemoAppState, "auditEvents">;

    expect(response.status).toBe(200);
    expect(body.styleExamples.every((example) => example.workspaceId === "ws-fyf")).toBe(true);
    expect(body.mediaAssets.every((asset) => asset.workspaceId === "ws-fyf")).toBe(true);
    expect(body.promptVersions.every((version) => version.workspaceId === "ws-fyf")).toBe(true);
    expect(body.integrationLogs.every((log) => log.workspaceId === "ws-fyf")).toBe(true);
    expect(body.auditEvents[0]).toMatchObject({ workspaceId: "ws-fyf", action: "demo data reset" });
  });
});
