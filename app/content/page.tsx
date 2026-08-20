"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  Zap,
  Share2,
} from "lucide-react";
import type { Draft, DraftStatus, PublishJob, WeeklyBufferState, WeeklyBufferSlot } from "@/backend/types";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";

type DraftsPayload = {
  drafts: Draft[];
  publishJobs?: PublishJob[];
};

type BufferPayload = {
  ok: boolean;
  buffer: WeeklyBufferState;
};

type FilterKey = "all" | "needs_review" | "approved" | "published" | "risk_blocked";
type LoadStatus = "loading" | "ready" | "error";
type ActiveTab = "planner" | "library";

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Needs review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
  { key: "risk_blocked", label: "Risk blocked" },
];

function formatStatus(status: DraftStatus) {
  return status.replaceAll("_", " ");
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: DraftStatus) {
  if (status === "published" || status === "approved") return "saved";
  if (status === "risk_blocked" || status === "failed" || status === "rejected") return "error";
  return "idle";
}

export default function ContentPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "ws-fyf";

  const [activeTab, setActiveTab] = useState<ActiveTab>("planner");
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [message, setMessage] = useState("Loading generated drafts & weekly buffer.");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [bufferState, setBufferState] = useState<WeeklyBufferState | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summarySuccessMsg, setSummarySuccessMsg] = useState("");

  const loadData = useCallback(async () => {
    setStatus("loading");
    try {
      const [draftsRes, bufferRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/drafts`, { cache: "no-store" }),
        fetch(`/api/workspaces/${workspaceId}/buffer`, { cache: "no-store" }),
      ]);

      if (!draftsRes.ok) throw new Error("Could not load generated content.");
      const draftsData = (await draftsRes.json()) as DraftsPayload;
      setDrafts(draftsData.drafts || []);
      setPublishJobs(draftsData.publishJobs || []);

      if (bufferRes.ok) {
        const bufferData = (await bufferRes.json()) as BufferPayload;
        if (bufferData.ok && bufferData.buffer) {
          setBufferState(bufferData.buffer);
        }
      }

      setStatus("ready");
      setMessage("Content library & buffer queue loaded.");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not load content.");
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData, workspaceId]);

  const filteredDrafts = useMemo(() => {
    if (activeFilter === "all") return drafts;
    return drafts.filter((draft) => draft.status === activeFilter);
  }, [activeFilter, drafts]);

  const counts = useMemo(
    () =>
      filters.reduce<Record<FilterKey, number>>(
        (accumulator, filter) => {
          accumulator[filter.key] = filter.key === "all" ? drafts.length : drafts.filter((draft) => draft.status === filter.key).length;
          return accumulator;
        },
        { all: 0, needs_review: 0, approved: 0, published: 0, risk_blocked: 0 }
      ),
    [drafts]
  );

  async function handleGenerateSundaySummary() {
    setIsGeneratingSummary(true);
    setSummarySuccessMsg("");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/buffer/summary`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to generate summary");

      setSummarySuccessMsg("🎉 Sunday Weekly Executive Summary generated! You can review and approve it in Studio.");
      await loadData();
    } catch (err) {
      setSummarySuccessMsg(err instanceof Error ? err.message : "Summary generation error");
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  return (
    <section className="page-container wide" style={{ maxWidth: "1140px" }}>
      <div className="page-heading">
        <p className="eyebrow" style={{ color: BRAND_COLORS.VIRIDIAN, fontWeight: 600 }}>
          FYF AI Content Studio
        </p>
        <h1 style={{ color: BRAND_COLORS.OLIVE_INK, letterSpacing: "-0.03em" }}>Content & Weekly Planner</h1>
        <p className="page-subtitle">
          Weekly 4-pillar buffer scheduling, automated Sunday Executive Summary rollup, and generated draft archives.
        </p>
      </div>

      <div className="flow-map" aria-label="Content rules">
        <span>4-Pillar Weekly Cadence</span>
        <span className="active">Buffer Health Monitoring</span>
        <span>Human Approval Gate</span>
      </div>

      {/* Main Tab Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: `1.5px solid ${BRAND_COLORS.SOFT_SAGE}40`,
          paddingBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("planner")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: activeTab === "planner" ? `1.5px solid ${BRAND_COLORS.VIRIDIAN}` : `1px solid ${BRAND_COLORS.SOFT_SAGE}50`,
            backgroundColor: activeTab === "planner" ? BRAND_COLORS.WARM_IVORY : BRAND_COLORS.SURFACE_WHITE,
            color: activeTab === "planner" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
            fontWeight: activeTab === "planner" ? 800 : 600,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeTab === "planner" ? `0 2px 8px ${BRAND_COLORS.VIRIDIAN}20` : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Calendar size={16} />
          <span>📅 Weekly Buffer Queue & 4-Pillar Planner</span>
          {bufferState && (
            <span
              style={{
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "10px",
                backgroundColor: bufferState.healthScore >= 75 ? BRAND_COLORS.VIRIDIAN : "#D97706",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {bufferState.healthScore}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("library")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: activeTab === "library" ? `1.5px solid ${BRAND_COLORS.VIRIDIAN}` : `1px solid ${BRAND_COLORS.SOFT_SAGE}50`,
            backgroundColor: activeTab === "library" ? BRAND_COLORS.WARM_IVORY : BRAND_COLORS.SURFACE_WHITE,
            color: activeTab === "library" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
            fontWeight: activeTab === "library" ? 800 : 600,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeTab === "library" ? `0 2px 8px ${BRAND_COLORS.VIRIDIAN}20` : "none",
            transition: "all 0.15s ease",
          }}
        >
          <FileText size={16} />
          <span>📑 Draft Library ({drafts.length})</span>
        </button>
      </div>

      {activeTab === "planner" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Buffer Health Dashboard Card */}
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: BRAND_COLORS.WARM_IVORY,
              border: `1.5px solid ${BRAND_COLORS.VIRIDIAN}30`,
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: BRAND_COLORS.VIRIDIAN,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  ⚡ Active Content Cycle
                </span>
                <h2 style={{ margin: "2px 0 6px 0", color: BRAND_COLORS.OLIVE_INK, fontSize: "20px" }}>
                  {bufferState?.weekLabel || "Weekly 4-Slot Content Schedule"}
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.85 }}>
                  {bufferState?.statusMessage || "Monitor your weekly post readiness across the 4 verified FYF content pillars."}
                </p>
              </div>

              {/* Sunday Summary Generator CTA Button */}
              <button
                type="button"
                onClick={handleGenerateSundaySummary}
                disabled={isGeneratingSummary}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  backgroundColor: BRAND_COLORS.VIRIDIAN,
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(22, 133, 107, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                {isGeneratingSummary ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>📰 Generate Sunday Executive Summary</span>
                  </>
                )}
              </button>
            </div>

            {summarySuccessMsg && (
              <p
                style={{
                  margin: "0 0 12px 0",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #10B981",
                  fontSize: "12px",
                  color: "#065F46",
                  fontWeight: 600,
                }}
              >
                {summarySuccessMsg}
              </p>
            )}

            {/* Health Progress Bar */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                <span style={{ color: BRAND_COLORS.OLIVE_INK }}>
                  Weekly Buffer Preparedness: {bufferState?.readyCount || 0} of {bufferState?.totalSlots || 4} Posts Ready
                </span>
                <span style={{ color: BRAND_COLORS.VIRIDIAN }}>{bufferState?.healthScore || 0}% Complete</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  borderRadius: "5px",
                  backgroundColor: `${BRAND_COLORS.SOFT_SAGE}40`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${bufferState?.healthScore || 0}%`,
                    height: "100%",
                    backgroundColor: BRAND_COLORS.VIRIDIAN,
                    borderRadius: "5px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4-Slot Weekly Buffer Calendar Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {bufferState?.slots.map((slot: WeeklyBufferSlot) => {
              const isReady = slot.status === "ready" || slot.status === "scheduled" || slot.status === "published";
              const isDrafting = slot.status === "drafting";
              const isEmpty = slot.status === "empty";

              return (
                <div
                  key={slot.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                    border: isReady
                      ? `1.5px solid ${BRAND_COLORS.VIRIDIAN}`
                      : isDrafting
                        ? "1.5px solid #F59E0B"
                        : `1px solid ${BRAND_COLORS.SOFT_SAGE}50`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  {/* Slot Top Header */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: BRAND_COLORS.OLIVE_INK,
                        }}
                      >
                        {slot.dayLabel}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#666",
                          backgroundColor: BRAND_COLORS.WARM_IVORY,
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        🕒 {slot.targetTime}
                      </span>
                    </div>

                    {/* Pillar Badge */}
                    <div style={{ marginBottom: "8px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: BRAND_COLORS.VIRIDIAN,
                          backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          display: "inline-block",
                          marginBottom: "4px",
                        }}
                      >
                        {slot.pillarLabel}
                      </span>
                      <p style={{ margin: 0, fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.75 }}>
                        {slot.pillarBurmese}
                      </p>
                    </div>

                    {/* Recommended Visual & Length Specs */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "10.5px",
                        color: "#666",
                        borderTop: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
                        borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
                        padding: "6px 0",
                        marginBottom: "10px",
                      }}
                    >
                      <span>
                        {slot.recommendedFormat === "album" ? "📱 4-Slide Album" : "🖼️ Single Graphic"}
                      </span>
                      <span>🎯 {slot.targetWordCount}</span>
                    </div>

                    {/* Slot Content Status */}
                    {slot.draftTopic ? (
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          backgroundColor: "#FAF9F5",
                          border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: isReady ? BRAND_COLORS.VIRIDIAN : "#D97706",
                            }}
                          >
                            {slot.status === "published"
                              ? "✅ Published"
                              : slot.status === "scheduled"
                                ? "📅 Scheduled"
                                : slot.status === "ready"
                                  ? "⭐ Approved & Ready"
                                  : "✏️ In Draft"}
                          </span>
                          {slot.draftWordCount ? (
                            <span style={{ fontSize: "10px", color: "#888" }}>
                              {slot.draftWordCount} words
                            </span>
                          ) : null}
                        </div>
                        <strong
                          style={{
                            fontSize: "12px",
                            color: BRAND_COLORS.OLIVE_INK,
                            display: "block",
                            lineHeight: 1.3,
                          }}
                        >
                          {slot.draftTopic}
                        </strong>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1.5px dashed #D1D5DB",
                          textAlign: "center",
                          color: "#9CA3AF",
                          fontSize: "12px",
                        }}
                      >
                        <span>No post assigned to this slot yet</span>
                      </div>
                    )}
                  </div>

                  {/* Slot Actions */}
                  <div>
                    {isEmpty ? (
                      <Link
                        href="/create"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          backgroundColor: BRAND_COLORS.VIRIDIAN,
                          color: "#fff",
                          textDecoration: "none",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Zap size={13} />
                        <span>Fill Slot with AI</span>
                      </Link>
                    ) : (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link
                          href="/create"
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                            border: `1px solid ${BRAND_COLORS.VIRIDIAN}`,
                            color: BRAND_COLORS.VIRIDIAN,
                            textDecoration: "none",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          <span>Open in Studio</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "library" && (
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Draft library</h2>
              <p>Check whether a post is still a draft, approved, blocked by Risk Guard, or manually published.</p>
            </div>
            <Link className="secondary-button nav-action-link" href="/create">
              Create new draft
            </Link>
          </div>

          <div className="filter-row" aria-label="Content filters">
            {filters.map((filter) => (
              <button
                key={filter.key}
                className={`filter-chip ${activeFilter === filter.key ? "active" : ""}`}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label} <span>{counts[filter.key]}</span>
              </button>
            ))}
          </div>

          {status === "error" ? (
            <p className="form-message error">{message}</p>
          ) : status === "loading" ? (
            <div className="empty-state">
              <strong>Loading content library</strong>
              <p>Checking saved FYF drafts and status history.</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="empty-state">
              <strong>No drafts in this filter</strong>
              <p>
                Generate one post in <Link href="/create">Create</Link>, then approve it before photo planning.
              </p>
            </div>
          ) : (
            <div className="content-card-list">
              {filteredDrafts.map((draft) => (
                <article key={draft.id} className="content-card">
                  <div className="content-card-main">
                    <div className="content-card-header">
                      <div>
                        <h3>{draft.topic}</h3>
                        <p>{draft.content.slice(0, 260)}{draft.content.length > 260 ? "…" : ""}</p>
                      </div>
                      <span className={`status-indicator ${statusClass(draft.status)}`}>{formatStatus(draft.status)}</span>
                    </div>
                    <div className="content-meta-row">
                      <span>Risk: {draft.riskLevel}</span>
                      <span>Score: {draft.score}</span>
                      <span>Version: {draft.version}</span>
                      <span>Updated: {formatUpdatedAt(draft.updatedAt)}</span>
                    </div>
                    {publishJobs.find((job) => job.draftId === draft.id && job.externalPostId) ? (
                      <p className="published-link">
                        Manual Facebook record: {publishJobs.find((job) => job.draftId === draft.id && job.externalPostId)?.externalPostId}
                      </p>
                    ) : null}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                      <Link
                        className="text-button content-card-action"
                        href={`/review?workspaceId=${workspaceId}&draftId=${draft.id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: BRAND_COLORS.VIRIDIAN, fontWeight: 600 }}
                      >
                        <Share2 size={13} />
                        <span>Client Review Portal</span>
                      </Link>
                      {(draft.status === "needs_review" || draft.status === "risk_blocked") && (
                        <Link className="text-button content-card-action" href="/create">
                          Continue in Create
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
