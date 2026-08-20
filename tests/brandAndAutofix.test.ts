import { describe, expect, it } from "vitest";
import { DemoRepository } from "@/backend/demoRepository";
import { applyAiFix } from "@/backend/draftLifecycle";
import { GET as getBrandProfileRoute, PATCH as patchBrandProfileRoute } from "@/app/api/workspaces/[workspaceId]/brand-profile/route";
import { POST as postFixDraftRoute } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/fix/route";

describe("Brand Voice OS & Client Auto-Fix Loop", () => {
  it("fetches and updates brand profile with custom colors and tone persona", () => {
    const repository = new DemoRepository();
    const profile = repository.getBrandProfile("ws-fyf");
    expect(profile).toBeDefined();

    const updated = repository.updateBrandProfile({
      ...profile,
      tonePersona: "energetic_bold",
      primaryColor: "#FF5722",
      secondaryColor: "#212121",
      accentColor: "#FFC107",
      backgroundColor: "#FAFAFA",
      customCta: "Page Messenger သို့ စာပို့ပြီး အမြန်ဆုံး စုံစမ်းပါ"
    });

    expect(updated.tonePersona).toBe("energetic_bold");
    expect(updated.primaryColor).toBe("#FF5722");
    expect(updated.customCta).toContain("Page Messenger");

    const reloaded = repository.getBrandProfile("ws-fyf");
    expect(reloaded.primaryColor).toBe("#FF5722");
  });

  it("handles GET and PATCH /api/workspaces/[workspaceId]/brand-profile via route handlers", async () => {
    const getRes = await getBrandProfileRoute(new Request("http://localhost:3000/api/workspaces/ws-fyf/brand-profile"), {
      params: Promise.resolve({ workspaceId: "ws-fyf" })
    });
    const getData = await getRes.json();
    expect(getData.ok).toBe(true);
    expect(getData.brandProfile).toBeDefined();

    const patchReq = new Request("http://localhost:3000/api/workspaces/ws-fyf/brand-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tonePersona: "luxury_prestigious",
        primaryColor: "#D4AF37",
        customCta: "Exclusive Consultation ရယူရန် ဆက်သွယ်ပါ"
      })
    });

    const patchRes = await patchBrandProfileRoute(patchReq, {
      params: Promise.resolve({ workspaceId: "ws-fyf" })
    });
    const patchData = await patchRes.json();
    expect(patchData.ok).toBe(true);
    expect(patchData.brandProfile.tonePersona).toBe("luxury_prestigious");
    expect(patchData.brandProfile.primaryColor).toBe("#D4AF37");
  });

  it("applies client feedback auto-fix and tracks revision history and version increments", () => {
    const repository = new DemoRepository();
    const draft = repository.listDrafts("ws-fyf")[0];
    const initialVersion = draft.version;

    const result = applyAiFix(
      repository,
      "ws-fyf",
      draft.id,
      {
        mode: "client_feedback",
        instruction: "Slide 2 ခေါင်းစဉ်ကို ပိုရှင်းလင်းပြီး ဆွဲဆောင်မှုရှိအောင် ပြင်ပေးပါ"
      },
      { actor: "Client Reviewer" }
    );

    expect(result.draft.version).toBe(initialVersion + 1);
    expect(result.draft.revisions).toBeDefined();
    expect(result.draft.revisions?.length).toBeGreaterThanOrEqual(1);
    expect(result.draft.revisions?.[result.draft.revisions.length - 1].instruction).toContain("Slide 2 ခေါင်းစဉ်");
    expect(result.reason).toContain("Client Feedback");
  });

  it("handles POST /api/workspaces/[workspaceId]/drafts/[draftId]/fix with client instruction", async () => {
    const repository = new DemoRepository();
    const draft = repository.listDrafts("ws-fyf")[0];

    const req = new Request(`http://localhost:3000/api/workspaces/ws-fyf/drafts/${draft.id}/fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "client_feedback",
        instruction: "ပိုမို တိုတိုတုတ်တုတ် ရေးသားပေးပါ"
      })
    });

    const res = await postFixDraftRoute(req, {
      params: Promise.resolve({ workspaceId: "ws-fyf", draftId: draft.id })
    });
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.draft.version).toBeGreaterThan(draft.version);
    expect(data.draft.revisions).toBeDefined();
  });
});
