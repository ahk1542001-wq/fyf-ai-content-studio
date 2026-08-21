import { describe, expect, it } from "vitest";
import config from "../playwright.config";

describe("Playwright verification isolation", () => {
  it("uses a dedicated memory-backed server instead of the operator database", () => {
    expect(config.use?.baseURL).toBe("http://127.0.0.1:3100");
    expect(config.webServer).toMatchObject({
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false
    });
    expect((config.webServer as { command?: string }).command).toContain("FYF_DEMO_PERSISTENCE=memory");
    expect((config.webServer as { command?: string }).command).toContain("--port 3100");
  });
});
