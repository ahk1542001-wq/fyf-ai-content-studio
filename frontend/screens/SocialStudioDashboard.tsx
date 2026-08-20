"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clipboard,
  Copy,
  DatabaseBackup,
  FileCheck2,
  KeyRound,
  Loader2,
  PenLine,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wand2,
  X
} from "lucide-react";
import type {
  AuditEvent,
  BrandProfile,
  ContentIdea,
  DemoSession,
  Draft,
  DraftVersion,
  IntegrationLog,
  IntegrationSetting,
  MediaAsset,
  OnboardingChecklistItem,
  PromptVersion,
  PublishJob,
  ScheduleJob,
  StyleExample,
  Workspace
} from "@/backend/types";
import type { AiFixMode } from "@/backend/draftLifecycle";
import { scoreContentBreakdown } from "@/backend/contentQuality";
import { filterByWorkspace } from "@/backend/workspaceGuards";
import { auditEvents, demoWorkspaces, integrationSettings, seedDrafts } from "@/database/demo-data/demoData";
import { runRiskGuard, type RiskIssue } from "@/integrations/riskGuard";
import { navItems } from "@/frontend/styles/tokens";

const navConfig = {
  Today: CalendarClock,
  Create: PenLine,
  Review: ShieldCheck,
  Export: FileCheck2,
  Settings
} as const;

const composerOptions = {
  tone: ["Use saved voice", "Friendly", "Professional", "Direct"],
  length: ["Short", "Medium", "Long"],
  angle: ["Use saved context", "Education first", "Workflow explanation", "Beginner guide", "Case-study style"],
  audience: ["Use saved audience", "Myanmar beginners", "Small business owners", "AI learners", "Content creators"],
  cta: ["Use saved CTA", "Comment question", "Inbox for checklist", "Ask for topic", "Join community"]
} as const;

type AppView = (typeof navItems)[number];

type DraftsApiResponse = {
  session: DemoSession;
  drafts: Draft[];
  auditEvents: AuditEvent[];
  ideas: ContentIdea[];
  styleExamples: StyleExample[];
  mediaAssets: MediaAsset[];
  promptVersions: PromptVersion[];
  integrationLogs: IntegrationLog[];
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  onboardingChecklistItems: OnboardingChecklistItem[];
  brandProfile: BrandProfile;
  workspace: Workspace;
};

type DraftGenerateResponse = {
  ok: true;
  draft: Draft;
  auditEvents: AuditEvent[];
};

type DraftMutationResponse = {
  ok: true;
  draft: Draft;
  versions?: DraftVersion[];
  auditEvents?: AuditEvent[];
};

type AiFixResponse = DraftMutationResponse & {
  before: string;
  after: string;
  reason: string;
};

type ScheduleResponse = {
  ok: true;
  job: ScheduleJob;
  draft: Draft;
  scheduleJobs: ScheduleJob[];
  auditEvents: AuditEvent[];
};

type ManualPostResponse = {
  ok: true;
  job: PublishJob;
  draft: Draft;
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  auditEvents: AuditEvent[];
};

type ApiConflictDetails = {
  draft?: Draft;
  issues?: RiskIssue[];
  job?: PublishJob;
};

class DemoApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "DemoApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });
  const body = (await response.json()) as T & { error?: { code?: string; message?: string; details?: unknown } };
  if (!response.ok) {
    throw new DemoApiError(body.error?.message ?? "Demo API request failed", response.status, body.error?.code, body.error?.details);
  }
  return body;
}

function isConflictDetails(value: unknown): value is ApiConflictDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as ApiConflictDetails;
  return (
    (!details.draft || typeof details.draft.id === "string") &&
    (!details.job || typeof details.job.id === "string") &&
    (!details.issues || Array.isArray(details.issues))
  );
}

function statusLabel(status: Draft["status"]) {
  const labels: Record<Draft["status"], string> = {
    draft: "Draft",
    needs_review: "Needs review",
    risk_blocked: "Risk blocked",
    approved: "Approved",
    scheduled: "Scheduled",
    published: "Posted",
    rejected: "Rejected",
    failed: "Failed",
    archived: "Archived"
  };
  return labels[status];
}

function riskLabel(issues: RiskIssue[]) {
  if (issues.some((issue) => issue.severity === "blocked")) return "Blocked";
  if (issues.length) return "Needs review";
  return "Safe";
}

function hasBurmese(text: string) {
  return /[\u1000-\u109F]/.test(text);
}

function isLegacyCustomizationDraft(draft: Draft) {
  return (
    /Audience:\s*Busy traders/i.test(draft.content) ||
    /external workflow style/i.test(draft.content)
  );
}

export function SocialStudioDashboard({ initialView = "Today" }: { initialView?: AppView } = {}) {
  const [workspaceId, setWorkspaceId] = useState("ws-fyf");
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(demoWorkspaces);
  const [drafts, setDrafts] = useState(seedDrafts);
  const [activeDraftId, setActiveDraftId] = useState("draft-risk");
  const [draftText, setDraftText] = useState(seedDrafts[0].content);
  const [activity, setActivity] = useState(auditEvents);
  const [settingsState, setSettingsState] = useState<IntegrationSetting[]>(integrationSettings);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [scheduleJobs, setScheduleJobs] = useState<ScheduleJob[]>([]);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingChecklistItem[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [topic, setTopic] = useState("AI Agent workflow planning for beginners");
  const [tone, setTone] = useState<(typeof composerOptions.tone)[number]>("Use saved voice");
  const [length, setLength] = useState<(typeof composerOptions.length)[number]>("Medium");
  const [angle, setAngle] = useState<(typeof composerOptions.angle)[number]>("Use saved context");
  const [audience, setAudience] = useState<(typeof composerOptions.audience)[number]>("Use saved audience");
  const [cta, setCta] = useState<(typeof composerOptions.cta)[number]>("Use saved CTA");
  const [scheduledFor, setScheduledFor] = useState("Tomorrow, 7:00 PM");
  const [externalPostId, setExternalPostId] = useState("");
  const [toast, setToast] = useState("Local FYF Studio ready. Manual Facebook export only.");
  const [blockedDetails, setBlockedDetails] = useState<ApiConflictDetails | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const serverDraftContentRef = useRef<Record<string, string>>(Object.fromEntries(seedDrafts.map((draft) => [draft.id, draft.content])));

  const workspace = workspaces.find((item) => item.id === workspaceId) ?? workspaces[0];
  const workspaceDrafts = useMemo(() => filterByWorkspace(drafts, workspace.id), [drafts, workspace.id]).filter(
    (draft) => draft.status !== "archived"
  );
  const visibleWorkspaceDrafts = workspaceDrafts.filter((draft) => !isLegacyCustomizationDraft(draft));
  const activeDraft = visibleWorkspaceDrafts.find((draft) => draft.id === activeDraftId) ?? visibleWorkspaceDrafts[0] ?? workspaceDrafts[0];
  const issues = runRiskGuard(draftText);
  const quality = scoreContentBreakdown(draftText);
  const settings = settingsState.filter((setting) => setting.workspaceId === workspace.id);
  const logs = activity.filter((event) => event.workspaceId === workspace.id);
  const workspacePublishJobs = publishJobs.filter((job) => job.workspaceId === workspace.id);
  const workspaceScheduleJobs = scheduleJobs.filter((job) => job.workspaceId === workspace.id);
  const pendingDrafts = visibleWorkspaceDrafts.filter((draft) =>
    draft.status === "needs_review" || draft.status === "risk_blocked" || draft.status === "failed"
  );
  const approvedDrafts = visibleWorkspaceDrafts.filter((draft) => draft.status === "approved" || draft.status === "scheduled");
  const postedDrafts = visibleWorkspaceDrafts.filter((draft) => draft.status === "published");
  const reviewBaseDrafts = pendingDrafts.length ? pendingDrafts : visibleWorkspaceDrafts.filter((draft) => draft.status === "draft");
  const activeReviewDrafts = activeDraft
    ? [activeDraft, ...reviewBaseDrafts.filter((draft) => draft.id !== activeDraft.id)].slice(0, 5)
    : reviewBaseDrafts.slice(0, 5);
  const onboardingDone = onboardingItems.filter((item) => item.completed).length;
  const onboardingTotal = onboardingItems.length || 1;
  const isModifiedAfterApproval = activeDraft && ["approved", "scheduled"].includes(activeDraft.status) && draftText !== activeDraft.content;

  const nextAction = useMemo(() => {
    if (issues.some((issue) => issue.severity === "blocked")) {
      return { label: "Fix Risk", view: "Review" as AppView, detail: "Risk Guard found blocked wording." };
    }
    if (pendingDrafts.length) {
      return { label: "Review Draft", view: "Review" as AppView, detail: `${pendingDrafts.length} draft needs a decision.` };
    }
    if (approvedDrafts.length) {
      return { label: "Copy for Facebook", view: "Export" as AppView, detail: `${approvedDrafts.length} approved draft ready.` };
    }
    return { label: "Create Draft", view: "Create" as AppView, detail: "Start with a topic and customize the voice." };
  }, [approvedDrafts.length, issues, pendingDrafts.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaceData() {
      try {
        const [data, integrations] = await Promise.all([
          apiJson<DraftsApiResponse>(`/api/workspaces/${workspace.id}/drafts`),
          apiJson<{ settings: IntegrationSetting[] }>(`/api/workspaces/${workspace.id}/integrations`)
        ]);
        if (cancelled) return;
        data.drafts.forEach((draft) => {
          serverDraftContentRef.current[draft.id] = draft.content;
        });
        setDrafts((items) => [...data.drafts, ...items.filter((draft) => draft.workspaceId !== workspace.id)]);
        setActivity((items) => [...data.auditEvents, ...items.filter((event) => event.workspaceId !== workspace.id)]);
        setPublishJobs((items) => [...data.publishJobs, ...items.filter((job) => job.workspaceId !== workspace.id)]);
        setScheduleJobs((items) => [...data.scheduleJobs, ...items.filter((job) => job.workspaceId !== workspace.id)]);
        setOnboardingItems(data.onboardingChecklistItems);
        setBrandProfile(data.brandProfile);
        setSession(data.session);
        setSettingsState((items) => [...integrations.settings, ...items.filter((setting) => setting.workspaceId !== workspace.id)]);
        setWorkspaces((items) => [data.workspace, ...items.filter((item) => item.id !== data.workspace.id)]);
        const nextDraft = data.drafts.find((draft) => draft.id === activeDraftId) ?? data.drafts[0];
        if (nextDraft) selectDraft(nextDraft);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Could not load local operator data.");
      }
    }

    loadWorkspaceData();
    return () => {
      cancelled = true;
    };
  }, [workspace.id]);

  function selectDraft(draft: Draft) {
    setActiveDraftId(draft.id);
    setDraftText(draft.content);
    setTopic(draft.topic);
    setScheduledFor(draft.scheduledFor ?? "Tomorrow, 7:00 PM");
    setBlockedDetails(null);
  }

  function mergeDraft(next: Draft) {
    serverDraftContentRef.current[next.id] = next.content;
    setDrafts((items) => items.map((draft) => (draft.id === next.id ? next : draft)));
    selectDraft(next);
  }

  function mergeActivity(nextEvents?: AuditEvent[]) {
    if (!nextEvents) return;
    setActivity((items) => [...nextEvents, ...items.filter((event) => event.workspaceId !== workspace.id)]);
  }

  async function saveDraftToApi(content = draftText) {
    if (!activeDraft) throw new Error("No draft selected.");
    const data = await apiJson<DraftMutationResponse>(`/api/workspaces/${workspace.id}/drafts/${activeDraft.id}`, {
      method: "PATCH",
      body: JSON.stringify({ content })
    });
    mergeDraft(data.draft);
    mergeActivity(data.auditEvents);
    return data.draft;
  }

  async function saveDraftIfChanged(content = draftText) {
    if (!activeDraft) throw new Error("No draft selected.");
    const serverContent = serverDraftContentRef.current[activeDraft.id] ?? activeDraft.content;
    return serverContent === content ? activeDraft : saveDraftToApi(content);
  }

  async function runAction(action: () => Promise<void>) {
    setIsBusy(true);
    try {
      await action();
    } finally {
      setIsBusy(false);
    }
  }

  async function generateDraft() {
    await runAction(async () => {
      const data = await apiJson<DraftGenerateResponse>(`/api/workspaces/${workspace.id}/drafts`, {
        method: "POST",
        body: JSON.stringify({
          topic,
          tone: tone === "Use saved voice" ? brandProfile?.toneRules.at(0) ?? "Friendly" : tone,
          length,
          angle: angle === "Use saved context" ? brandProfile?.description ?? "Education first" : angle,
          audience: audience === "Use saved audience" ? brandProfile?.targetAudience ?? "Myanmar beginners" : audience,
          cta: cta === "Use saved CTA" ? brandProfile?.preferredCtas.at(0) ?? "comment မှာ မေးပါ" : cta
        })
      });
      serverDraftContentRef.current[data.draft.id] = data.draft.content;
      setDrafts((items) => [data.draft, ...items.filter((draft) => draft.id !== data.draft.id)]);
      mergeActivity(data.auditEvents);
      selectDraft(data.draft);
      setActiveView("Review");
      setToast("Burmese draft generated. Customize it before approval.");
    });
  }

  async function saveDraft() {
    await runAction(async () => {
      await saveDraftToApi();
      setToast("Draft saved. Customization stays in version history.");
    });
  }

  async function applyFix(mode: AiFixMode) {
    if (!activeDraft) return;
    await runAction(async () => {
      const data = await apiJson<AiFixResponse>(`/api/workspaces/${workspace.id}/drafts/${activeDraft.id}/fix`, {
        method: "POST",
        body: JSON.stringify({ mode, content: draftText, topic })
      });
      mergeDraft(data.draft);
      mergeActivity(data.auditEvents);
      setToast(`${data.reason} Review the customized draft again.`);
    });
  }

  async function approveDraft() {
    if (!activeDraft) return;
    await runAction(async () => {
      try {
        await saveDraftIfChanged();
        const data = await apiJson<DraftMutationResponse>(`/api/workspaces/${workspace.id}/drafts/${activeDraft.id}/approve`, {
          method: "POST",
          body: JSON.stringify({})
        });
        mergeDraft(data.draft);
        mergeActivity(data.auditEvents);
        setActiveView("Export");
        setToast("Draft approved. Copy/export is ready. No live Facebook auto-post.");
      } catch (error) {
        if (error instanceof DemoApiError && isConflictDetails(error.details)) {
          setBlockedDetails(error.details);
        }
        setToast(error instanceof Error ? error.message : "Approval failed.");
      }
    });
  }

  async function rejectDraft() {
    if (!activeDraft) return;
    await runAction(async () => {
      const data = await apiJson<DraftMutationResponse>(`/api/workspaces/${workspace.id}/drafts/${activeDraft.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Rejected during local operator review." })
      });
      mergeDraft(data.draft);
      mergeActivity(data.auditEvents);
      setToast("Draft rejected. You can create or customize another one.");
    });
  }

  async function scheduleDraft() {
    if (!activeDraft) return;
    await runAction(async () => {
      if (isModifiedAfterApproval) {
        await saveDraftIfChanged();
        setToast("Draft changed after approval. Review and approve again before scheduling.");
        return;
      }
      const data = await apiJson<ScheduleResponse>(`/api/workspaces/${workspace.id}/drafts/${activeDraft.id}/schedule`, {
        method: "POST",
        body: JSON.stringify({ scheduledFor })
      });
      mergeDraft(data.draft);
      setScheduleJobs(data.scheduleJobs);
      mergeActivity(data.auditEvents);
      setToast(`Reminder scheduled for ${data.job.scheduledFor}.`);
    });
  }

  async function copyForFacebook() {
    if (!draftText.trim()) return;
    await navigator.clipboard.writeText(draftText);
    setToast("Copied for Facebook. Paste manually, then mark manually posted.");
  }

  async function markManuallyPosted() {
    if (!activeDraft) return;
    await runAction(async () => {
      try {
        if (isModifiedAfterApproval) {
          await saveDraftIfChanged();
          setToast("Draft changed after approval. Review and approve again before marking posted.");
          return;
        }
        const data = await apiJson<ManualPostResponse>(`/api/workspaces/${workspace.id}/drafts/${activeDraft.id}/manual-post`, {
          method: "POST",
          body: JSON.stringify({ externalPostId })
        });
        mergeDraft(data.draft);
        setPublishJobs(data.publishJobs);
        setScheduleJobs(data.scheduleJobs);
        mergeActivity(data.auditEvents);
        setToast("Marked manually posted. No Facebook API call was made.");
      } catch (error) {
        if (error instanceof DemoApiError && isConflictDetails(error.details)) {
          setBlockedDetails(error.details);
        }
        setToast(error instanceof Error ? error.message : "Could not mark manually posted.");
      }
    });
  }

  function switchWorkspace(nextWorkspaceId: string) {
    setWorkspaceId(nextWorkspaceId);
    const nextDraft = drafts.find((draft) => draft.workspaceId === nextWorkspaceId);
    if (nextDraft) selectDraft(nextDraft);
    setToast("Workspace switched. Local Studio keeps data scoped.");
  }

  const primaryActionDisabled = isBusy || !activeDraft;

  return (
    <main className="operator-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="operator-sidebar" aria-label="Local operator navigation">
        <div className="operator-brand">
          <span className="operator-logo">FYF</span>
          <div>
            <strong>FYF AI Studio</strong>
            <small>Local operator app</small>
          </div>
        </div>

        <nav className="operator-nav">
          {navItems.map((item) => {
            const Icon = navConfig[item];
            return (
              <button key={item} className={clsx("operator-nav-item", activeView === item && "active")} onClick={() => setActiveView(item)}>
                <Icon aria-hidden="true" />
                <span>{item}</span>
              </button>
            );
          })}
        </nav>

        <div className="operator-private-card">
          <UserRound aria-hidden="true" />
          <div>
            <strong>{session?.user.name ?? "Demo User"}</strong>
            <span>{session?.member.role ?? "owner"} access</span>
          </div>
        </div>
      </aside>

      <section id="main-content" className="operator-main" tabIndex={-1}>
        <header className="operator-topbar">
          <div>
            <h1>{activeView === "Today" ? "Today" : `${activeView} workspace`}</h1>
            <p>{workspace.pageName} · Burmese content · manual Facebook posting first</p>
          </div>
          <label className="operator-workspace">
            <span>Workspace</span>
            <select aria-label="Workspace" value={workspaceId} onChange={(event) => switchWorkspace(event.target.value)}>
              {workspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="operator-toast" role="status">
          {isBusy ? <Loader2 className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
          {toast}
        </div>

        {activeView === "Today" && (
          <section className="operator-screen">
            <div className="small-next-action">
              <span>
                <strong>Next Action</strong>
                {nextAction.detail}
              </span>
              <button onClick={() => setActiveView(nextAction.view)}>{nextAction.label}</button>
            </div>

            <div className="operator-grid two">
              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Today queue</h2>
                  <small>Only work that needs action</small>
                </div>
                <DraftQueue drafts={[...pendingDrafts, ...approvedDrafts].slice(0, 5)} activeDraftId={activeDraft?.id} onSelect={(draft) => {
                  selectDraft(draft);
                  setActiveView(draft.status === "approved" || draft.status === "scheduled" ? "Export" : "Review");
                }} />
              </section>

              <section className="guardrail-strip">
                <h2 className="sr-only">Local Studio guardrails</h2>
                <ul className="check-list inline">
                  <li><Check aria-hidden="true" /> Customize before approval</li>
                  <li><Check aria-hidden="true" /> Risk Guard before export</li>
                  <li><Check aria-hidden="true" /> Manual Facebook copy first</li>
                  <li><X aria-hidden="true" /> No live Facebook auto-post</li>
                  <li><CalendarClock aria-hidden="true" /> {workspaceScheduleJobs.length} reminder(s)</li>
                </ul>
              </section>
            </div>
          </section>
        )}

        {activeView === "Create" && (
          <section className="operator-screen">
            <div className="operator-grid create-grid">
              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Create & customize</h2>
                  <small>Customization is part of draft creation, not an afterthought</small>
                </div>
                <label className="operator-field">
                  <span>Topic / Idea</span>
                  <input aria-label="Topic / Idea" value={topic} onChange={(event) => setTopic(event.target.value)} />
                </label>
                <CustomizationControls
                  tone={tone}
                  length={length}
                  angle={angle}
                  audience={audience}
                  cta={cta}
                  setTone={setTone}
                  setLength={setLength}
                  setAngle={setAngle}
                  setAudience={setAudience}
                  setCta={setCta}
                />
                <div className="primary-row">
                  <button className="primary-action" onClick={generateDraft} disabled={isBusy || !topic.trim()}>
                    <Sparkles aria-hidden="true" />
                    Generate Burmese Draft
                  </button>
                  <button className="secondary-action" onClick={() => setActiveView("Review")}>Review existing</button>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeView === "Review" && (
          <section className="operator-screen">
            <div className="operator-grid review-grid">
              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Decision queue</h2>
                  <small>{activeReviewDrafts.length} active item(s)</small>
                </div>
                <DraftQueue drafts={activeReviewDrafts} activeDraftId={activeDraft?.id} onSelect={selectDraft} />
              </section>

              <section className="operator-panel editor-panel">
                <div className="panel-heading">
                  <h2>Customize draft</h2>
                  <small>{hasBurmese(draftText) ? "Burmese content detected" : "Needs Burmese output"}</small>
                </div>
                <textarea
                  aria-label="AI Generated Draft (Burmese)"
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                />
                <div className="customization-strip">
                  <button onClick={() => applyFix("safer")} disabled={primaryActionDisabled}>
                    <Wand2 aria-hidden="true" />
                    Safer rewrite
                  </button>
                  <button onClick={() => applyFix("hook")} disabled={primaryActionDisabled}>Stronger hook</button>
                  <button onClick={() => applyFix("brand_style")} disabled={primaryActionDisabled}>FYF AI style</button>
                  <button onClick={saveDraft} disabled={primaryActionDisabled}>
                    <Save aria-hidden="true" />
                    Save Draft
                  </button>
                </div>
              </section>

              <section className="operator-panel">
                <RiskGuardPanel issues={issues} blockedDetails={blockedDetails} />
                <div className="quality-list">
                  {Object.entries(quality).map(([label, score]) => (
                    <p key={label}>
                      <span>{label}</span>
                      <meter min={0} max={100} value={score} />
                    </p>
                  ))}
                </div>
              </section>

              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Decision</h2>
                  <small>Risk Guard required</small>
                </div>
                <label className="operator-field">
                  <span>Reminder / schedule note</span>
                  <input aria-label="Reminder / schedule note" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
                </label>
                <div className="decision-actions">
                  <button className="primary-action" onClick={approveDraft} disabled={primaryActionDisabled || issues.some((issue) => issue.severity === "blocked")}>
                    Approve
                  </button>
                  <button onClick={scheduleDraft} disabled={primaryActionDisabled || !["approved", "scheduled"].includes(activeDraft?.status ?? "")}>
                    Schedule / remind
                  </button>
                  <button className="danger-action" onClick={rejectDraft} disabled={primaryActionDisabled}>Reject</button>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeView === "Export" && (
          <section className="operator-screen">
            <div className="operator-grid export-grid">
              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Manual Facebook export</h2>
                  <small>Copy first, mark after FYF AI posts manually</small>
                </div>
                <DraftPreview draft={activeDraft} content={draftText} />
                <div className="primary-row">
                  <button className="primary-action" onClick={copyForFacebook} disabled={!activeDraft || activeDraft.status !== "approved" && activeDraft.status !== "scheduled"}>
                    <Copy aria-hidden="true" />
                    Copy for Facebook
                  </button>
                </div>
                <label className="operator-field">
                  <span>Facebook post ID / note (optional)</span>
                  <input value={externalPostId} onChange={(event) => setExternalPostId(event.target.value)} placeholder="Manual post link or note" />
                </label>
                <button className="secondary-action full" onClick={markManuallyPosted} disabled={primaryActionDisabled || isModifiedAfterApproval || !["approved", "scheduled"].includes(activeDraft?.status ?? "")}>
                  <Clipboard aria-hidden="true" />
                  Mark Manually Posted
                </button>
              </section>

              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Ready to export</h2>
                  <small>{approvedDrafts.length} approved/scheduled</small>
                </div>
                <DraftQueue drafts={approvedDrafts} activeDraftId={activeDraft?.id} onSelect={selectDraft} />
              </section>

              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Posted history</h2>
                  <small>{postedDrafts.length} manually tracked</small>
                </div>
                <DraftQueue drafts={postedDrafts} activeDraftId={activeDraft?.id} onSelect={selectDraft} />
                <div className="job-list">
                  {workspacePublishJobs.slice(0, 4).map((job) => (
                    <p key={job.id}>
                      <span>{job.status}</span>
                      <strong>{job.externalPostId ?? job.fakePostId ?? job.reason ?? "Manual record"}</strong>
                    </p>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeView === "Settings" && (
          <section className="operator-screen">
            <div className="operator-grid settings-grid">
              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Local access</h2>
                  <small>1-2 real users first</small>
                </div>
                <ul className="check-list">
                  <li><KeyRound aria-hidden="true" /> Password/simple auth path belongs here</li>
                  <li><UserRound aria-hidden="true" /> FYF AI, builder/owner, maybe one assistant</li>
                  <li><ShieldCheck aria-hidden="true" /> Secrets stay server-side in .env.local</li>
                  <li><PenLine aria-hidden="true" /> User context drives audience, voice, CTA, and forbidden wording</li>
                </ul>
              </section>

              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>API integrations</h2>
                  <small>Real Gemini + Sheets path</small>
                </div>
                <div className="integration-list">
                  {settings.map((setting) => (
                    <p key={setting.provider}>
                      <span className={clsx("status-dot", setting.status)} />
                      <strong>{setting.provider}</strong>
                      <small>{setting.status} · {setting.lastChecked}</small>
                    </p>
                  ))}
                </div>
              </section>

              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>SQLite backup/export</h2>
                  <small>Before real daily use</small>
                </div>
                <div className="backup-box">
                  <DatabaseBackup aria-hidden="true" />
                  <p>Keep local SQLite snapshots backed up before FYF AI relies on this app daily.</p>
                </div>
              </section>

              <section className="operator-panel">
                <div className="panel-heading">
                  <h2>Setup checklist</h2>
                  <small>{onboardingDone} / {onboardingTotal} done</small>
                </div>
                <ul className="check-list">
                  {onboardingItems.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      {item.completed ? <Check aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="operator-panel">
              <div className="panel-heading">
                <h2>Recent audit</h2>
                <small>Owner-visible log</small>
              </div>
              <div className="log-list-simple">
                {logs.slice(0, 6).map((event) => (
                  <p key={event.id}>
                    <span>{event.createdAt}</span>
                    <strong>{event.action}</strong>
                    <em>{event.detail}</em>
                  </p>
                ))}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

type DraftQueueProps = {
  drafts: Draft[];
  activeDraftId?: string;
  onSelect: (draft: Draft) => void;
};

function DraftQueue({ drafts, activeDraftId, onSelect }: DraftQueueProps) {
  if (!drafts.length) {
    return <p className="empty-note">No drafts in this step.</p>;
  }

  return (
    <div className="draft-queue">
      {drafts.map((draft) => (
        <button key={draft.id} className={clsx("operator-draft-card", activeDraftId === draft.id && "active")} onClick={() => onSelect(draft)}>
          <span className={clsx("status-dot", draft.status)} />
          <strong>{draft.topic}</strong>
          <small>{statusLabel(draft.status)} · Risk {draft.riskLevel}</small>
          <p>{draft.content}</p>
        </button>
      ))}
    </div>
  );
}

type CustomizationProps = {
  tone: (typeof composerOptions.tone)[number];
  length: (typeof composerOptions.length)[number];
  angle: (typeof composerOptions.angle)[number];
  audience: (typeof composerOptions.audience)[number];
  cta: (typeof composerOptions.cta)[number];
  setTone: (value: (typeof composerOptions.tone)[number]) => void;
  setLength: (value: (typeof composerOptions.length)[number]) => void;
  setAngle: (value: (typeof composerOptions.angle)[number]) => void;
  setAudience: (value: (typeof composerOptions.audience)[number]) => void;
  setCta: (value: (typeof composerOptions.cta)[number]) => void;
};

function CustomizationControls(props: CustomizationProps) {
  return (
    <div className="customization-grid" aria-label="Draft customization">
      <SelectField label="Tone" value={props.tone} options={composerOptions.tone} onChange={props.setTone} />
      <SelectField label="Length" value={props.length} options={composerOptions.length} onChange={props.setLength} />
      <SelectField label="Angle" value={props.angle} options={composerOptions.angle} onChange={props.setAngle} />
      <SelectField label="Audience" value={props.audience} options={composerOptions.audience} onChange={props.setAudience} />
      <SelectField label="CTA" value={props.cta} options={composerOptions.cta} onChange={props.setCta} />
    </div>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return (
    <label className="operator-field">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RiskGuardPanel({ issues, blockedDetails }: { issues: RiskIssue[]; blockedDetails: ApiConflictDetails | null }) {
  return (
    <div className={clsx("risk-summary", issues.some((issue) => issue.severity === "blocked") && "blocked")}>
      <div className="panel-heading">
        <h2>Risk Guard</h2>
        <small>{riskLabel(issues)}</small>
      </div>
      {blockedDetails?.job?.reason && <p className="risk-line"><AlertTriangle aria-hidden="true" />{blockedDetails.job.reason}</p>}
      {issues.length ? (
        issues.map((issue) => (
          <p className="risk-line" key={`${issue.code}-${issue.phrase}`}>
            <AlertTriangle aria-hidden="true" />
            <span>
              <strong>{issue.severity}</strong> · {issue.phrase}
            </span>
          </p>
        ))
      ) : (
        <p className="risk-line safe"><Check aria-hidden="true" />Safe for approval/export.</p>
      )}
    </div>
  );
}

function DraftPreview({ draft, content }: { draft?: Draft; content: string }) {
  if (!draft) return <p className="empty-note">Create a draft first.</p>;

  return (
    <article className="facebook-export-preview">
      <header>
        <span>FYF</span>
        <div>
          <strong>FYF AI</strong>
          <small>{statusLabel(draft.status)} · manual Facebook post</small>
        </div>
      </header>
      <p>{content}</p>
    </article>
  );
}
