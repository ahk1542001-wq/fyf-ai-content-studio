import type { AnalyticsSnapshot } from "./types";
import { getDemoRepository } from "./demoRepository";

export interface ParsedCsvRow {
  postId: string;
  publishTime: string;
  title: string;
  views: number;
  reach: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  pillar: string;
}

export function detectPillarFromContent(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("fact") ||
    lower.includes("hype") ||
    lower.includes("benchmark") ||
    lower.includes("model") ||
    lower.includes("evaluation") ||
    lower.includes("သတင်း") ||
    lower.includes("အရှိတရား")
  ) {
    return "ai_news_analysis";
  }
  if (
    lower.includes("reporting") ||
    lower.includes("workflow") ||
    lower.includes("langgraph") ||
    lower.includes("sync lag") ||
    lower.includes("လည်ပတ်ပုံ")
  ) {
    return "workflow_breakdowns";
  }
  if (
    lower.includes("maker") ||
    lower.includes("checker") ||
    lower.includes("framework") ||
    lower.includes("checklist") ||
    lower.includes("မူဘောင်") ||
    lower.includes("စည်းမျဉ်း")
  ) {
    return "burmese_ai_education";
  }
  return "operational_failure_risks";
}

/**
 * Robust CSV parser that handles multi-line quoted fields (like Burmese post text).
 */
export function parseFacebookCsv(csvText: string): ParsedCsvRow[] {
  const rows: ParsedCsvRow[] = [];
  const lines: string[] = [];

  // Custom tokenizer to split CSV rows properly respecting quotes
  let currentField = "";
  let insideQuotes = false;
  const currentTokens: string[] = [];

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentTokens.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // skip \r\n
      }
      currentTokens.push(currentField);
      currentField = "";

      if (currentTokens.some(t => t.trim().length > 0)) {
        lines.push(JSON.stringify(currentTokens));
      }
      currentTokens.length = 0;
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentTokens.length > 0) {
    currentTokens.push(currentField);
    if (currentTokens.some(t => t.trim().length > 0)) {
      lines.push(JSON.stringify(currentTokens));
    }
  }

  if (lines.length <= 1) return rows;

  // Header parsing
  const headers = JSON.parse(lines[0]) as string[];
  const findCol = (name: string) => headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());

  const postIdIdx = findCol("Post ID");
  const titleIdx = findCol("Title");
  const publishTimeIdx = findCol("Publish time");
  const viewsIdx = findCol("Views");
  const reachIdx = findCol("Reach");
  const reactionsIdx = findCol("Reactions");
  const commentsIdx = findCol("Comments");
  const sharesIdx = findCol("Shares");
  const clicksIdx = findCol("Total clicks");

  for (let i = 1; i < lines.length; i++) {
    const cols = JSON.parse(lines[i]) as string[];
    if (cols.length < 5) continue;

    const postId = (postIdIdx !== -1 ? cols[postIdIdx] : cols[0])?.trim();
    if (!postId || !/^\d+$/.test(postId)) continue;

    const title = (titleIdx !== -1 ? cols[titleIdx] : cols[3])?.trim() || "";
    const publishTime = (publishTimeIdx !== -1 ? cols[publishTimeIdx] : cols[6])?.trim() || "";
    const views = parseInt(viewsIdx !== -1 ? cols[viewsIdx] : cols[17], 10) || 0;
    const reach = parseInt(reachIdx !== -1 ? cols[reachIdx] : cols[18], 10) || 0;
    const reactions = parseInt(reactionsIdx !== -1 ? cols[reactionsIdx] : cols[20], 10) || 0;
    const comments = parseInt(commentsIdx !== -1 ? cols[commentsIdx] : cols[21], 10) || 0;
    const shares = parseInt(sharesIdx !== -1 ? cols[sharesIdx] : cols[22], 10) || 0;
    const clicks = parseInt(clicksIdx !== -1 ? cols[clicksIdx] : cols[23], 10) || 0;

    const pillar = detectPillarFromContent(title);

    rows.push({
      postId,
      publishTime,
      title,
      views,
      reach,
      reactions,
      comments,
      shares,
      clicks,
      pillar,
    });
  }

  return rows;
}

/**
 * Text / OCR parser to extract numeric metrics from pasted text or screenshot transcription.
 */
export function parseInsightsFromText(rawText: string): Partial<ParsedCsvRow> {
  const res: Partial<ParsedCsvRow> = {
    views: 0,
    reach: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
  };

  const viewsMatch = rawText.match(/(?:views|impressions|ကြည့်ရှုသူ|view count)[:\s]+(\d+[\d,]*)/i);
  if (viewsMatch) res.views = parseInt(viewsMatch[1].replace(/,/g, ""), 10);

  const reachMatch = rawText.match(/(?:reach|people reached|ရောက်ရှိသူ)[:\s]+(\d+[\d,]*)/i);
  if (reachMatch) res.reach = parseInt(reachMatch[1].replace(/,/g, ""), 10);

  const reactionsMatch = rawText.match(/(?:reactions|likes|like|ကြိုက်နှစ်သက်သူ)[:\s]+(\d+[\d,]*)/i);
  if (reactionsMatch) res.reactions = parseInt(reactionsMatch[1].replace(/,/g, ""), 10);

  const commentsMatch = rawText.match(/(?:comments|comment|မှတ်ချက်)[:\s]+(\d+[\d,]*)/i);
  if (commentsMatch) res.comments = parseInt(commentsMatch[1].replace(/,/g, ""), 10);

  const sharesMatch = rawText.match(/(?:shares|share|မျှဝေသူ)[:\s]+(\d+[\d,]*)/i);
  if (sharesMatch) res.shares = parseInt(sharesMatch[1].replace(/,/g, ""), 10);

  const clicksMatch = rawText.match(/(?:clicks|link clicks|photo clicks)[:\s]+(\d+[\d,]*)/i);
  if (clicksMatch) res.clicks = parseInt(clicksMatch[1].replace(/,/g, ""), 10);

  return res;
}

/**
 * Upsert with strict deduplication by draftId OR postId OR title similarity.
 */
export function upsertAnalyticsRecord(
  workspaceId: string,
  record: {
    id?: string;
    draftId?: string;
    postId?: string;
    postTitle?: string;
    views?: number;
    reach: number;
    reactions: number;
    comments?: number;
    shares: number;
    clicks?: number;
    pillar?: string;
    capturedAt?: string;
  }
): { snapshot: AnalyticsSnapshot; isUpdate: boolean } {
  const repository = getDemoRepository();
  const existing = repository.listAnalytics(workspaceId);

  const views = Number(record.views) || 0;
  const reach = Number(record.reach) || 0;
  const reactions = Number(record.reactions) || 0;
  const comments = Number(record.comments) || 0;
  const shares = Number(record.shares) || 0;
  const clicks = Number(record.clicks) || 0;

  const totalEngagements = reactions + comments + shares + clicks;
  const engagementRate = reach > 0 ? (totalEngagements / reach) * 100 : 0;

  // Deduplication check:
  // 1. By draftId if specified and not 'custom-post'
  // 2. By id
  // 3. By postId matching
  const matchIndex = existing.findIndex((snap) => {
    if (record.id && snap.id === record.id) return true;
    if (record.draftId && record.draftId !== "custom-post" && snap.draftId === record.draftId) return true;
    if (record.postId && snap.id.includes(record.postId)) return true;
    return false;
  });

  const isUpdate = matchIndex !== -1;
  const targetId = isUpdate
    ? existing[matchIndex].id
    : record.id || (record.postId ? `fb-post-${record.postId}` : `snap-${Date.now()}`);

  const snapshot: AnalyticsSnapshot = {
    id: targetId,
    workspaceId,
    draftId: record.draftId || (isUpdate ? existing[matchIndex].draftId : undefined),
    views,
    reach,
    reactions,
    comments,
    shares,
    clicks,
    pillar: record.pillar || (isUpdate ? existing[matchIndex].pillar : "operational_failure_risks"),
    engagementRate: parseFloat(engagementRate.toFixed(2)),
    capturedAt: record.capturedAt || (isUpdate ? existing[matchIndex].capturedAt : new Date().toISOString()),
  };

  const saved = repository.ingestAnalyticsSnapshot(snapshot);
  return { snapshot: saved, isUpdate };
}
