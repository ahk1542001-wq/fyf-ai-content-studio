import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scoreContentBreakdown } from "@/backend/contentQuality";
import { createDemoState, DemoRepository } from "@/backend/demoRepository";
import { applyAiFix, approveDraft, generateDraft, publishDraft, recoverDraft, rejectDraft, saveDraftEdit, scheduleDraft } from "@/backend/draftLifecycle";
import { saveIntegrationSecret } from "@/backend/integrationSettings";
import { buildGeminiPrompt } from "@/backend/promptBuilder";
import { createInMemoryDemoDatabase, createSqliteDemoStateStore, verifyWorkspaceColumns } from "@/database/sqliteDemo";
import { mockSheetsFetchExamples } from "@/integrations/mockSheets";

describe("draft lifecycle services", () => {
  it("writes draft versions and audit events on manual edit", () => {
    const repository = new DemoRepository();
    const draft = saveDraftEdit(repository, "ws-fyf", "draft-risk", "Edited Burmese content မေးလို့ရပါတယ်", { actor: "Tester" });

    expect(draft.version).toBe(3);
    expect(repository.listDraftVersions("ws-fyf", "draft-risk")[0]?.reason).toBe("Manual edit");
    expect(repository.listAuditEvents("ws-fyf")[0]?.action).toBe("draft edited");
  });

  it("blocks risky approval and allows safe approval then mock publish", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "ဒီ strategy က အမြတ် အာမခံ ရပါတယ်", { actor: "Tester" });

    const blocked = approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    expect(blocked.ok).toBe(false);

    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    const approved = approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    expect(approved.ok).toBe(true);

    const publishJob = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    expect(publishJob.status).toBe("published");
    expect(publishJob.idempotencyKey).toContain("ws-fyf:draft-risk");
  });

  it("supports reject and schedule states", () => {
    const repository = new DemoRepository();
    const rejected = rejectDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-scheduled", { actor: "Tester" });
    const schedule = scheduleDraft(repository, "ws-fyf", "draft-scheduled", "Friday, 6:00 PM", { actor: "Tester" });

    expect(rejected.status).toBe("rejected");
    expect(schedule.status).toBe("scheduled");
    expect(repository.listAuditEvents("ws-fyf").some((event) => event.action === "schedule created")).toBe(true);
  });

  it("stores custom schedule times on the draft and real schedule job", () => {
    const repository = new DemoRepository();
    const scheduledFor = "2026-07-08T12:30:00+06:30";

    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", {
      actor: "Tester"
    });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    const schedule = scheduleDraft(repository, "ws-fyf", "draft-risk", scheduledFor, { actor: "Tester" });
    const draft = repository.getDraft("ws-fyf", "draft-risk");

    expect(draft.status).toBe("scheduled");
    expect(draft.scheduledFor).toBe(scheduledFor);
    expect(schedule).toMatchObject({
      workspaceId: "ws-fyf",
      draftId: "draft-risk",
      scheduledFor,
      status: "scheduled"
    });
    expect(repository.listScheduleJobs("ws-fyf")).toEqual(
      expect.arrayContaining([expect.objectContaining({ draftId: "draft-risk", scheduledFor })])
    );
    expect(repository.listScheduleJobs("ws-agency")).toHaveLength(0);
  });

  it("rejects blank schedule input without mutating an approved draft", () => {
    const repository = new DemoRepository();

    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", {
      actor: "Tester"
    });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(() => scheduleDraft(repository, "ws-fyf", "draft-risk", "   ", { actor: "Tester" })).toThrow("Scheduled time is required");
    expect(repository.getDraft("ws-fyf", "draft-risk").status).toBe("approved");
    expect(repository.listScheduleJobs("ws-fyf").some((job) => job.draftId === "draft-risk")).toBe(false);
  });

  it("keeps lifecycle actions inside the requested workspace", () => {
    const repository = new DemoRepository();

    expect(() => saveDraftEdit(repository, "ws-fyf", "draft-failed", "Cross-tenant edit", { actor: "Tester" })).toThrow(
      "Draft not found in workspace"
    );
    expect(() => rejectDraft(repository, "ws-fyf", "draft-failed", { actor: "Tester" })).toThrow("Draft not found in workspace");
    expect(() => scheduleDraft(repository, "ws-fyf", "draft-failed", "Friday, 6:00 PM", { actor: "Tester" })).toThrow(
      "Draft not found in workspace"
    );
    expect(() => publishDraft(repository, "ws-fyf", "draft-failed", { actor: "Tester" })).toThrow("Draft not found in workspace");
    expect(() => scheduleDraft(repository, "ws-fyf", "draft-risk", "Friday, 6:00 PM", { actor: "Tester" })).toThrow(
      "Draft must be approved before scheduling"
    );

    expect(repository.getDraft("ws-agency", "draft-failed").status).toBe("failed");
    expect(repository.listAuditEvents("ws-fyf").map((event) => event.action)).not.toEqual(
      expect.arrayContaining(["draft edited", "draft rejected", "schedule created", "mock publish completed"])
    );
  });

  it("lists onboarding checklist items inside the requested workspace", () => {
    const repository = new DemoRepository();
    const fyfItems = repository.listOnboardingChecklistItems("ws-fyf");
    const agencyItems = repository.listOnboardingChecklistItems("ws-agency");

    expect(fyfItems).toHaveLength(5);
    expect(fyfItems.every((item) => item.workspaceId === "ws-fyf")).toBe(true);
    expect(fyfItems.filter((item) => item.completed)).toHaveLength(5);
    expect(agencyItems).toHaveLength(5);
    expect(agencyItems.every((item) => item.workspaceId === "ws-agency")).toBe(true);
  });

  it("recovers a failed draft back to needs_review and queues the publish job", () => {
    const repository = new DemoRepository();
    const recovered = recoverDraft(repository, "ws-agency", "draft-failed", { actor: "Tester" });

    expect(recovered.status).toBe("needs_review");
    expect(recovered.scheduledFor).toBeUndefined();
    expect(repository.listAuditEvents("ws-agency").some((event) => event.action === "recovery queued")).toBe(true);
    const jobs = repository.listPublishJobsForDraft("ws-agency", "draft-failed");
    const queuedJob = jobs.find((j) => j.status === "queued");
    expect(queuedJob).toBeDefined();
    expect(queuedJob?.reason).toContain("Recovered");
  });

  it("cancels scheduled jobs when recovering a draft back to review", () => {
    const state = createDemoState();
    state.scheduleJobs.push({
      id: "schedule-failed",
      workspaceId: "ws-agency",
      draftId: "draft-failed",
      scheduledFor: "Today, 11:00 PM",
      status: "scheduled"
    });
    const repository = new DemoRepository(state);

    recoverDraft(repository, "ws-agency", "draft-failed", { actor: "Tester" });

    expect(repository.listScheduleJobs("ws-agency")).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "schedule-failed", status: "cancelled" })])
    );
  });

  it("throws when recovering a draft that is not in a failed or blocked state", () => {
    const repository = new DemoRepository();
    expect(() => recoverDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" })).toThrow("not in a recoverable state");
  });

  it("does not allow cross-tenant draft recovery", () => {
    const repository = new DemoRepository();
    expect(() => recoverDraft(repository, "ws-fyf", "draft-failed", { actor: "Tester" })).toThrow("Draft not found in workspace");
  });

  it("supports varied custom schedule time formats", () => {
    const repository = new DemoRepository();
    approveDraft(repository, "ws-fyf", "draft-scheduled", { actor: "Tester" });

    const times = ["Monday, 6:00 AM", "2025-12-31 23:59", "End of this month, 11:00 PM"];
    for (const scheduledFor of times) {
      scheduleDraft(repository, "ws-fyf", "draft-scheduled", scheduledFor, { actor: "Tester" });
      const draft = repository.getDraft("ws-fyf", "draft-scheduled");
      expect(draft.scheduledFor).toBe(scheduledFor);
      expect(draft.status).toBe("scheduled");
      // Re-approve for the next iteration since scheduleDraft changes status to "scheduled"
      repository.upsertDraft({ ...draft, status: "approved", updatedAt: "Re-approve for next iteration" });
    }
  });

  it("manual edit after approval resets to needs_review and blocks direct publish until reapproved", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    const edited = saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ အသစ်ရေးပါတယ်။", { actor: "Tester" });
    expect(edited.status).toBe("needs_review");

    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    expect(job.status).toBe("blocked");
    expect(job.reason).toContain("approved");
  });

  it("AI Fix after scheduled draft resets to needs_review, clears scheduledFor, and cancels schedule jobs", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    scheduleDraft(repository, "ws-fyf", "draft-risk", "Friday, 6:00 PM", { actor: "Tester" });

    const fixed = applyAiFix(repository, "ws-fyf", "draft-risk", { mode: "shorter" }, { actor: "Tester" });
    expect(fixed.draft.status).toBe("needs_review");
    expect(fixed.draft.scheduledFor).toBeUndefined();

    const jobs = repository.listScheduleJobs("ws-fyf");
    expect(jobs.find(j => j.draftId === "draft-risk")?.status).toBe("cancelled");
  });

});

describe("publish readiness enforcement and audit hardening", () => {
  it("blocks publish for an unapproved draft before mock publish can succeed", () => {
    const repository = new DemoRepository();
    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job.status).toBe("blocked");
    expect(job.reason).toContain("approved");
    const auditActions = repository.listAuditEvents("ws-fyf").map((e) => e.action);
    expect(auditActions).toContain("publish blocked");
  });

  it("records risk review run when approve evaluates Risk Guard and blocks risky content", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "ဒီ strategy က အမြတ် အာမခံ ရပါတယ်", { actor: "Tester" });
    const result = approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(result.ok).toBe(false);
    const auditActions = repository.listAuditEvents("ws-fyf").map((e) => e.action);
    expect(auditActions).toContain("risk review run");
    expect(auditActions).toContain("publish blocked");
  });

  it("records risk review run when approve succeeds on safe content", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    const result = approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(result.ok).toBe(true);
    const riskReviewEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(1);
    expect(riskReviewEvents[0]?.detail).toContain("during approval");
  });

  it("successful approve then publish lifecycle includes risk review run audit events", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job.status).toBe("published");
    const riskReviewEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(2);
    expect(riskReviewEvents.some((e) => e.detail.includes("during approval"))).toBe(true);
    expect(riskReviewEvents.some((e) => e.detail.includes("during publish"))).toBe(true);
  });

  it("records risk review run when schedule evaluates Risk Guard", () => {
    const repository = new DemoRepository();
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    scheduleDraft(repository, "ws-fyf", "draft-risk", "Friday, 6:00 PM", { actor: "Tester" });

    const riskReviewEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(2);
    expect(riskReviewEvents.some((e) => e.detail.includes("during schedule"))).toBe(true);
  });

  it("blocks publish when Risk Guard finds blocked issues on approved draft and records risk review run", () => {
    const repository = new DemoRepository();
    repository.upsertDraft({
      ...repository.getDraft("ws-fyf", "draft-risk"),
      content: "ဒီ strategy က အမြတ် အာမခံ ရပါတယ်",
      status: "approved",
      riskLevel: "review",
      updatedAt: "Test setup"
    });

    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job.status).toBe("blocked");
    expect(job.reason).toContain("Risk Guard");
    const draft = repository.getDraft("ws-fyf", "draft-risk");
    expect(draft.status).toBe("risk_blocked");
    const riskReviewEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "risk review run");
    expect(riskReviewEvents.length).toBeGreaterThanOrEqual(1);
    expect(riskReviewEvents[0]?.detail).toContain("during publish");
    const blockedEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "publish blocked");
    expect(blockedEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("blocks approved unsafe trading promises before mock publish", () => {
    const repository = new DemoRepository();
    repository.upsertDraft({
      ...repository.getDraft("ws-fyf", "draft-risk"),
      content: "ဒီ strategy က no risk ဖြစ်ပြီး copy my trade လုပ်ရင် အန္တရာယ် မရှိပါဘူး။",
      status: "approved",
      riskLevel: "review",
      updatedAt: "Test setup"
    });

    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job.status).toBe("blocked");
    expect(repository.getDraft("ws-fyf", "draft-risk")).toMatchObject({
      status: "risk_blocked",
      riskLevel: "blocked"
    });
    expect(repository.listAuditEvents("ws-fyf").some((event) => event.action === "publish blocked")).toBe(true);
  });

  it("blocks review-level misleading claims before mock publish", () => {
    const repository = new DemoRepository();
    repository.upsertDraft({
      ...repository.getDraft("ws-fyf", "draft-risk"),
      content: "ဒီ signal က အနိုင်ရနှုန်း ၁၀၀% ဖြစ်ပြီး သေချာပေါက် နိုင်ပါတယ်။",
      status: "approved",
      riskLevel: "review",
      updatedAt: "Test setup"
    });

    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job).toMatchObject({
      status: "blocked",
      reason: "Risk Guard blocked this draft."
    });
    expect(repository.getDraft("ws-fyf", "draft-risk").status).toBe("approved");
    expect(repository.listAuditEvents("ws-fyf").some((event) => event.action === "publish blocked")).toBe(true);
  });

  it("blocks publish when Facebook integration is not configured in non-demo mode", () => {
    const state = createDemoState();
    const wsIndex = state.workspaces.findIndex((ws) => ws.id === "ws-fyf");
    state.workspaces[wsIndex] = { ...state.workspaces[wsIndex], demoMode: false };
    const fbIndex = state.integrationSettings.findIndex((s) => s.workspaceId === "ws-fyf" && s.provider === "facebook");
    state.integrationSettings[fbIndex] = { ...state.integrationSettings[fbIndex], status: "needs_setup" };
    const repository = new DemoRepository(state);

    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job.status).toBe("blocked");
    expect(job.reason).toContain("Facebook integration");
    const blockedEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "publish blocked");
    expect(blockedEvents.some((e) => e.detail.includes("Facebook integration"))).toBe(true);
  });

  it("demo mode never does live external publishing and records mock publish completed", () => {
    const repository = new DemoRepository();
    const ws = repository.getWorkspace("ws-fyf");
    expect(ws.demoMode).toBe(true);
    saveDraftEdit(repository, "ws-fyf", "draft-risk", "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။", { actor: "Tester" });
    approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });
    const job = publishDraft(repository, "ws-fyf", "draft-risk", { actor: "Tester" });

    expect(job.status).toBe("published");
    expect(job.fakePostId).toBeTruthy();
    const mockEvents = repository.listAuditEvents("ws-fyf").filter((e) => e.action === "mock publish completed");
    expect(mockEvents.some((e) => e.detail.includes("Demo mode"))).toBe(true);
  });
});

describe("settings, prompt, quality, and sqlite support", () => {
  it("masks integration secrets without returning raw values", () => {
    const setting = saveIntegrationSecret(
      { workspaceId: "ws-fyf", provider: "facebook", status: "needs_setup", lastChecked: "Never" },
      "EAAB_REAL_SECRET_TOKEN_12345"
    );

    expect(setting.maskedSecret).toBe("EAAB••••45");
    expect(JSON.stringify(setting)).not.toContain("REAL_SECRET_TOKEN");
  });

  it("preserves safe provider config metadata when masking a new secret", () => {
    const setting = saveIntegrationSecret(
      {
        workspaceId: "ws-fyf",
        provider: "facebook",
        status: "demo",
        maskedSecret: "old••••ed",
        lastChecked: "Yesterday",
        config: {
          pageId: "page_123",
          pageName: "FYF AI Forex",
          defaultPublishMode: "review_first"
        }
      } as Parameters<typeof saveIntegrationSecret>[0] & { config: Record<string, unknown> },
      "EAAB_NEW_RAW_FACEBOOK_SECRET_67890"
    ) as ReturnType<typeof saveIntegrationSecret> & { config?: Record<string, unknown> };

    expect(setting.maskedSecret).toBe("EAAB••••90");
    expect(setting.config).toEqual({
      pageId: "page_123",
      pageName: "FYF AI Forex",
      defaultPublishMode: "review_first"
    });
    expect(JSON.stringify(setting)).not.toContain("NEW_RAW_FACEBOOK_SECRET");
  });

  it("builds a Gemini prompt with Burmese few-shot examples and forbidden phrases", () => {
    const repository = new DemoRepository();
    const prompt = buildGeminiPrompt({
      topic: "Risk control",
      tone: "Friendly",
      length: "Medium",
      angle: "Education first",
      audience: "Myanmar beginners",
      cta: "comment မှာ မေးပါ",
      brandProfile: repository.getBrandProfile("ws-fyf"),
      examples: mockSheetsFetchExamples("ws-fyf")
    });

    expect(prompt).toContain("Return only the final Burmese draft");
    expect(prompt).toContain("အမြတ် အာမခံ");
    expect(/[\u1000-\u109F]/.test(prompt)).toBe(true);
  });

  it("uses updated Brand Voice OS rules when building prompts", () => {
    const repository = new DemoRepository();
    const current = repository.getBrandProfile("ws-fyf");
    repository.updateBrandProfile({
      ...current,
      targetAudience: "Myanmar traders who want safer learning habits",
      toneRules: ["Calm mentor", "No signal selling"],
      forbiddenPhrases: ["instant rich", "အမြတ် အာမခံ"],
      preferredCtas: ["Inbox for checklist"],
      voiceNotes: "Use shorter Burmese teaching paragraphs."
    });

    const prompt = buildGeminiPrompt({
      topic: "Position sizing",
      tone: "Professional",
      length: "Short",
      angle: "Risk discipline",
      audience: "Busy traders",
      cta: "Inbox for checklist",
      brandProfile: repository.getBrandProfile("ws-fyf"),
      examples: mockSheetsFetchExamples("ws-fyf")
    });

    expect(prompt).toContain("Calm mentor");
    expect(prompt).toContain("Myanmar traders who want safer learning habits");
    expect(prompt).toContain("No signal selling");
    expect(prompt).toContain("instant rich");
    expect(prompt).toContain("Inbox for checklist");
    expect(prompt).toContain("Use shorter Burmese teaching paragraphs.");
    expect(/[\u1000-\u109F]/.test(prompt)).toBe(true);
  });

  it("uses updated Brand Voice OS rules when generating drafts", () => {
    const repository = new DemoRepository();
    repository.updateBrandProfile({
      ...repository.getBrandProfile("ws-fyf"),
      toneRules: ["Calm mentor generation rule", "No hype"],
      forbiddenPhrases: ["instant rich"],
      preferredCtas: ["Inbox for checklist"],
      voiceNotes: "Use shorter Burmese teaching paragraphs."
    });

    const result = generateDraft(
      repository,
      "ws-fyf",
      {
        topic: "Risk plan for beginners",
        tone: "Professional",
        length: "Short",
        angle: "Risk management",
        audience: "Myanmar beginners",
        cta: "Comment question"
      },
      { actor: "Tester" }
    );

    expect(result.draft.content).toContain("Risk plan for beginners");
    expect(result.draft.content).toContain("Inbox for checklist");
    expect(result.draft.content).not.toContain("instant rich");
    expect(/[\u1000-\u109F]/.test(result.draft.content)).toBe(true);
  });

  it("returns quality score breakdowns for UI readiness", () => {
    const score = scoreContentBreakdown("Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ comment မှာ မေးနိုင်ပါတယ်။");
    expect(score.overall).toBeGreaterThan(70);
    expect(score.riskReadiness).toBeGreaterThan(80);
  });

  it("creates the SQLite schema and verifies workspace-owned tables", () => {
    const database = createInMemoryDemoDatabase();
    const checks = verifyWorkspaceColumns(database);
    expect(checks.every((check) => check.hasWorkspaceId)).toBe(true);
  });

  it("persists demo repository state to a SQLite snapshot", () => {
    const directory = mkdtempSync(join(tmpdir(), "fyf-demo-db-"));
    const dbPath = join(directory, "demo-state.sqlite");

    try {
      const firstStore = createSqliteDemoStateStore(dbPath);
      const firstRepository = new DemoRepository(createDemoState(), firstStore);
      const edited = saveDraftEdit(
        firstRepository,
        "ws-fyf",
        "draft-risk",
        "Risk ကို သေချာတွက်ပြီး journal နဲ့ပြန်သုံးသပ်ပါ။ comment မှာ မေးနိုင်ပါတယ်။",
        { actor: "Tester" }
      );
      firstStore.close();

      const secondStore = createSqliteDemoStateStore(dbPath);
      const restored = secondStore.load();
      expect(restored?.drafts.find((draft) => draft.id === "draft-risk")?.content).toBe(edited.content);

      const secondRepository = new DemoRepository(restored ?? createDemoState(), secondStore);
      expect(secondRepository.getDraft("ws-fyf", "draft-risk").version).toBe(3);
      expect(secondRepository.listDraftVersions("ws-fyf", "draft-risk")[0]?.reason).toBe("Manual edit");
      expect(secondRepository.listAuditEvents("ws-fyf")[0]?.action).toBe("draft edited");
      secondStore.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
