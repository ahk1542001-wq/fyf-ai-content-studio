"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Sparkles,
  MessageSquare,
  Send,
  ArrowRight,
  RefreshCw,
  X,
  Zap,
  Layers,
  Image as ImageIcon,
  Share2,
} from "lucide-react";
import { BannerStudio } from "@/frontend/components/banner/BannerStudio";
import { BannerPreview } from "@/frontend/components/banner/BannerPreview";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";
import { generateBannerFromDraft } from "@/src/domain/banner/generator";
import type {
  BannerTemplateFamily,
  BannerGenerationResult,
  DraftContentForBanner,
} from "@/src/domain/banner/types";
import type { TopicRecommendation } from "@/backend/types";

type Step = "write" | "photo" | "export";
type SaveStatus = "idle" | "saving" | "saved" | "error";
type PostType = "Facebook post" | "Photo post" | "Reel caption";
type VisualFormat = "single" | "album";
type ProcessStageStatus = "waiting" | "running" | "done" | "blocked";

type DraftApiResponse = {
  draft?: {
    id?: string;
    content?: string;
    topic?: string;
    status?: string;
  };
  error?: string | { message?: string };
};

type ActionStatus = "idle" | "working" | "saved" | "error";

type ContentPillarKey = "risk_story" | "workflow_breakdown" | "reality_vs_hype" | "framework_education";

type ChatMessage = {
  id: string;
  sender: "user" | "copilot";
  text: string;
  suggestions?: Array<{
    title: string;
    burmeseTitle: string;
    pillar: ContentPillarKey;
    details: string;
    wordCount: string;
    suggestedFormat?: VisualFormat;
  }>;
};

const defaultAudience =
  "Myanmar SME owners, founders, business operators, creators, and developers learning practical AI automation.";

function buildDraft(topic: string, details: string, _postType: PostType) {
  const cleanTopic = topic.trim() || "AI Systems Workflow";
  const cleanDetails = details.trim();

  return [
    `${cleanTopic} နှင့် ပတ်သက်ပြီး လုပ်ငန်းခွင်မှာ AI အသုံးပြုရာတွင် မဖြစ်မနေ သတိပြုရမည့် အချက်တစ်ခု ရှိပါတယ်။`,
    "",
    "လုပ်ငန်းတော်တော်များများက AI Tool တွေကို အသုံးပြုပြီး အလုပ်တွေ အမြန်ပြီးဖို့ ကြိုးစားကြပါတယ်။ ဒါပေမဲ့ အချက်အလက်ဖတ်တာ မြန်တိုင်း၊ စာရင်းထွက်လာတိုင်း အဲ့ဒါကို တိုက်ရိုက် အတည်ပြုလိုက်မယ်ဆိုရင် မလိုအပ်တဲ့ အမှားတွေ ဖြစ်လာနိုင်ပါတယ်။",
    cleanDetails ? `\nအဓိက အာရုံစိုက်ရန် အချက်:\n${cleanDetails}\n` : "",
    "FYF AI ၏ အဓိက စနစ်စည်းမျဉ်း (၃) ရပ်:",
    "၁။ အချက်အလက် ကူညီမှတ်သားခြင်း - AI က Chat နှင့် ဖောင်များမှ အချက်အလက်များကို စနစ်တကျ ကူညီမှတ်ပေးမည်။",
    "၂။ မန်နေဂျာ ကိုယ်တိုင် စစ်ဆေးခြင်း (Human Gate) - ဘဏ်ငွေဝင်ရောက်မှုနှင့် စည်းမျဉ်းများကို လူက စစ်ဆေးပြီးမှသာ အတည်ပြုမည်။",
    "၃။ အတည်ပြုပြီးမှ ဆောင်ရွက်ခြင်း - စစ်ဆေးပြီးမှသာ ပစ္စည်းထုတ်ပေးခြင်း သို့မဟုတ် ငွေလွှဲခြင်းကို ဆောင်ရွက်မည်။",
    "",
    "💡 အဓိက သတိပြုရန် စည်းမျဉ်း:",
    "\"AI ကို အချက်အလက် စုစည်းခိုင်းပါ။ ငွေကြေးနှင့် စီးပွားရေး ဆုံးဖြတ်ချက်ကိုတော့ လူကပဲ အတည်ပြုပါ။\"",
    "",
    "သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ \x27WORKFLOW\x27 ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်",
    "",
    "#FYFAI #AIAgents #BusinessAutomation #HumanInTheLoop",
  ].filter(Boolean).join("\n");
}

const CONTENT_PILLARS: Array<{
  id: ContentPillarKey;
  title: string;
  burmeseTitle: string;
  description: string;
  badge: string;
  targetLength: string;
  defaultFormat: VisualFormat;
}> = [
  {
    id: "risk_story",
    title: "🛡️ 1. Risk & Failure Story",
    burmeseTitle: "အမှားအယွင်းနှင့် ဆုံးရှုံးနိုင်ခြေများ",
    description: "Slip/Stock အမှား၊ စာရင်းမကိုက်မှုနှင့် လူကိုယ်တိုင် စစ်ဆေးရမည့် Gate စနစ်များ",
    badge: "Most Viral",
    targetLength: "350 – 450 words (Case Study)",
    defaultFormat: "album",
  },
  {
    id: "workflow_breakdown",
    title: "⚙️ 2. Workflow Breakdown",
    burmeseTitle: "စနစ်တကျ အလုပ်လုပ်ပုံ ရှင်းပြချက်",
    description: "Chat မှာ အော်ဒါမှတ် ➔ AI ကူညီ ➔ မန်နေဂျာစစ်ဆေး ➔ အတည်ပြု အဆင့်ဆင့်လည်ပတ်ပုံ",
    badge: "High Intent",
    targetLength: "350 – 500 words (Step-by-Step)",
    defaultFormat: "album",
  },
  {
    id: "reality_vs_hype",
    title: "💡 3. AI Reality vs Hype",
    burmeseTitle: "အရှိတရားနှင့် ချဲ့ကားမှု ခွဲခြားပြသခြင်း",
    description: "Grok Bot / Tools စျေးကွက်ကြော်ငြာ hype vs လက်တွေ့ SME တွင် ကြုံရမည့် ကန့်သတ်ချက်များ",
    badge: "Authority",
    targetLength: "300 – 400 words (News Analysis)",
    defaultFormat: "single",
  },
  {
    id: "framework_education",
    title: "🇲🇲 4. Knowledge Framework",
    burmeseTitle: "လက်တွေ့သုံး မူဘောင်နှင့် စည်းမျဉ်းများ",
    description: "SME လုပ်ငန်းရှင်များအတွက် 3-Point Checklist နှင့် Zero-Jargon စည်းမျဉ်းများ",
    badge: "Educational",
    targetLength: "180 – 250 words (Checklist)",
    defaultFormat: "single",
  },
];

export default function CreatePage() {
  const { currentWorkspace } = useWorkspace();
  const activeWorkspaceId = currentWorkspace?.id || "ws-fyf";

  const [step, setStep] = useState<Step>("write");
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [selectedPillar, setSelectedPillar] = useState<ContentPillarKey | null>(null);
  const [visualFormat, setVisualFormat] = useState<VisualFormat>("single");
  const [postType, setPostType] = useState<PostType>("Facebook post");
  const [audience, setAudience] = useState(defaultAudience);
  const [showDetails, setShowDetails] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [draft, setDraft] = useState("");
  const [draftId, setDraftId] = useState("");
  const [confirmedContent, setConfirmedContent] = useState(false);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [postLink, setPostLink] = useState("");
  const [publishedMessage, setPublishedMessage] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<ActionStatus>("idle");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [publishStatus, setPublishStatus] = useState<ActionStatus>("idle");
  const [copyMessage, setCopyMessage] = useState("");
  const [preferredFamily, setPreferredFamily] = useState<BannerTemplateFamily>("system_risk_story");
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  const [bannerResult, setBannerResult] = useState<BannerGenerationResult | null>(null);
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "copilot",
      text: "မင်္ဂလာပါ Victor! ကျွန်တော်က FYF Content Co-pilot ဖြစ်ပါတယ်။ သင့်မှာ အိုင်ဒီယာ အကြမ်းပဲရှိတာဖြစ်ဖြစ်၊ သတင်းအသစ် (ဥပမာ Grok Bot, Claude) အကြောင်း ရေးချင်တာဖြစ်ဖြစ် မေးနိုင်ပါတယ်။ အောက်ပါ prompt တွေကိုလည်း နှိပ်ပြီး စတင်နိုင်ပါတယ် -",
      suggestions: [
        {
          title: "AI News Reality Check: Grok Bot & Multi-Agent Teams",
          burmeseTitle: "xAI Grok Bot အသစ်ထွက်လာချိန်တွင် SME များ သတိပြုရမည့် အရှိတရားနှင့် အမှားများ",
          pillar: "reality_vs_hype",
          details: "ကြော်ငြာ hype vs လက်တွေ့ကြုံရမည့် Infinite Loop စရိတ်၊ Context Blindness နှင့် ငွေကြေးကန့်သတ်ချက် ထားရှိပုံ",
          wordCount: "300 – 400 words",
          suggestedFormat: "single",
        },
        {
          title: "Stock Desync Failure: POS vs E-Commerce Inventory Mismatch",
          burmeseTitle: "POS နှင့် Warehouse ကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်လာနိုင်သော ဆုံးရှုံးမှုများ",
          pillar: "risk_story",
          details: "လမ်းမှာရောက်နေဆဲ Order ကို မသိဘဲ AI က ထပ်မှာမိတဲ့အမှားနှင့် Final Approval စစ်ဆေးနည်း",
          wordCount: "350 – 450 words",
          suggestedFormat: "album",
        },
        {
          title: "Payment Slip OCR & Financial Verification Gate",
          burmeseTitle: "ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်းနှင့် လူကိုယ်တိုင် အတည်ပြုခြင်း Gate ၏ အရေးပါပုံ",
          pillar: "risk_story",
          details: "Slip အတု မမိစေရန် AI ကို Data ဖတ်ခိုင်းပြီး ပစ္စည်းထုတ်ပေးခွင့်ကို လူက စစ်ဆေးသည့် စနစ်",
          wordCount: "350 – 450 words",
          suggestedFormat: "album",
        },
      ],
    },
  ]);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/analytics/recommendations`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        }
      } catch {
        // Silently fallback if needed
      }
    }
    loadRecommendations();
  }, [activeWorkspaceId]);

  const detectedPillar = useMemo<ContentPillarKey>(() => {
    const text = `${topic} ${details} ${draft}`.toLowerCase();
    if (/\\b(fact|hype|benchmark|evaluation|model|analysis|grok|bot|news)\\b|အရှိတရား|သတင်း/i.test(text)) {
      return "reality_vs_hype";
    }
    if (/\\b(reporting|workflow|langgraph|pipeline|sync|batch|sqlite|postgres|order|chat)\\b|လည်ပတ်ပုံ|အဆင့်ဆင့်/i.test(text)) {
      return "workflow_breakdown";
    }
    if (/\\b(maker|checker|framework|checklist|principles|rules|guide)\\b|စည်းမျဉ်း|မူဘောင်|အခြေခံ/i.test(text)) {
      return "framework_education";
    }
    return "risk_story";
  }, [topic, details, draft]);

  const activePillar = selectedPillar || detectedPillar;

  const autoSuggestedFormat = useMemo<VisualFormat>(() => {
    if (activePillar === "risk_story" || activePillar === "workflow_breakdown" || postType === "Photo post") {
      return "album";
    }
    return "single";
  }, [activePillar, postType]);

  const draftForBanner: DraftContentForBanner = useMemo(() => {
    return {
      id: draftId,
      topic: topic || "AI Systems Workflow",
      headline: topic || "AI Systems Workflow",
      hook: details,
      content: draft,
      format: visualFormat === "album" ? "album_carousel" : postType,
      takeaway: "Understand AI. Build Real Systems.",
    };
  }, [draftId, topic, details, draft, visualFormat, postType]);

  const processStages: Array<{ label: string; detail: string; status: ProcessStageStatus }> = [
    {
      label: "1. Topic & Recommendations",
      detail: "Data-driven pillar selection with performance score insights.",
      status: topic.trim() ? "done" : "waiting",
    },
    {
      label: "2. Draft Caption",
      detail: "Maker/Checker agent generation with Burmese practitioner mentor voice.",
      status: generateError ? "blocked" : isGenerating ? "running" : draft ? "done" : "waiting",
    },
    {
      label: "3. Content Approval",
      detail: "Risk Guard boundary verification and human approval gate.",
      status: confirmedContent ? "done" : "waiting",
    },
    {
      label: "4. Visual Banner Studio",
      detail: visualFormat === "album" ? "4-Slide Carousel Album 1080x1080 SVG generation." : "Single 1080x1080 SVG graphic preview.",
      status: photoConfirmed ? "done" : confirmedContent ? "running" : "waiting",
    },
  ];

  const showProcessPanel = Boolean(topic.trim() || draft || generateError || confirmedContent || photoConfirmed);
  const processHeadline = isGenerating
    ? "AI is working"
    : generateError
      ? "AI fallback used"
      : photoConfirmed
        ? "Ready to export"
        : confirmedContent
          ? "Visual Banner Studio"
          : draft
            ? "Draft ready"
            : "Ready";
  const processSubtext = isGenerating
    ? "Reading context and generating calibrated Burmese draft..."
    : generateError
      ? "Real AI failed. A local fallback draft is shown — edit it before confirming."
      : photoConfirmed
        ? "Caption and vector graphic are ready for manual export."
        : confirmedContent
          ? "Content approved. Customize your visual banner below."
          : "Select a topic recommendation or write your own.";

  useEffect(() => {
    const saved = window.localStorage.getItem("fyf-create-draft");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        topic?: string;
        details?: string;
        postType?: PostType;
        visualFormat?: VisualFormat;
        audience?: string;
        draft?: string;
        draftId?: string;
        confirmedContent?: boolean;
        photoConfirmed?: boolean;
        postLink?: string;
        preferredFamily?: BannerTemplateFamily;
        bannerResult?: BannerGenerationResult;
      };

      if (
        parsed.draft &&
        (/Project context:/i.test(parsed.draft) ||
          /Voice memory:/i.test(parsed.draft) ||
          /Tone:\\s/i.test(parsed.draft) ||
          /Brand voice:/i.test(parsed.draft))
      ) {
        window.localStorage.removeItem("fyf-create-draft");
        return;
      }

      setTopic(parsed.topic || "");
      setDetails(parsed.details || "");
      setPostType(parsed.postType || "Facebook post");
      if (parsed.visualFormat) setVisualFormat(parsed.visualFormat);
      setAudience(parsed.audience || defaultAudience);
      setDraft(parsed.draft || "");
      setDraftId(parsed.draftId || "");
      setConfirmedContent(Boolean(parsed.confirmedContent));
      setPhotoConfirmed(Boolean(parsed.photoConfirmed));
      setPostLink(parsed.postLink || "");
      if (parsed.preferredFamily) setPreferredFamily(parsed.preferredFamily);
      if (parsed.bannerResult) setBannerResult(parsed.bannerResult);
      if (parsed.details) setShowDetails(true);
      if (parsed.draft) setSaveStatus("saved");
      if (parsed.photoConfirmed) setStep("export");
      else if (parsed.confirmedContent) setStep("photo");
    } catch {
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!topic && !details && !draft) return;
    setSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          "fyf-create-draft",
          JSON.stringify({
            topic,
            details,
            postType,
            visualFormat,
            audience,
            draft,
            draftId,
            confirmedContent,
            photoConfirmed,
            postLink,
            preferredFamily,
            bannerResult,
          })
        );
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [topic, details, postType, visualFormat, audience, draft, draftId, confirmedContent, photoConfirmed, postLink, preferredFamily, bannerResult]);

  function errorMessageFrom(payload: DraftApiResponse, fallback: string) {
    if (typeof payload.error === "string") return payload.error;
    return payload.error?.message || fallback;
  }

  async function triggerGenerate(targetTopic?: string, targetDetails?: string, targetPillar?: ContentPillarKey, targetFormat?: VisualFormat) {
    const topicToUse = targetTopic || topic;
    const detailsToUse = targetDetails !== undefined ? targetDetails : details;
    const pillarToUse = targetPillar || activePillar;
    const formatToUse = targetFormat || visualFormat;

    if (!topicToUse.trim()) return;

    if (targetTopic) setTopic(targetTopic);
    if (targetDetails !== undefined) setDetails(targetDetails);
    if (targetPillar) setSelectedPillar(targetPillar);
    if (targetFormat) setVisualFormat(targetFormat);

    setIsGenerating(true);
    setGenerateError("");
    setApprovalMessage("");
    setApprovalStatus("idle");
    setPublishStatus("idle");
    setConfirmedContent(false);
    setPhotoConfirmed(false);
    setDraftId("");
    setPublishedMessage("");
    setCopyMessage("");

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicToUse,
          tone: "Friendly but disciplined",
          length: "Medium",
          angle: detailsToUse || "Zero-jargon practical SME business AI automation",
          audience,
          cta: "သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ 'WORKFLOW' ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်",
          mediaName: formatToUse === "album" ? "Photo post" : postType,
          pillar: pillarToUse,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as DraftApiResponse;
      if (!response.ok || !payload.draft?.content) {
        throw new Error(errorMessageFrom(payload, "Draft API did not return content"));
      }
      const nextDraft = payload.draft.content;
      setDraft(nextDraft);
      setDraftId(payload.draft.id || "");
    } catch (error) {
      const fallbackDraft = buildDraft(topicToUse, detailsToUse, postType);
      setDraft(fallbackDraft);
      setGenerateError(
        error instanceof Error
          ? `Real AI failed, so a local fallback draft is shown for editing: ${error.message}`
          : "Real AI failed, so a local fallback draft is shown for editing."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateDraft() {
    await triggerGenerate();
  }

  function confirmContent() {
    void approveContent();
  }

  async function approveContent() {
    if (!draft.trim()) return;
    if (isGenerating) {
      setApprovalStatus("error");
      setApprovalMessage("Wait until draft generation finishes before confirming content.");
      return;
    }
    setApprovalStatus("working");
    setApprovalMessage(draftId ? "Saving edits and running Risk Guard before banner studio." : "Local fallback draft approved for banner studio.");

    const targetFamily: BannerTemplateFamily = visualFormat === "album" ? "album_carousel" : preferredFamily;
    setPreferredFamily(targetFamily);

    if (!draftId) {
      setConfirmedContent(true);
      setApprovalStatus("saved");
      setApprovalMessage("Approved locally. Proceeding to Visual Banner Studio.");
      const initResult = generateBannerFromDraft(draftForBanner, targetFamily);
      setBannerResult(initResult);
      setStep("photo");
      return;
    }

    try {
      const editResponse = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts/${encodeURIComponent(draftId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const editPayload = (await editResponse.json().catch(() => ({}))) as DraftApiResponse;
      if (!editResponse.ok) {
        throw new Error(errorMessageFrom(editPayload, "Could not save edited caption."));
      }

      const approveResponse = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts/${encodeURIComponent(draftId)}/approve`, {
        method: "POST",
      });
      const approvePayload = (await approveResponse.json().catch(() => ({}))) as DraftApiResponse;
      if (!approveResponse.ok) {
        throw new Error(errorMessageFrom(approvePayload, "Risk Guard blocked approval."));
      }

      if (approvePayload.draft?.content) setDraft(approvePayload.draft.content);
      setConfirmedContent(true);
      setApprovalStatus("saved");
      setApprovalMessage("Approved in the local workflow. Visual Banner Studio is unlocked.");

      const initResult = generateBannerFromDraft(draftForBanner, targetFamily);
      setBannerResult(initResult);
      setStep("photo");
    } catch (error) {
      setConfirmedContent(false);
      setApprovalStatus("error");
      setApprovalMessage(error instanceof Error ? error.message : "Could not approve this draft.");
    }
  }

  const handleBannerSave = (result: BannerGenerationResult) => {
    setBannerResult(result);
    setPreferredFamily(result.family);
    setPhotoConfirmed(true);
    setPublishStatus("idle");
    setPublishedMessage("");
    setCopyMessage("");
    setStep("export");
  };

  async function markPublished() {
    if (!postLink.trim()) {
      setPublishStatus("error");
      setPublishedMessage("Paste the Facebook post link first, then mark it as published.");
      return;
    }

    setPublishStatus("working");
    setPublishedMessage(draftId ? "Saving manual publish record locally." : "Saving local manual publish note.");

    if (!draftId) {
      setPublishStatus("saved");
      setPublishedMessage("Marked locally. Facebook publishing still stays manual.");
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspaceId}/drafts/${encodeURIComponent(draftId)}/manual-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalPostId: postLink }),
      });
      const payload = (await response.json().catch(() => ({}))) as DraftApiResponse;
      if (!response.ok) {
        throw new Error(errorMessageFrom(payload, "Could not mark this draft as manually posted."));
      }
      setPublishStatus("saved");
      setPublishedMessage("Marked locally. Facebook publishing still stays manual.");
    } catch (error) {
      setPublishStatus("error");
      setPublishedMessage(error instanceof Error ? error.message : "Could not mark this draft as manually posted.");
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyMessage("Caption copied. Paste it into Facebook manually.");
    } catch {
      setCopyMessage("Could not copy automatically. Select the caption text and copy it manually.");
    }
  }

  function handleSendCopilotMessage() {
    if (!copilotInput.trim()) return;
    const userText = copilotInput.trim();
    setCopilotInput("");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userText,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsCopilotThinking(true);

    setTimeout(() => {
      let replyText = "";
      let suggestions: ChatMessage["suggestions"] = [];

      const lower = userText.toLowerCase();

      if (lower.includes("grok") || lower.includes("bot") || lower.includes("သတင်း") || lower.includes("news")) {
        replyText = "xAI ရဲ့ Grok Bot / Multi-Agent စနစ် အကြောင်းကို SME လုပ်ငန်းရှင်တွေအတွက် Zero-Jargon စည်းမျဉ်းနဲ့ သုံးသပ်ထားတဲ့ Content အကြံပြုချက် (၂) ခု ရှိပါတယ်:";
        suggestions = [
          {
            title: "AI News Reality Check: Grok Bot & Multi-Agent Teams",
            burmeseTitle: "xAI Grok Bot အသစ်ထွက်လာချိန်တွင် SME များ သတိပြုရမည့် အရှိတရားနှင့် အမှားများ",
            pillar: "reality_vs_hype",
            details: "Bot အချင်းချင်း စကားပြောပြီး Infinite Loop ဖြစ်တဲ့ စရိတ်၊ Context Blindness နဲ့ လူကိုယ်တိုင် အတည်ပြုခွင့် ထားရှိပုံ",
            wordCount: "300 – 400 words (News Analysis)",
            suggestedFormat: "single",
          },
          {
            title: "Multi-Agent System Architecture for Small Business",
            burmeseTitle: "Bot တွေကို အဖွဲ့လိုက် အလုပ်ခိုင်းတဲ့အခါ ကုန်ကျစရိတ်မတက်အောင် ထိန်းချုပ်နည်း",
            pillar: "workflow_breakdown",
            details: "Bot တစ်ခုစီကို တာဝန်အတိအကျ သတ်မှတ်ပြီး Spending Limit သတ်မှတ်နည်း",
            wordCount: "350 – 500 words (Workflow)",
            suggestedFormat: "album",
          },
        ];
      } else if (lower.includes("slip") || lower.includes("ငွေလွှဲ") || lower.includes("ဘဏ်") || lower.includes("ocr")) {
        replyText = "ငွေလွှဲပြေစာ (Slip) စစ်ဆေးခြင်းနဲ့ ပတ်သက်ပြီး လူကိုယ်တိုင် စစ်ဆေးရမည့် Financial Gate အကြောင်း ရေးသားနိုင်သော အကြံပြုချက် (Slide ၄ ပုံတွဲ Album Post အဖြစ် အကြံပြုပါသည်):";
        suggestions = [
          {
            title: "Payment Slip OCR & Financial Verification Gate",
            burmeseTitle: "ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်းနှင့် လူကိုယ်တိုင် အတည်ပြုခြင်း Gate ၏ အရေးပါပုံ",
            pillar: "risk_story",
            details: "Slip အတု မမိစေရန် AI ကို Data ဖတ်ခိုင်းပြီး ပစ္စည်းထုတ်ပေးခွင့်ကို လူက စစ်ဆေးသည့် စနစ်",
            wordCount: "350 – 450 words (Case Study)",
            suggestedFormat: "album",
          },
        ];
      } else if (lower.includes("stock") || lower.includes("inventory") || lower.includes("အရောင်း") || lower.includes("pos")) {
        replyText = "ဆိုင်ခွဲများကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်တတ်တဲ့ ဆုံးရှုံးနိုင်ခြေနဲ့ ဖြေရှင်းပုံ အကြံပြုချက် (Slide ၄ ပုံတွဲ Album Post အဖြစ် အကြံပြုပါသည်):";
        suggestions = [
          {
            title: "Stock Desync Failure: POS vs E-Commerce Inventory Mismatch",
            burmeseTitle: "POS နှင့် Warehouse ကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်လာနိုင်သော ဆုံးရှုံးမှုများ",
            pillar: "risk_story",
            details: "လမ်းမှာရောက်နေဆဲ Order ကို မသိဘဲ AI က ထပ်မှာမိတဲ့အမှားနှင့် Final Approval စစ်ဆေးနည်း",
            wordCount: "350 – 450 words (Case Study)",
            suggestedFormat: "album",
          },
        ];
      } else {
        replyText = `သင်မေးမြန်းထားသော "${userText}" နှင့် ကိုက်ညီသည့် FYF Content Pillar အကြံပြုချက်ကို ပြင်ဆင်ပေးထားပါသည်:`;
        suggestions = [
          {
            title: userText,
            burmeseTitle: `${userText} (Zero-Jargon SME Guide)`,
            pillar: detectedPillar,
            details: "လုပ်ငန်းရှင်များ နားလည်လွယ်မည့် ရှင်းလင်းချက်၊ လက်တွေ့ကြုံရမည့် အမှားနှင့် မန်နေဂျာ စစ်ဆေးချက် Gate",
            wordCount: "300 – 450 words",
            suggestedFormat: autoSuggestedFormat,
          },
        ];
      }

      const copilotMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: "copilot",
        text: replyText,
        suggestions,
      };

      setChatMessages((prev) => [...prev, copilotMsg]);
      setIsCopilotThinking(false);
    }, 600);
  }

  function handleUseSuggestion(sug: {
    title: string;
    burmeseTitle: string;
    pillar: ContentPillarKey;
    details: string;
    suggestedFormat?: VisualFormat;
  }) {
    setTopic(sug.burmeseTitle || sug.title);
    setDetails(sug.details);
    setSelectedPillar(sug.pillar);
    if (sug.suggestedFormat) setVisualFormat(sug.suggestedFormat);
    setShowDetails(true);
    void triggerGenerate(sug.burmeseTitle || sug.title, sug.details, sug.pillar, sug.suggestedFormat);
  }

  return (
    <section className="page-container create-workspace" style={{ maxWidth: "1140px" }}>
      <div className="page-heading">
        <p className="eyebrow" style={{ color: BRAND_COLORS.VIRIDIAN, fontWeight: 600 }}>
          FYF AI Content Studio
        </p>
        <h1 style={{ color: BRAND_COLORS.OLIVE_INK, letterSpacing: "-0.03em" }}>Create & Studio</h1>
        <p className="page-subtitle">
          Data-driven topic suggestions, Burmese practitioner drafting, and native 1080×1080 SVG banner design.
        </p>
      </div>

      <div className="flow-map" aria-label="Create guardrails">
        <span>Brand holds page data</span>
        <span className="active">Data-driven Topic & Banner Studio</span>
        <span>Human Review & Manual Export</span>
      </div>

      <ol className="stepper" aria-label="Create workflow">
        <li className={`step ${step === "write" ? "active" : confirmedContent ? "complete" : ""}`}>
          1. Write & Topics
        </li>
        <li className={`step ${step === "photo" ? "active" : photoConfirmed ? "complete" : ""}`}>
          2. Banner Studio
        </li>
        <li className={`step ${step === "export" ? "active" : ""}`}>
          3. Export & Publish
        </li>
      </ol>

      {showProcessPanel ? (
        <aside className="ai-process-panel" aria-label="AI process status">
          <div className="process-summary">
            <span
              className={`process-dot ${isGenerating ? "running" : generateError ? "blocked" : draft ? "done" : ""}`}
              aria-hidden="true"
            />
            <div>
              <strong>{processHeadline}</strong>
              <p>{processSubtext}</p>
            </div>
          </div>
          <ol>
            {processStages.map((stage) => (
              <li key={stage.label} className={`process-stage ${stage.status}`}>
                <span className="process-dot" aria-hidden="true" />
                <div>
                  <strong>{stage.label}</strong>
                  <p>{stage.detail}</p>
                </div>
                <em>{stage.status === "blocked" ? "needs approval" : stage.status}</em>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}

      {step === "write" && (
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Write first draft</h2>
              <p>
                Brainstorm with Co-pilot, select a calibrated topic card, or enter your custom draft below.
              </p>
            </div>
            <span className={`status-indicator ${saveStatus}`}>
              {saveStatus === "idle" ? "Not saved" : saveStatus}
            </span>
          </div>

          {/* Co-pilot Chat Drawer Toggle Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: isCopilotOpen ? `${BRAND_COLORS.VIRIDIAN}10` : `${BRAND_COLORS.WARM_IVORY}90`,
              borderRadius: "12px",
              border: `1.5px solid ${isCopilotOpen ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}60`}`,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: BRAND_COLORS.VIRIDIAN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: BRAND_COLORS.OLIVE_INK, display: "block" }}>
                  AI Content Co-pilot & Brainstorming
                </strong>
                <span style={{ fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.75 }}>
                  သတင်းအသစ်များ (Grok, Claude) နှင့် စွန့်စားရမှု Case Study များကို တိုင်ပင်ပြီး Draft ရေးခိုင်းနိုင်ပါသည်
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: isCopilotOpen ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.SURFACE_WHITE,
                color: isCopilotOpen ? BRAND_COLORS.SURFACE_WHITE : BRAND_COLORS.VIRIDIAN,
                border: `1px solid ${BRAND_COLORS.VIRIDIAN}`,
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: isCopilotOpen ? `0 2px 8px ${BRAND_COLORS.VIRIDIAN}30` : "none",
                transition: "all 0.15s ease",
              }}
            >
              <MessageSquare size={14} />
              <span>{isCopilotOpen ? "Hide Co-pilot Chat" : "Open Co-pilot Chat"}</span>
            </button>
          </div>

          {/* Interactive Co-pilot Chat Drawer Panel */}
          {isCopilotOpen && (
            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                border: `1.5px solid ${BRAND_COLORS.VIRIDIAN}40`,
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
                  paddingBottom: "10px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: BRAND_COLORS.VIRIDIAN,
                      display: "inline-block",
                    }}
                  />
                  <strong style={{ fontSize: "13px", color: BRAND_COLORS.OLIVE_INK }}>
                    Content Co-pilot Assistant (Zero-Jargon Burmese Mentor)
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: BRAND_COLORS.OLIVE_INK,
                    opacity: 0.6,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat Message List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  paddingRight: "6px",
                  marginBottom: "14px",
                }}
              >
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        backgroundColor: msg.sender === "user" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.WARM_IVORY,
                        color: msg.sender === "user" ? "#fff" : BRAND_COLORS.OLIVE_INK,
                        fontSize: "12.5px",
                        lineHeight: 1.5,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {msg.text}
                    </div>

                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "10px",
                          width: "100%",
                          marginTop: "10px",
                        }}
                      >
                        {msg.suggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "12px",
                              borderRadius: "10px",
                              backgroundColor: "#FAF9F5",
                              border: `1.5px solid ${BRAND_COLORS.VIRIDIAN}30`,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                                    color: BRAND_COLORS.VIRIDIAN,
                                  }}
                                >
                                  {sug.pillar === "reality_vs_hype"
                                    ? "💡 News & Reality"
                                    : sug.pillar === "risk_story"
                                      ? "🛡️ Risk Story"
                                      : "⚙️ Workflow"}
                                </span>
                                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600 }}>
                                  {sug.suggestedFormat === "album" ? "📱 4-Slide Album" : "🖼️ Single Banner"} · {sug.wordCount}
                                </span>
                              </div>
                              <strong
                                style={{
                                  fontSize: "12px",
                                  color: BRAND_COLORS.OLIVE_INK,
                                  display: "block",
                                  marginBottom: "4px",
                                }}
                              >
                                {sug.burmeseTitle}
                              </strong>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: BRAND_COLORS.OLIVE_INK,
                                  opacity: 0.8,
                                  margin: 0,
                                  lineHeight: 1.4,
                                }}
                              >
                                {sug.details}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUseSuggestion(sug)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                backgroundColor: BRAND_COLORS.VIRIDIAN,
                                color: "#fff",
                                border: "none",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Zap size={12} />
                              <span>✨ Use in Studio & Draft</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isCopilotThinking && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: BRAND_COLORS.VIRIDIAN, fontSize: "12px" }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Co-pilot is analyzing context and framing SME angles...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {[
                  "💡 ဒီနေ့ ဘာတင်ရမလဲ? (Brainstorm 3 Ideas)",
                  "📰 xAI Grok Bot အကြောင်း ရေးမယ်",
                  "🛡️ ဆိုင်ခွဲ Stock မကိုက်ညီတဲ့ အမှား",
                  "📋 ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်း",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setCopilotInput(chip);
                    }}
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      borderRadius: "16px",
                      backgroundColor: BRAND_COLORS.WARM_IVORY,
                      color: BRAND_COLORS.OLIVE_INK,
                      border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCopilotMessage();
                }}
                style={{ display: "flex", gap: "8px" }}
              >
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder="သတင်းလင့်ခ် ထည့်ပါ သို့မဟုတ် ရေးလိုသော အကြောင်းအရာကို မေးပါ..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${BRAND_COLORS.SOFT_SAGE}`,
                    fontSize: "13px",
                    color: BRAND_COLORS.OLIVE_INK,
                    backgroundColor: "#FAF9F5",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!copilotInput.trim() || isCopilotThinking}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    backgroundColor: BRAND_COLORS.VIRIDIAN,
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* Content Writing Styles / Pillars Bar */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <label className="field-label" style={{ margin: 0 }}>
                Content Writing Style & Pillar (စာရေးဟန် ရွေးချယ်ရန်)
              </label>
              <span style={{ fontSize: "11px", color: "#D97706", fontWeight: 700 }}>
                ⭐ AI auto-detects from your topic & notes
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "10px",
              }}
            >
              {CONTENT_PILLARS.map((p) => {
                const isAutoMatch = detectedPillar === p.id;
                const isSelected = activePillar === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPillar(p.id);
                      setVisualFormat(p.defaultFormat);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: isSelected
                        ? `2px solid ${BRAND_COLORS.VIRIDIAN}`
                        : isAutoMatch
                          ? `1.5px solid #F59E0B`
                          : `1px solid ${BRAND_COLORS.SOFT_SAGE}50`,
                      backgroundColor: isSelected
                        ? BRAND_COLORS.WARM_IVORY
                        : isAutoMatch
                          ? "#FFFDF5"
                          : BRAND_COLORS.SURFACE_WHITE,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected
                        ? `0 4px 12px ${BRAND_COLORS.VIRIDIAN}20`
                        : isAutoMatch
                          ? "0 2px 8px rgba(217, 119, 6, 0.12)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: "4px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "12px",
                          color: isSelected ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                        }}
                      >
                        {p.title}
                      </strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {isAutoMatch && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              color: "#D97706",
                              backgroundColor: "#FEF3C7",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              border: "1px solid #F59E0B",
                            }}
                          >
                            ⭐ Best Match
                          </span>
                        )}
                        {isSelected && <CheckCircle2 size={14} color={BRAND_COLORS.VIRIDIAN} />}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: BRAND_COLORS.OLIVE_INK,
                        margin: "0 0 4px 0",
                        opacity: 0.85,
                        fontWeight: 600,
                      }}
                    >
                      {p.burmeseTitle}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: BRAND_COLORS.VIRIDIAN,
                          fontWeight: 700,
                        }}
                      >
                        {p.targetLength}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#666",
                          backgroundColor: "#f0ede6",
                          padding: "1px 4px",
                          borderRadius: "3px",
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Format Auto-Suggestion Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              padding: "10px 14px",
              backgroundColor: "#FAF9F5",
              borderRadius: "10px",
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}50`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
                🎨 Visual Format:
              </span>
              <span style={{ fontSize: "11px", color: BRAND_COLORS.VIRIDIAN, fontWeight: 600 }}>
                ⭐ AI Suggested: {autoSuggestedFormat === "album" ? "4-Slide Carousel Album (Best for Cases)" : "Single 1080×1080 Graphic"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setVisualFormat("single")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: visualFormat === "single" ? `1.5px solid ${BRAND_COLORS.VIRIDIAN}` : `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                  backgroundColor: visualFormat === "single" ? `${BRAND_COLORS.VIRIDIAN}15` : BRAND_COLORS.SURFACE_WHITE,
                  color: visualFormat === "single" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                  fontSize: "11.5px",
                  fontWeight: visualFormat === "single" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                <ImageIcon size={13} />
                <span>Single Banner (၁ ပုံ)</span>
              </button>
              <button
                type="button"
                onClick={() => setVisualFormat("album")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: visualFormat === "album" ? `1.5px solid ${BRAND_COLORS.VIRIDIAN}` : `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                  backgroundColor: visualFormat === "album" ? `${BRAND_COLORS.VIRIDIAN}15` : BRAND_COLORS.SURFACE_WHITE,
                  color: visualFormat === "album" ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                  fontSize: "11.5px",
                  fontWeight: visualFormat === "album" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                <Layers size={13} />
                <span>4-Slide Album (၄ ပုံတွဲ)</span>
              </button>
            </div>
          </div>

          {/* Topic Recommendations Idea Cards Bar */}
          {recommendations.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <label className="field-label" style={{ margin: 0 }}>
                  💡 Top Data-Driven Topic Suggestions (၁-ချက်နှိပ် ရေးသားနိုင်သော အကြောင်းအရာများ)
                </label>
                <span style={{ fontSize: "11px", color: BRAND_COLORS.VIRIDIAN, fontWeight: 700 }}>
                  ⚡ Past-content anti-duplicate filtered
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "10px",
                }}
              >
                {recommendations.slice(0, 4).map((rec) => {
                  const mappedKey: ContentPillarKey =
                    rec.pillarKey === "operational_failure_risks"
                      ? "risk_story"
                      : rec.pillarKey === "human_control_checkpoints"
                        ? "workflow_breakdown"
                        : rec.pillarKey === "knowledge_frameworks"
                          ? "framework_education"
                          : "reality_vs_hype";
                  const mappedFormat: VisualFormat =
                    mappedKey === "risk_story" || mappedKey === "workflow_breakdown" ? "album" : "single";

                  return (
                    <div
                      key={rec.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        backgroundColor: "#FAF9F5",
                        border: `1.5px solid ${BRAND_COLORS.SOFT_SAGE}50`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: BRAND_COLORS.VIRIDIAN,
                              backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {rec.pillar}
                          </span>
                          <span style={{ fontSize: "10px", color: "#D97706", fontWeight: 700 }}>
                            ⭐ {rec.metrics.engagementBoost || "High Reach"}
                          </span>
                        </div>
                        <strong
                          style={{
                            fontSize: "12px",
                            color: BRAND_COLORS.OLIVE_INK,
                            display: "block",
                            marginBottom: "4px",
                            lineHeight: 1.3,
                          }}
                        >
                          {rec.topicBurmese || rec.topic}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#666", display: "block" }}>
                          🎯 {rec.targetWordCount || "350–450w"} · Messenger CTA Ready
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTopic(rec.topicBurmese || rec.topic);
                          setDetails(rec.angle);
                          setShowDetails(true);
                          setSelectedPillar(mappedKey);
                          setVisualFormat(mappedFormat);
                          void triggerGenerate(rec.topicBurmese || rec.topic, rec.angle, mappedKey, mappedFormat);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                          color: BRAND_COLORS.VIRIDIAN,
                          border: `1px solid ${BRAND_COLORS.VIRIDIAN}`,
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>Draft This Topic</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className="field-label" htmlFor="topic">
            Topic Headline (ခေါင်းစဉ်)
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="ဥပမာ - POS နှင့် Warehouse ကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်လာနိုင်သော ဆုံးရှုံးမှုများ"
            className="input-field"
          />

          {!showDetails ? (
            <button className="text-button" type="button" onClick={() => setShowDetails(true)}>
              Add custom details, audience & angle
            </button>
          ) : (
            <div className="details-grid">
              <div>
                <label className="field-label" htmlFor="postType">
                  Content format
                </label>
                <select
                  id="postType"
                  className="input-field"
                  value={postType}
                  onChange={(event) => setPostType(event.target.value as PostType)}
                >
                  <option>Facebook post</option>
                  <option>Photo post</option>
                  <option>Reel caption</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="audience">
                  Audience override for this post only
                </label>
                <input
                  id="audience"
                  className="input-field"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                />
                <p className="helper-text">Permanent audience setup belongs in Brand.</p>
              </div>
              <div className="details-wide">
                <label className="field-label" htmlFor="details">
                  Notes, angle, & CTA for this post
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Goal, CTA, raw idea, product angle, or what not to claim."
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="action-row">
            <button
              className="primary-button"
              type="button"
              onClick={generateDraft}
              disabled={!topic.trim() || isGenerating}
            >
              {isGenerating ? "Generating draft..." : "Generate draft"}
            </button>
            <span className="helper-text">
              Uses FYF brand context, zero-jargon standard, and Messenger CTA.
            </span>
          </div>
          {generateError ? <p className="form-message error">{generateError}</p> : null}

          <article className={`draft-preview ${draft ? "" : "empty-draft"}`}>
            <div className="panel-header compact">
              <h3>Draft preview</h3>
              <span>
                {generateError
                  ? "Local fallback draft"
                  : draft
                    ? confirmedContent
                      ? "Content confirmed"
                      : "Needs Victor approval"
                    : "Waiting for topic"}
              </span>
            </div>
            {draft ? (
              <>
                {/* Quick Hashtags Toolbar */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "10px",
                    padding: "8px 12px",
                    backgroundColor: `${BRAND_COLORS.WARM_IVORY}80`,
                    borderRadius: "8px",
                    border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: BRAND_COLORS.OLIVE_INK,
                      marginRight: "4px",
                    }}
                  >
                    🏷️ Hashtags:
                  </span>
                  {[
                    "#FYFAI",
                    "#AIAgents",
                    "#BusinessAutomation",
                    "#HumanInTheLoop",
                    "#MyanmarAI",
                    "#WorkflowAutomation",
                  ].map((tag) => {
                    const hasTag = draft.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (hasTag) {
                            setDraft(draft.replace(tag, "").replace(/\n\s*\n\s*$/, "\n").trim());
                          } else {
                            setDraft(`${draft.trim()}\n${tag}`);
                          }
                          setConfirmedContent(false);
                          setPhotoConfirmed(false);
                          setStep("write");
                        }}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "14px",
                          border: hasTag
                            ? `1px solid ${BRAND_COLORS.VIRIDIAN}`
                            : `1px solid ${BRAND_COLORS.SOFT_SAGE}90`,
                          backgroundColor: hasTag ? `${BRAND_COLORS.VIRIDIAN}18` : BRAND_COLORS.SURFACE_WHITE,
                          color: hasTag ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                          cursor: "pointer",
                        }}
                      >
                        {tag} {hasTag ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  className="draft-editor"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setConfirmedContent(false);
                    setPhotoConfirmed(false);
                    setStep("write");
                    setApprovalStatus("idle");
                    setApprovalMessage("");
                    setPublishStatus("idle");
                    setPublishedMessage("");
                    setCopyMessage("");
                  }}
                  rows={12}
                />
                <div className="action-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={confirmContent}
                    disabled={approvalStatus === "working" || isGenerating}
                  >
                    {approvalStatus === "working" ? "Approving..." : "Confirm content & Open Studio"}
                  </button>
                  <span className="helper-text">
                    Locks this caption and proceeds to {visualFormat === "album" ? "4-Slide Album" : "1080×1080 Banner"} Studio.
                  </span>
                </div>
                {approvalMessage ? (
                  <p
                    className={`form-message ${
                      approvalStatus === "error" ? "error" : approvalStatus === "saved" ? "saved" : ""
                    }`}
                  >
                    {approvalMessage}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="empty-state">
                <strong>No draft yet</strong>
                <p>
                  Click a topic recommendation above, ask the Co-pilot, or enter a topic to generate a calibrated draft.
                </p>
              </div>
            )}
          </article>
        </section>
      )}

      {step === "photo" && (
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Visual Banner Studio</h2>
              <p>
                {visualFormat === "album"
                  ? "4-Slide Carousel Album (Cover ➔ The Risk ➔ Safe Solution ➔ Key Takeaway) preview and customization."
                  : "Switch between the approved FYF template families, customize layout and text, and preview in real-time."}
              </p>
            </div>
            <span className="status-indicator saved">Content Confirmed</span>
          </div>

          <BannerStudio
            draft={draftForBanner}
            initialFamily={preferredFamily}
            onSave={handleBannerSave}
            onChange={(result) => setBannerResult(result)}
          />

          <div className="action-row" style={{ marginTop: "24px" }}>
            <button className="secondary-button" type="button" onClick={() => setStep("write")}>
              Back to content
            </button>
          </div>
        </section>
      )}

      {step === "export" && (
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Manual Export & Publish Gate</h2>
              <p>
                Download your {visualFormat === "album" ? "4-Slide Album Graphics" : "1080×1080 Graphic"}, copy the caption, publish manually on Facebook, and record the URL.
              </p>
            </div>
            <span className="status-indicator saved">Studio Ready</span>
          </div>

          <div
            className="export-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            <article>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, color: BRAND_COLORS.OLIVE_INK, fontWeight: 700 }}>
                  {visualFormat === "album" ? `Album Carousel Graphic (Slide ${previewSlideIndex + 1}/4)` : "Final Banner Graphic (1080 × 1080)"}
                </h3>
                {visualFormat === "album" && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0, 1, 2, 3].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewSlideIndex(idx)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: previewSlideIndex === idx ? `1.5px solid ${BRAND_COLORS.VIRIDIAN}` : `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                          backgroundColor: previewSlideIndex === idx ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.SURFACE_WHITE,
                          color: previewSlideIndex === idx ? "#fff" : BRAND_COLORS.OLIVE_INK,
                          cursor: "pointer",
                        }}
                      >
                        Slide {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <BannerPreview
                svgString={bannerResult?.svg}
                templateFamily={bannerResult?.family || preferredFamily}
                categoryLabel={bannerResult?.props?.categoryLabel}
                showControls={true}
              />
            </article>

            <article style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                  border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                }}
              >
                <div
                  className="content-card-header compact"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}
                >
                  <h3 style={{ margin: 0, color: BRAND_COLORS.OLIVE_INK, fontWeight: 700 }}>Caption Text</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        const reviewUrl = `${window.location.origin}/review?workspaceId=${activeWorkspaceId}${draftId ? `&draftId=${encodeURIComponent(draftId)}` : ""}`;
                        navigator.clipboard.writeText(reviewUrl);
                        alert("🔗 Shareable Client Review Link copied to clipboard!\n" + reviewUrl);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: BRAND_COLORS.OLIVE_INK,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Share2 size={14} color={BRAND_COLORS.VIRIDIAN} />
                      <span>Share Review Link</span>
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={copyCaption}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: BRAND_COLORS.VIRIDIAN,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Copy size={14} />
                      <span>Copy caption</span>
                    </button>
                  </div>
                </div>
                <pre
                  className="export-copy"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    maxHeight: "320px",
                    overflowY: "auto",
                    backgroundColor: BRAND_COLORS.WARM_IVORY,
                    padding: "12px",
                    borderRadius: "6px",
                    color: BRAND_COLORS.OLIVE_INK,
                  }}
                >
                  {draft}
                </pre>
                {copyMessage ? <p className="form-message saved">{copyMessage}</p> : null}
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                  border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: BRAND_COLORS.OLIVE_INK, fontWeight: 700 }}>
                  Publication Checklist
                </h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    color: BRAND_COLORS.OLIVE_INK,
                  }}
                >
                  <li>
                    <strong>Visual Format:</strong>{" "}
                    {visualFormat === "album" ? "4-Slide Carousel Album (1080×1080 px × 4)" : "Single 1080×1080 Square Graphic"}
                  </li>
                  <li>
                    <strong>Template Family:</strong> <code>{bannerResult?.family || preferredFamily}</code>
                  </li>
                  <li>
                    <strong>Brand Guard:</strong> Zero-jargon Burmese tone, human verification gate & Messenger Lead CTA.
                  </li>
                </ul>
              </div>
            </article>
          </div>

          <div
            className="publish-manual-box"
            style={{
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              border: `1.5px solid ${BRAND_COLORS.VIRIDIAN}40`,
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: BRAND_COLORS.OLIVE_INK, fontWeight: 700 }}>
              Record Published Facebook Post
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.85 }}>
              After posting manually to your Facebook Page, paste the link or post ID below to transition this draft to
              Published status.
            </p>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                value={postLink}
                onChange={(event) => setPostLink(event.target.value)}
                placeholder="https://facebook.com/permalink.php?story_fbid=... or Post ID"
                className="input-field"
                style={{ flex: 1 }}
              />
              <button
                className="primary-button"
                type="button"
                onClick={markPublished}
                disabled={publishStatus === "working"}
              >
                {publishStatus === "working" ? "Saving..." : "Mark as Published"}
              </button>
            </div>

            {publishedMessage ? (
              <p
                className={`form-message ${
                  publishStatus === "error" ? "error" : publishStatus === "saved" ? "saved" : ""
                }`}
                style={{ marginTop: "12px" }}
              >
                {publishedMessage}
              </p>
            ) : null}
          </div>

          <div className="action-row" style={{ marginTop: "24px" }}>
            <button className="secondary-button" type="button" onClick={() => setStep("photo")}>
              Back to Banner Studio
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
