import { beforeEach, describe, expect, it } from "vitest";
import { DemoRepository, createDemoState } from "@/backend/demoRepository";
import {
  calculatePillarScore,
  aggregatePillarPerformance,
  generateTopicRecommendations,
  FYF_CONTENT_PILLARS
} from "@/backend/topicEngine";
import { mockAnalyticsSnapshot } from "@/integrations/mockAnalytics";
import { GET as getTopicRecommendationsRoute } from "@/app/api/workspaces/[workspaceId]/topic-recommendations/route";
import { createInMemoryDemoDatabase } from "@/database/sqliteDemo";

describe("Milestone M3: Facebook Insights & Topic Recommendation Engine", () => {
  let repository: DemoRepository;

  beforeEach(() => {
    repository = new DemoRepository(createDemoState());
  });

  describe("1. Composite Performance Scoring Formula", () => {
    it("calculates composite performance score using exact weights: views*0.1 + reach*0.2 + reactions*1.0 + shares*2.5 + clicks*1.5", () => {
      const metrics = {
        views: 1000,
        reach: 500,
        reactions: 50,
        shares: 20,
        clicks: 30
      };
      // Expected = (1000 * 0.1) + (500 * 0.2) + (50 * 1.0) + (20 * 2.5) + (30 * 1.5)
      //          = 100 + 100 + 50 + 50 + 45 = 345
      const score = calculatePillarScore(metrics);
      expect(score).toBe(345);
    });

    it("handles zero values and undefined optional metrics gracefully", () => {
      expect(calculatePillarScore({})).toBe(0);
      expect(calculatePillarScore({ views: 500 })).toBe(50);
      expect(calculatePillarScore({ shares: 10 })).toBe(25);
    });
  });

  describe("2. Mock Analytics 5-Metric Generator", () => {
    it("generates all 5 required Facebook Insights metrics", () => {
      const snapshot = mockAnalyticsSnapshot(1);
      expect(snapshot).toHaveProperty("views");
      expect(snapshot).toHaveProperty("reach");
      expect(snapshot).toHaveProperty("reactions");
      expect(snapshot).toHaveProperty("shares");
      expect(snapshot).toHaveProperty("clicks");
      expect(snapshot.views).toBeGreaterThan(0);
      expect(snapshot.reach).toBeGreaterThan(0);
      expect(snapshot.reactions).toBeGreaterThan(0);
      expect(snapshot.shares).toBeGreaterThan(0);
      expect(snapshot.clicks).toBeGreaterThan(0);
      expect(snapshot.engagementRate).toBeGreaterThan(0);
    });

    it("applies realistic performance multipliers for Operational Failure Risks (+42% reach, 2.5x shares)", () => {
      const base = mockAnalyticsSnapshot(2);
      const operational = mockAnalyticsSnapshot(2, "operational_failure_risks");

      expect(operational.reach).toBeGreaterThan(base.reach);
      expect(operational.shares).toBeGreaterThan(base.shares);
      expect(operational.reach).toBe(Math.round(base.reach * 1.42));
      expect(operational.shares).toBe(Math.round(base.shares * 2.5));
    });
  });

  describe("3. Repository Ingestion & Tenant Isolation", () => {
    it("ingests 5-metric analytics snapshot and retrieves by workspace", () => {
      const ingested = repository.ingestAnalyticsSnapshot({
        id: "snapshot-test-1",
        workspaceId: "ws-fyf",
        draftId: "draft-published",
        views: 8500,
        reach: 4200,
        reactions: 320,
        comments: 45,
        shares: 68,
        clicks: 210,
        pillar: "operational_failure_risks",
        capturedAt: "Just now"
      });

      expect(ingested.id).toBe("snapshot-test-1");
      const list = repository.listAnalytics("ws-fyf");
      const found = list.find((s) => s.id === "snapshot-test-1");
      expect(found).toBeDefined();
      expect(found?.views).toBe(8500);
      expect(found?.shares).toBe(68);
      expect(found?.clicks).toBe(210);
    });

    it("filters analytics snapshots strictly by pillar", () => {
      repository.ingestAnalyticsSnapshot({
        id: "snap-risk-1",
        workspaceId: "ws-fyf",
        draftId: "draft-1",
        views: 6000,
        reach: 3000,
        reactions: 150,
        shares: 40,
        clicks: 120,
        pillar: "operational_failure_risks",
        capturedAt: "Today"
      });
      repository.ingestAnalyticsSnapshot({
        id: "snap-ai-1",
        workspaceId: "ws-fyf",
        draftId: "draft-2",
        views: 5000,
        reach: 2500,
        reactions: 100,
        shares: 20,
        clicks: 80,
        pillar: "ai_news_analysis",
        capturedAt: "Today"
      });

      const riskSnapshots = repository.listAnalyticsByPillar("ws-fyf", "operational_failure_risks");
      expect(riskSnapshots.length).toBe(1);
      expect(riskSnapshots[0].id).toBe("snap-risk-1");

      const aiSnapshots = repository.listAnalyticsByPillar("ws-fyf", "ai_news_analysis");
      expect(aiSnapshots.length).toBe(1);
      expect(aiSnapshots[0].id).toBe("snap-ai-1");
    });

    it("enforces strict workspace tenant isolation", () => {
      repository.ingestAnalyticsSnapshot({
        id: "snap-agency-only",
        workspaceId: "ws-agency",
        draftId: "draft-failed",
        views: 1200,
        reach: 600,
        reactions: 30,
        shares: 5,
        clicks: 25,
        pillar: "knowledge_frameworks",
        capturedAt: "Today"
      });

      const fyfAnalytics = repository.listAnalytics("ws-fyf");
      expect(fyfAnalytics.some((s) => s.id === "snap-agency-only")).toBe(false);

      const agencyAnalytics = repository.listAnalytics("ws-agency");
      expect(agencyAnalytics.some((s) => s.id === "snap-agency-only")).toBe(true);
    });

    it("rejects ingestion into non-existent workspaces", () => {
      expect(() =>
        repository.ingestAnalyticsSnapshot({
          id: "snap-invalid",
          workspaceId: "ws-nonexistent",
          draftId: "draft-xyz",
          views: 100,
          reach: 50,
          reactions: 5,
          shares: 1,
          clicks: 2,
          capturedAt: "Now"
        })
      ).toThrow(/workspace not found/i);
    });
  });

  describe("4. Pillar Performance Aggregation & Ranking", () => {
    it("aggregates pillar performance across 4 standard FYF pillars and ranks top pillar", () => {
      // Ingest high performance for operational failure risks
      repository.ingestAnalyticsSnapshot({
        id: "snap-high-risk",
        workspaceId: "ws-fyf",
        draftId: "draft-published",
        views: 15000,
        reach: 9000,
        reactions: 800,
        comments: 120,
        shares: 350,
        clicks: 600,
        pillar: "operational_failure_risks",
        capturedAt: "Today"
      });

      const summary = repository.getPillarPerformanceSummary("ws-fyf");
      expect(summary.length).toBeGreaterThanOrEqual(4);

      // Verify descending order
      for (let i = 0; i < summary.length - 1; i++) {
        expect(summary[i].compositeScore).toBeGreaterThanOrEqual(summary[i + 1].compositeScore);
      }

      // Top pillar should be flagged
      expect(summary[0].topPillar).toBe(true);
      expect(summary[0].pillar).toBe("operational_failure_risks");
      expect(summary[0].compositeScore).toBeGreaterThan(1000);
    });

    it("aggregates raw snapshot arrays directly via aggregatePillarPerformance", () => {
      const rawSnapshots = [
        {
          id: "raw-1",
          workspaceId: "ws-test",
          draftId: "d1",
          views: 10000,
          reach: 5000,
          reactions: 400,
          comments: 50,
          shares: 200,
          clicks: 300,
          pillar: "human_control_checkpoints",
          capturedAt: "2026-08-19"
        }
      ];

      const aggregated = aggregatePillarPerformance(rawSnapshots);
      expect(aggregated.length).toBeGreaterThanOrEqual(4);
      const humanCheckpoint = aggregated.find((p) => p.pillar === "human_control_checkpoints");
      expect(humanCheckpoint).toBeDefined();
      expect(humanCheckpoint?.views).toBe(10000);
      expect(humanCheckpoint?.shares).toBe(200);
      expect(humanCheckpoint?.compositeScore).toBeGreaterThan(1000);
    });

    it("returns top N performing pillars via getTopPerformingPillars", () => {
      const top2 = repository.getTopPerformingPillars("ws-fyf", 2);
      expect(top2.length).toBe(2);
      expect(top2[0].compositeScore).toBeGreaterThanOrEqual(top2[1].compositeScore);
    });

  });

  describe("5. Contextual Burmese Topic Recommendations", () => {
    it("generates Burmese topic recommendations for all 4 FYF pillars with performance rationale", () => {
      const recommendations = generateTopicRecommendations("ws-fyf", repository);
      expect(recommendations.length).toBeGreaterThanOrEqual(4);

      const pillarKeys = new Set(recommendations.map((r) => r.pillarKey));
      expect(pillarKeys.has("operational_failure_risks")).toBe(true);
      expect(pillarKeys.has("human_control_checkpoints")).toBe(true);
      expect(pillarKeys.has("knowledge_frameworks")).toBe(true);
      expect(pillarKeys.has("ai_news_analysis")).toBe(true);

      // Verify Burmese titles and required metadata
      for (const rec of recommendations) {
        expect(rec.id).toBeDefined();
        expect(rec.topic).toBeTruthy();
        expect(rec.topicBurmese).toBeTruthy();
        expect(rec.angle).toBeTruthy();
        expect(rec.tone).toBeTruthy();
        expect(rec.targetAudience).toBeTruthy();
        expect(rec.performanceRationale).toBeTruthy();
        expect(rec.metrics.compositeScore).toBeGreaterThan(0);
        expect(rec.suggestedVisualFamily).toBeDefined();
      }

      // Check specific Burmese content coverage for key pillars
      const stockDesyncRec = recommendations.find((r) => r.topic.includes("Stock Desync"));
      expect(stockDesyncRec).toBeDefined();
      expect(stockDesyncRec?.topicBurmese).toContain("Stock");
      expect(stockDesyncRec?.suggestedVisualFamily).toBe("system_story");

      const ocrRec = recommendations.find((r) => r.topic.includes("Payment Slip OCR"));
      expect(ocrRec).toBeDefined();
      expect(ocrRec?.topicBurmese).toContain("ငွေလွှဲပြေစာ OCR");

      const langGraphRec = recommendations.find((r) => r.topic.includes("Daily Reporting"));
      expect(langGraphRec).toBeDefined();
      expect(langGraphRec?.topicBurmese).toContain("LangGraph");

      const aiNewsRec = recommendations.find((r) => r.topic.includes("Fact vs Inference"));
      expect(aiNewsRec).toBeDefined();
      expect(aiNewsRec?.topicBurmese).toContain("SME");
    });

    it("verifies static FYF_CONTENT_PILLARS definitions contain all required keys", () => {
      expect(Object.keys(FYF_CONTENT_PILLARS)).toEqual([
        "operational_failure_risks",
        "human_control_checkpoints",
        "knowledge_frameworks",
        "ai_news_analysis"
      ]);
    });
  });

  describe("6. Topic Recommendations API Route", () => {
    it("returns 200 with topPillars and recommendations for valid workspace", async () => {
      const request = new Request("http://localhost:3000/api/workspaces/ws-fyf/topic-recommendations");
      const response = await getTopicRecommendationsRoute(request, {
        params: Promise.resolve({ workspaceId: "ws-fyf" })
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        ok: boolean;
        workspaceId: string;
        topPillars: Array<{ pillar: string; compositeScore: number }>;
        recommendations: Array<{ topic: string; topicBurmese: string }>;
      };

      expect(data.ok).toBe(true);
      expect(data.workspaceId).toBe("ws-fyf");
      expect(Array.isArray(data.topPillars)).toBe(true);
      expect(data.topPillars.length).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThanOrEqual(4);
    });

    it("returns 404 for unknown workspace", async () => {
      const request = new Request("http://localhost:3000/api/workspaces/ws-unknown/topic-recommendations");
      const response = await getTopicRecommendationsRoute(request, {
        params: Promise.resolve({ workspaceId: "ws-unknown" })
      });

      expect(response.status).toBe(404);
      const data = (await response.json()) as { ok: boolean; error: { code: string; message: string } };
      expect(data.ok).toBe(false);
      expect(data.error.code).toBe("not_found");
    });
  });

  describe("7. SQLite Schema Compatibility", () => {
    it("creates SQLite in-memory database with extended analytics_snapshots columns", () => {
      const db = createInMemoryDemoDatabase();
      const columns = db.prepare("PRAGMA table_info(analytics_snapshots)").all() as Array<{ name: string }>;
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("workspaceId");
      expect(columnNames).toContain("draftId");
      expect(columnNames).toContain("views");
      expect(columnNames).toContain("reach");
      expect(columnNames).toContain("reactions");
      expect(columnNames).toContain("comments");
      expect(columnNames).toContain("shares");
      expect(columnNames).toContain("clicks");
      expect(columnNames).toContain("pillar");
      expect(columnNames).toContain("capturedAt");
    });
  });
});
