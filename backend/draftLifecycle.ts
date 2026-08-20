import type { AuditEvent, BrandProfile, Draft, DraftVersion, PublishJob, ScheduleJob, ContentPillarKey } from "@/backend/types";
import { scoreContent } from "@/backend/contentQuality";
import { DemoRepository } from "@/backend/demoRepository";
import { mockGeminiGenerateDraft } from "@/integrations/mockGemini";
import { mockFacebookPublish } from "@/integrations/mockFacebook";
import { buildSafeContextRewrite, runRiskGuard } from "@/integrations/riskGuard";
import { buildGeminiPrompt } from "@/backend/promptBuilder";
import { LLMGateway } from "@/src/infrastructure/llm/gateway";

type Actor = {
  actor: string;
};

function nowLabel() {
  return "Just now";
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function event(workspaceId: string, actor: string, action: string, detail: string): AuditEvent {
  return { id: id("audit"), workspaceId, actor, action, detail, createdAt: nowLabel() };
}

function versionFor(draft: Draft, reason: string): DraftVersion {
  return {
    id: id("version"),
    workspaceId: draft.workspaceId,
    draftId: draft.id,
    version: draft.version,
    content: draft.content,
    reason,
    createdAt: nowLabel()
  };
}

export type GenerateDraftOptions = {
  topic: string;
  tone?: string;
  length?: string;
  angle?: string;
  audience?: string;
  cta?: string;
  mediaName?: string;
  pillar?: ContentPillarKey | string;
};

export type AiFixMode = "safer" | "hook" | "shorter" | "professional" | "emotional" | "brand_style" | "cta" | "client_feedback" | "custom";

const editLockStatuses = new Set<Draft["status"]>(["approved", "scheduled", "published", "rejected", "risk_blocked", "failed"]);

function riskLevelFor(content: string): Draft["riskLevel"] {
  const issues = runRiskGuard(content);
  if (issues.some((issue) => issue.severity === "blocked")) return "blocked";
  return issues.length ? "review" : "safe";
}

function summarizeBrandContext(brandProfile?: BrandProfile) {
  if (!brandProfile) {
    return {
      project: "FYF AI helps Myanmar beginners learn practical AI workflows.",
      audience: "Myanmar beginners and small business owners",
      voice: "clear, beginner-friendly, and practical",
      cta: "comment မှာ မေးပါ"
    };
  }

  return {
    project: brandProfile.description || "FYF AI helps Myanmar beginners learn practical AI workflows.",
    audience: brandProfile.targetAudience || "Myanmar beginners and small business owners",
    voice: brandProfile.voiceNotes || brandProfile.toneRules.join(", ") || "clear, beginner-friendly, and practical",
    cta: brandProfile.customCta || brandProfile.preferredCtas[0] || "comment မှာ မေးပါ"
  };
}

function buildAiFixContent(mode: AiFixMode, topic: string, content: string, brandProfile?: BrandProfile, instruction?: string) {
  const issues = runRiskGuard(content);
  const context = summarizeBrandContext(brandProfile);
  if (mode === "safer") {
    return {
      content: buildSafeContextRewrite(topic, content, issues, brandProfile),
      reason: issues.some((issue) => issue.severity === "blocked")
        ? "Removed blocked claims and reframed the post around the saved FYF user context."
        : "Replaced review-risk wording while preserving the current draft structure.",
      issues
    };
  }

  if (mode === "client_feedback" || mode === "custom") {
    const feedbackText = instruction?.trim() || "Applied client revision instructions.";
    let revisedContent = content;
    if (feedbackText.toLowerCase().includes("short") || feedbackText.includes("တို")) {
      revisedContent = content.split("\n\n").slice(0, 3).join("\n\n");
    } else if (feedbackText.includes("ခေါင်းစဉ်") || feedbackText.toLowerCase().includes("hook")) {
      revisedContent = `📌 [Client Note: ${feedbackText}]\n\n${content}`;
    } else {
      revisedContent = `${content}\n\n💡 [Client Update: ${feedbackText}]`;
    }

    return {
      content: revisedContent,
      reason: `Client Feedback: ${feedbackText}`,
      issues
    };
  }

  const variants: Record<Exclude<AiFixMode, "safer" | "client_feedback" | "custom">, { content: string; reason: string }> = {
    hook: {
      content: `AI workflow စတင်သူအများစု အရင်ဆုံးရှင်းသင့်တဲ့အချက်တစ်ခုက tool မရွေးခင် ကိုယ့်လုပ်ငန်း context ကိုသေချာသတ်မှတ်တာပါ။\n\n${content}`,
      reason: "Added a stronger opening hook for the saved FYF audience."
    },
    shorter: {
      content: content.split("\n").slice(0, 4).join("\n"),
      reason: "Compressed the draft into a shorter review-friendly version."
    },
    professional: {
      content: `${content}\n\nမှတ်ချက် - ${context.audience} အတွက် အသုံးဝင်ဖို့ ကိုယ့် data, goal, workflow နဲ့ကိုက်အောင် သေးသေးလေးစမ်းပြီးမှ ဆက်တိုးပါ။`,
      reason: "Added a more professional context-aware closing note."
    },
    emotional: {
      content: `AI ကိုစသုံးတဲ့အချိန်မှာ tool များလို့လမ်းပျောက်သလိုခံစားရတာ ပုံမှန်ပါ။ အရေးကြီးတာက ကိုယ့်အလုပ် flow တစ်ခုကို ရှင်းရှင်းလင်းလင်းစတင်နိုင်ဖို့ပါ။\n\n${content}`,
      reason: "Made the draft more human while keeping the saved user context central."
    },
    brand_style: {
      content: `${content}\n\nFYF AI အနေနဲ့ tone က ${context.voice} ဖြစ်ရပါမယ်။ အဓိကက ${context.project} ဆိုတဲ့ context ကိုမပျောက်စေဘဲ action တစ်ခုချင်းကို လွယ်လွယ်ကူကူလုပ်နိုင်အောင်ပြောတာပါ။`,
      reason: "Applied the saved FYF user context while keeping the existing fix-mode API compatible."
    },
    cta: {
      content: `${content}\n\n${context.cta}`,
      reason: "Clarified the call to action from the saved user context."
    }
  };

  return { ...variants[mode], issues };
}

function draftGenerationContext(repository: DemoRepository, workspaceId: string, input: GenerateDraftOptions) {
  const workspace = repository.getWorkspace(workspaceId);
  const topic = input.topic.trim();
  if (!topic) throw new Error("Topic is required");

  const examples = repository.listStyleExamples(workspaceId);
  const brandProfile = repository.getBrandProfile(workspaceId);
  const generationInput = {
    topic,
    tone: input.tone ?? "Friendly",
    length: input.length ?? "Medium",
    angle: input.angle ?? "Education first",
    audience: input.audience ?? "Myanmar beginners",
    cta: input.cta ?? "comment မှာ မေးပါ",
    brandProfile,
    examples
  };
  const prompt = buildGeminiPrompt(generationInput);
  return { workspace, topic, examples, prompt, generationInput };
}

export function persistGeneratedDraft(
  repository: DemoRepository,
  workspaceId: string,
  input: GenerateDraftOptions,
  actor: Actor,
  content: string,
  prompt: string,
  providerLabel: string
) {
  const workspace = repository.getWorkspace(workspaceId);
  const topic = input.topic.trim();
  const examples = repository.listStyleExamples(workspaceId);
  if (!content.trim()) throw new Error("Gemini returned an empty draft");
  const media = input.mediaName
    ? [{ id: id("media"), workspaceId, name: input.mediaName, type: "image" as const, size: "demo upload" }]
    : undefined;
  const draft: Draft = {
    id: id("draft"),
    workspaceId,
    topic,
    content,
    status: "needs_review",
    riskLevel: riskLevelFor(content),
    score: scoreContent(content),
    version: 1,
    updatedAt: nowLabel(),
    media
  };

  repository.upsertDraft(draft);
  repository.addDraftVersion(versionFor(draft, `Initial ${providerLabel} output`));
  repository.addPromptVersion({
    id: id("prompt"),
    workspaceId,
    name: `${providerLabel} Burmese draft prompt`,
    prompt,
    createdAt: nowLabel()
  });
  media?.forEach((asset) => repository.addMediaAsset({ ...asset, draftId: draft.id }));
  repository.addAuditEvent(
    event(workspaceId, actor.actor, "draft created", `${providerLabel} generated a Burmese draft for ${workspace.name}.`)
  );
  return { draft, examplesUsed: examples.length };
}

export function generateDraft(repository: DemoRepository, workspaceId: string, input: GenerateDraftOptions, actor: Actor) {
  const { prompt, generationInput } = draftGenerationContext(repository, workspaceId, input);
  const content = mockGeminiGenerateDraft({ ...generationInput, prompt });
  return persistGeneratedDraft(repository, workspaceId, input, actor, content, prompt, "Mock Gemini");
}

export async function generateLiveDraft(repository: DemoRepository, workspaceId: string, input: GenerateDraftOptions, actor: Actor) {
  const { prompt } = draftGenerationContext(repository, workspaceId, input);
  const content = await LLMGateway.generateFromPrompt(prompt);
  return persistGeneratedDraft(repository, workspaceId, input, actor, content, prompt, "Vertex Gemini");
}

export function saveDraftEdit(repository: DemoRepository, workspaceId: string, draftId: string, content: string, actor: Actor) {
  const existing = repository.getDraft(workspaceId, draftId);
  if (!content.trim()) throw new Error("Draft content is required");

  let status = existing.status;
  let scheduledFor = existing.scheduledFor;

  if (editLockStatuses.has(status)) {
    status = "needs_review";
    scheduledFor = undefined;
    repository.cancelScheduleJobsForDraft(workspaceId, draftId);
  }

  const next: Draft = {
    ...existing,
    content,
    status,
    scheduledFor,
    score: scoreContent(content),
    riskLevel: riskLevelFor(content),
    version: existing.version + 1,
    updatedAt: nowLabel()
  };
  repository.upsertDraft(next);
  repository.addDraftVersion(versionFor(next, "Manual edit"));
  repository.addAuditEvent(event(workspaceId, actor.actor, "draft edited", "Draft content changed and version history saved."));
  return next;
}

export function applyAiFix(
  repository: DemoRepository,
  workspaceId: string,
  draftId: string,
  input: { mode: AiFixMode; content?: string; topic?: string; brandProfile?: BrandProfile; instruction?: string },
  actor: Actor
) {
  const existing = repository.getDraft(workspaceId, draftId);
  const source = input.content?.trim() ? input.content : existing.content;
  if (!source.trim()) throw new Error("Draft content is required");
  const topic = input.topic?.trim() || existing.topic;
  const fixed = buildAiFixContent(input.mode, topic, source, input.brandProfile, input.instruction);

  let status = existing.status;
  let scheduledFor = existing.scheduledFor;

  if (editLockStatuses.has(status)) {
    status = "needs_review";
    scheduledFor = undefined;
    repository.cancelScheduleJobsForDraft(workspaceId, draftId);
  }

  const newRevision = {
    version: existing.version + 1,
    instruction: input.instruction || fixed.reason,
    previousContent: source,
    newContent: fixed.content,
    timestamp: new Date().toISOString()
  };

  const next: Draft = {
    ...existing,
    content: fixed.content,
    status,
    scheduledFor,
    score: scoreContent(fixed.content),
    riskLevel: riskLevelFor(fixed.content),
    version: existing.version + 1,
    revisions: [...(existing.revisions || []), newRevision],
    updatedAt: nowLabel()
  };

  repository.upsertDraft(next);
  repository.addDraftVersion(versionFor(next, `AI Fix: ${fixed.reason}`));
  repository.addAuditEvent(event(workspaceId, actor.actor, "AI fix applied", fixed.reason));
  return {
    draft: next,
    before: source,
    after: fixed.content,
    reason: fixed.reason,
    issues: fixed.issues
  };
}

export function approveDraft(repository: DemoRepository, workspaceId: string, draftId: string, actor: Actor) {
  const draft = repository.getDraft(workspaceId, draftId);
  const issues = runRiskGuard(draft.content);
  repository.addAuditEvent(event(workspaceId, actor.actor, "risk review run", `Risk Guard evaluated draft "${draft.topic}" during approval. ${issues.length} issue(s) found.`));

  if (issues.some((issue) => issue.severity === "blocked")) {
    const blocked = repository.upsertDraft({ ...draft, status: "risk_blocked", riskLevel: "blocked", updatedAt: nowLabel() });
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", "Approval blocked because Risk Guard found a severe issue."));
    return { ok: false as const, draft: blocked, issues };
  }

  const approved = repository.upsertDraft({
    ...draft,
    status: "approved",
    riskLevel: issues.length ? "review" : "safe",
    updatedAt: nowLabel()
  });
  repository.addAuditEvent(
    event(workspaceId, actor.actor, "approve clicked", `Draft approved after Risk Guard review. draftId=${draftId}`)
  );
  return { ok: true as const, draft: approved, issues };
}

export function rejectDraft(repository: DemoRepository, workspaceId: string, draftId: string, actor: Actor, reason = "Rejected during review") {
  const draft = repository.getDraft(workspaceId, draftId);
  const rejected = repository.upsertDraft({ ...draft, status: "rejected", updatedAt: nowLabel() });
  repository.addAuditEvent(event(workspaceId, actor.actor, "draft rejected", reason));
  return rejected;
}

export function archiveDraft(repository: DemoRepository, workspaceId: string, draftId: string, actor: Actor) {
  const draft = repository.getDraft(workspaceId, draftId);
  const archived = repository.upsertDraft({ ...draft, status: "archived", scheduledFor: undefined, updatedAt: nowLabel() });
  repository.cancelScheduleJobsForDraft(workspaceId, draftId);
  repository.addAuditEvent(event(workspaceId, actor.actor, "draft archived", `Draft "${draft.topic}" was archived in demo mode.`));
  return archived;
}

export function removeDraftMedia(repository: DemoRepository, workspaceId: string, draftId: string, mediaId: string, actor: Actor) {
  const draft = repository.getDraft(workspaceId, draftId);
  const media = draft.media?.find((item) => item.id === mediaId);
  if (!media) throw new Error("Media asset not found in draft");
  const next: Draft = {
    ...draft,
    media: draft.media?.filter((item) => item.id !== mediaId),
    version: draft.version + 1,
    updatedAt: nowLabel()
  };
  if (!next.media?.length) delete next.media;

  repository.upsertDraft(next);
  repository.addDraftVersion(versionFor(next, `Media removed: ${media.name}`));
  repository.removeMediaAsset(workspaceId, mediaId);
  repository.addAuditEvent(event(workspaceId, actor.actor, "media removed", `Removed demo media attachment "${media.name}". No external file was deleted.`));
  return next;
}

export function updateBrandProfile(
  repository: DemoRepository,
  workspaceId: string,
  input: Omit<BrandProfile, "id" | "workspaceId">,
  actor: Actor
) {
  const existing = repository.getBrandProfile(workspaceId);
  const next = repository.updateBrandProfile({
    ...existing,
    description: input.description,
    targetAudience: input.targetAudience,
    toneRules: input.toneRules,
    forbiddenPhrases: input.forbiddenPhrases,
    preferredCtas: input.preferredCtas,
    voiceNotes: input.voiceNotes
  });
  repository.addAuditEvent(event(workspaceId, actor.actor, "brand profile updated", "Brand Voice OS rules were updated in demo mode."));
  return next;
}

export function scheduleDraft(repository: DemoRepository, workspaceId: string, draftId: string, scheduledFor: string, actor: Actor): ScheduleJob {
  const normalizedSchedule = scheduledFor.trim();
  if (!normalizedSchedule) throw new Error("Scheduled time is required");
  const draft = repository.getDraft(workspaceId, draftId);
  if (draft.status !== "approved" && draft.status !== "scheduled") {
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", "Draft must be approved before scheduling."));
    throw new Error("Draft must be approved before scheduling.");
  }
  const issues = runRiskGuard(draft.content);
  repository.addAuditEvent(event(workspaceId, actor.actor, "risk review run", `Risk Guard evaluated draft "${draft.topic}" during schedule. ${issues.length} issue(s) found.`));
  if (issues.length) {
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", "Risk Guard blocked scheduling."));
    throw new Error("Risk Guard blocked scheduling.");
  }
  const scheduled = repository.upsertDraft({ ...draft, status: "scheduled", scheduledFor: normalizedSchedule, updatedAt: nowLabel() });
  repository.addAuditEvent(event(workspaceId, actor.actor, "schedule created", `Draft scheduled for ${normalizedSchedule}.`));
  return repository.addOrReuseScheduleJob({
    id: id("schedule"),
    workspaceId,
    draftId: scheduled.id,
    scheduledFor: normalizedSchedule,
    status: "scheduled"
  });
}

export function recoverDraft(repository: DemoRepository, workspaceId: string, draftId: string, actor: Actor) {
  const draft = repository.getDraft(workspaceId, draftId);
  const relatedJobs = repository.listPublishJobsForDraft(workspaceId, draftId);
  const recoverableJobs = relatedJobs.filter((job) => job.status === "failed" || job.status === "blocked");
  if (draft.status !== "failed" && draft.status !== "risk_blocked" && recoverableJobs.length === 0) {
    throw new Error("Draft is not in a recoverable state.");
  }

  const recovered = repository.upsertDraft({
    ...draft,
    status: "needs_review",
    scheduledFor: undefined,
    riskLevel: riskLevelFor(draft.content),
    score: scoreContent(draft.content),
    updatedAt: nowLabel()
  });

  recoverableJobs.forEach((job) => {
    repository.updatePublishJob({
      ...job,
      status: "queued",
      reason: "Recovered to review queue for demo retry.",
      createdAt: nowLabel()
    });
  });
  repository.cancelScheduleJobsForDraft(workspaceId, draftId);

  repository.addAuditEvent(event(workspaceId, actor.actor, "recovery queued", "Failed draft moved back to review for a demo retry."));
  return recovered;
}

export function publishDraft(repository: DemoRepository, workspaceId: string, draftId: string, actor: Actor): PublishJob {
  const workspace = repository.getWorkspace(workspaceId);
  const draft = repository.getDraft(workspaceId, draftId);
  const idempotencyKey = `${workspaceId}:${draftId}:${draft.version}`;
  const existingJob = repository.findPublishJobByIdempotencyKey(workspaceId, idempotencyKey);
  if (existingJob?.status === "published") return existingJob;

  if (draft.status !== "approved") {
    const reason = "Draft must be approved before publishing.";
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", reason));
    return repository.addOrReusePublishJob({
      id: id("publish"),
      workspaceId,
      draftId,
      status: "blocked",
      idempotencyKey,
      reason,
      createdAt: nowLabel()
    });
  }

  const issues = runRiskGuard(draft.content);
  repository.addAuditEvent(event(workspaceId, actor.actor, "risk review run", `Risk Guard evaluated draft "${draft.topic}" during publish. ${issues.length} issue(s) found.`));

  if (issues.some((issue) => issue.severity === "blocked")) {
    repository.upsertDraft({
      ...draft,
      status: "risk_blocked",
      riskLevel: "blocked",
      updatedAt: nowLabel()
    });
    const reason = "Risk Guard blocked publishing due to severe content issues.";
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", reason));
    return repository.addOrReusePublishJob({
      id: id("publish"),
      workspaceId,
      draftId,
      status: "blocked",
      idempotencyKey,
      reason,
      createdAt: nowLabel()
    });
  }

  const facebookSetting = repository.getIntegrationSetting(workspaceId, "facebook");
  if (!workspace.demoMode && !["demo", "healthy"].includes(facebookSetting.status)) {
    const reason = "Facebook integration must be configured before publishing.";
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", reason));
    return repository.addOrReusePublishJob({
      id: id("publish"),
      workspaceId,
      draftId,
      status: "blocked",
      idempotencyKey,
      reason,
      createdAt: nowLabel()
    });
  }

  if (workspace.demoMode) {
    const result = mockFacebookPublish(draft);

    if (!result.ok) {
      const reason = result.reason ?? "Mock publish failed.";
      repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", reason));
      return repository.addOrReusePublishJob({
        id: id("publish"),
        workspaceId,
        draftId,
        status: "blocked",
        idempotencyKey,
        reason,
        createdAt: nowLabel()
      });
    }

    repository.upsertDraft({ ...draft, status: "published", riskLevel: "safe", updatedAt: nowLabel() });
    repository.addAuditEvent(event(workspaceId, actor.actor, "mock publish completed", `Fake Facebook post ID ${result.fakePostId} returned. Demo mode: no live external publish.`));
    return repository.addOrReusePublishJob({
      id: id("publish"),
      workspaceId,
      draftId,
      status: "published",
      idempotencyKey,
      fakePostId: result.fakePostId,
      createdAt: nowLabel()
    });
  }

  const result = mockFacebookPublish(draft);

  if (!result.ok) {
    const reason = result.reason ?? "Mock publish failed.";
    repository.addAuditEvent(event(workspaceId, actor.actor, "publish blocked", reason));
    return repository.addOrReusePublishJob({
      id: id("publish"),
      workspaceId,
      draftId,
      status: "blocked",
      idempotencyKey,
      reason,
      createdAt: nowLabel()
    });
  }

  repository.upsertDraft({ ...draft, status: "published", riskLevel: "safe", updatedAt: nowLabel() });
  repository.addAuditEvent(event(workspaceId, actor.actor, "mock publish completed", `Fake Facebook post ID ${result.fakePostId} returned.`));
  return repository.addOrReusePublishJob({
    id: id("publish"),
    workspaceId,
    draftId,
    status: "published",
    idempotencyKey,
    fakePostId: result.fakePostId,
    createdAt: nowLabel()
  });
}

export function markManuallyPosted(
  repository: DemoRepository,
  workspaceId: string,
  draftId: string,
  actor: Actor,
  externalPostId?: string
): PublishJob {
  const draft = repository.getDraft(workspaceId, draftId);
  const idempotencyKey = `${workspaceId}:${draftId}:${draft.version}:manual`;
  const existingJob = repository.findPublishJobByIdempotencyKey(workspaceId, idempotencyKey);
  if (existingJob?.status === "published") return existingJob;

  if (draft.status !== "approved" && draft.status !== "scheduled") {
    const reason = "Draft must be approved before marking it manually posted.";
    repository.addAuditEvent(event(workspaceId, actor.actor, "manual post blocked", reason));
    return repository.addOrReusePublishJob({
      id: id("manual-post"),
      workspaceId,
      draftId,
      status: "blocked",
      idempotencyKey,
      reason,
      createdAt: nowLabel()
    });
  }

  const issues = runRiskGuard(draft.content);
  repository.addAuditEvent(event(workspaceId, actor.actor, "risk review run", `Risk Guard evaluated draft "${draft.topic}" before manual post marking. ${issues.length} issue(s) found.`));
  if (issues.some((issue) => issue.severity === "blocked")) {
    const reason = "Risk Guard blocked manual post marking.";
    repository.upsertDraft({ ...draft, status: "risk_blocked", riskLevel: "blocked", updatedAt: nowLabel() });
    repository.addAuditEvent(event(workspaceId, actor.actor, "manual post blocked", reason));
    return repository.addOrReusePublishJob({
      id: id("manual-post"),
      workspaceId,
      draftId,
      status: "blocked",
      idempotencyKey,
      reason,
      createdAt: nowLabel()
    });
  }

  repository.upsertDraft({ ...draft, status: "published", riskLevel: issues.length ? "review" : "safe", updatedAt: nowLabel() });
  repository.cancelScheduleJobsForDraft(workspaceId, draftId);
  repository.addAuditEvent(
    event(
      workspaceId,
      actor.actor,
      "manual post marked",
      externalPostId ? `Operator marked this draft posted on Facebook as ${externalPostId}.` : "Operator marked this draft posted on Facebook manually."
    )
  );
  return repository.addOrReusePublishJob({
    id: id("manual-post"),
    workspaceId,
    draftId,
    status: "published",
    idempotencyKey,
    externalPostId: externalPostId?.trim() || undefined,
    reason: "Manual Facebook posting confirmed by operator.",
    createdAt: nowLabel()
  });
}
