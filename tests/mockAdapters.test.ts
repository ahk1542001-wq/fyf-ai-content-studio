import { describe, expect, it } from "vitest";
import { guardBurmeseOutput, mockGeminiGenerateDraft } from "@/integrations/mockGemini";
import { mockSheetsFetchExamples } from "@/integrations/mockSheets";
import { mockFacebookPublish } from "@/integrations/mockFacebook";
import { filterByWorkspace } from "@/backend/workspaceGuards";
import { testIntegrationConnection } from "@/backend/integrationSettings";
import { buildGeminiPrompt } from "@/backend/promptBuilder";
import { brandProfiles, seedDrafts } from "@/database/demo-data/demoData";

type ChecklistResult = ReturnType<typeof testIntegrationConnection> & {
  checklist?: Array<Record<string, unknown>>;
  readinessChecklist?: Array<Record<string, unknown>>;
};

function checklistText(result: ChecklistResult) {
  return JSON.stringify(result.checklist ?? result.readinessChecklist ?? []).toLowerCase();
}

describe("mock automation adapters", () => {
  it("generates Burmese draft content using style examples", () => {
    const examples = mockSheetsFetchExamples("ws-fyf");
    const brandProfile = brandProfiles.find((profile) => profile.workspaceId === "ws-fyf") ?? brandProfiles[0];
    const input = {
      topic: "Risk management",
      tone: "Professional",
      length: "Long",
      angle: "Risk discipline",
      audience: "Busy traders",
      cta: "မေးမြန်း",
      brandProfile,
      examples
    };
    const draft = mockGeminiGenerateDraft({
      ...input,
      prompt: buildGeminiPrompt(input)
    });
    expect(guardBurmeseOutput(draft)).toBe(true);
    expect(draft).toContain("Risk management");
    expect(draft).toContain("Human Verification Gate");
    expect(draft).toContain("AI ကို အချက်အလက် စုစည်းခိုင်းပါ။ စီးပွားရေး ဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။");
  });

  it("keeps workspace records isolated", () => {
    const fyfDrafts = filterByWorkspace(seedDrafts, "ws-fyf");
    expect(fyfDrafts.every((draft) => draft.workspaceId === "ws-fyf")).toBe(true);
    expect(fyfDrafts.some((draft) => draft.workspaceId === "ws-agency")).toBe(false);
  });

  it("blocks mock publish until approval", () => {
    const result = mockFacebookPublish(seedDrafts[0]);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/approved/i);
  });

  it("blocks mock publish for any Risk Guard issue, including review-level wording", () => {
    const result = mockFacebookPublish({
      ...seedDrafts[0],
      id: "draft-review-risk",
      content: "ဒီ trade ကိုဝင်ဖို့ setup ကိုကြည့်ပါ။ နောက်ကျမနေနဲ့။",
      status: "approved",
      riskLevel: "review"
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Risk Guard blocked/i);
    expect(result.issues?.map((issue) => issue.code)).toEqual(["direct_financial_advice", "high_pressure"]);
    expect(result.issues?.every((issue) => issue.severity === "review")).toBe(true);
  });

  it("returns provider-specific readiness checklist details for integration health", () => {
    const facebook = testIntegrationConnection({
      workspaceId: "ws-fyf",
      provider: "facebook",
      status: "demo",
      maskedSecret: "EAAB••••45",
      lastChecked: "Just now",
      config: {
        pageId: "page_123",
        pageName: "FYF AI Forex"
      }
    } as Parameters<typeof testIntegrationConnection>[0] & { config: Record<string, unknown> }) as ChecklistResult;
    const gemini = testIntegrationConnection({
      workspaceId: "ws-fyf",
      provider: "gemini",
      status: "demo",
      maskedSecret: "GEMI••••DE",
      lastChecked: "Just now",
      config: {
        model: "gemini-2.5-pro",
        language: "Burmese"
      }
    } as Parameters<typeof testIntegrationConnection>[0] & { config: Record<string, unknown> }) as ChecklistResult;

    expect(checklistText(facebook)).toContain("page");
    expect(checklistText(facebook)).toMatch(/token|secret|credential/);
    expect(checklistText(facebook)).not.toContain("gemini");
    expect(checklistText(gemini)).toMatch(/gemini|model/);
    expect(checklistText(gemini)).toMatch(/burmese|myanmar|prompt/);
    expect(JSON.stringify(facebook)).not.toContain("page_access_token");
  });
});
