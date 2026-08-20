import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as archiveDraftRoute, GET as getDraftDetail, PATCH as editDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/route";
import { DELETE as removeMediaRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/media/[mediaId]/route";
import { GET as getBrandProfileRoute, PATCH as saveBrandProfileRoute } from "@/app/api/workspaces/[workspaceId]/brand-profile/route";
import { POST as approveDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/approve/route";
import { POST as aiFixDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/fix/route";
import { POST as publishDraft } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/publish/route";
import { POST as markManualPostRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/manual-post/route";
import { POST as recoverDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/recover/route";
import { POST as rejectDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/reject/route";
import { POST as scheduleDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/schedule/route";
import { GET as getDrafts, POST as generateDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/route";
import { PATCH as saveIntegrationRoute, GET as getIntegrations } from "@/app/api/workspaces/[workspaceId]/integrations/route";
import { POST as testIntegrationRoute } from "@/app/api/workspaces/[workspaceId]/integrations/test/route";
import { GET as getHealth } from "@/app/api/workspaces/[workspaceId]/health/route";
import { GET as getLogs } from "@/app/api/workspaces/[workspaceId]/logs/route";
import { POST as resetWorkspaceRoute } from "@/app/api/workspaces/[workspaceId]/reset/route";
import { GET as getWorkspace, PATCH as updateWorkspace } from "@/app/api/workspaces/[workspaceId]/route";
import { GET as listStyleExamples, POST as addStyleExample, DELETE as deleteStyleExample } from "@/app/api/workspaces/[workspaceId]/style-examples/route";
import { createDemoState, DemoRepository, resetDemoRepository } from "@/backend/demoRepository";
import { approveDraft, publishDraft as publishDraftFromRepository } from "@/backend/draftLifecycle";
import { maskSecret, redactSensitiveUrlQueryParams, sanitizeIntegrationConfigPatch, saveIntegrationSecret } from "@/backend/integrationSettings";
import type {
  AnalyticsSnapshot,
  AuditEvent,
  BrandProfile,
  DemoSession,
  Draft,
  IntegrationSetting,
  OnboardingChecklistItem,
  PublishJob,
  ScheduleJob
} from "@/backend/types";

type DraftsResponse = {
  session: DemoSession;
  drafts: Draft[];
  auditEvents: AuditEvent[];
  analytics: AnalyticsSnapshot[];
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  onboardingChecklistItems: OnboardingChecklistItem[];
  brandProfile: BrandProfile;
};

type IntegrationsResponse = {
  settings: IntegrationSetting[];
};

type PublishResponse = {
  ok: boolean;
  job: PublishJob;
};

type ManualPostResponse = {
  ok: true;
  job: PublishJob;
  draft: Draft;
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  auditEvents: AuditEvent[];
};

type DraftMutationResponse = {
  ok: true;
  draft: Draft;
  versions?: Array<{ workspaceId: string; draftId: string; version: number }>;
  auditEvents: AuditEvent[];
};

type AiFixResponse = DraftMutationResponse & {
  before: string;
  after: string;
  reason: string;
};

type ScheduleResponse = {
  ok: true;
  job: { workspaceId: string; draftId: string; scheduledFor: string; status: string };
  draft: Draft;
  scheduleJobs: Array<{ workspaceId: string; draftId: string; scheduledFor: string; status: string }>;
};

type IntegrationMutationResponse = {
  ok: boolean;
  setting?: IntegrationSetting;
  result?: {
    provider: string;
    ok: boolean;
    message: string;
    checklist?: IntegrationChecklistItem[];
    readinessChecklist?: IntegrationChecklistItem[];
  };
  auditEvents: AuditEvent[];
};

type IntegrationChecklistItem = {
  id?: string;
  label?: string;
  title?: string;
  description?: string;
  status?: string;
  ok?: boolean;
};

type IntegrationSettingWithConfig = IntegrationSetting & {
  config?: Record<string, unknown>;
};

type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type PublishConflictResponse = {
  ok: false;
  error: {
    code: "conflict";
    message: string;
    details: {
      draft: Draft;
      job: PublishJob;
      issues: Array<{
        code: string;
        severity: "review" | "blocked";
        phrase: string;
      }>;
    };
  };
};

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

async function expectBadRequest(response: Response, message: string | RegExp) {
  const body = (await response.json()) as ApiErrorResponse;
  expect(response.status).toBe(400);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(body.ok).toBe(false);
  expect(body.error.code).toBe("bad_request");
  expect(body.error.message).toEqual(expect.stringMatching(message));
}

function checklistItems(result: NonNullable<IntegrationMutationResponse["result"]>) {
  return result.checklist ?? result.readinessChecklist ?? [];
}

describe("Next API route handlers", () => {
  beforeEach(() => {
    resetDemoRepository();
  });

  afterEach(() => {
    vi.doUnmock("@/backend/demoRepository");
    vi.resetModules();
    resetDemoRepository();
  });

  it("returns workspace-scoped drafts, audit events, and analytics", async () => {
    const response = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as DraftsResponse;

    expect(response.status).toBe(200);
    expect(body.session).toMatchObject({
      workspaceId: "ws-fyf",
      mode: "demo",
      user: { name: "Demo User", email: "demo@fyf.local" },
      member: { workspaceId: "ws-fyf", role: "owner" }
    });
    expect(body.drafts).toHaveLength(3);
    expect(body.drafts.every((draft) => draft.workspaceId === "ws-fyf")).toBe(true);
    expect(body.auditEvents.every((event) => event.workspaceId === "ws-fyf")).toBe(true);
    expect(body.analytics.every((snapshot) => snapshot.workspaceId === "ws-fyf")).toBe(true);
    expect(body.publishJobs.every((job) => job.workspaceId === "ws-fyf")).toBe(true);
    expect(body.scheduleJobs.every((job) => job.workspaceId === "ws-fyf")).toBe(true);
    expect(body.onboardingChecklistItems.every((item) => item.workspaceId === "ws-fyf")).toBe(true);
    expect(body.onboardingChecklistItems.filter((item) => item.completed)).toHaveLength(5);
    expect(body.drafts.some((draft) => draft.id === "draft-failed")).toBe(false);
    expect(body.publishJobs.some((job) => job.draftId === "draft-failed")).toBe(false);
  });

  it("returns only masked integration settings for the requested workspace", async () => {
    const response = await getIntegrations(
      request("/api/workspaces/ws-fyf/integrations"),
      params({ workspaceId: "ws-fyf" })
    );
    const body = (await response.json()) as IntegrationsResponse;

    expect(response.status).toBe(200);
    expect(body.settings).toHaveLength(3);
    expect(body.settings.every((setting) => setting.workspaceId === "ws-fyf")).toBe(true);
    expect(body.settings.map((setting) => setting.provider).sort()).toEqual(["facebook", "gemini", "sheets"]);
    expect(JSON.stringify(body)).not.toContain("ws-agency");
    expect(body.settings.every((setting) => setting.maskedSecret && !setting.maskedSecret.includes("REAL_SECRET"))).toBe(true);
  });

  it("returns the workspace-scoped brand profile", async () => {
    const response = await getBrandProfileRoute(
      request("/api/workspaces/ws-fyf/brand-profile"),
      params({ workspaceId: "ws-fyf" })
    );
    const body = (await response.json()) as { brandProfile: BrandProfile };

    expect(response.status).toBe(200);
    expect(body.brandProfile.workspaceId).toBe("ws-fyf");
    expect(body.brandProfile.description).toMatch(/AI/i);
    expect(body.brandProfile.forbiddenPhrases).toContain("အမြတ် အာမခံ");
  });

  it("updates Brand Voice OS rules and records an audit event", async () => {
    const response = await saveBrandProfileRoute(
      request("/api/workspaces/ws-fyf/brand-profile", {
        method: "PATCH",
        body: JSON.stringify({
          description: "Updated FYF AI mentor brand for disciplined forex education.",
          targetAudience: "Myanmar traders who want safer learning habits",
          toneRules: ["Calm mentor", "Risk-first", "No hype"],
          forbiddenPhrases: ["instant rich", "အမြတ် အာမခံ"],
          preferredCtas: ["Comment with your question", "Inbox for checklist"],
          voiceNotes: "Use short Burmese paragraphs and practical next steps."
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const body = (await response.json()) as { ok: true; brandProfile: BrandProfile; auditEvents: AuditEvent[] };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.brandProfile.workspaceId).toBe("ws-fyf");
    expect(body.brandProfile.toneRules).toEqual(["Calm mentor", "Risk-first", "No hype"]);
    expect(body.brandProfile.preferredCtas).toContain("Inbox for checklist");
    expect(body.auditEvents[0]).toMatchObject({ workspaceId: "ws-fyf", action: "brand profile updated" });
  });

  it("keeps Brand Voice OS updates isolated by workspace", async () => {
    await saveBrandProfileRoute(
      request("/api/workspaces/ws-fyf/brand-profile", {
        method: "PATCH",
        body: JSON.stringify({
          description: "FYF AI-only voice update for isolation test.",
          targetAudience: "FYF AI audience",
          toneRules: ["FYF AI isolated rule"],
          forbiddenPhrases: ["FYF AI forbidden phrase"],
          preferredCtas: ["FYF AI CTA"],
          voiceNotes: "FYF AI isolated notes."
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );

    const agencyResponse = await getBrandProfileRoute(
      request("/api/workspaces/ws-agency/brand-profile"),
      params({ workspaceId: "ws-agency" })
    );
    const agencyBody = (await agencyResponse.json()) as { brandProfile: BrandProfile };

    expect(agencyResponse.status).toBe(200);
    expect(agencyBody.brandProfile.workspaceId).toBe("ws-agency");
    expect(JSON.stringify(agencyBody.brandProfile)).not.toContain("FYF AI isolated");
  });

  it("approves and mock-publishes a safe draft through the publish route", async () => {
    await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-scheduled/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-scheduled" })
    );

    const response = await publishDraft(
      request("/api/workspaces/ws-fyf/drafts/draft-scheduled/publish", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-scheduled" })
    );
    const body = (await response.json()) as PublishResponse;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.job.status).toBe("published");
    expect(body.job.workspaceId).toBe("ws-fyf");
    expect(body.job.draftId).toBe("draft-scheduled");
    expect(body.job.idempotencyKey).toBe("ws-fyf:draft-scheduled:1");
    expect(body.job.fakePostId).toMatch(/^fb_demo_draft-scheduled_/);
  });

  it("marks an approved draft as manually posted without a live Facebook publish", async () => {
    await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-scheduled/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-scheduled" })
    );

    const response = await markManualPostRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-scheduled/manual-post", {
        method: "POST",
        body: JSON.stringify({ externalPostId: "facebook-manual-post-123" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-scheduled" })
    );
    const body = (await response.json()) as ManualPostResponse;

    expect(response.status).toBe(200);
    expect(body.job).toMatchObject({
      workspaceId: "ws-fyf",
      draftId: "draft-scheduled",
      status: "published",
      externalPostId: "facebook-manual-post-123",
      reason: "Manual Facebook posting confirmed by operator."
    });
    expect(body.job.fakePostId).toBeUndefined();
    expect(body.draft.status).toBe("published");
    expect(body.auditEvents).toEqual(expect.arrayContaining([expect.objectContaining({ action: "manual post marked" })]));
  });

  it("blocks manual post marking until a draft is approved", async () => {
    const response = await markManualPostRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/manual-post", {
        method: "POST",
        body: JSON.stringify({ externalPostId: "should-not-post" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const body = (await response.json()) as PublishConflictResponse;

    expect(response.status).toBe(409);
    expect(body.error.message).toContain("approved");
    expect(body.error.details.job.status).toBe("blocked");
  });

  it("generates a Burmese draft and keeps detail data workspace-scoped", async () => {
    const response = await generateDraftRoute(
      request("/api/workspaces/ws-fyf/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "Risk discipline checklist", mediaName: "chart.png" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const body = (await response.json()) as DraftMutationResponse & { examplesUsed: number };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.draft.workspaceId).toBe("ws-fyf");
    expect(body.draft.content).toMatch(/[\u1000-\u109F]/);
    expect(body.draft.media?.[0]?.name).toBe("chart.png");
    expect(body.examplesUsed).toBeGreaterThan(0);

    const detailResponse = await getDraftDetail(
      request(`/api/workspaces/ws-fyf/drafts/${body.draft.id}`),
      params({ workspaceId: "ws-fyf", draftId: body.draft.id })
    );
    const detail = (await detailResponse.json()) as { draft: Draft; versions: Array<{ workspaceId: string; draftId: string }> };
    expect(detail.draft.id).toBe(body.draft.id);
    expect(detail.versions.every((version) => version.workspaceId === "ws-fyf" && version.draftId === body.draft.id)).toBe(true);
  });

  it("persists the demo UI action lifecycle through API state and logs", async () => {
    const generatePublishResponse = await generateDraftRoute(
      request("/api/workspaces/ws-fyf/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "API backed publish smoke", mediaName: "api-smoke.png" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const generatedPublish = (await generatePublishResponse.json()) as DraftMutationResponse & { examplesUsed: number };
    const publishDraftId = generatedPublish.draft.id;

    expect(generatePublishResponse.status).toBe(200);
    expect(generatedPublish.draft.content).toMatch(/[\u1000-\u109F]/);
    expect(generatedPublish.draft.media?.[0]?.name).toBe("api-smoke.png");

    const editResponse = await editDraftRoute(
      request(`/api/workspaces/ws-fyf/drafts/${publishDraftId}`, {
        method: "PATCH",
        body: JSON.stringify({
          content:
            "Forex learning မှာ risk plan ကိုအရင်တည်ဆောက်ပြီး journal နဲ့ပြန်သုံးသပ်ပါ။ ရလဒ်က လူတိုင်းမတူနိုင်တာကြောင့် discipline ကိုဦးစားပေးပါ။"
        })
      }),
      params({ workspaceId: "ws-fyf", draftId: publishDraftId })
    );
    const edited = (await editResponse.json()) as DraftMutationResponse;
    expect(editResponse.status).toBe(200);
    expect(edited.draft.version).toBe(2);
    expect(edited.draft.riskLevel).toBe("safe");
    expect(edited.versions?.[0]).toMatchObject({ workspaceId: "ws-fyf", draftId: publishDraftId, version: 2 });

    const approveResponse = await approveDraftRoute(
      request(`/api/workspaces/ws-fyf/drafts/${publishDraftId}/approve`, { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: publishDraftId })
    );
    const approved = (await approveResponse.json()) as DraftMutationResponse;
    expect(approveResponse.status).toBe(200);
    expect(approved.draft.status).toBe("approved");

    const publishResponse = await publishDraft(
      request(`/api/workspaces/ws-fyf/drafts/${publishDraftId}/publish`, { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: publishDraftId })
    );
    const published = (await publishResponse.json()) as PublishResponse;
    expect(publishResponse.status).toBe(200);
    expect(published.job).toMatchObject({
      workspaceId: "ws-fyf",
      draftId: publishDraftId,
      status: "published",
      idempotencyKey: `ws-fyf:${publishDraftId}:2`
    });

    const generateScheduleResponse = await generateDraftRoute(
      request("/api/workspaces/ws-fyf/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "API backed schedule smoke" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const generatedSchedule = (await generateScheduleResponse.json()) as DraftMutationResponse;
    const scheduleDraftId = generatedSchedule.draft.id;
    const approveScheduleResponse = await approveDraftRoute(
      request(`/api/workspaces/ws-fyf/drafts/${scheduleDraftId}/approve`, { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: scheduleDraftId })
    );
    expect(approveScheduleResponse.status).toBe(200);
    const scheduleResponse = await scheduleDraftRoute(
      request(`/api/workspaces/ws-fyf/drafts/${scheduleDraftId}/schedule`, {
        method: "POST",
        body: JSON.stringify({ scheduledFor: "Saturday, 8:00 PM" })
      }),
      params({ workspaceId: "ws-fyf", draftId: scheduleDraftId })
    );
    const scheduled = (await scheduleResponse.json()) as ScheduleResponse;
    expect(scheduleResponse.status).toBe(200);
    expect(scheduled.draft).toMatchObject({ id: scheduleDraftId, workspaceId: "ws-fyf", status: "scheduled" });
    expect(scheduled.job).toMatchObject({ workspaceId: "ws-fyf", draftId: scheduleDraftId, scheduledFor: "Saturday, 8:00 PM" });

    const integrationResponse = await testIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations/test", {
        method: "POST",
        body: JSON.stringify({ provider: "gemini" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const integration = (await integrationResponse.json()) as IntegrationMutationResponse;
    expect(integrationResponse.status).toBe(200);
    expect(integration.result).toMatchObject({ provider: "gemini", ok: true });

    const draftsResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const draftsBody = (await draftsResponse.json()) as DraftsResponse;
    expect(draftsBody.drafts.find((draft) => draft.id === publishDraftId)?.status).toBe("published");
    expect(draftsBody.drafts.find((draft) => draft.id === scheduleDraftId)?.status).toBe("scheduled");
    expect(draftsBody.publishJobs).toEqual(expect.arrayContaining([expect.objectContaining({ draftId: publishDraftId, status: "published" })]));
    expect(draftsBody.scheduleJobs).toEqual(expect.arrayContaining([expect.objectContaining({ draftId: scheduleDraftId, status: "scheduled" })]));

    const logsResponse = await getLogs(request("/api/workspaces/ws-fyf/logs"), params({ workspaceId: "ws-fyf" }));
    const logs = (await logsResponse.json()) as {
      auditEvents: AuditEvent[];
      publishJobs: PublishJob[];
      scheduleJobs: Array<{ workspaceId: string; draftId: string; scheduledFor: string; status: string }>;
    };
    const actions = logs.auditEvents.map((event) => event.action);
    expect(logsResponse.status).toBe(200);
    expect(actions).toEqual(expect.arrayContaining(["draft created", "draft edited", "approve clicked", "mock publish completed", "schedule created", "connection test run"]));
    expect(logs.publishJobs).toEqual(expect.arrayContaining([expect.objectContaining({ draftId: publishDraftId, status: "published" })]));
    expect(logs.scheduleJobs).toEqual(expect.arrayContaining([expect.objectContaining({ draftId: scheduleDraftId, scheduledFor: "Saturday, 8:00 PM" })]));
  });

  it("edits, approves, rejects, and schedules through workspace-scoped routes", async () => {
    const editResponse = await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const editBody = (await editResponse.json()) as DraftMutationResponse;
    expect(editResponse.status).toBe(200);
    expect(editBody.draft.version).toBe(3);
    expect(editBody.versions?.[0]?.version).toBe(3);

    const approveResponse = await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const approveBody = (await approveResponse.json()) as DraftMutationResponse;
    expect(approveResponse.status).toBe(200);
    expect(approveBody.draft.status).toBe("approved");

    const scheduleResponse = await scheduleDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/schedule", {
        method: "POST",
        body: JSON.stringify({ scheduledFor: "Friday, 6:00 PM" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const scheduleBody = (await scheduleResponse.json()) as ScheduleResponse;
    expect(scheduleResponse.status).toBe(200);
    expect(scheduleBody.draft.status).toBe("scheduled");
    expect(scheduleBody.scheduleJobs.some((job) => job.draftId === "draft-risk" && job.workspaceId === "ws-fyf")).toBe(true);

    const rejectResponse = await rejectDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/reject", {
        method: "POST",
        body: JSON.stringify({ reason: "Client wants a new angle" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const rejectBody = (await rejectResponse.json()) as DraftMutationResponse;
    expect(rejectResponse.status).toBe(200);
    expect(rejectBody.draft.status).toBe("rejected");
    expect(rejectBody.auditEvents[0]?.detail).toContain("Client wants a new angle");
  });

  it("persists a custom schedule time through drafts and logs APIs", async () => {
    const customScheduledFor = "2026-07-08T12:30:00+06:30";

    await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );

    const scheduleResponse = await scheduleDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/schedule", {
        method: "POST",
        body: JSON.stringify({ scheduledFor: customScheduledFor })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const scheduleBody = (await scheduleResponse.json()) as ScheduleResponse;

    expect(scheduleResponse.status).toBe(200);
    expect(scheduleBody.draft).toMatchObject({
      id: "draft-risk",
      workspaceId: "ws-fyf",
      status: "scheduled",
      scheduledFor: customScheduledFor
    });
    expect(scheduleBody.job).toMatchObject({
      workspaceId: "ws-fyf",
      draftId: "draft-risk",
      scheduledFor: customScheduledFor,
      status: "scheduled"
    });

    const draftsResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const draftsBody = (await draftsResponse.json()) as DraftsResponse;
    expect(draftsBody.drafts.find((draft) => draft.id === "draft-risk")?.scheduledFor).toBe(customScheduledFor);
    expect(draftsBody.scheduleJobs).toEqual(
      expect.arrayContaining([expect.objectContaining({ draftId: "draft-risk", scheduledFor: customScheduledFor })])
    );

    const logsResponse = await getLogs(request("/api/workspaces/ws-fyf/logs"), params({ workspaceId: "ws-fyf" }));
    const logsBody = (await logsResponse.json()) as { auditEvents: AuditEvent[]; scheduleJobs: ScheduleJob[] };
    expect(logsBody.auditEvents[0]).toMatchObject({
      workspaceId: "ws-fyf",
      action: "schedule created",
      detail: expect.stringContaining(customScheduledFor)
    });
    expect(logsBody.scheduleJobs).toEqual(
      expect.arrayContaining([expect.objectContaining({ draftId: "draft-risk", scheduledFor: customScheduledFor })])
    );
  });

  it("blocks publish and schedule until a draft is explicitly approved", async () => {
    const publishResponse = await publishDraft(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/publish", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const publishBody = (await publishResponse.json()) as PublishConflictResponse;
    expect(publishResponse.status).toBe(409);
    expect(publishBody.error.message).toContain("approved");
    expect(publishBody.error.details.job.status).toBe("blocked");

    const scheduleResponse = await scheduleDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/schedule", {
        method: "POST",
        body: JSON.stringify({ scheduledFor: "Friday, 6:00 PM" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const scheduleBody = (await scheduleResponse.json()) as ApiErrorResponse;
    expect(scheduleResponse.status).toBe(409);
    expect(scheduleBody.error.message).toContain("approved");
  });

  it("applies AI Fix through the API with version history and audit logs", async () => {
    const fixResponse = await aiFixDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/fix", {
        method: "POST",
        body: JSON.stringify({
          mode: "safer",
          topic: "Risk promise cleanup",
          content: "ဒီ strategy က အမြတ် အာမခံ ရပါတယ်။ အခုချက်ချင်း join လုပ်ပါ။"
        })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const fixed = (await fixResponse.json()) as AiFixResponse;

    expect(fixResponse.status).toBe(200);
    expect(fixed.ok).toBe(true);
    expect(fixed.before).toContain("အမြတ် အာမခံ");
    expect(fixed.after).toContain("ရလဒ်ကို အာမခံလို့မရပါ");
    expect(fixed.draft).toMatchObject({ workspaceId: "ws-fyf", id: "draft-risk", version: 3, riskLevel: "safe" });
    expect(fixed.versions?.[0]).toMatchObject({ workspaceId: "ws-fyf", draftId: "draft-risk", version: 3 });
    expect(fixed.auditEvents[0]).toMatchObject({ workspaceId: "ws-fyf", action: "AI fix applied" });

    await expectBadRequest(
      await aiFixDraftRoute(
        request("/api/workspaces/ws-fyf/drafts/draft-risk/fix", {
          method: "POST",
          body: JSON.stringify({ mode: "unknown", content: "demo" })
        }),
        params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
      ),
      /AI Fix mode is required/
    );
  });

  it("saves masked integration settings and tests connections without leaking raw secrets", async () => {
    const saveResponse = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({ provider: "facebook", secret: "EAAB_REAL_FACEBOOK_SECRET_12345" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const saveBody = (await saveResponse.json()) as IntegrationMutationResponse;
    expect(saveResponse.status).toBe(200);
    expect(saveBody.setting).toMatchObject({ workspaceId: "ws-fyf", provider: "facebook", status: "demo" });
    expect(saveBody.setting?.maskedSecret).toBe("EAAB••••45");
    expect(JSON.stringify(saveBody)).not.toContain("REAL_FACEBOOK_SECRET");

    const testResponse = await testIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations/test", {
        method: "POST",
        body: JSON.stringify({ provider: "facebook" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const testBody = (await testResponse.json()) as IntegrationMutationResponse;
    expect(testResponse.status).toBe(200);
    expect(testBody.ok).toBe(true);
    expect(testBody.result?.message).toContain("No live external request");
  });

  it("merges provider config through PATCH and GET without exposing raw secrets", async () => {
    const secretWithConfigResponse = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({
          provider: "facebook",
          secret: "EAAB_FACEBOOK_RAW_SECRET_99999",
          config: {
            pageId: "page_123",
            permissions: ["pages_manage_posts"],
            mockPublishReady: true
          }
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const secretWithConfig = (await secretWithConfigResponse.json()) as IntegrationMutationResponse & {
      setting?: IntegrationSettingWithConfig;
    };

    expect(secretWithConfigResponse.status).toBe(200);
    expect(secretWithConfig.setting).toMatchObject({
      workspaceId: "ws-fyf",
      provider: "facebook",
      status: "demo",
      maskedSecret: "EAAB••••99",
      config: {
        pageId: "page_123",
        permissions: ["pages_manage_posts"],
        mockPublishReady: true
      }
    });
    expect(JSON.stringify(secretWithConfig)).not.toContain("FACEBOOK_RAW_SECRET");

    const configOnlyResponse = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({
          provider: "facebook",
          config: {
            pageId: "page_456",
            permissions: ["pages_manage_posts", "pages_read_engagement"]
          }
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const configOnly = (await configOnlyResponse.json()) as IntegrationMutationResponse & {
      setting?: IntegrationSettingWithConfig;
    };

    expect(configOnlyResponse.status).toBe(200);
    expect(configOnly.setting?.maskedSecret).toBe("EAAB••••99");
    expect(configOnly.setting?.config).toMatchObject({
      pageId: "page_456",
      permissions: ["pages_manage_posts", "pages_read_engagement"],
      mockPublishReady: true
    });
    expect(JSON.stringify(configOnly)).not.toContain("FACEBOOK_RAW_SECRET");

    const getResponse = await getIntegrations(
      request("/api/workspaces/ws-fyf/integrations"),
      params({ workspaceId: "ws-fyf" })
    );
    const getBody = (await getResponse.json()) as { settings: IntegrationSettingWithConfig[] };
    const facebook = getBody.settings.find((setting) => setting.provider === "facebook");

    expect(getResponse.status).toBe(200);
    expect(facebook?.maskedSecret).toBe("EAAB••••99");
    expect(facebook?.config).toMatchObject({
      pageId: "page_456",
      permissions: ["pages_manage_posts", "pages_read_engagement"],
      mockPublishReady: true
    });
    expect(JSON.stringify(getBody)).not.toContain("FACEBOOK_RAW_SECRET");
  });

  it("supports secret-only and config-only saves while preserving provider config", async () => {
    const configOnlyResponse = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({
          provider: "gemini",
          config: {
            model: "gemini-2.5-pro",
            demoMode: true
          }
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const configOnly = (await configOnlyResponse.json()) as IntegrationMutationResponse & {
      setting?: IntegrationSettingWithConfig;
    };

    expect(configOnlyResponse.status).toBe(200);
    expect(configOnly.setting).toMatchObject({
      workspaceId: "ws-fyf",
      provider: "gemini",
      maskedSecret: "demo••••24",
      config: {
        model: "gemini-2.5-pro",
        demoMode: true
      }
    });
    expect(JSON.stringify(configOnly)).not.toContain("GEMINI_RAW_SECRET");

    const secretOnlyResponse = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({
          provider: "gemini",
          secret: "GEMINI_RAW_SECRET_ABCDE"
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const secretOnly = (await secretOnlyResponse.json()) as IntegrationMutationResponse & {
      setting?: IntegrationSettingWithConfig;
    };

    expect(secretOnlyResponse.status).toBe(200);
    expect(secretOnly.setting?.maskedSecret).toBe("GEMI••••DE");
    expect(secretOnly.setting?.config).toMatchObject({
      model: "gemini-2.5-pro",
      demoMode: true
    });
    expect(JSON.stringify(secretOnly)).not.toContain("GEMINI_RAW_SECRET");
  });

  it("returns provider-specific readiness checklist items from integration tests", async () => {
    await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({
          provider: "facebook",
          secret: "EAAB_FACEBOOK_CHECKLIST_SECRET_12345",
          config: {
            pageId: "page_123",
            permissions: ["pages_manage_posts"],
            mockPublishReady: true
          }
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );

    const facebookResponse = await testIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations/test", {
        method: "POST",
        body: JSON.stringify({ provider: "facebook" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const facebookBody = (await facebookResponse.json()) as IntegrationMutationResponse;
    const facebookChecklist = checklistItems(facebookBody.result!);
    const facebookChecklistText = JSON.stringify(facebookChecklist).toLowerCase();

    expect(facebookResponse.status).toBe(200);
    expect(facebookChecklist.length).toBeGreaterThanOrEqual(2);
    expect(facebookChecklistText).toContain("page");
    expect(facebookChecklistText).toMatch(/token|secret|credential/);
    expect(JSON.stringify(facebookBody)).not.toContain("FACEBOOK_CHECKLIST_SECRET");

    const geminiResponse = await testIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations/test", {
        method: "POST",
        body: JSON.stringify({ provider: "gemini" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const geminiBody = (await geminiResponse.json()) as IntegrationMutationResponse;
    const geminiChecklistText = JSON.stringify(checklistItems(geminiBody.result!)).toLowerCase();

    expect(geminiResponse.status).toBe(200);
    expect(geminiChecklistText).toMatch(/gemini|model/);
    expect(geminiChecklistText).toMatch(/burmese|myanmar|prompt/);
    expect(geminiChecklistText).not.toContain("facebook page");
  });

  it("resets only the requested workspace demo data and records an audit event", async () => {
    await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "Temporary edit before reset မေးနိုင်ပါတယ်။" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({ provider: "facebook", secret: "EAAB_TEMP_SECRET_12345" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const agencyBefore = await getDrafts(request("/api/workspaces/ws-agency/drafts"), params({ workspaceId: "ws-agency" }));
    const agencyBeforeBody = (await agencyBefore.json()) as DraftsResponse;

    const resetResponse = await resetWorkspaceRoute(
      request("/api/workspaces/ws-fyf/reset", { method: "POST" }),
      params({ workspaceId: "ws-fyf" })
    );
    const resetBody = (await resetResponse.json()) as DraftsResponse & IntegrationsResponse;
    const resetActions = resetBody.auditEvents.map((event) => event.action);

    expect(resetResponse.status).toBe(200);
    expect(resetBody.drafts.find((draft) => draft.id === "draft-risk")?.version).toBe(2);
    expect(resetBody.settings.find((setting) => setting.provider === "facebook")?.maskedSecret).toBe("masked••••page");
    expect(resetBody.onboardingChecklistItems.filter((item) => item.completed)).toHaveLength(5);
    expect(resetBody.onboardingChecklistItems.every((item) => item.workspaceId === "ws-fyf")).toBe(true);
    expect(resetActions[0]).toBe("demo data reset");
    expect(resetBody.drafts.every((draft) => draft.workspaceId === "ws-fyf")).toBe(true);

    const agencyAfter = await getDrafts(request("/api/workspaces/ws-agency/drafts"), params({ workspaceId: "ws-agency" }));
    const agencyAfterBody = (await agencyAfter.json()) as DraftsResponse;
    expect(agencyAfterBody.drafts).toEqual(agencyBeforeBody.drafts);
  });

  it("returns a JSON error for an unknown workspace reset request", async () => {
    const response = await resetWorkspaceRoute(
      request("/api/workspaces/ws-missing/reset", { method: "POST" }),
      params({ workspaceId: "ws-missing" })
    );
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: expect.stringContaining("Workspace")
      }
    });
  });

  it("returns audit, publish, and schedule logs for the requested workspace only", async () => {
    const response = await getLogs(request("/api/workspaces/ws-fyf/logs"), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as {
      auditEvents: AuditEvent[];
      publishJobs: PublishJob[];
      scheduleJobs: Array<{ workspaceId: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.auditEvents.every((event) => event.workspaceId === "ws-fyf")).toBe(true);
    expect(body.publishJobs.every((job) => job.workspaceId === "ws-fyf")).toBe(true);
    expect(body.scheduleJobs.every((job) => job.workspaceId === "ws-fyf")).toBe(true);
  });

  it("returns workspace health without leaking another tenant", async () => {
    const response = await getHealth(request("/api/workspaces/ws-fyf/health"), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as {
      workspace: { id: string; name: string; demoMode: boolean };
      integrations: { ready: number; total: number; settings: IntegrationSetting[] };
      queues: { failedJobs: number; scheduledJobs: number; publishJobs: number };
      onboarding: { completed: number; total: number; items: OnboardingChecklistItem[] };
      session: DemoSession;
    };

    expect(response.status).toBe(200);
    expect(body.workspace).toEqual({ id: "ws-fyf", name: "FYF AI", demoMode: true });
    expect(body.session).toMatchObject({
      workspaceId: "ws-fyf",
      mode: "demo",
      user: { name: "Demo User", email: "demo@fyf.local" },
      member: { workspaceId: "ws-fyf", role: "owner" }
    });
    expect(body.integrations.total).toBe(3);
    expect(body.integrations.settings.every((setting) => setting.workspaceId === "ws-fyf")).toBe(true);
    expect(body.onboarding).toMatchObject({ completed: 5, total: 5 });
    expect(body.onboarding.items.every((item) => item.workspaceId === "ws-fyf")).toBe(true);
    expect(JSON.stringify(body)).not.toContain("ws-agency");
  });

  it("surfaces failed draft recovery counts only for the owning workspace", async () => {
    const agencyHealthResponse = await getHealth(request("/api/workspaces/ws-agency/health"), params({ workspaceId: "ws-agency" }));
    const agencyHealth = (await agencyHealthResponse.json()) as {
      queues: { failedJobs: number; scheduledJobs: number; publishJobs: number };
    };
    const agencyDraftsResponse = await getDrafts(request("/api/workspaces/ws-agency/drafts"), params({ workspaceId: "ws-agency" }));
    const agencyDrafts = (await agencyDraftsResponse.json()) as DraftsResponse;

    expect(agencyHealthResponse.status).toBe(200);
    expect(agencyHealth.queues.failedJobs).toBe(1);
    expect(agencyDrafts.drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "draft-failed",
          workspaceId: "ws-agency",
          status: "failed"
        })
      ])
    );

    const fyfHealthResponse = await getHealth(request("/api/workspaces/ws-fyf/health"), params({ workspaceId: "ws-fyf" }));
    const fyfHealth = (await fyfHealthResponse.json()) as {
      queues: { failedJobs: number; scheduledJobs: number; publishJobs: number };
    };
    const fyfDraftsResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const fyfDrafts = (await fyfDraftsResponse.json()) as DraftsResponse;

    expect(fyfHealth.queues.failedJobs).toBe(0);
    expect(fyfDrafts.drafts.some((draft) => draft.id === "draft-failed")).toBe(false);
    expect(JSON.stringify(fyfDrafts)).not.toContain("Client campaign recap");
  });

  it("returns bad_request JSON envelopes for malformed route input", async () => {
    await expectBadRequest(
      await generateDraftRoute(
        request("/api/workspaces/ws-fyf/drafts", {
          method: "POST",
          body: "{"
        }),
        params({ workspaceId: "ws-fyf" })
      ),
      /valid JSON/
    );

    await expectBadRequest(
      await generateDraftRoute(
        request("/api/workspaces/ws-fyf/drafts", {
          method: "POST",
          body: JSON.stringify([])
        }),
        params({ workspaceId: "ws-fyf" })
      ),
      /JSON object/
    );

    await expectBadRequest(
      await generateDraftRoute(
        request("/api/workspaces/ws-fyf/drafts", {
          method: "POST",
          body: JSON.stringify({ topic: "   " })
        }),
        params({ workspaceId: "ws-fyf" })
      ),
      /Topic is required/
    );

    await expectBadRequest(
      await editDraftRoute(
        request("/api/workspaces/ws-fyf/drafts/draft-risk", {
          method: "PATCH",
          body: JSON.stringify({ content: "   " })
        }),
        params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
      ),
      /Draft content is required/
    );

    await expectBadRequest(
      await scheduleDraftRoute(
        request("/api/workspaces/ws-fyf/drafts/draft-risk/schedule", {
          method: "POST",
          body: JSON.stringify({ scheduledFor: "" })
        }),
        params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
      ),
      /Scheduled time is required/
    );

    await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    await expectBadRequest(
      await scheduleDraftRoute(
        request("/api/workspaces/ws-fyf/drafts/draft-risk/schedule", {
          method: "POST",
          body: JSON.stringify({ scheduledFor: "   " })
        }),
        params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
      ),
      /Scheduled time is required/
    );

    await expectBadRequest(
      await saveIntegrationRoute(
        request("/api/workspaces/ws-fyf/integrations", {
          method: "PATCH",
          body: JSON.stringify({ provider: "linkedin", secret: "demo" })
        }),
        params({ workspaceId: "ws-fyf" })
      ),
      /Integration provider is required/
    );

    await expectBadRequest(
      await testIntegrationRoute(
        request("/api/workspaces/ws-fyf/integrations/test", {
          method: "POST",
          body: JSON.stringify({ provider: 123 })
        }),
        params({ workspaceId: "ws-fyf" })
      ),
      /Integration provider is required/
    );
  });

  it("returns a JSON error for an unknown workspace", async () => {
    const response = await getDrafts(request("/api/workspaces/ws-missing/drafts"), params({ workspaceId: "ws-missing" }));
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: expect.stringContaining("Workspace")
      }
    });
  });

  it("returns a JSON error for an unknown draft publish request", async () => {
    const response = await publishDraft(
      request("/api/workspaces/ws-fyf/drafts/draft-missing/publish", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-missing" })
    );
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: expect.stringContaining("Draft")
      }
    });
  });

  it("does not publish a draft that belongs to another workspace", async () => {
    const response = await publishDraft(
      request("/api/workspaces/ws-fyf/drafts/draft-failed/publish", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-failed" })
    );
    const body = (await response.json()) as ApiErrorResponse;
    const draftsResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const draftsBody = (await draftsResponse.json()) as DraftsResponse;

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: expect.stringContaining("Draft")
      }
    });
    expect(draftsBody.publishJobs.some((job) => job.draftId === "draft-failed")).toBe(false);
  });

  it("records risk review run when approve evaluates Risk Guard on a risky draft", async () => {
    await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "ဒီ strategy က အမြတ် အာမခံ ရပါတယ်" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );

    const approveResponse = await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const approveBody = (await approveResponse.json()) as DraftMutationResponse;

    expect(approveResponse.status).toBe(409);
    expect(approveBody.ok).toBe(false);

    const logsResponse = await getLogs(request("/api/workspaces/ws-fyf/logs"), params({ workspaceId: "ws-fyf" }));
    const logs = (await logsResponse.json()) as { auditEvents: AuditEvent[] };
    const riskReviewEvents = logs.auditEvents.filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(1);
    expect(riskReviewEvents[0]?.workspaceId).toBe("ws-fyf");
  });

  it("records risk review run when schedule evaluates Risk Guard on approved content", async () => {
    await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );

    await scheduleDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/schedule", {
        method: "POST",
        body: JSON.stringify({ scheduledFor: "Saturday, 9:00 PM" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );

    const logsResponse = await getLogs(request("/api/workspaces/ws-fyf/logs"), params({ workspaceId: "ws-fyf" }));
    const logs = (await logsResponse.json()) as { auditEvents: AuditEvent[] };
    const riskReviewEvents = logs.auditEvents.filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(2);
    expect(riskReviewEvents.some((e) => e.detail.includes("during approval"))).toBe(true);
    expect(riskReviewEvents.some((e) => e.detail.includes("during schedule"))).toBe(true);
  });

  it("successful approve/publish lifecycle records risk review run for both approval and publish", async () => {
    await editDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk", {
        method: "PATCH",
        body: JSON.stringify({ content: "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။" })
      }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    await approveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/approve", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const publishResponse = await publishDraft(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/publish", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const publishBody = (await publishResponse.json()) as PublishResponse;
    expect(publishResponse.status).toBe(200);
    expect(publishBody.job.status).toBe("published");

    const logsResponse = await getLogs(request("/api/workspaces/ws-fyf/logs"), params({ workspaceId: "ws-fyf" }));
    const logs = (await logsResponse.json()) as { auditEvents: AuditEvent[] };
    const riskReviewEvents = logs.auditEvents.filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(2);
    expect(riskReviewEvents.some((e) => e.detail.includes("during approval"))).toBe(true);
    expect(riskReviewEvents.some((e) => e.detail.includes("during publish"))).toBe(true);
    expect(logs.auditEvents.some((e) => e.action === "mock publish completed")).toBe(true);
  });

  it("returns a 409 JSON issue body when Risk Guard blocks publish", async () => {
    vi.resetModules();
    vi.doMock("@/backend/demoRepository", async () => {
      const actual = await vi.importActual<typeof import("@/backend/demoRepository")>("@/backend/demoRepository");
      const repository = new actual.DemoRepository();
      repository.upsertDraft({
        ...repository.getDraft("ws-fyf", "draft-risk"),
        content: "ဒီ strategy က အမြတ် အာမခံ ရပါတယ်",
        riskLevel: "review",
        status: "approved",
        updatedAt: "Test setup"
      });

      return {
        ...actual,
        getDemoRepository: () => repository
      };
    });

    const { POST: publishRiskyDraft } = await import("@/app/api/workspaces/[workspaceId]/drafts/[draftId]/publish/route");
    const response = await publishRiskyDraft(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/publish", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const body = (await response.json()) as PublishConflictResponse;

    expect(response.status).toBe(409);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("conflict");
    expect(body.error.details.draft.status).toBe("risk_blocked");
    expect(body.error.details.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "guaranteed_profit",
          severity: "blocked"
        })
      ])
    );
  });

  it("keeps repository publish idempotency keys stable across repeated publishes for one draft version", () => {
    const repository = new DemoRepository();
    approveDraft(repository, "ws-fyf", "draft-scheduled", { actor: "Tester" });
    const firstJob = publishDraftFromRepository(repository, "ws-fyf", "draft-scheduled", { actor: "Tester" });
    const secondJob = publishDraftFromRepository(repository, "ws-fyf", "draft-scheduled", { actor: "Tester" });
    const draft = repository.getDraft("ws-fyf", "draft-scheduled");

    expect(firstJob.status).toBe("published");
    expect(secondJob.status).toBe("published");
    expect(secondJob.idempotencyKey).toBe(firstJob.idempotencyKey);
    expect(draft.status).toBe("published");
    expect(draft.version).toBe(1);
  });

  it("accepts varied custom schedule times and persists them on the draft and job", async () => {
    const generateResponse = await generateDraftRoute(
      request("/api/workspaces/ws-fyf/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "Schedule time variety test" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const generated = (await generateResponse.json()) as DraftMutationResponse;
    const draftId = generated.draft.id;
    await approveDraftRoute(
      request(`/api/workspaces/ws-fyf/drafts/${draftId}/approve`, { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId })
    );

    const times = ["Monday, 6:00 AM", "2025-12-31 23:59", "End of this month, 11:00 PM"];
    for (const scheduledFor of times) {
      const response = await scheduleDraftRoute(
        request(`/api/workspaces/ws-fyf/drafts/${draftId}/schedule`, {
          method: "POST",
          body: JSON.stringify({ scheduledFor })
        }),
        params({ workspaceId: "ws-fyf", draftId })
      );
      const body = (await response.json()) as ScheduleResponse;
      expect(response.status).toBe(200);
      expect(body.job.scheduledFor).toBe(scheduledFor);
      expect(body.draft.scheduledFor).toBe(scheduledFor);
      // Re-approve for the next iteration since schedule changes status
      await approveDraftRoute(
        request(`/api/workspaces/ws-fyf/drafts/${draftId}/approve`, { method: "POST" }),
        params({ workspaceId: "ws-fyf", draftId })
      );
    }
  });

  it("recovers a failed draft through the recovery route and queues the publish job", async () => {
    const result = await recoverDraftRoute(
      request("/api/workspaces/ws-agency/drafts/draft-failed/recover", { method: "POST" }),
      params({ workspaceId: "ws-agency", draftId: "draft-failed" })
    );
    const body = (await result.json()) as {
      ok: boolean;
      draft: Draft;
      publishJobs: PublishJob[];
      scheduleJobs: ScheduleJob[];
      auditEvents: AuditEvent[];
    };

    expect(result.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.draft.status).toBe("needs_review");
    expect(body.draft.workspaceId).toBe("ws-agency");
    const recoveredJob = body.publishJobs.find((j) => j.draftId === "draft-failed");
    expect(recoveredJob?.status).toBe("queued");
    expect(body.scheduleJobs.every((job) => job.workspaceId === "ws-agency")).toBe(true);
    expect(body.auditEvents.some((e) => e.action === "recovery queued")).toBe(true);
  });

  it("archives a draft through the delete route and cancels active schedule jobs", async () => {
    const result = await archiveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-scheduled", { method: "DELETE" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-scheduled" })
    );
    const body = (await result.json()) as {
      ok: boolean;
      draft: Draft;
      scheduleJobs: ScheduleJob[];
      auditEvents: AuditEvent[];
    };

    expect(result.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.draft.status).toBe("archived");
    expect(body.draft.scheduledFor).toBeUndefined();
    expect(body.scheduleJobs.find((job) => job.draftId === "draft-scheduled")?.status).toBe("cancelled");
    expect(body.auditEvents[0]).toMatchObject({ workspaceId: "ws-fyf", action: "draft archived" });
  });

  it("does not archive a draft that belongs to another workspace", async () => {
    const result = await archiveDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-failed", { method: "DELETE" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-failed" })
    );
    const body = (await result.json()) as ApiErrorResponse;
    const agencyDraftsResponse = await getDrafts(request("/api/workspaces/ws-agency/drafts"), params({ workspaceId: "ws-agency" }));
    const agencyDrafts = (await agencyDraftsResponse.json()) as DraftsResponse;

    expect(result.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(agencyDrafts.drafts.find((draft) => draft.id === "draft-failed")?.status).toBe("failed");
  });

  it("removes a demo media attachment through the media route with version history and audit", async () => {
    const generateResponse = await generateDraftRoute(
      request("/api/workspaces/ws-fyf/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "Media removal route test", mediaName: "route-media.png" })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    const generated = (await generateResponse.json()) as DraftMutationResponse;
    const media = generated.draft.media?.[0];
    expect(media?.id).toBeTruthy();

    const result = await removeMediaRoute(
      request(`/api/workspaces/ws-fyf/drafts/${generated.draft.id}/media/${media!.id}`, { method: "DELETE" }),
      params({ workspaceId: "ws-fyf", draftId: generated.draft.id, mediaId: media!.id })
    );
    const body = (await result.json()) as DraftMutationResponse;

    expect(result.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.draft.media).toBeUndefined();
    expect(body.draft.version).toBe(generated.draft.version + 1);
    expect(body.versions?.[0]).toMatchObject({ draftId: generated.draft.id, version: generated.draft.version + 1 });
    expect(body.auditEvents[0]).toMatchObject({ workspaceId: "ws-fyf", action: "media removed" });
    expect(body.auditEvents[0]?.detail).toContain("No external file was deleted");
  });

  it("does not remove media through the wrong workspace route", async () => {
    const generateResponse = await generateDraftRoute(
      request("/api/workspaces/ws-agency/drafts", {
        method: "POST",
        body: JSON.stringify({ topic: "Agency media isolation", mediaName: "agency-media.png" })
      }),
      params({ workspaceId: "ws-agency" })
    );
    const generated = (await generateResponse.json()) as DraftMutationResponse;
    const media = generated.draft.media?.[0];

    const result = await removeMediaRoute(
      request(`/api/workspaces/ws-fyf/drafts/${generated.draft.id}/media/${media!.id}`, { method: "DELETE" }),
      params({ workspaceId: "ws-fyf", draftId: generated.draft.id, mediaId: media!.id })
    );
    const body = (await result.json()) as ApiErrorResponse;
    const agencyDetail = await getDraftDetail(
      request(`/api/workspaces/ws-agency/drafts/${generated.draft.id}`),
      params({ workspaceId: "ws-agency", draftId: generated.draft.id })
    );
    const agencyBody = (await agencyDetail.json()) as { draft: Draft };

    expect(result.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(agencyBody.draft.media?.[0]?.name).toBe("agency-media.png");
  });

  it("does not recover a draft that is already in a non-failed state", async () => {
    const result = await recoverDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-risk/recover", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const body = (await result.json()) as ApiErrorResponse;

    expect(result.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("recoverable");
  });

  it("does not allow cross-tenant draft recovery", async () => {
    const result = await recoverDraftRoute(
      request("/api/workspaces/ws-fyf/drafts/draft-failed/recover", { method: "POST" }),
      params({ workspaceId: "ws-fyf", draftId: "draft-failed" })
    );
    const body = (await result.json()) as ApiErrorResponse;

    expect(result.status).toBe(404);
    expect(body.ok).toBe(false);
  });

  it("blocks publish when Facebook integration is not configured in non-demo mode and records publish blocked", async () => {
    const state = createDemoState();
    const wsIndex = state.workspaces.findIndex((ws) => ws.id === "ws-fyf");
    state.workspaces[wsIndex] = { ...state.workspaces[wsIndex], demoMode: false };
    const fbIndex = state.integrationSettings.findIndex((s) => s.workspaceId === "ws-fyf" && s.provider === "facebook");
    state.integrationSettings[fbIndex] = { ...state.integrationSettings[fbIndex], status: "needs_setup" };

    const repository = new DemoRepository(state);
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Route test" });
    const job = publishDraftFromRepository(repository, "ws-fyf", "draft-risk", { actor: "Route test" });

    expect(job.status).toBe("blocked");
    expect(job.reason).toContain("Facebook integration");
  });

  it("returns schedule jobs scoped to the requested workspace only", async () => {
    const fyfResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const agencyResponse = await getDrafts(request("/api/workspaces/ws-agency/drafts"), params({ workspaceId: "ws-agency" }));
    const fyfBody = (await fyfResponse.json()) as DraftsResponse;
    const agencyBody = (await agencyResponse.json()) as DraftsResponse;

    expect(fyfBody.scheduleJobs.every((job) => job.workspaceId === "ws-fyf")).toBe(true);
    expect(agencyBody.scheduleJobs.every((job) => job.workspaceId === "ws-agency")).toBe(true);
    expect(fyfBody.scheduleJobs.some((job) => job.workspaceId === "ws-agency")).toBe(false);
  });
});

describe("integration secret masking lifecycle", () => {
  it("redacts secret-like URL query params before storing integration config", () => {
    expect(redactSensitiveUrlQueryParams("https://docs.google.com/spreadsheets/d/demo?api_key=real-key-123&topic=forex#run")).toBe(
      "https://docs.google.com/spreadsheets/d/demo?api_key=redacted&topic=forex#run"
    );

    const sanitized = sanitizeIntegrationConfigPatch({
      sheetUrl: "https://docs.google.com/spreadsheets/d/demo?access_token=raw-sheets-token&range=Posts",
      model: "  gemini-demo-burmese  "
    });

    expect(sanitized).toEqual({
      sheetUrl: "https://docs.google.com/spreadsheets/d/demo?access_token=redacted&range=Posts",
      model: "gemini-demo-burmese"
    });
    expect(JSON.stringify(sanitized)).not.toContain("raw-sheets-token");
  });

  it("normalizes whitespace before masking and never stores raw secret text", () => {
    const saved = saveIntegrationSecret(
      { workspaceId: "ws-fyf", provider: "facebook", status: "needs_setup", lastChecked: "Never" },
      " EAAB real secret token 98765 "
    );

    expect(saved.status).toBe("demo");
    expect(saved.maskedSecret).toBe("EAAB••••65");
    expect(saved.lastChecked).toBe("Just now");
    expect(JSON.stringify(saved)).not.toContain("real secret token");
  });

  it("keeps empty and very short secrets masked for setup states", () => {
    expect(maskSecret("   ")).toBe("not configured");
    expect(maskSecret("abc123")).toBe("••••••");

    const saved = saveIntegrationSecret(
      { workspaceId: "ws-fyf", provider: "facebook", status: "demo", lastChecked: "Yesterday" },
      "   "
    );

    expect(saved.status).toBe("needs_setup");
    expect(saved.maskedSecret).toBe("not configured");
    expect(saved.lastChecked).toBe("Just now");
  });

  it("rejects providers outside the local integration allowlist", async () => {
    const response = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({ provider: "external-workflow", secret: "ignored" })
      }),
      params({ workspaceId: "ws-fyf" })
    );

    await expectBadRequest(response, /Integration provider is required/);
  });

  it("keeps saved integration credentials and config scoped to the requested workspace", async () => {
    const saveResponse = await saveIntegrationRoute(
      request("/api/workspaces/ws-fyf/integrations", {
        method: "PATCH",
        body: JSON.stringify({
          provider: "facebook",
          secret: " fyf workspace secret 98765 ",
          config: {
            pageId: "fyf-page"
          }
        })
      }),
      params({ workspaceId: "ws-fyf" })
    );
    expect(saveResponse.status).toBe(200);

    const agencyResponse = await getIntegrations(
      request("/api/workspaces/ws-agency/integrations"),
      params({ workspaceId: "ws-agency" })
    );
    const agencyBody = (await agencyResponse.json()) as IntegrationsResponse;
    const serializedAgency = JSON.stringify(agencyBody);

    expect(agencyResponse.status).toBe(200);
    expect(agencyBody.settings.every((setting) => setting.workspaceId === "ws-agency")).toBe(true);
    expect(serializedAgency).not.toContain("fyf");
    expect(serializedAgency).not.toContain("98765");
  });
});

type WorkspaceMutationResponse = {
  ok: true;
  workspace: { id: string; name: string; pageName: string };
};

type StyleExamplesResponse = {
  styleExamples: Array<{ id: string; workspaceId: string; topic: string; content: string }>;
};

type StyleExampleMutationResponse = StyleExamplesResponse & {
  ok: true;
  styleExample: { id: string; workspaceId: string; topic: string; content: string };
};

describe("Workspace profile and style-examples routes", () => {
  const workspaceId = "ws-fyf";
  const altWorkspaceId = "ws-agency";

  beforeEach(() => {
    resetDemoRepository();
  });

  it("GET /workspaces/:id returns workspace with pageName field", async () => {
    const response = await getWorkspace(
      request(`/api/workspaces/${workspaceId}`),
      params({ workspaceId })
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { workspace: { pageName: string } };
    expect(typeof body.workspace.pageName).toBe("string");
  });

  it("PATCH /workspaces/:id persists pageName and returns updated workspace", async () => {
    const response = await updateWorkspace(
      request(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ pageName: "FYF Official Page" }),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as WorkspaceMutationResponse;
    expect(body.ok).toBe(true);
    expect(body.workspace.pageName).toBe("FYF Official Page");

    const getResponse = await getWorkspace(
      request(`/api/workspaces/${workspaceId}`),
      params({ workspaceId })
    );
    const getBody = (await getResponse.json()) as { workspace: { pageName: string } };
    expect(getBody.workspace.pageName).toBe("FYF Official Page");
  });

  it("PATCH /workspaces/:id preserves existing pageName when not provided", async () => {
    await updateWorkspace(
      request(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ pageName: "Preserved Name" }),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );
    const response = await updateWorkspace(
      request(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );
    const body = (await response.json()) as WorkspaceMutationResponse;
    expect(body.workspace.pageName).toBe("Preserved Name");
  });

  it("PATCH /workspaces/:id rejects an empty pageName", async () => {
    const response = await updateWorkspace(
      request(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ pageName: "   " }),
        headers: { "content-type": "application/json" }
      }),
      params({ workspaceId })
    );

    expect(response.status).toBe(400);
  });

  it("GET /workspaces/:id/style-examples returns array", async () => {
    const response = await listStyleExamples(
      request(`/api/workspaces/${workspaceId}/style-examples`),
      params({ workspaceId })
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as StyleExamplesResponse;
    expect(Array.isArray(body.styleExamples)).toBe(true);
  });

it("DELETE /workspaces/:id/style-examples?id=XYZ removes the example", async () => {
  const addResponse = await addStyleExample(
    request(`/api/workspaces/${workspaceId}/style-examples`, {
      method: "POST",
      body: JSON.stringify({ topic: "To Delete", content: "Will be deleted" }),
      headers: { "content-type": "application/json" },
    }),
    params({ workspaceId })
  );
  expect(addResponse.status).toBe(200);
  const addedBody = (await addResponse.json()) as StyleExampleMutationResponse;

  const deleteResponse = await deleteStyleExample(
    request(`/api/workspaces/${workspaceId}/style-examples?id=${addedBody.styleExample.id}`, {
      method: "DELETE",
    }),
    params({ workspaceId })
  );
  expect(deleteResponse.status).toBe(200);
  const deletedBody = (await deleteResponse.json()) as StyleExamplesResponse & {
    ok: true;
    deletedStyleExample: { id: string; workspaceId: string; topic: string; content: string };
  };
  expect(deletedBody.ok).toBe(true);
  expect(deletedBody.deletedStyleExample.id).toBe(addedBody.styleExample.id);
  expect(deletedBody.styleExamples.some((example) => example.id === addedBody.styleExample.id)).toBe(false);
});

it("DELETE /workspaces/:id/style-examples is isolated by workspace", async () => {
  const addResponse = await addStyleExample(
    request(`/api/workspaces/${altWorkspaceId}/style-examples`, {
      method: "POST",
      body: JSON.stringify({ topic: "Agency only", content: "Do not delete from FYF" }),
      headers: { "content-type": "application/json" },
    }),
    params({ workspaceId: altWorkspaceId })
  );
  const addedBody = (await addResponse.json()) as StyleExampleMutationResponse;

  const crossWorkspaceDelete = await deleteStyleExample(
    request(`/api/workspaces/${workspaceId}/style-examples?id=${addedBody.styleExample.id}`, {
      method: "DELETE",
    }),
    params({ workspaceId })
  );
  expect(crossWorkspaceDelete.status).toBe(404);

  const agencyResponse = await listStyleExamples(
    request(`/api/workspaces/${altWorkspaceId}/style-examples`),
    params({ workspaceId: altWorkspaceId })
  );
  const agencyBody = (await agencyResponse.json()) as StyleExamplesResponse;
  expect(agencyBody.styleExamples.some((example) => example.id === addedBody.styleExample.id)).toBe(true);
});

  it("POST /workspaces/:id/style-examples with topic+content keys saves and returns example", async () => {
    const response = await addStyleExample(
      request(`/api/workspaces/${workspaceId}/style-examples`, {
        method: "POST",
        body: JSON.stringify({ topic: "Burmese New Year", content: "ကျွန်တော်တို့ FYF မှ ..." }),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as StyleExampleMutationResponse;
    expect(body.ok).toBe(true);
    expect(body.styleExample.topic).toBe("Burmese New Year");
    expect(body.styleExample.content).toBe("ကျွန်တော်တို့ FYF မှ ...");
    expect(body.styleExample.workspaceId).toBe(workspaceId);
    expect(body.styleExamples.length).toBeGreaterThan(0);
  });

  it("POST /workspaces/:id/style-examples rejects rawTopic/rawContent keys (old UI bug)", async () => {
    const response = await addStyleExample(
      request(`/api/workspaces/${workspaceId}/style-examples`, {
        method: "POST",
        body: JSON.stringify({ rawTopic: "test", rawContent: "test content" }),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );
    expect(response.status).toBe(400);
  });

  it("POST /workspaces/:id/style-examples rejects missing topic", async () => {
    const response = await addStyleExample(
      request(`/api/workspaces/${workspaceId}/style-examples`, {
        method: "POST",
        body: JSON.stringify({ content: "some content" }),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );
    expect(response.status).toBe(400);
  });

  it("style examples are scoped to workspace and not visible cross-workspace", async () => {
    await addStyleExample(
      request(`/api/workspaces/${workspaceId}/style-examples`, {
        method: "POST",
        body: JSON.stringify({ topic: "ws1 topic", content: "ws1 content" }),
        headers: { "content-type": "application/json" },
      }),
      params({ workspaceId })
    );

    const response = await listStyleExamples(
      request(`/api/workspaces/${altWorkspaceId}/style-examples`),
      params({ workspaceId: altWorkspaceId })
    );
    const body = (await response.json()) as StyleExamplesResponse;
    expect(body.styleExamples.every((e) => e.workspaceId === altWorkspaceId)).toBe(true);
    expect(body.styleExamples.some((e) => e.topic === "ws1 topic")).toBe(false);
  });
});
