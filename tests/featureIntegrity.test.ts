import { beforeEach, describe, expect, it } from "vitest";
import { PATCH as patchBrandProfile } from "@/app/api/workspaces/[workspaceId]/brand-profile/route";
import { upsertAnalyticsRecord } from "@/backend/analyticsEngine";
import { createDemoState, DemoRepository, getDemoRepository, resetDemoRepository } from "@/backend/demoRepository";
import { readFileSync } from "node:fs";

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

describe("feature data integrity boundaries", () => {
  beforeEach(() => {
    resetDemoRepository();
  });

  it("preserves a new workspace member and brand profile when resetting that workspace", () => {
    const repository = new DemoRepository(createDemoState());
    const { workspace } = repository.createWorkspace({
      name: "Local Reset Test",
      pageName: "Local Reset Test Page",
      brandDescription: "A local-first workspace"
    });
    const membersBeforeReset = repository.listWorkspaceMembers(workspace.id);
    const profileBeforeReset = repository.getBrandProfile(workspace.id);

    repository.resetWorkspace(workspace.id, "Test");

    expect(repository.getWorkspace(workspace.id)).toMatchObject({ id: workspace.id, name: "Local Reset Test" });
    expect(repository.listWorkspaceMembers(workspace.id)).toEqual(membersBeforeReset);
    expect(repository.getBrandProfile(workspace.id)).toEqual(profileBeforeReset);
  });

  it("rejects a draft id collision from another workspace instead of overwriting the owner", () => {
    const repository = new DemoRepository(createDemoState());
    const original = repository.getDraft("ws-fyf", "draft-risk");

    expect(() => repository.upsertDraft({
      ...original,
      workspaceId: "ws-agency",
      content: "Cross-workspace overwrite attempt"
    })).toThrow(/another workspace/i);

    expect(repository.getDraft("ws-fyf", "draft-risk")).toEqual(original);
  });

  it("stores external analytics without inventing a foreign draft id", () => {
    const result = upsertAnalyticsRecord("ws-fyf", {
      postId: "external-post-123",
      postTitle: "Imported Facebook post",
      views: 100,
      reach: 80,
      reactions: 4,
      comments: 1,
      shares: 2,
      clicks: 3,
      pillar: "workflow_breakdowns"
    });

    expect(result.snapshot.draftId).toBeUndefined();
    expect(result.snapshot.workspaceId).toBe("ws-fyf");
  });

  it("keeps the local SQLite analytics draft relation nullable for external posts", () => {
    const schema = readFileSync("database/schema/schema.sql", "utf8");
    const analyticsTable = schema.match(/CREATE TABLE analytics_snapshots \(([\s\S]*?)\);/)?.[1] || "";

    expect(analyticsTable).toMatch(/draftId TEXT REFERENCES drafts\(id\)/);
    expect(analyticsTable).not.toMatch(/draftId TEXT NOT NULL/);
  });

  it("rejects an unsupported brand tone persona without mutating local state", async () => {
    const before = getDemoRepository().getBrandProfile("ws-fyf");
    const response = await patchBrandProfile(
      request("/api/workspaces/ws-fyf/brand-profile", {
        method: "PATCH",
        body: JSON.stringify({ tonePersona: "not-a-real-persona" })
      }),
      params({ workspaceId: "ws-fyf" })
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("bad_request");
    expect(getDemoRepository().getBrandProfile("ws-fyf")).toEqual(before);
  });

  it("rejects non-string brand rule arrays without mutating local state", async () => {
    const before = getDemoRepository().getBrandProfile("ws-fyf");
    const response = await patchBrandProfile(
      request("/api/workspaces/ws-fyf/brand-profile", {
        method: "PATCH",
        body: JSON.stringify({ toneRules: ["valid rule", 42] })
      }),
      params({ workspaceId: "ws-fyf" })
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("bad_request");
    expect(getDemoRepository().getBrandProfile("ws-fyf")).toEqual(before);
  });
});
