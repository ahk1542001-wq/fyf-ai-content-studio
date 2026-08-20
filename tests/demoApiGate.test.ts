import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDemoApiEnabled, isDemoApiPath } from "../backend/demoApiGate";
import { proxy } from "../proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demo API gate", () => {
  it("matches only the workspaces namespace", () => {
    expect(isDemoApiPath("/api/workspaces")).toBe(true);
    expect(isDemoApiPath("/api/workspaces/abc/drafts")).toBe(true);
    expect(isDemoApiPath("/api/workspaceship")).toBe(false);
    expect(isDemoApiPath("/api/generate")).toBe(false);
  });

  it("allows local development and tests", () => {
    expect(isDemoApiEnabled({ nodeEnv: "development", flag: "false" })).toBe(true);
    expect(isDemoApiEnabled({ nodeEnv: "test", flag: undefined })).toBe(true);
  });

  it("denies production unless explicitly enabled", () => {
    expect(isDemoApiEnabled({ nodeEnv: "production", flag: undefined })).toBe(false);
    expect(isDemoApiEnabled({ nodeEnv: "production", flag: "false" })).toBe(false);
    expect(isDemoApiEnabled({ nodeEnv: "production", flag: "true" })).toBe(true);
  });

  it("returns a non-disclosing 404 for the demo namespace in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FYF_DEMO_API_ENABLED", "false");

    const response = proxy(new NextRequest("http://localhost/api/workspaces/ws-fyf"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "demo_api_disabled",
        message: "Demo API disabled in production",
      },
    });
  });

  it("does not block authenticated route namespaces", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FYF_DEMO_API_ENABLED", "false");

    const response = proxy(new NextRequest("http://localhost/api/generate"));
    expect(response.status).toBe(200);
  });
});
