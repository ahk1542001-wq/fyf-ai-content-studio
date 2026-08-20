import { expect, test } from "@playwright/test";

test.describe("Private MVP setup smoke", () => {
  test("shows setup checklist inside Settings instead of a busy dashboard sidebar", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".operator-private-card")).toContainText("owner access");
    await page.getByRole("button", { name: "Settings", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Setup checklist" })).toBeVisible();
    await expect(page.getByText("5 / 5 done")).toBeVisible();
    await expect(page.getByText("Create workspace")).toBeVisible();
    await expect(page.getByText("Load Sheets style memory")).toBeVisible();
  });

  test("keeps checklist and draft data workspace scoped", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByText("5 / 5 done")).toBeVisible();

    await page.getByRole("combobox", { name: "Workspace" }).selectOption("ws-agency");
    await expect(page.getByText("2 / 5 done")).toBeVisible();
    await expect(page.getByText("5 / 5 done")).toHaveCount(0);
  });
});
