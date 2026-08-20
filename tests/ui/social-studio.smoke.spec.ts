import { expect, test } from "@playwright/test";

test.describe("FYF Studio navigation and responsive surface", () => {
  test("exposes the five primary workspaces from the shared navigation", async ({ page }) => {
    await page.goto("/create");

    const navigation = page.getByRole("navigation");
    for (const label of ["Create Studio", "Drafts & Posts", "Performance Hub", "Reference Vault", "Brand Identity"]) {
      await expect(navigation.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    await expect(page.getByRole("link", { name: /FYF AI AGENCY V2\.0/ })).toBeVisible();
    await expect(page.getByText("Understand AI. Build Real Systems.", { exact: true })).toBeVisible();
  });

  test("keeps the current studio usable on a narrow viewport", async ({ page }) => {
    await page.goto("/create");

    const metrics = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasBurmese: /[\u1000-\u109F]/.test(document.body.innerText),
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
    expect(metrics.hasBurmese).toBe(true);
  });

  test("does not turn a missing review draft into an empty success state", async ({ page }) => {
    await page.goto("/review?workspaceId=ws-fyf&draftId=missing");

    await expect(page.getByRole("heading", { name: "No Draft Found", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Go to Studio", exact: true })).toBeVisible();
  });
});
