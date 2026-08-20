import type { Draft } from "@/backend/types";
import { runRiskGuard } from "@/integrations/riskGuard";

export function mockFacebookPublish(draft: Draft) {
  const issues = runRiskGuard(draft.content);
  if (draft.status !== "approved") {
    return { ok: false, reason: "Draft must be approved before publishing." };
  }
  if (issues.length) {
    return { ok: false, reason: "Risk Guard blocked this draft.", issues };
  }
  return { ok: true, fakePostId: `fb_demo_${draft.id}_${Date.now().toString().slice(-4)}` };
}
