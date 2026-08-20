import { expect, test } from "@playwright/test";

test.describe("FYF Studio route smoke", () => {
  test("root enters the current Create Studio workflow", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/create$/);
    await expect(page.getByRole("heading", { name: "Create & Studio", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Write first draft", exact: true })).toBeVisible();
    await expect(page.getByLabel("Create workflow")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Topic Headline (ခေါင်းစဉ်)", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate draft", exact: true })).toBeVisible();
  });

  test("each primary workspace route exposes its current product surface", async ({ page }) => {
    const routes = [
      { path: "/create", heading: "Create & Studio" },
      { path: "/content", heading: "Content & Weekly Planner" },
      { path: "/brand", heading: "Brand Voice & Identity Customizer" },
      { path: "/analytics", heading: "Real Performance Hub" },
      { path: "/references", heading: "References" },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading, exact: true })).toBeVisible();
    }
  });
});
