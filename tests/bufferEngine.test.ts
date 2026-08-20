import { describe, expect, it } from "vitest";
import { getDemoRepository } from "@/backend/demoRepository";
import {
  WEEKLY_SLOT_CONFIGS,
  getWeeklyBufferState,
  generateSundayExecutiveSummary,
  calculateWordCount,
  getCurrentWeekRange,
} from "@/backend/bufferEngine";

describe("Weekly Buffer Queue & 4-Pillar Content Planner Engine", () => {
  it("defines the 4 canonical FYF weekly slot configurations", () => {
    expect(WEEKLY_SLOT_CONFIGS.length).toBe(4);

    const [mon, wed, fri, sun] = WEEKLY_SLOT_CONFIGS;
    expect(mon.day).toBe("monday");
    expect(mon.pillar).toBe("risk_story");
    expect(mon.recommendedFormat).toBe("album");

    expect(wed.day).toBe("wednesday");
    expect(wed.pillar).toBe("workflow_breakdown");
    expect(wed.recommendedFormat).toBe("album");

    expect(fri.day).toBe("friday");
    expect(fri.pillar).toBe("reality_vs_hype");
    expect(fri.recommendedFormat).toBe("single");

    expect(sun.day).toBe("sunday");
    expect(sun.pillar).toBe("framework_education");
    expect(sun.recommendedFormat).toBe("single");
  });

  it("calculates accurate word count for Burmese & English mixed captions", () => {
    const text = "POS နှင့် Warehouse ကြား Stock မကိုက်ညီတဲ့အခါ AI စနစ်က ဘာလုပ်သင့်သလဲ။";
    const count = calculateWordCount(text);
    expect(count).toBeGreaterThan(5);
    expect(calculateWordCount("")).toBe(0);
  });

  it("computes current week range with formatted labels", () => {
    const range = getCurrentWeekRange();
    expect(range.weekLabel).toContain("Week of");
    expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("generates full weekly buffer state with health scores for a workspace", () => {
    const repo = getDemoRepository();
    const buffer = getWeeklyBufferState(repo, "ws-fyf");

    expect(buffer.slots.length).toBe(4);
    expect(buffer.totalSlots).toBe(4);
    expect(buffer.healthScore).toBeGreaterThanOrEqual(0);
    expect(buffer.healthScore).toBeLessThanOrEqual(100);
    expect(buffer.readyCount).toBeLessThanOrEqual(4);
    expect(buffer.statusMessage).toBeDefined();

    // Verify slot fields
    const monSlot = buffer.slots.find((s) => s.day === "monday");
    expect(monSlot).toBeDefined();
    expect(monSlot?.pillar).toBe("risk_story");
    expect(monSlot?.dayLabel).toContain("Monday");
  });

  it("generates structured Sunday Executive Summary draft with Rule #10 Zero-Jargon and Messenger Lead CTA", () => {
    const repo = getDemoRepository();
    const summary = generateSundayExecutiveSummary(repo, "ws-fyf");

    expect(summary.topic).toContain("အနှစ်ချုပ်");
    expect(summary.keyTakeaways.length).toBeGreaterThanOrEqual(1);
    expect(summary.content).toContain("FYF AI အဓိက စနစ်စည်းမျဉ်း");
    expect(summary.content).toContain("Page Messenger သို့ 'WORKFLOW' ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်");
    expect(summary.content).toContain("#FYFAI");
  });
});
