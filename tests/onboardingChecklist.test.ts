import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getDrafts } from "@/app/api/workspaces/[workspaceId]/drafts/route";
import { GET as getHealth } from "@/app/api/workspaces/[workspaceId]/health/route";
import { DemoRepository, resetDemoRepository } from "@/backend/demoRepository";
import type { AuditEvent, Draft, OnboardingChecklistItem, PublishJob, ScheduleJob } from "@/backend/types";

type DraftsResponse = {
  drafts: Draft[];
  auditEvents: AuditEvent[];
  analytics: Array<{ workspaceId: string }>;
  publishJobs: PublishJob[];
  scheduleJobs: ScheduleJob[];
  ideas: Array<{ workspaceId: string }>;
  onboardingChecklistItems: OnboardingChecklistItem[];
};

type HealthResponse = {
  workspace: { id: string; name: string; demoMode: boolean };
  integrations: { ready: number; total: number };
  queues: { failedJobs: number; scheduledJobs: number; publishJobs: number };
  onboarding: {
    completed: number;
    total: number;
    items: OnboardingChecklistItem[];
  };
};

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

describe("onboarding checklist data model", () => {
  it("has workspace-scoped seeded items for ws-fyf", () => {
    const repository = new DemoRepository();
    const items = repository.listOnboardingChecklistItems("ws-fyf");

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.workspaceId === "ws-fyf")).toBe(true);
  });

  it("has workspace-scoped seeded items for ws-agency", () => {
    const repository = new DemoRepository();
    const items = repository.listOnboardingChecklistItems("ws-agency");

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.workspaceId === "ws-agency")).toBe(true);
  });

  it("keeps checklist data workspace-scoped when counts match", () => {
    const repository = new DemoRepository();
    const fyfItems = repository.listOnboardingChecklistItems("ws-fyf");
    const agencyItems = repository.listOnboardingChecklistItems("ws-agency");

    expect(fyfItems).not.toEqual(agencyItems);
  });

  it("each seeded item has a stable id, label, completed boolean, and detail string", () => {
    const repository = new DemoRepository();
    const items = repository.listOnboardingChecklistItems("ws-fyf");

    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(typeof item.id).toBe("string");
      expect(item.label).toBeTruthy();
      expect(typeof item.completed).toBe("boolean");
      expect(typeof item.detail).toBe("string");
      expect(item.detail.length).toBeGreaterThan(0);
    }
  });

  it("ws-fyf has exactly 5 onboarding items with all completed", () => {
    const repository = new DemoRepository();
    const items = repository.listOnboardingChecklistItems("ws-fyf");

    expect(items).toHaveLength(5);
    expect(items.filter((i) => i.completed)).toHaveLength(5);
    expect(items.filter((i) => !i.completed)).toHaveLength(0);
  });

  it("ws-agency has exactly 5 onboarding items with 2 completed", () => {
    const repository = new DemoRepository();
    const items = repository.listOnboardingChecklistItems("ws-agency");

    expect(items).toHaveLength(5);
    expect(items.filter((i) => i.completed)).toHaveLength(2);
    expect(items.filter((i) => !i.completed)).toHaveLength(3);
  });

  it("throws for an unknown workspace", () => {
    const repository = new DemoRepository();
    expect(() => repository.listOnboardingChecklistItems("ws-missing")).toThrow("Workspace not found");
  });

  it("resetWorkspace restores onboarding items to seed data", () => {
    const repository = new DemoRepository();
    const before = repository.listOnboardingChecklistItems("ws-fyf");
    repository.resetWorkspace("ws-fyf", "Test");
    const after = repository.listOnboardingChecklistItems("ws-fyf");

    expect(after).toHaveLength(before.length);
    expect(after.map((i) => i.id).sort()).toEqual(before.map((i) => i.id).sort());
    expect(after.filter((i) => i.completed)).toHaveLength(5);
  });

  it("resets only the requested workspace onboarding items", () => {
    const repository = new DemoRepository();
    const agencyBefore = repository.listOnboardingChecklistItems("ws-agency");
    repository.resetWorkspace("ws-fyf", "Test");
    const agencyAfter = repository.listOnboardingChecklistItems("ws-agency");

    expect(agencyAfter.map((i) => i.id).sort()).toEqual(agencyBefore.map((i) => i.id).sort());
  });
});

describe("onboarding checklist in API responses", () => {
  beforeEach(() => {
    resetDemoRepository();
  });

  afterEach(() => {
    resetDemoRepository();
  });

  it("GET /drafts includes onboardingChecklistItems in the response", async () => {
    const response = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as DraftsResponse;

    expect(response.status).toBe(200);
    expect(body.onboardingChecklistItems).toBeDefined();
    expect(Array.isArray(body.onboardingChecklistItems)).toBe(true);
    expect(body.onboardingChecklistItems.length).toBeGreaterThan(0);
  });

  it("GET /drafts onboarding items are workspace-scoped", async () => {
    const fyfResponse = await getDrafts(request("/api/workspaces/ws-fyf/drafts"), params({ workspaceId: "ws-fyf" }));
    const agencyResponse = await getDrafts(request("/api/workspaces/ws-agency/drafts"), params({ workspaceId: "ws-agency" }));
    const fyfBody = (await fyfResponse.json()) as DraftsResponse;
    const agencyBody = (await agencyResponse.json()) as DraftsResponse;

    expect(fyfBody.onboardingChecklistItems.every((i) => i.workspaceId === "ws-fyf")).toBe(true);
    expect(agencyBody.onboardingChecklistItems.every((i) => i.workspaceId === "ws-agency")).toBe(true);
    expect(fyfBody.onboardingChecklistItems).toHaveLength(5);
    expect(agencyBody.onboardingChecklistItems).toHaveLength(5);
  });

  it("GET /health includes onboarding summary with completed count and total", async () => {
    const response = await getHealth(request("/api/workspaces/ws-fyf/health"), params({ workspaceId: "ws-fyf" }));
    const body = (await response.json()) as HealthResponse;

    expect(response.status).toBe(200);
    expect(body.onboarding).toBeDefined();
    expect(body.onboarding.completed).toBe(5);
    expect(body.onboarding.total).toBe(5);
    expect(body.onboarding.items).toHaveLength(5);
    expect(body.onboarding.items.every((i) => i.workspaceId === "ws-fyf")).toBe(true);
  });

  it("GET /health onboarding summary is workspace-scoped", async () => {
    const fyfResponse = await getHealth(request("/api/workspaces/ws-fyf/health"), params({ workspaceId: "ws-fyf" }));
    const agencyResponse = await getHealth(request("/api/workspaces/ws-agency/health"), params({ workspaceId: "ws-agency" }));
    const fyfBody = (await fyfResponse.json()) as HealthResponse;
    const agencyBody = (await agencyResponse.json()) as HealthResponse;

    expect(fyfBody.onboarding.completed).toBe(5);
    expect(fyfBody.onboarding.total).toBe(5);
    expect(agencyBody.onboarding.completed).toBe(2);
    expect(agencyBody.onboarding.total).toBe(5);
    expect(JSON.stringify(fyfBody)).not.toContain("ws-agency");
  });

  it("GET /health for unknown workspace returns 404", async () => {
    const response = await getHealth(request("/api/workspaces/ws-missing/health"), params({ workspaceId: "ws-missing" }));

    expect(response.status).toBe(404);
  });

  it("GET /drafts for unknown workspace returns 404", async () => {
    const response = await getDrafts(request("/api/workspaces/ws-missing/drafts"), params({ workspaceId: "ws-missing" }));

    expect(response.status).toBe(404);
  });
});
