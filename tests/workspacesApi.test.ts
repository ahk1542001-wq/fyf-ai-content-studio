import { describe, expect, it } from "vitest";
import { DemoRepository } from "@/backend/demoRepository";
import { GET, POST } from "@/app/api/workspaces/route";

describe("Workspaces API & Repository (Phase 2 Agency Mode)", () => {
  it("lists existing workspaces including default ws-fyf", () => {
    const repository = new DemoRepository();
    const workspaces = repository.listWorkspaces();
    expect(workspaces.length).toBeGreaterThanOrEqual(1);
    expect(workspaces.some((w) => w.id === "ws-fyf")).toBe(true);
  });

  it("creates a new custom client workspace with associated brand profile", () => {
    const repository = new DemoRepository();
    const result = repository.createWorkspace({
      name: "Acme Retail Store",
      pageName: "Acme Retail Myanmar",
      industry: "Retail & Apparel",
      targetAudience: "Fashion conscious youth in Yangon",
      brandDescription: "Modern trendy fashion brand",
      riskSensitivity: "standard"
    });

    expect(result.workspace.id).toContain("ws-acme-retail-store");
    expect(result.workspace.name).toBe("Acme Retail Store");
    expect(result.workspace.pageName).toBe("Acme Retail Myanmar");
    expect(result.brandProfile.description).toContain("fashion brand");

    // Verify workspace is in listing
    const workspaces = repository.listWorkspaces();
    expect(workspaces.some((w) => w.id === result.workspace.id)).toBe(true);
  });

  it("handles GET /api/workspaces via route handler", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.workspaces).toBeDefined();
    expect(Array.isArray(data.workspaces)).toBe(true);
  });

  it("handles POST /api/workspaces to create a new client via route handler", async () => {
    const req = new Request("http://localhost:3000/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Zenith Real Estate",
        pageName: "Zenith Properties",
        industry: "Real Estate",
        targetAudience: "Condo buyers and investors",
        brandDescription: "High-end luxury property development"
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.workspace.name).toBe("Zenith Real Estate");
    expect(data.brandProfile.workspaceId).toBe(data.workspace.id);
  });
});
