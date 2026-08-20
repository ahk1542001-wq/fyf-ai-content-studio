import { expect, test } from "@playwright/test";

test.describe("Private Operator App smoke", () => {
  test("loads the calm 5-screen operator shell", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await expect(page.getByText("Private operator app")).toBeVisible();
    await expect(page.getByText("Next Action")).toBeVisible();

    for (const item of ["Today", "Create", "Review", "Export", "Settings"]) {
      await expect(page.getByRole("button", { name: item, exact: true })).toBeVisible();
    }

    await expect(page.getByRole("button", { name: "Pipeline" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Analytics" })).toHaveCount(0);

    const rootMetrics = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasBurmese: /[\u1000-\u109F]/.test(document.body.innerText)
    }));
    expect(rootMetrics.scrollWidth).toBeLessThanOrEqual(rootMetrics.width + 1);
    expect(rootMetrics.hasBurmese).toBe(true);
  });

  test("shows a useful auth message for expired Supabase email links", async ({ page }) => {
    await page.goto("/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");

    await expect(page.getByRole("heading", { name: "Invite link expired" })).toBeVisible();
    await expect(page.getByText("Email link is invalid or has expired")).toBeVisible();
    await expect(page.getByText("Ask Codex to resend a fresh Supabase invite")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("keeps customization first-class when creating a Burmese draft", async ({ page }) => {
    const capturedPayloads: unknown[] = [];
    await page.route("**/api/workspaces/*/drafts", async (route) => {
      if (route.request().method() === "POST") {
        capturedPayloads.push(route.request().postDataJSON());
      }
      await route.continue();
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const topic = `Private operator customization ${Date.now()}`;
    await page.getByLabel("Topic / Idea").fill(topic);
    await page.getByLabel("Tone").selectOption("Professional");
    await page.getByLabel("Length").selectOption("Short");
    await page.getByLabel("Angle").selectOption("Workflow explanation");
    await page.getByLabel("Audience").selectOption("AI learners");
    await page.getByLabel("CTA").selectOption("Inbox for checklist");
    await page.getByRole("button", { name: "Generate Burmese Draft" }).click();

    await expect(page.getByRole("heading", { name: "Review workspace" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel("AI Generated Draft (Burmese)")).toHaveValue(/[\u1000-\u109F]/, { timeout: 15000 });
    await expect(page.locator(".operator-draft-card").filter({ hasText: topic }).first()).toBeVisible();
    await expect.poll(() => capturedPayloads.length).toBeGreaterThan(0);
    expect(capturedPayloads.at(-1)).toMatchObject({
      topic,
      tone: "Professional",
      length: "Short",
      angle: "Workflow explanation",
      audience: "AI learners",
      cta: "Inbox for checklist"
    });
  });

  test("supports review customization, Risk Guard, approval, and manual export", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Review", exact: true }).click();

    const editor = page.getByLabel("AI Generated Draft (Burmese)");
    await expect(editor).toBeVisible();
    await expect(page.getByRole("heading", { name: "Risk Guard", exact: true })).toBeVisible();

    await editor.fill("ဒီ strategy က အမြတ် အာမခံ ရပါတယ်။ အခုချက်ချင်း join လုပ်ပါ။");
    await expect(page.locator(".risk-summary").getByText("Blocked", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeDisabled();

    await page.getByRole("button", { name: "Safer rewrite" }).click();
    await expect(editor).toHaveValue(/ရလဒ်ကို အာမခံလို့မရပါ/, { timeout: 15000 });
    await page.getByRole("button", { name: "Approve", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Export workspace" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Copy for Facebook" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Mark Manually Posted" })).toBeEnabled();
    await page.getByPlaceholder("Manual post link or note").fill("facebook-manual-smoke");
    await page.getByRole("button", { name: "Mark Manually Posted" }).click();
    await expect(page.getByText("Marked manually posted. No Facebook API call was made.")).toBeVisible({ timeout: 15000 });
  });

  test("keeps settings focused on private access, integrations, and backup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Private access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "API integrations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "SQLite backup/export" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Setup checklist" })).toBeVisible();
    await expect(page.getByText("Secrets stay server-side in .env.local")).toBeVisible();
  });

  test("keeps workspace data scoped in the simplified UI", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("combobox", { name: "Workspace" }).selectOption("ws-agency");
    await page.getByRole("button", { name: "Review", exact: true }).click();

    await expect(page.getByText("Star Digital · Burmese")).toBeVisible();
    await expect(page.locator(".operator-draft-card").filter({ hasText: "Client campaign recap" })).toBeVisible();
    await expect(page.locator(".operator-draft-card").filter({ hasText: "AI Agent workflow planning for beginners" })).toHaveCount(0);

    await page.getByRole("combobox", { name: "Workspace" }).selectOption("ws-fyf");
    await expect(page.getByText("FYF AI · Burmese")).toBeVisible();
    await expect(page.locator(".operator-draft-card").filter({ hasText: "Client campaign recap" })).toHaveCount(0);
    await expect(page.locator(".operator-draft-card").filter({ hasText: "AI Agent workflow planning for beginners" }).first()).toBeVisible();
  });
});
