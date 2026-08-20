import { beforeEach, describe, expect, it } from "vitest";
import { GET as getVideoContract } from "@/app/api/workspaces/[workspaceId]/drafts/[draftId]/video-contract/route";
import { approveDraft } from "@/backend/draftLifecycle";
import { getDemoRepository, resetDemoRepository } from "@/backend/demoRepository";

function params(value: { workspaceId: string; draftId: string }) {
  return { params: Promise.resolve(value) };
}

describe("approved video contract route", () => {
  beforeEach(() => resetDemoRepository());

  it("returns only an approved FYF draft contract for the video pipeline", async () => {
    const repository = getDemoRepository();
    const approval = approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Victor" });
    expect(approval.ok).toBe(true);

    const response = await getVideoContract(
      new Request("http://localhost/api/workspaces/ws-fyf/drafts/draft-risk/video-contract"),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const body = (await response.json()) as { contract: { contractVersion: string; content: { draftId: string }; approval: { status: string } } };

    expect(response.status).toBe(200);
    expect(body.contract).toMatchObject({
      contractVersion: "fyf.video-content.v1",
      content: { draftId: "draft-risk" },
      approval: { status: "approved" }
    });
  });

  it("does not hand off a draft that has not been approved", async () => {
    const response = await getVideoContract(
      new Request("http://localhost/api/workspaces/ws-fyf/drafts/draft-scheduled/video-contract"),
      params({ workspaceId: "ws-fyf", draftId: "draft-scheduled" })
    );
    const body = (await response.json()) as { ok: false; error: { code: string; message: string } };

    expect(response.status).toBe(409);
    expect(body).toMatchObject({ ok: false, error: { code: "conflict" } });
  });

  it("rejects an unsupported voice mode as a client error", async () => {
    const repository = getDemoRepository();
    const approval = approveDraft(repository, "ws-fyf", "draft-risk", { actor: "Victor" });
    expect(approval.ok).toBe(true);

    const response = await getVideoContract(
      new Request("http://localhost/api/workspaces/ws-fyf/drafts/draft-risk/video-contract?voice=robot"),
      params({ workspaceId: "ws-fyf", draftId: "draft-risk" })
    );
    const body = (await response.json()) as { ok: false; error: { code: string; message: string } };

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: { code: "bad_request" } });
  });
});
