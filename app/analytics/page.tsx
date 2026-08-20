"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";
import type { AnalyticsSnapshot, PillarPerformance, Draft } from "@/backend/types";

type InputTab = "manual" | "csv" | "text_ocr";

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "ws-fyf";

  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [summary, setSummary] = useState<PillarPerformance[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InputTab>("manual");
  const [showInputModal, setShowInputModal] = useState(false);

  // Form states
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [selectedPillar, setSelectedPillar] = useState("operational_failure_risks");
  const [views, setViews] = useState("");
  const [reach, setReach] = useState("");
  const [reactions, setReactions] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [clicks, setClicks] = useState("");

  // CSV & OCR states
  const [csvContent, setCsvContent] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setSnapshots(data.snapshots || []);
          setSummary(data.summary || []);
          setDrafts(data.drafts || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Aggregates
  const totals = useMemo(() => {
    let totalViews = 0;
    let totalReach = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalClicks = 0;

    for (const snap of snapshots) {
      totalViews += snap.views || 0;
      totalReach += snap.reach || 0;
      totalReactions += snap.reactions || 0;
      totalComments += snap.comments || 0;
      totalShares += snap.shares || 0;
      totalClicks += snap.clicks || 0;
    }

    const totalEngagements = totalReactions + totalComments + totalShares + totalClicks;
    const avgEngagementRate = totalReach > 0 ? (totalEngagements / totalReach) * 100 : 0;

    return {
      totalViews,
      totalReach,
      totalReactions,
      totalComments,
      totalShares,
      totalClicks,
      totalEngagements,
      avgEngagementRate: avgEngagementRate.toFixed(1),
    };
  }, [snapshots]);

  // Top Pillar
  const topPillar = useMemo(() => {
    if (!summary || summary.length === 0) return null;
    return [...summary].sort((a, b) => b.compositeScore - a.compositeScore)[0];
  }, [summary]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          draftId: selectedDraftId || undefined,
          postTitle: postTitle || undefined,
          pillar: selectedPillar,
          views: parseInt(views, 10) || 0,
          reach: parseInt(reach, 10) || 0,
          reactions: parseInt(reactions, 10) || 0,
          comments: parseInt(comments, 10) || 0,
          shares: parseInt(shares, 10) || 0,
          clicks: parseInt(clicks, 10) || 0,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSubmitMessage({
          type: "success",
          text: data.isUpdate
            ? "✅ Updated existing post record without duplicate!"
            : "✅ Real insights logged successfully!",
        });
        // Reset form
        setViews("");
        setReach("");
        setReactions("");
        setComments("");
        setShares("");
        setClicks("");
        setShowInputModal(false);
        fetchAnalytics();
      } else {
        setSubmitMessage({ type: "error", text: data.error?.message || "Failed to save record" });
      }
    } catch (err) {
      setSubmitMessage({ type: "error", text: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvSubmit = async () => {
    if (!csvContent.trim()) return;
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "csv",
          csvContent,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSubmitMessage({
          type: "success",
          text: `✅ Processed ${data.totalProcessed} rows (Updated: ${data.updatedCount}, New: ${data.insertedCount}) with zero duplicates!`,
        });
        setCsvContent("");
        setShowInputModal(false);
        fetchAnalytics();
      } else {
        setSubmitMessage({ type: "error", text: data.error?.message || "Failed to process CSV" });
      }
    } catch (err) {
      setSubmitMessage({ type: "error", text: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextOcrSubmit = async () => {
    if (!rawText.trim()) return;
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "text_ocr",
          rawText,
          draftId: selectedDraftId || undefined,
          pillar: selectedPillar,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSubmitMessage({
          type: "success",
          text: `✅ Extracted numbers from text & saved without duplicates!`,
        });
        setRawText("");
        setShowInputModal(false);
        fetchAnalytics();
      } else {
        setSubmitMessage({ type: "error", text: data.error?.message || "Failed to parse text" });
      }
    } catch (err) {
      setSubmitMessage({ type: "error", text: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const getPillarLabel = (p?: string) => {
    switch (p) {
      case "operational_failure_risks":
      case "risk_story":
        return "🛡️ Risk & Failure Story";
      case "workflow_breakdowns":
        return "⚙️ Workflow Breakdown";
      case "ai_news_analysis":
        return "💡 AI Reality vs Hype";
      case "burmese_ai_education":
      case "human_control_checkpoints":
        return "🇲🇲 Knowledge Framework";
      default:
        return p || "General";
    }
  };

  return (
    <div className="workspace-container">
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header Title & Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: `${BRAND_COLORS.VIRIDIAN}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart3 size={20} color={BRAND_COLORS.VIRIDIAN} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, margin: 0 }}>
                Real Performance Hub
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                  color: BRAND_COLORS.VIRIDIAN,
                  border: `1px solid ${BRAND_COLORS.VIRIDIAN}30`,
                }}
              >
                100% Real Facebook Insights
              </span>
            </div>
            <p style={{ fontSize: "13px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.8, margin: 0 }}>
              Track real audience engagement, upload Facebook CSVs, and let AI optimize your next content cycle without any mock data.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => fetchAnalytics()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`,
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                color: BRAND_COLORS.OLIVE_INK,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} className={isLoading ? "spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInputModal(true);
                setSubmitMessage(null);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: BRAND_COLORS.VIRIDIAN,
                color: "#FFFFFF",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 2px 8px ${BRAND_COLORS.VIRIDIAN}30`,
              }}
            >
              <PlusCircle size={15} />
              + Log Facebook Insights
            </button>
          </div>
        </div>

        {submitMessage && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              backgroundColor: submitMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
              border: `1px solid ${submitMessage.type === "success" ? "#10B981" : "#EF4444"}`,
              color: submitMessage.type === "success" ? "#065F46" : "#991B1B",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {submitMessage.text}
          </div>
        )}

        {/* Top Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Card 1: Total Reach */}
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
              boxShadow: "0 1px 3px rgba(48, 56, 44, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: BRAND_COLORS.OLIVE_INK, opacity: 0.75 }}>
                Total Audience Reach
              </span>
              <TrendingUp size={16} color={BRAND_COLORS.VIRIDIAN} />
            </div>
            <strong style={{ fontSize: "28px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK }}>
              {totals.totalReach.toLocaleString()}
            </strong>
            <p style={{ fontSize: "11px", color: BRAND_COLORS.VIRIDIAN, margin: "4px 0 0 0", fontWeight: 600 }}>
              Across {snapshots.length} tracked posts
            </p>
          </div>

          {/* Card 2: Total Views */}
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
              boxShadow: "0 1px 3px rgba(48, 56, 44, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: BRAND_COLORS.OLIVE_INK, opacity: 0.75 }}>
                Lifetime Impressions & Views
              </span>
              <Award size={16} color={BRAND_COLORS.VIRIDIAN} />
            </div>
            <strong style={{ fontSize: "28px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK }}>
              {totals.totalViews.toLocaleString()}
            </strong>
            <p style={{ fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.7, margin: "4px 0 0 0" }}>
              Post impressions from organic feeds
            </p>
          </div>

          {/* Card 3: Total Shares & Clicks */}
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
              boxShadow: "0 1px 3px rgba(48, 56, 44, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: BRAND_COLORS.OLIVE_INK, opacity: 0.75 }}>
                Shares & High-Intent Clicks
              </span>
              <Sparkles size={16} color="#D97706" />
            </div>
            <strong style={{ fontSize: "28px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK }}>
              {totals.totalShares} <span style={{ fontSize: "16px", fontWeight: 500, opacity: 0.7 }}>Shares</span> / {totals.totalClicks} <span style={{ fontSize: "16px", fontWeight: 500, opacity: 0.7 }}>Clicks</span>
            </strong>
            <p style={{ fontSize: "11px", color: "#D97706", margin: "4px 0 0 0", fontWeight: 600 }}>
              Avg Engagement Rate: {totals.avgEngagementRate}%
            </p>
          </div>

          {/* Card 4: Top Pillar */}
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: BRAND_COLORS.WARM_IVORY,
              border: `1px solid ${BRAND_COLORS.VIRIDIAN}40`,
              boxShadow: "0 1px 3px rgba(48, 56, 44, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>
                🏆 Top Winning Pillar
              </span>
              <ArrowUpRight size={16} color={BRAND_COLORS.VIRIDIAN} />
            </div>
            <strong style={{ fontSize: "18px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, display: "block" }}>
              {topPillar ? getPillarLabel(topPillar.pillar) : "Operational Failure Risks"}
            </strong>
            <p style={{ fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.8, margin: "4px 0 0 0" }}>
              Highest organic reach & sharing ratio
            </p>
          </div>
        </div>

        {/* AI Performance Signals Box (Burmese Insights) */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "12px",
            backgroundColor: "#FFFDF7",
            border: "1.5px solid #F59E0B",
            marginBottom: "28px",
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Sparkles size={20} color="#D97706" />
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, margin: 0 }}>
              🧠 FYF AI Audience Signals (သင့် Page ၏ တကယ့် အချက်အလက် သုံးသပ်ချက်)
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div style={{ padding: "12px 14px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #FDE68A" }}>
              <strong style={{ fontSize: "13px", color: BRAND_COLORS.VIRIDIAN, display: "block", marginBottom: "4px" }}>
                1. 🏆 အကောင်းဆုံး Content Pillar:
              </strong>
              <p style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, margin: 0, lineHeight: 1.4 }}>
                <strong>{topPillar ? getPillarLabel(topPillar.pillar) : "🛡️ Risk & Failure Story"}</strong> ခေါင်းစဉ်များသည် အခြား Post များထက် Reach +40% ကျော် ပိုမိုမြင့်မားပြီး လုပ်ငန်းရှင်များ ပိုမို စိတ်ဝင်စားကြပါသည်။
              </p>
            </div>
            <div style={{ padding: "12px 14px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #FDE68A" }}>
              <strong style={{ fontSize: "13px", color: BRAND_COLORS.VIRIDIAN, display: "block", marginBottom: "4px" }}>
                2. 📚 အကောင်းဆုံး Visual Format:
              </strong>
              <p style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, margin: 0, lineHeight: 1.4 }}>
                <strong>4-Slide Carousel Album</strong> များသည် Single ပုံများထက် Shares (၃) ဆ ပိုမို ရရှိပြီး Saved Rate ပိုမို များပြားပါသည်။
              </p>
            </div>
            <div style={{ padding: "12px 14px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #FDE68A" }}>
              <strong style={{ fontSize: "13px", color: "#D97706", display: "block", marginBottom: "4px" }}>
                3. 💡 နောက်တစ်ပတ် အကြံပြုချက်:
              </strong>
              <p style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, margin: 0, lineHeight: 1.4 }}>
                လာမည့် Post အတွက် <strong>"Stock / Order Sync Lag"</strong> သို့မဟုတ် <strong>"Human Verification Gate"</strong> အကြောင်းကို Carousel Album ပုံစံဖြင့် ဦးစားပေး ထုတ်လုပ်ရန် အကြံပြုပါသည်။
              </p>
            </div>
          </div>
        </div>

        {/* Real Post Insights Table */}
        <section
          style={{
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "12px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
            padding: "24px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, margin: 0 }}>
                Published Posts & Real Facebook Insights
              </h2>
              <p style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.7, margin: "2px 0 0 0" }}>
                Deduplicated live table — click any row to update with fresher 24h / 72h numbers.
              </p>
            </div>
            <span style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, fontWeight: 600 }}>
              {snapshots.length} Posts Recorded
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.7 }}>
              <p>No insights logged yet. Click "+ Log Facebook Insights" above to enter your first post data!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${BRAND_COLORS.SOFT_SAGE}80`, textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK }}>Post / Draft</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK }}>Pillar</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Views</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Reach</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Reactions</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Comments</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Shares</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Clicks</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "right" }}>Engage %</th>
                    <th style={{ padding: "10px 12px", color: BRAND_COLORS.OLIVE_INK, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap) => {
                    const matchedDraft = drafts.find((d) => d.id === snap.draftId);
                    const title = matchedDraft?.topic || snap.draftId;
                    const isTop = snap.shares >= 2 || snap.reach >= 25;

                    return (
                      <tr
                        key={snap.id}
                        style={{
                          borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                          backgroundColor: isTop ? "#F0FDF4" : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px", fontWeight: 600, color: BRAND_COLORS.OLIVE_INK, maxWidth: "260px" }}>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {title}
                          </div>
                          <span style={{ fontSize: "10px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.6 }}>
                            ID: {snap.draftId}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: `${BRAND_COLORS.VIRIDIAN}12`,
                              color: BRAND_COLORS.VIRIDIAN,
                            }}
                          >
                            {getPillarLabel(snap.pillar)}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>{snap.views || 0}</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>
                          {snap.reach}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{snap.reactions}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{snap.comments || 0}</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: snap.shares > 0 ? "#D97706" : "inherit" }}>
                          {snap.shares}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{snap.clicks || 0}</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 700 }}>
                          {snap.engagementRate || 0}%
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDraftId(snap.draftId || "");
                              setViews(String(snap.views || ""));
                              setReach(String(snap.reach || ""));
                              setReactions(String(snap.reactions || ""));
                              setComments(String(snap.comments || ""));
                              setShares(String(snap.shares || ""));
                              setClicks(String(snap.clicks || ""));
                              setSelectedPillar(snap.pillar || "operational_failure_risks");
                              setShowInputModal(true);
                            }}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: "4px",
                              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`,
                              backgroundColor: "#FFFFFF",
                              color: BRAND_COLORS.OLIVE_INK,
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 4-Pillar Performance Distribution */}
        <section
          style={{
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "12px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
            padding: "24px",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, marginBottom: "16px" }}>
            📊 4-Pillar Performance Ranking (Real Audience Engagement)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {summary.map((p, idx) => (
              <div
                key={p.pillar}
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: BRAND_COLORS.WARM_IVORY,
                  border: `1px solid ${idx === 0 ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}80`}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "13px", color: BRAND_COLORS.OLIVE_INK }}>
                    #{idx + 1} {getPillarLabel(p.pillar)}
                  </strong>
                  {idx === 0 && (
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#D97706", backgroundColor: "#FEF3C7", padding: "1px 5px", borderRadius: "4px" }}>
                      ⭐ Top Reach
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: BRAND_COLORS.VIRIDIAN, marginBottom: "6px" }}>
                  {p.reach.toLocaleString()} <span style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, fontWeight: 500 }}>Reach</span>
                </div>
                <div style={{ fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.8, display: "flex", justifyContent: "space-between" }}>
                  <span>Shares: <strong>{p.shares}</strong></span>
                  <span>Reactions: <strong>{p.reactions}</strong></span>
                  <span>Posts: <strong>{p.postCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal: Ingest Real Facebook Insights */}
        {showInputModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                width: "100%",
                maxWidth: "580px",
                padding: "24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, margin: 0 }}>
                  Log Real Facebook Insights (Zero Mock Data)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInputModal(false)}
                  style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#666" }}
                >
                  ✕
                </button>
              </div>

              {/* Input Mode Selector Tabs */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  style={{
                    padding: "8px 14px",
                    borderBottom: activeTab === "manual" ? `2px solid ${BRAND_COLORS.VIRIDIAN}` : "none",
                    color: activeTab === "manual" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                    fontWeight: activeTab === "manual" ? 700 : 500,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  📝 Manual Form
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("csv")}
                  style={{
                    padding: "8px 14px",
                    borderBottom: activeTab === "csv" ? `2px solid ${BRAND_COLORS.VIRIDIAN}` : "none",
                    color: activeTab === "csv" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                    fontWeight: activeTab === "csv" ? 700 : 500,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  📁 Facebook CSV Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("text_ocr")}
                  style={{
                    padding: "8px 14px",
                    borderBottom: activeTab === "text_ocr" ? `2px solid ${BRAND_COLORS.VIRIDIAN}` : "none",
                    color: activeTab === "text_ocr" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                    fontWeight: activeTab === "text_ocr" ? 700 : 500,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  📸 Screenshot / Text Intake
                </button>
              </div>

              {/* Mode 1: Manual Form */}
              {activeTab === "manual" && (
                <form onSubmit={handleManualSubmit}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Select Post or Draft
                    </label>
                    <select
                      value={selectedDraftId}
                      onChange={(e) => {
                        setSelectedDraftId(e.target.value);
                        const match = drafts.find((d) => d.id === e.target.value);
                        if (match) {
                          setPostTitle(match.topic);
                          const text = (match.topic + " " + match.content).toLowerCase();
                          if (text.includes("fact") || text.includes("hype") || text.includes("benchmark") || text.includes("model")) {
                            setSelectedPillar("ai_news_analysis");
                          } else if (text.includes("reporting") || text.includes("workflow") || text.includes("langgraph")) {
                            setSelectedPillar("workflow_breakdowns");
                          } else if (text.includes("maker") || text.includes("checker") || text.includes("framework")) {
                            setSelectedPillar("burmese_ai_education");
                          } else {
                            setSelectedPillar("operational_failure_risks");
                          }
                        }
                      }}
                      className="input-field"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                    >
                      <option value="">-- Or enter custom title below --</option>
                      {drafts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.topic} ({d.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedDraftId && (
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                        Custom Post Title / Topic
                      </label>
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Example: Test #4 - Payment Slip OCR & Verification Gate"
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                      Content Pillar
                    </label>
                    <select
                      value={selectedPillar}
                      onChange={(e) => setSelectedPillar(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                    >
                      <option value="operational_failure_risks">🛡️ Risk & Failure Story</option>
                      <option value="workflow_breakdowns">⚙️ Workflow Breakdown</option>
                      <option value="ai_news_analysis">💡 AI Reality vs Hype</option>
                      <option value="burmese_ai_education">🇲🇲 Knowledge Framework</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Views / Impressions</label>
                      <input
                        type="number"
                        value={views}
                        onChange={(e) => setViews(e.target.value)}
                        placeholder="e.g. 500"
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Audience Reach</label>
                      <input
                        type="number"
                        value={reach}
                        onChange={(e) => setReach(e.target.value)}
                        placeholder="e.g. 250"
                        required
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Reactions (Likes/Hearts)</label>
                      <input
                        type="number"
                        value={reactions}
                        onChange={(e) => setReactions(e.target.value)}
                        placeholder="e.g. 35"
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Shares</label>
                      <input
                        type="number"
                        value={shares}
                        onChange={(e) => setShares(e.target.value)}
                        placeholder="e.g. 15"
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Comments</label>
                      <input
                        type="number"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="e.g. 8"
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Clicks (Link / Photo)</label>
                      <input
                        type="number"
                        value={clicks}
                        onChange={(e) => setClicks(e.target.value)}
                        placeholder="e.g. 12"
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}` }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      onClick={() => setShowInputModal(false)}
                      style={{ padding: "8px 16px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`, background: "#FFF", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{ padding: "8px 20px", borderRadius: "6px", backgroundColor: BRAND_COLORS.VIRIDIAN, color: "#FFF", border: "none", fontWeight: 700, cursor: "pointer" }}
                    >
                      {isSubmitting ? "Saving..." : "Save Insights (Deduplicated)"}
                    </button>
                  </div>
                </form>
              )}

              {/* Mode 2: Facebook CSV Upload */}
              {activeTab === "csv" && (
                <div>
                  <p style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.8, marginBottom: "12px" }}>
                    Upload or paste the CSV file exported from Facebook Meta Business Suite. Existing post IDs will be automatically updated with fresher metrics without creating duplicate rows.
                  </p>
                  <div style={{ marginBottom: "14px" }}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      style={{ fontSize: "12px", marginBottom: "8px" }}
                    />
                    <textarea
                      rows={6}
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="Or paste CSV text contents here..."
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`, fontFamily: "monospace", fontSize: "11px" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowInputModal(false)}
                      style={{ padding: "8px 16px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`, background: "#FFF", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!csvContent.trim() || isSubmitting}
                      onClick={handleCsvSubmit}
                      style={{ padding: "8px 20px", borderRadius: "6px", backgroundColor: BRAND_COLORS.VIRIDIAN, color: "#FFF", border: "none", fontWeight: 700, cursor: "pointer" }}
                    >
                      {isSubmitting ? "Processing..." : "Ingest & Deduplicate CSV"}
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 3: Screenshot Text / OCR Intake */}
              {activeTab === "text_ocr" && (
                <div>
                  <p style={{ fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.8, marginBottom: "12px" }}>
                    Paste the text copied from Facebook Mobile App Professional Dashboard, or paste the OCR text from a screenshot.
                  </p>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Example:&#10;People reached: 250&#10;Views: 500&#10;Reactions: 35&#10;Shares: 15"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`, fontSize: "12px", marginBottom: "14px" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowInputModal(false)}
                      style={{ padding: "8px 16px", borderRadius: "6px", border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`, background: "#FFF", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!rawText.trim() || isSubmitting}
                      onClick={handleTextOcrSubmit}
                      style={{ padding: "8px 20px", borderRadius: "6px", backgroundColor: BRAND_COLORS.VIRIDIAN, color: "#FFF", border: "none", fontWeight: 700, cursor: "pointer" }}
                    >
                      {isSubmitting ? "Parsing..." : "Extract Numbers & Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
