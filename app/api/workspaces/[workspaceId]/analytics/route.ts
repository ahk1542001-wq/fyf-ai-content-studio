import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import {
  parseFacebookCsv,
  parseInsightsFromText,
  upsertAnalyticsRecord,
} from "@/backend/analyticsEngine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();

  try {
    repository.getWorkspace(workspaceId);
    const snapshots = repository.listAnalytics(workspaceId);
    const summary = repository.getPillarPerformanceSummary(workspaceId);
    const drafts = repository.listDrafts(workspaceId);

    return okJson({
      ok: true,
      workspaceId,
      snapshots,
      summary,
      drafts,
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();

  try {
    repository.getWorkspace(workspaceId);
    const body = (await request.json()) as {
      mode?: "manual" | "csv" | "text_ocr";
      csvContent?: string;
      rawText?: string;
      draftId?: string;
      postId?: string;
      postTitle?: string;
      views?: number;
      reach?: number;
      reactions?: number;
      comments?: number;
      shares?: number;
      clicks?: number;
      pillar?: string;
    };

    // Case 1: CSV Batch Upload & Deduplicated Ingestion
    if (body.mode === "csv" && body.csvContent) {
      const parsedRows = parseFacebookCsv(body.csvContent);
      let insertedCount = 0;
      let updatedCount = 0;

      for (const row of parsedRows) {
        const { isUpdate } = upsertAnalyticsRecord(workspaceId, {
          postId: row.postId,
          views: row.views,
          reach: row.reach,
          reactions: row.reactions,
          comments: row.comments,
          shares: row.shares,
          clicks: row.clicks,
          pillar: row.pillar,
          capturedAt: row.publishTime || new Date().toISOString(),
        });
        if (isUpdate) updatedCount++;
        else insertedCount++;
      }

      const updatedSummary = repository.getPillarPerformanceSummary(workspaceId);
      const allSnapshots = repository.listAnalytics(workspaceId);

      return okJson({
        ok: true,
        mode: "csv",
        totalProcessed: parsedRows.length,
        insertedCount,
        updatedCount,
        summary: updatedSummary,
        snapshots: allSnapshots,
      });
    }

    // Case 2: Text / Screenshot OCR Extraction with Deduplication
    if (body.mode === "text_ocr" && body.rawText) {
      const extracted = parseInsightsFromText(body.rawText);
      const { snapshot, isUpdate } = upsertAnalyticsRecord(workspaceId, {
        draftId: body.draftId,
        postId: body.postId,
        postTitle: body.postTitle,
        views: body.views || extracted.views || 0,
        reach: body.reach || extracted.reach || 0,
        reactions: body.reactions || extracted.reactions || 0,
        comments: body.comments || extracted.comments || 0,
        shares: body.shares || extracted.shares || 0,
        clicks: body.clicks || extracted.clicks || 0,
        pillar: body.pillar || "operational_failure_risks",
      });

      const updatedSummary = repository.getPillarPerformanceSummary(workspaceId);
      const allSnapshots = repository.listAnalytics(workspaceId);

      return okJson({
        ok: true,
        mode: "text_ocr",
        isUpdate,
        snapshot,
        extracted,
        summary: updatedSummary,
        snapshots: allSnapshots,
      });
    }

    // Case 3: Standard Form Entry with Strict Deduplication
    const { snapshot, isUpdate } = upsertAnalyticsRecord(workspaceId, {
      draftId: body.draftId,
      postId: body.postId,
      postTitle: body.postTitle,
      views: body.views,
      reach: body.reach || 0,
      reactions: body.reactions || 0,
      comments: body.comments,
      shares: body.shares || 0,
      clicks: body.clicks,
      pillar: body.pillar,
    });

    const updatedSummary = repository.getPillarPerformanceSummary(workspaceId);
    const allSnapshots = repository.listAnalytics(workspaceId);

    return okJson({
      ok: true,
      mode: "manual",
      isUpdate,
      snapshot,
      summary: updatedSummary,
      snapshots: allSnapshots,
    });
  } catch (error) {
    return routeError(error);
  }
}
