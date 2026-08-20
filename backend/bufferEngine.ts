/**
 * Weekly Buffer Queue & 4-Pillar Content Planner Engine
 * Manages 4-slot weekly scheduling cadence, buffer health tracking,
 * and automated Sunday Executive Summary generation.
 */

import { DemoRepository } from "./demoRepository";
import {
  WeeklyBufferState,
  WeeklyBufferSlot,
  WeeklyBufferDay,
  ContentPillarKey,
} from "./types";
import { classifyPillarFromText } from "./topicEngine";

export interface SlotConfig {
  day: WeeklyBufferDay;
  dayLabel: string;
  targetTime: string;
  pillar: ContentPillarKey;
  pillarLabel: string;
  pillarBurmese: string;
  recommendedFormat: "single" | "album";
  targetWordCount: string;
}

export const WEEKLY_SLOT_CONFIGS: SlotConfig[] = [
  {
    day: "monday",
    dayLabel: "Monday (တနင်္လာ)",
    targetTime: "09:00 AM",
    pillar: "risk_story",
    pillarLabel: "🛡️ Risk & Failure Story",
    pillarBurmese: "စွန့်စားရမှုနှင့် အမှားအယွင်း သင်ခန်းစာများ",
    recommendedFormat: "album",
    targetWordCount: "350 – 450 words",
  },
  {
    day: "wednesday",
    dayLabel: "Wednesday (ဗုဒ္ဓဟူး)",
    targetTime: "09:00 AM",
    pillar: "workflow_breakdown",
    pillarLabel: "⚙️ Workflow Breakdown",
    pillarBurmese: "စနစ်တကျ လည်ပတ်ပုံ အဆင့်ဆင့်",
    recommendedFormat: "album",
    targetWordCount: "350 – 500 words",
  },
  {
    day: "friday",
    dayLabel: "Friday (သောကြာ)",
    targetTime: "09:00 AM",
    pillar: "reality_vs_hype",
    pillarLabel: "💡 AI Reality vs Hype",
    pillarBurmese: "သတင်းအရှိတရားနှင့် သုံးသပ်ချက်",
    recommendedFormat: "single",
    targetWordCount: "300 – 400 words",
  },
  {
    day: "sunday",
    dayLabel: "Sunday (တနင်္ဂနွေ)",
    targetTime: "07:00 PM",
    pillar: "framework_education",
    pillarLabel: "🇲🇲 Knowledge Framework & Executive Summary",
    pillarBurmese: "အပတ်စဉ် အနှစ်ချုပ်နှင့် စည်းမျဉ်းများ",
    recommendedFormat: "single",
    targetWordCount: "180 – 250 words",
  },
];

/**
 * Calculates words from a draft content string (Burmese spaces & English tokens)
 */
export function calculateWordCount(content: string): number {
  if (!content) return 0;
  return content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Computes current week label and dates (Monday to Sunday)
 */
export function getCurrentWeekRange(): { weekLabel: string; startDate: string; endDate: string } {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startFormatted = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endFormatted = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    weekLabel: `Week of ${startFormatted} – ${endFormatted}`,
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

/**
 * Generates the full weekly buffer queue state for a workspace
 */
export function getWeeklyBufferState(
  repository: DemoRepository,
  workspaceId: string
): WeeklyBufferState {
  const drafts = repository.listDrafts(workspaceId);
  const weekRange = getCurrentWeekRange();

  const assignedDraftIds = new Set<string>();

  const slots: WeeklyBufferSlot[] = WEEKLY_SLOT_CONFIGS.map((config) => {
    // Look for explicitly scheduled draft first
    let matchedDraft = drafts.find(
      (d) =>
        !assignedDraftIds.has(d.id) &&
        d.status === "scheduled" &&
        d.scheduledFor &&
        d.scheduledFor.toLowerCase().includes(config.day)
    );

    // If no explicitly scheduled draft, look for matching pillar draft with approved/published status
    if (!matchedDraft) {
      matchedDraft = drafts.find((d) => {
        if (assignedDraftIds.has(d.id)) return false;
        const pillar = classifyPillarFromText(`${d.topic} ${d.content}`);
        return pillar === config.pillar && (d.status === "approved" || d.status === "published");
      });
    }

    // If still no draft, look for any draft matching pillar
    if (!matchedDraft) {
      matchedDraft = drafts.find((d) => {
        if (assignedDraftIds.has(d.id)) return false;
        const pillar = classifyPillarFromText(`${d.topic} ${d.content}`);
        return pillar === config.pillar;
      });
    }

    if (matchedDraft) {
      assignedDraftIds.add(matchedDraft.id);
      const wordCount = calculateWordCount(matchedDraft.content);

      let slotStatus: WeeklyBufferSlot["status"] = "drafting";
      if (matchedDraft.status === "published") slotStatus = "published";
      else if (matchedDraft.status === "scheduled") slotStatus = "scheduled";
      else if (matchedDraft.status === "approved") slotStatus = "ready";

      return {
        id: `slot-${config.day}`,
        day: config.day,
        dayLabel: config.dayLabel,
        targetTime: config.targetTime,
        pillar: config.pillar,
        pillarLabel: config.pillarLabel,
        pillarBurmese: config.pillarBurmese,
        recommendedFormat: config.recommendedFormat,
        targetWordCount: config.targetWordCount,
        draftId: matchedDraft.id,
        draftTopic: matchedDraft.topic,
        draftStatus: matchedDraft.status,
        draftWordCount: wordCount,
        scheduledFor: matchedDraft.scheduledFor || `${config.dayLabel} • ${config.targetTime}`,
        status: slotStatus,
      };
    }

    return {
      id: `slot-${config.day}`,
      day: config.day,
      dayLabel: config.dayLabel,
      targetTime: config.targetTime,
      pillar: config.pillar,
      pillarLabel: config.pillarLabel,
      pillarBurmese: config.pillarBurmese,
      recommendedFormat: config.recommendedFormat,
      targetWordCount: config.targetWordCount,
      status: "empty",
    };
  });

  const readyCount = slots.filter(
    (s) => s.status === "ready" || s.status === "scheduled" || s.status === "published"
  ).length;
  const healthScore = Math.round((readyCount / slots.length) * 100);

  let statusMessage = "🚨 Empty buffer — Fill Monday, Wednesday, Friday slots with AI.";
  if (healthScore === 100) {
    statusMessage = "🎉 Excellent! Full weekly 4-pillar buffer is ready for publication.";
  } else if (healthScore >= 75) {
    statusMessage = `⚡ Strong buffer (75% ready) — ${slots.length - readyCount} slot remaining.`;
  } else if (healthScore >= 50) {
    statusMessage = `⚠️ Half buffer ready (50%) — ${slots.length - readyCount} slots need drafts.`;
  } else if (healthScore > 0) {
    statusMessage = `⚠️ Low buffer (${healthScore}%) — Fill remaining slots to maintain reach.`;
  }

  return {
    weekLabel: weekRange.weekLabel,
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
    slots,
    healthScore,
    readyCount,
    totalSlots: slots.length,
    statusMessage,
  };
}

/**
 * Synthesizes recent weekly posts into a high-value Sunday Weekly Executive Summary draft
 */
export function generateSundayExecutiveSummary(
  repository: DemoRepository,
  workspaceId: string
): {
  topic: string;
  content: string;
  keyTakeaways: string[];
} {
  const drafts = repository.listDrafts(workspaceId);

  // Find recent non-empty drafts
  const recentPosts = drafts.slice(0, 3);

  const takeaways: string[] = [];

  if (recentPosts.length > 0) {
    recentPosts.forEach((post, idx) => {
      const firstLine = post.topic || `Post 0${idx + 1}`;
      takeaways.push(firstLine);
    });
  } else {
    takeaways.push("POS နှင့် Warehouse ကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်လာနိုင်သော ဆုံးရှုံးမှုများ");
    takeaways.push("ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်းနှင့် မန်နေဂျာ စစ်ဆေးချက် Gate");
    takeaways.push("xAI Grok Bot အသစ်ထွက်လာချိန်တွင် SME များ သတိပြုရမည့် အရှိတရားများ");
  }

  const topic = "ယခုအပတ် FYF AI SME Automation အနှစ်ချုပ် (၃) ချက်နှင့် စနစ်စည်းမျဉ်းများ";

  const content = [
    "ယခုအပတ်အတွင်း မြန်မာ SME လုပ်ငန်းရှင်များအတွက် တင်ဆက်ပေးခဲ့သော လက်တွေ့ကျသည့် AI Automation အနှစ်ချုပ် (၃) ချက် ဖြစ်ပါသည် -",
    "",
    `၁။ ${takeaways[0] || "Stock စာရင်းစစ်ဆေးခြင်း"} - AI က စာရင်းကူဖတ်ပေးနိုင်သော်လည်း လမ်းမှာရောက်နေဆဲ ပစ္စည်းစာရင်းကို လူက စစ်ဆေးရန် လိုအပ်ပါသည်။`,
    "",
    `၂။ ${takeaways[1] || "ငွေလွှဲပြေစာ စစ်ဆေးခြင်း"} - ဘဏ်ပြေစာ အတုမဖြစ်စေရန် AI ကို Data ကူထုတ်ခိုင်းပြီး ပစ္စည်းထုတ်ပေးခြင်းကို မန်နေဂျာက အတည်ပြုရပါမည်။`,
    "",
    `၃။ ${takeaways[2] || "AI သတင်း အရှိတရား"} - Bot အချင်းချင်း စကားပြောခိုင်းရာတွင် Token စရိတ် မတက်စေရန် Spending Limit နှင့် Task ကန့်သတ်ချက်များ ကြိုတင်သတ်မှတ်ထားရပါမည်။`,
    "",
    "💡 FYF AI အဓိက စနစ်စည်းမျဉ်း:",
    "\"AI ကို အချက်အလက် စုစည်းခိုင်းပါ။ ငွေကြေးနှင့် စီးပွားရေး ဆုံးဖြတ်ချက်ကိုတော့ လူကပဲ အတည်ပြုပါ။\"",
    "",
    "သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ \x27WORKFLOW\x27 ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်",
    "",
    "#FYFAI #WeeklyRecap #BusinessAutomation #HumanInTheLoop #MyanmarSME",
  ].join("\n");

  return {
    topic,
    content,
    keyTakeaways: takeaways,
  };
}
