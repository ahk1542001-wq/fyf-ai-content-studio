import { describe, expect, it } from "vitest";
import { routeError } from "../backend/apiResponse";

describe("API error responses", () => {
  it("does not expose internal error details", async () => {
    const response = routeError(new Error("/private/database.sqlite provider token"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "internal_error",
        message: "Internal server error",
      },
    });
  });
});
