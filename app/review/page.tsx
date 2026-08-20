"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  MessageSquare,
  Copy,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2
} from "lucide-react";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";
import { BannerPreview } from "@/frontend/components/banner/BannerPreview";
import { generateBannerFromDraft } from "@/src/domain/banner/generator";
import type { Draft } from "@/backend/types";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId") || searchParams.get("id");
  const workspaceIdParam = searchParams.get("workspaceId");

  const { currentWorkspace } = useWorkspace();
  const activeWorkspaceId = workspaceIdParam || currentWorkspace?.id || "ws-fyf";

  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadDraft() {
      setIsLoading(true);
      try {
        if (draftIdParam) {
          const res = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts/${draftIdParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data.draft) {
              setDraft(data.draft);
              return;
            }
          }
        }
        // Fallback: load latest draft from workspace
        const resAll = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts`);
        if (resAll.ok) {
          const data = await resAll.json();
          if (data.drafts && data.drafts.length > 0) {
            setDraft(data.drafts[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load draft for review:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDraft();
  }, [activeWorkspaceId, draftIdParam]);

  const handleApprove = async () => {
    if (!draft) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts/${draft.id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft || { ...draft, status: "approved" });
        setStatusMessage({ type: "success", text: "🎉 စာမူနှင့် ပုံများကို အတည်ပြုပြီးပါပြီ! (Approved for Publishing)" });
      }
    } catch {
      setStatusMessage({ type: "error", text: "အတည်ပြုရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !feedbackText.trim()) return;
    setIsActionLoading(true);
    setIsAutoFixing(true);
    setFeedbackModalOpen(false);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts/${draft.id}/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "client_feedback",
          instruction: feedbackText.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft || { ...draft, status: "needs_review", version: draft.version + 1 });
        setStatusMessage({ type: "success", text: `✨ AI Auto-Fix ဖြင့် Version ${data.draft?.version || draft.version + 1} အဖြစ် ပြင်ဆင်ပြီးပါပြီ!` });
        setFeedbackText("");
      }
    } catch {
      setStatusMessage({ type: "error", text: "ပြင်ဆင်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။" });
    } finally {
      setIsActionLoading(false);
      setIsAutoFixing(false);
    }
  };

  const handleCopyCaption = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("🔗 Shareable Review Link copied to clipboard!");
  };

  // Render 4 slides dynamically
  const slides = useMemo(() => {
    if (!draft) return [];
    return [
      {
        title: "Slide 1: Hook & Headline",
        svg: generateBannerFromDraft(
          { topic: draft.topic || "AI စနစ်များနှင့် လုပ်ငန်းခွင် အန္တရာယ်", content: draft.content },
          "album_carousel"
        ).svg
      },
      {
        title: "Slide 2: The Operational Risk",
        svg: generateBannerFromDraft(
          { topic: "လုပ်ငန်းခွင် ဆုံးရှုံးနိုင်ခြေ အန္တရာယ်", content: draft.content },
          "system_risk_story"
        ).svg
      },
      {
        title: "Slide 3: Human Verification Gate",
        svg: generateBannerFromDraft(
          { topic: "လူကိုယ်တိုင် စစ်ဆေးသည့် Human Verification Gate", content: draft.content },
          "knowledge_framework"
        ).svg
      },
      {
        title: "Slide 4: Key Rule & Lead CTA",
        svg: generateBannerFromDraft(
          { topic: "လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow တည်ဆောက်ပါ", content: draft.content },
          "live_architecture_ui"
        ).svg
      }
    ];
  }, [draft]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "80px auto", textAlign: "center", color: BRAND_COLORS.SOFT_SAGE }}>
        <p className="animate-pulse">Loading draft for client review...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div style={{ maxWidth: "800px", margin: "60px auto", padding: "32px", backgroundColor: BRAND_COLORS.SURFACE_WHITE, borderRadius: "12px", textAlign: "center" }}>
        <h3 style={{ color: BRAND_COLORS.OLIVE_INK }}>No Draft Found</h3>
        <p style={{ color: BRAND_COLORS.SOFT_SAGE, marginBottom: "20px" }}>There is no active draft to review in this workspace.</p>
        <button onClick={() => router.push("/create")} className="primary-button">Go to Studio</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Top Client Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.push("/content")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              color: BRAND_COLORS.OLIVE_INK,
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Drafts</span>
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={16} color={BRAND_COLORS.VIRIDIAN} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
                {currentWorkspace?.name || "FYF AI"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: draft.status === "approved" ? `${BRAND_COLORS.VIRIDIAN}20` : `${"#C84B31"}20`,
                  color: draft.status === "approved" ? BRAND_COLORS.VIRIDIAN : "#C84B31",
                  textTransform: "uppercase"
                }}
              >
                {draft.status === "approved" ? "⭐ Approved" : "⏳ Pending Client Review"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleShareLink}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "6px",
              backgroundColor: `${BRAND_COLORS.SOFT_SAGE}20`,
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
              color: BRAND_COLORS.OLIVE_INK,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Share2 size={14} color={BRAND_COLORS.VIRIDIAN} />
            <span>Share Review Link</span>
          </button>
        </div>
      </div>

      {isAutoFixing && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
            border: `1.5px dashed ${BRAND_COLORS.VIRIDIAN}`,
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <Sparkles className="animate-spin" size={20} color={BRAND_COLORS.VIRIDIAN} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>
              🤖 AI Agent Revision In Progress...
            </div>
            <div style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK }}>
              Applying client instructions, calibrating Rule #10 Zero-Jargon standards, and regenerating 4-slide vector album.
            </div>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: statusMessage.type === "success" ? `${BRAND_COLORS.VIRIDIAN}15` : "#fee2e2",
            border: `1px solid ${statusMessage.type === "success" ? BRAND_COLORS.VIRIDIAN : "#ef4444"}`,
            color: statusMessage.type === "success" ? BRAND_COLORS.VIRIDIAN : "#b91c1c",
            fontSize: "13px",
            fontWeight: 600
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Main Review Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "start" }}>
        {/* Left Column: Visual Album Slides Preview */}
        <div
          style={{
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "12px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
            padding: "20px",
            boxShadow: "0 2px 8px rgba(48, 56, 44, 0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
              🎨 4-Slide Album Visual Preview
            </span>
            <span style={{ fontSize: "12px", color: BRAND_COLORS.SOFT_SAGE }}>
              Slide {activeSlideIndex + 1} of {slides.length}
            </span>
          </div>

          {/* Slide Tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            {slides.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: `1px solid ${activeSlideIndex === idx ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}40`}`,
                  backgroundColor: activeSlideIndex === idx ? `${BRAND_COLORS.VIRIDIAN}15` : BRAND_COLORS.SURFACE_WHITE,
                  color: activeSlideIndex === idx ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                  fontSize: "11px",
                  fontWeight: activeSlideIndex === idx ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                Slide {idx + 1}
              </button>
            ))}
          </div>

          {/* Active SVG Canvas */}
          <div style={{ borderRadius: "8px", overflow: "hidden", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40` }}>
            <BannerPreview
              svgString={slides[activeSlideIndex]?.svg || ""}
              templateFamily="system_risk_story"
              categoryLabel={slides[activeSlideIndex]?.title}
              showControls={false}
            />
          </div>

          {/* Carousel Arrows */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => setActiveSlideIndex((p) => Math.max(0, p - 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                color: BRAND_COLORS.OLIVE_INK,
                fontSize: "12px",
                cursor: activeSlideIndex === 0 ? "not-allowed" : "pointer",
                opacity: activeSlideIndex === 0 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={14} /> Previous Slide
            </button>
            <button
              type="button"
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => setActiveSlideIndex((p) => Math.min(slides.length - 1, p + 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                color: BRAND_COLORS.OLIVE_INK,
                fontSize: "12px",
                cursor: activeSlideIndex === slides.length - 1 ? "not-allowed" : "pointer",
                opacity: activeSlideIndex === slides.length - 1 ? 0.5 : 1
              }}
            >
              Next Slide <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Burmese Post Caption & Approval Gate */}
        <div
          style={{
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "12px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
            padding: "24px",
            boxShadow: "0 2px 8px rgba(48, 56, 44, 0.04)"
          }}
        >
          {/* Post Headline & Verification Gates */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                  color: BRAND_COLORS.VIRIDIAN
                }}
              >
                System & Risk Story
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: draft.version > 1 ? "#FEF3C7" : `${BRAND_COLORS.SOFT_SAGE}20`,
                  color: draft.version > 1 ? "#92400E" : BRAND_COLORS.OLIVE_INK
                }}
              >
                ⭐ Version {draft.version} {draft.version > 1 ? "(AI Revised)" : "(Initial Draft)"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: BRAND_COLORS.VIRIDIAN, fontWeight: 600 }}>
                <ShieldCheck size={13} /> Rule #10 Zero-Jargon Verified
              </span>
            </div>

            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK }}>
              {draft.topic}
            </h2>
          </div>

          {/* Burmese Caption Body */}
          <div
            style={{
              padding: "16px",
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              borderRadius: "8px",
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
              marginBottom: "14px"
            }}
          >
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.75",
                color: BRAND_COLORS.OLIVE_INK,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-noto-sans-myanmar), system-ui, sans-serif"
              }}
            >
              {draft.content}
            </div>
          </div>

          {/* Revision History Log if available */}
          {draft.revisions && draft.revisions.length > 0 && (
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: `${BRAND_COLORS.WARM_IVORY}90`,
                borderRadius: "8px",
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                marginBottom: "16px"
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK, marginBottom: "6px" }}>
                📜 Revision History ({draft.revisions.length} revision{draft.revisions.length > 1 ? "s" : ""})
              </div>
              {draft.revisions.map((rev, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "11px",
                    color: BRAND_COLORS.OLIVE_INK,
                    marginTop: "4px",
                    paddingLeft: "8px",
                    borderLeft: `2px solid ${BRAND_COLORS.VIRIDIAN}`
                  }}
                >
                  <span style={{ fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>v{rev.version}:</span> {rev.instruction}
                </div>
              ))}
            </div>
          )}

          {/* Copy Caption Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={handleCopyCaption}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                color: BRAND_COLORS.OLIVE_INK,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Copy size={13} />
              <span>{copied ? "Copied to Clipboard!" : "Copy Full Caption"}</span>
            </button>
          </div>

          {/* Client Approval Action Gate */}
          <div
            style={{
              padding: "18px",
              borderRadius: "10px",
              backgroundColor: `${BRAND_COLORS.VIRIDIAN}08`,
              border: `1px solid ${BRAND_COLORS.VIRIDIAN}30`,
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} color={BRAND_COLORS.VIRIDIAN} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
                Client Review & Decision Gate
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(true)}
                disabled={isActionLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${"#C84B31"}`,
                  backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                  color: "#C84B31",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <MessageSquare size={15} />
                <span>💬 Request Changes</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isActionLoading || draft.status === "approved"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: draft.status === "approved" ? BRAND_COLORS.SOFT_SAGE : BRAND_COLORS.VIRIDIAN,
                  color: BRAND_COLORS.SURFACE_WHITE,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: draft.status === "approved" ? "default" : "pointer"
                }}
              >
                <CheckCircle size={15} />
                <span>{draft.status === "approved" ? "✅ Approved" : "✅ Approve for Publishing"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Changes Feedback Modal */}
      {feedbackModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(48, 56, 44, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              borderRadius: "12px",
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
              💬 Submit Change Request
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: BRAND_COLORS.SOFT_SAGE }}>
              Enter what needs to be revised or improved in this draft/slides.
            </p>

            <form onSubmit={handleRequestChanges}>
              <textarea
                required
                rows={4}
                placeholder="e.g. Slide 2 တွင် အသုံးအနှုန်းကို ပိုမိုရှင်းလင်းစွာ ပြင်ပေးပါ..."
                className="input-field"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                style={{ width: "100%", marginBottom: "16px" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="ghost-button"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading || !feedbackText.trim()}
                  className="primary-button"
                  style={{
                    padding: "8px 18px",
                    fontSize: "13px",
                    backgroundColor: "#C84B31",
                    color: BRAND_COLORS.SURFACE_WHITE,
                    fontWeight: 700
                  }}
                >
                  {isActionLoading ? "Submitting..." : "Send Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading review portal...</div>}>
      <ReviewContent />
    </Suspense>
  );
}
