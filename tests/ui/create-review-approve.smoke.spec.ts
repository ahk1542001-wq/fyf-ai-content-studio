import { expect, test } from "@playwright/test";

test.describe("FYF create approval stages", () => {
  test("completes draft generation and visual approval without a fallback stage", async ({ page }) => {
    await page.goto("/create");

    await page.getByRole("textbox", { name: "Topic Headline (ခေါင်းစဉ်)", exact: true }).fill(
      "လက်တွေ့ပစ္စည်း ၁၂ ခုရှိပေမယ့် စနစ်ထဲမှာ ၂ ခုလို့ပဲ ပြနေတဲ့အခါ လူက ဘာကို စစ်ဆေးသင့်သလဲ။"
    );
    await page.getByRole("button", { name: "Generate draft", exact: true }).click();

    await expect(page.getByText("AI fallback used", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Draft preview", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm content & Open Studio", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Confirm content & Open Studio", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Visual Banner Studio", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Confirm Visual Plan", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Manual Export & Publish Gate", exact: true })).toBeVisible();
  });

  test("blocks the workflow when draft generation fails instead of approving a local fallback", async ({ page }) => {
    await page.route("**/api/workspaces/*/drafts", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "Draft service unavailable" })
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/create");
    await page.getByRole("textbox", { name: "Topic Headline (ခေါင်းစဉ်)", exact: true }).fill("Backend failure test");
    await page.getByRole("button", { name: "Generate draft", exact: true }).click();

    await expect(page.getByLabel("AI process status").getByText("Generation blocked", { exact: true })).toBeVisible();
    await expect(page.getByText(/Draft generation failed/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm content & Open Studio", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Visual Banner Studio", exact: true })).toHaveCount(0);
    await expect(page.getByText("Local fallback draft", { exact: true })).toHaveCount(0);
  });

  test("shows a review load error instead of treating a backend failure as an empty draft", async ({ page }) => {
    await page.route("**/api/workspaces/*/drafts/draft-risk", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Draft service unavailable" })
      });
    });
    await page.goto("/review?workspaceId=ws-fyf&draftId=draft-risk");

    await expect(page.getByRole("heading", { name: "Could not load draft", exact: true })).toBeVisible();
    await expect(page.getByText("No Draft Found", { exact: true })).toHaveCount(0);
  });

  test("marks unavailable topic recommendations as degraded instead of silently presenting stale suggestions", async ({ page }) => {
    await page.route("**/api/workspaces/*/analytics/recommendations", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Recommendation service unavailable" })
      });
    });
    await page.goto("/create");

    await expect(page.getByText(/Recommendation service unavailable/)).toBeVisible();
    await expect(page.getByText(/You can still enter a topic manually/)).toBeVisible();
  });
});
