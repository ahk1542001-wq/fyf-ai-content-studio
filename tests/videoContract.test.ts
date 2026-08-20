import { describe, expect, it } from "vitest";
import type { BrandProfile, Draft, Workspace } from "@/backend/types";
import { buildApprovedVideoContentContract } from "@/backend/videoContract";

const workspace: Workspace = {
  id: "ws-fyf",
  name: "FYF AI",
  pageName: "FYF AI",
  demoMode: false,
  riskSensitivity: "strict"
};

const brandProfile: BrandProfile = {
  id: "brand-fyf",
  workspaceId: workspace.id,
  description: "Practical Burmese AI workflow education for business owners.",
  targetAudience: "Burmese SME owners and team leads",
  toneRules: ["Plain Burmese", "Show the human approval gate"],
  forbiddenPhrases: ["အမြတ် အာမခံ"],
  preferredCtas: ["Messenger မှာ မေးနိုင်ပါတယ်"],
  voiceNotes: "Use concrete operational scenes and honest limits.",
  primaryColor: "#16856B",
  backgroundColor: "#F4F0E6"
};

const approvedDraft: Draft = {
  id: "draft-test-4",
  workspaceId: workspace.id,
  topic: "Payment Slip OCR & Financial Verification Gate",
  content: "AI က Slip ထဲက အချက်အလက်တွေကို ဖတ်ပေးနိုင်ပေမယ့် ငွေတကယ်ဝင်မဝင်ကို လူက ပြန်စစ်ရပါမယ်။",
  status: "approved",
  riskLevel: "safe",
  score: 94,
  version: 3,
  updatedAt: "2026-08-20T12:00:00.000Z"
};

describe("FYF approved video content contract", () => {
  it("serializes approved Burmese content with brand context and no local runtime details", () => {
    const contract = buildApprovedVideoContentContract({
      workspace,
      draft: approvedDraft,
      brandProfile,
      approvedBy: "Human Operator",
      approvedAt: "2026-08-20T12:01:00.000Z",
      voiceMode: "dual"
    });

    expect(contract).toMatchObject({
      contractVersion: "fyf.video-content.v1",
      source: { product: "fyf-ai-content-studio" },
      workspace: { id: "ws-fyf", name: "FYF AI", pageName: "FYF AI" },
      content: {
        draftId: "draft-test-4",
        topic: approvedDraft.topic,
        script: approvedDraft.content,
        version: 3,
        language: "my"
      },
      voice: { mode: "dual" },
      approval: { status: "approved", approvedBy: "Human Operator", approvedAt: "2026-08-20T12:01:00.000Z" }
    });
    expect(JSON.stringify(contract)).not.toMatch(/\.env|sqlite|token|secret|local\/|demo-state/i);
  });

  it("rejects content that has not passed the human approval gate", () => {
    expect(() =>
      buildApprovedVideoContentContract({
        workspace,
        draft: { ...approvedDraft, status: "needs_review" },
        brandProfile,
        approvedBy: "Human Operator",
        approvedAt: "2026-08-20T12:01:00.000Z",
        voiceMode: "ai"
      })
    ).toThrow("Draft must be approved before video handoff");
  });

  it("rejects a contract whose draft belongs to another workspace", () => {
    expect(() =>
      buildApprovedVideoContentContract({
        workspace,
        draft: { ...approvedDraft, workspaceId: "ws-other" },
        brandProfile,
        approvedBy: "Human Operator",
        approvedAt: "2026-08-20T12:01:00.000Z",
        voiceMode: "configured"
      })
    ).toThrow("Draft does not belong to workspace");
  });
});
