import type { AnalyticsSnapshot, PillarPerformance, TopicRecommendation } from "@/backend/types";
import type { DemoRepository } from "@/backend/demoRepository";
import { mockAnalyticsSnapshot } from "@/integrations/mockAnalytics";

export type ContentPillarDefinition = {
  key: string;
  name: string;
  burmeseName: string;
  visualFamily: "system_story" | "framework_mascot" | "editorial_split" | "fact_analysis";
  defaultAngle: string;
  defaultTone: string;
  targetAudience: string;
  defaultRationale: string;
  suggestedCta: string;
  topics: Array<{
    title: string;
    burmeseTitle: string;
  }>;
};

export const FYF_CONTENT_PILLARS: Record<string, ContentPillarDefinition> = {
  operational_failure_risks: {
    key: "operational_failure_risks",
    name: "Operational Failure Risks",
    burmeseName: "လုပ်ငန်းလည်ပတ်မှု အမှားအယွင်းနှင့် ဆုံးရှုံးနိုင်ခြေများ",
    visualFamily: "system_story",
    defaultAngle: "Practitioner root-cause analysis with human boundary limits and system safeguards",
    defaultTone: "Calm, practitioner-grounded, analytical",
    targetAudience: "Myanmar SME Owners, E-Commerce Operators, Operations Managers",
    defaultRationale: "Top Performing Pillar: Operational Failure (+42% Reach, 2.5x Shares)",
    suggestedCta: "သင့်လုပ်ငန်းမှာ ဒီလိုအဖြစ်မျိုး ကြုံဖူးပါသလား? ကွန်မန့်မှာ မျှဝေဆွေးနွေးပေးသွားပါ",
    topics: [
      {
        title: "Stock Desync Failure: POS vs E-Commerce Inventory Mismatch",
        burmeseTitle: "POS နှင့် Warehouse ကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်လာနိုင်သော ဆုံးရှုံးမှုများ"
      },
      {
        title: "Multi-branch Inventory Sync Lag: Why Real-Time Locking Prevents Double Selling",
        burmeseTitle: "ဆိုင်ခွဲများကြား Inventory စာရင်းမတူညီမှုနှင့် Double Selling မဖြစ်စေရန် ထိန်းချုပ်နည်း"
      },
      {
        title: "Silent Order Drop in Batch Processing: Recovery & Alerting Mechanisms",
        burmeseTitle: "Order တင်ရာတွင် Batch Processing ကြောင့် အမှာစာ ပျောက်ဆုံးမှု မဖြစ်စေရန် စနစ်"
      }
    ]
  },
  human_control_checkpoints: {
    key: "human_control_checkpoints",
    name: "Human Control Checkpoints",
    burmeseName: "လူကိုယ်တိုင် စိစစ်အတည်ပြုရမည့် အဆင့်များ",
    visualFamily: "system_story",
    defaultAngle: "Human-in-the-loop governance, verification gates, and operational safety",
    defaultTone: "Pragmatic, cautious, trustworthy",
    targetAudience: "Operations Managers, Finance Leads, Business Owners",
    defaultRationale: "High Engagement Pillar: Human Control Gates (+25% Clicks, High Retention)",
    suggestedCta: "လုပ်ငန်းစဉ်တိုင်းမှာ AI ကို အပြည့်အဝမလွှဲဘဲ လူကိုယ်တိုင် စစ်ဆေးမယ့် Gate တွေ ထားရှိဖို့ လိုအပ်ပါသည်",
    topics: [
      {
        title: "Payment Slip OCR & Verification Gate: Why Final Approval Must Stay Human",
        burmeseTitle: "ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်းနှင့် လူကိုယ်တိုင် အတည်ပြုခြင်း Gate ၏ အရေးပါပုံ"
      },
      {
        title: "High-Value Refund Safeguards: Setting Dual-Approval Thresholds",
        burmeseTitle: "တန်ဖိုးကြီး ငွေပြန်အမ်းမှုများတွင် လူနှစ်ဦး အတည်ပြုချက်ရယူသည့် Safeguards ထားရှိပုံ"
      },
      {
        title: "Customer Escalation Boundaries: When AI Must Hand Off to Humans",
        burmeseTitle: "Customer Service တွင် AI က လူကို လွှဲပြောင်းပေးရမည့် ဆုံးဖြတ်ချက်စည်းများ"
      }
    ]
  },
  knowledge_frameworks: {
    key: "knowledge_frameworks",
    name: "Knowledge & Frameworks",
    burmeseName: "ဗဟုသုတနှင့် နည်းပညာ မူဘောင်များ",
    visualFamily: "framework_mascot",
    defaultAngle: "Step-by-step engineering principles and reproducible blueprints",
    defaultTone: "Educational, structured, actionable",
    targetAudience: "Developers, Product Architects, Technology Enthusiasts",
    defaultRationale: "Viral Pillar: Frameworks & Blueprints (2.1x Saves & Shares)",
    suggestedCta: "ဒီ Framework ကို သင့်လုပ်ငန်း သို့မဟုတ် Project မှာ အသုံးချနိုင်ဖို့ Save လုပ်ထားပါ",
    topics: [
      {
        title: "Automated Daily Reporting: LangGraph State Machine Architecture",
        burmeseTitle: "နေ့စဉ် အစီရင်ခံစာ ထုတ်ပြန်ခြင်း LangGraph Workflow တည်ဆောက်ပုံ"
      },
      {
        title: "Maker/Checker Pattern in Content Pipelines: Ensuring Brand Voice Calibration",
        burmeseTitle: "Content ထုတ်လုပ်မှုတွင် Maker/Checker စနစ်ဖြင့် Brand Voice ထိန်းသိမ်းနည်း"
      },
      {
        title: "Local SQLite to Postgres Migration Strategy for Growing Apps",
        burmeseTitle: "Demo SQLite မှ Production Supabase Postgres သို့ ကူးပြောင်းခြင်း နည်းဗျူဟာ"
      }
    ]
  },
  ai_news_analysis: {
    key: "ai_news_analysis",
    name: "AI News & Analysis",
    burmeseName: "AI သတင်းနှင့် လက်တွေ့သုံးသပ်ချက်",
    visualFamily: "fact_analysis",
    defaultAngle: "Separating confirmed facts from market hype with objective practitioner analysis",
    defaultTone: "Objective, insightful, measured",
    targetAudience: "Founders, Executives, Business Strategists",
    defaultRationale: "Broad Reach Pillar: Industry Fact vs Hype Analysis (+30% Reach)",
    suggestedCta: "သင်ရော ဒီနည်းပညာအပေါ် ဘယ်လိုမြင်ပါသလဲ? အမြင်ချင်းဖလှယ် ဆွေးနွေးပေးသွားပါ",
    topics: [
      {
        title: "Fact vs Inference: What Today's AI Models Can and Cannot Do for Myanmar SMEs",
        burmeseTitle: "မြန်မာ SME လုပ်ငန်းများအတွက် AI ၏ အချက်အလက်နှင့် သုံးသပ်ချက် ကွာခြားချက်"
      },
      {
        title: "Small Local Models vs Cloud Frontier LLMs: Latency & Cost Tradeoffs",
        burmeseTitle: "Local Model များနှင့် Cloud LLM များ၏ ကုန်ကျစရိတ်နှင့် စွမ်းဆောင်ရည် နှိုင်းယှဉ်ချက်"
      },
      {
        title: "AI Agent Evaluation: Why Real Production Tracing Matters More Than Benchmarks",
        burmeseTitle: "AI Agent များကို Benchmark ထက် Production Tracing ဖြင့် စစ်ဆေးခြင်း"
      }
    ]
  }
};

/**
 * Composite performance score formula:
 * score = (views * 0.1) + (reach * 0.2) + (reactions * 1.0) + (shares * 2.5) + (clicks * 1.5)
 */
export function calculatePillarScore(metrics: {
  views?: number;
  reach?: number;
  reactions?: number;
  shares?: number;
  clicks?: number;
}): number {
  const views = metrics.views ?? 0;
  const reach = metrics.reach ?? 0;
  const reactions = metrics.reactions ?? 0;
  const shares = metrics.shares ?? 0;
  const clicks = metrics.clicks ?? 0;

  const rawScore = views * 0.1 + reach * 0.2 + reactions * 1.0 + shares * 2.5 + clicks * 1.5;
  return Number(rawScore.toFixed(2));
}

export function classifyPillarFromText(text?: string): string {
  if (!text) return "operational_failure_risks";
  const normalized = text.toLowerCase().trim();

  // AI News & Analysis
  if (
    normalized.includes("news") ||
    normalized.includes("grok") ||
    normalized.includes("bot") ||
    normalized.includes("update") ||
    normalized.includes("release") ||
    normalized.includes("fact") ||
    normalized.includes("hype") ||
    normalized.includes("benchmark") ||
    normalized.includes("သတင်း") ||
    normalized.includes("အရှိတရား")
  ) {
    return "ai_news_analysis";
  }

  // Human Control Checkpoints / Financial Approval
  if (
    normalized.includes("slip") ||
    normalized.includes("payment") ||
    normalized.includes("ocr") ||
    normalized.includes("refund") ||
    normalized.includes("control") ||
    normalized.includes("checkpoint") ||
    normalized.includes("approval") ||
    normalized.includes("စလစ်") ||
    normalized.includes("ငွေလွှဲ") ||
    normalized.includes("အတည်ပြု")
  ) {
    return "human_control_checkpoints";
  }

  // Knowledge Frameworks / Principles / Blueprints
  if (
    normalized.includes("framework") ||
    normalized.includes("checklist") ||
    normalized.includes("principles") ||
    normalized.includes("guide") ||
    normalized.includes("rule") ||
    normalized.includes("blueprint") ||
    normalized.includes("စည်းမျဉ်း") ||
    normalized.includes("မူဘောင်")
  ) {
    return "knowledge_frameworks";
  }

  // Operational Failure Risks / System Breakdown
  if (
    normalized.includes("risk") ||
    normalized.includes("failure") ||
    normalized.includes("stock") ||
    normalized.includes("desync") ||
    normalized.includes("inventory") ||
    normalized.includes("loss") ||
    normalized.includes("batch") ||
    normalized.includes("error") ||
    normalized.includes("အမှား") ||
    normalized.includes("ဆုံးရှုံး")
  ) {
    return "operational_failure_risks";
  }

  return normalizePillarKey(text);
}

function normalizePillarKey(pillarName?: string): string {
  if (!pillarName) return "operational_failure_risks";
  const normalized = pillarName.toLowerCase().trim().replace(/[\s_-]+/g, "_");
  if (normalized.includes("risk") || normalized.includes("operational") || normalized.includes("failure")) {
    return "operational_failure_risks";
  }
  if (normalized.includes("human") || normalized.includes("control") || normalized.includes("checkpoint") || normalized.includes("approval")) {
    return "human_control_checkpoints";
  }
  if (normalized.includes("knowledge") || normalized.includes("framework") || normalized.includes("workflow") || normalized.includes("mascot")) {
    return "knowledge_frameworks";
  }
  if (normalized.includes("news") || normalized.includes("analysis") || normalized.includes("fact") || normalized.includes("ai")) {
    return "ai_news_analysis";
  }
  return normalized;
}

export function aggregatePillarPerformance(snapshots: AnalyticsSnapshot[]): PillarPerformance[] {
  const pillarBuckets = new Map<
    string,
    {
      pillar: string;
      views: number;
      reach: number;
      reactions: number;
      comments: number;
      shares: number;
      clicks: number;
      postCount: number;
    }
  >();

  // Initialize standard FYF pillars
  for (const pillarDef of Object.values(FYF_CONTENT_PILLARS)) {
    pillarBuckets.set(pillarDef.key, {
      pillar: pillarDef.name,
      views: 0,
      reach: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      postCount: 0
    });
  }

  // Populate from real snapshots
  for (const snapshot of snapshots) {
    const key = normalizePillarKey(snapshot.pillar);
    const bucket = pillarBuckets.get(key) ?? {
      pillar: snapshot.pillar ?? key,
      views: 0,
      reach: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      postCount: 0
    };

    bucket.views += snapshot.views ?? 0;
    bucket.reach += snapshot.reach ?? 0;
    bucket.reactions += snapshot.reactions ?? 0;
    bucket.comments += snapshot.comments ?? 0;
    bucket.shares += snapshot.shares ?? 0;
    bucket.clicks += snapshot.clicks ?? 0;
    bucket.postCount += 1;
    pillarBuckets.set(key, bucket);
  }

  // If some standard pillars have 0 snapshots, provide realistic mock baseline
  let seedCounter = 1;
  for (const [key, bucket] of pillarBuckets.entries()) {
    if (bucket.postCount === 0) {
      const mock = mockAnalyticsSnapshot(seedCounter, key);
      bucket.views = mock.views;
      bucket.reach = mock.reach;
      bucket.reactions = mock.reactions;
      bucket.comments = mock.comments;
      bucket.shares = mock.shares;
      bucket.clicks = mock.clicks;
      bucket.postCount = 1;
      seedCounter++;
    }
  }

  const results: PillarPerformance[] = Array.from(pillarBuckets.entries()).map(([key, bucket]) => {
    const compositeScore = calculatePillarScore(bucket);
    const avgEngagementRate =
      bucket.reach > 0
        ? Number((((bucket.reactions + bucket.comments + bucket.shares + bucket.clicks) / bucket.reach) * 100).toFixed(2))
        : 0;

    const def = FYF_CONTENT_PILLARS[key];

    return {
      pillar: key,
      pillarName: def ? def.name : bucket.pillar,
      views: bucket.views,
      reach: bucket.reach,
      reactions: bucket.reactions,
      comments: bucket.comments,
      shares: bucket.shares,
      clicks: bucket.clicks,
      compositeScore,
      postCount: bucket.postCount,
      avgEngagementRate,
      topPillar: false
    };
  });

  // Sort descending by compositeScore
  results.sort((a, b) => b.compositeScore - a.compositeScore);

  if (results.length > 0) {
    results[0].topPillar = true;
  }

  return results;
}

export function generateTopicRecommendations(
  workspaceId: string,
  repository?: DemoRepository
): TopicRecommendation[] {
  let snapshots: AnalyticsSnapshot[] = [];
  if (repository) {
    snapshots = repository.listAnalytics(workspaceId);
  }

  const pillarPerformances = aggregatePillarPerformance(snapshots);
  const recommendations: TopicRecommendation[] = [];

  // Past Content Memory: Retrieve titles of recently published/created drafts
  const existingDraftTopics = new Set<string>();
  if (repository) {
    const existingDrafts = repository.listDrafts(workspaceId);
    for (const d of existingDrafts) {
      if (d.topic) existingDraftTopics.add(d.topic.toLowerCase().trim());
    }
  }

  let recIdCounter = 1;
  for (const perf of pillarPerformances) {
    const pillarDef = FYF_CONTENT_PILLARS[perf.pillar];
    if (!pillarDef) continue;

    for (let i = 0; i < pillarDef.topics.length; i++) {
      const topicItem = pillarDef.topics[i];
      const isTop = perf.topPillar && i === 0;

      const engagementBoost = isTop
        ? "+42% Reach, 2.5x Shares"
        : `${perf.avgEngagementRate}% Avg Engagement`;

      // Determine dynamic word count by pillar
      let targetWordCount = "300 – 400 words (Deep Breakdown)";
      if (perf.pillar === "knowledge_frameworks") {
        targetWordCount = "180 – 250 words (Actionable Checklist)";
      } else if (perf.pillar === "operational_failure_risks") {
        targetWordCount = "350 – 450 words (Case Study)";
      } else if (perf.pillar === "human_control_checkpoints") {
        targetWordCount = "300 – 400 words (Gate Breakdown)";
      }

      const leadCta = "သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ 'WORKFLOW' ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်";

      recommendations.push({
        id: `rec-${workspaceId}-${perf.pillar}-${recIdCounter++}`,
        pillar: pillarDef.name,
        pillarKey: pillarDef.key,
        topic: topicItem.title,
        topicBurmese: topicItem.burmeseTitle,
        angle: pillarDef.defaultAngle,
        tone: pillarDef.defaultTone,
        targetAudience: pillarDef.targetAudience,
        performanceRationale: isTop ? pillarDef.defaultRationale : `Pillar Score: ${perf.compositeScore} (${engagementBoost})`,
        suggestedVisualFamily: pillarDef.visualFamily,
        targetWordCount,
        leadCta,
        metrics: {
          compositeScore: perf.compositeScore,
          historicalReach: perf.reach,
          historicalShares: perf.shares,
          engagementBoost
        },
        suggestedCta: pillarDef.suggestedCta
      });
    }
  }

  // Sort recommendations primarily by pillar compositeScore descending
  recommendations.sort((a, b) => b.metrics.compositeScore - a.metrics.compositeScore);

  return recommendations;
}
