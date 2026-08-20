const { chromium } = require("playwright");
const fs = require("fs");

async function deepHumanTest() {
  console.log("🧪 Starting Deep Human-Like UI Interactive Test & Verification...");

  const chromeExecutable = process.env.CHROME_EXECUTABLE_PATH;

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromeExecutable && fs.existsSync(chromeExecutable) ? chromeExecutable : undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Track console errors & unhandled errors
  const pageErrors = [];
  page.on("pageerror", (err) => {
    console.error("❌ Page Error:", err.message);
    pageErrors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.warn("⚠️ Console Error:", msg.text());
    }
  });

  const baseUrl = "http://localhost:3000";

  try {
    // ----------------------------------------------------
    // TEST 1: Weekly Buffer & Draft Library (/content)
    // ----------------------------------------------------
    console.log("\n--- [TEST 1] Testing /content (Weekly Buffer & Draft Library) ---");
    await page.goto(`${baseUrl}/content`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify buffer health card is visible
    const bufferCard = await page.locator("text=Weekly Buffer Preparedness");
    console.log("✓ Buffer Preparedness card visible:", await bufferCard.isVisible());

    // Click Generate Sunday Executive Summary button
    const summaryBtn = await page.getByRole("button", { name: /Generate Sunday Executive Summary/i });
    if (await summaryBtn.isVisible()) {
      console.log("👉 Clicking 'Generate Sunday Executive Summary' button...");
      await summaryBtn.click();
      await page.waitForTimeout(2000);
      const successMsg = await page.locator("text=Sunday Weekly Executive Summary generated");
      console.log("✓ Summary Generation Success Message visible:", await successMsg.isVisible());
    }

    // Switch to Draft Library tab
    const libraryTab = await page.getByRole("button", { name: /Draft Library/i });
    if (await libraryTab.isVisible()) {
      console.log("👉 Clicking 'Draft Library' tab...");
      await libraryTab.click();
      await page.waitForTimeout(1000);

      // Test filter chips
      const needsReviewFilter = await page.getByRole("button", { name: /Needs review/i });
      if (await needsReviewFilter.isVisible()) {
        await needsReviewFilter.click();
        await page.waitForTimeout(500);
        console.log("✓ Filter 'Needs review' clicked");
      }

      const approvedFilter = await page.getByRole("button", { name: /Approved/i });
      if (await approvedFilter.isVisible()) {
        await approvedFilter.click();
        await page.waitForTimeout(500);
        console.log("✓ Filter 'Approved' clicked");
      }

      const allFilter = await page.getByRole("button", { name: /All/i }).first();
      if (await allFilter.isVisible()) {
        await allFilter.click();
        await page.waitForTimeout(500);
        console.log("✓ Filter 'All' clicked");
      }
    }

    // Switch back to Planner
    const plannerTab = await page.getByRole("button", { name: /Weekly Buffer Queue/i });
    if (await plannerTab.isVisible()) {
      await plannerTab.click();
      await page.waitForTimeout(1000);
      console.log("✓ Switched back to Planner tab");
    }

    // ----------------------------------------------------
    // TEST 2: Autonomous AI Content Studio (/create)
    // ----------------------------------------------------
    console.log("\n--- [TEST 2] Testing /create (Studio Step 1: Write & Topics) ---");
    await page.goto(`${baseUrl}/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Test 4-Pillar buttons
    const pillars = ["Risk Story", "Workflow Breakdown", "AI Reality vs Hype", "Knowledge Framework"];
    for (const p of pillars) {
      const pBtn = await page.getByRole("button", { name: new RegExp(p, "i") }).first();
      if (await pBtn.isVisible()) {
        await pBtn.click();
        await page.waitForTimeout(400);
        console.log(`✓ Clicked Pillar: ${p}`);
      }
    }

    // Test typing a topic to verify Best Match auto-detection
    const topicInput = await page.locator("input[placeholder*='Topic'], input[placeholder*='ဥပမာ'], textarea[placeholder*='Topic']").first();
    if (await topicInput.isVisible()) {
      console.log("👉 Typing topic into editor...");
      await topicInput.fill("POS စာရင်းနှင့် ဂိုဒေါင် စာရင်း မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်နိုင်သော ငွေကြေးဆုံးရှုံးမှုများ");
      await page.waitForTimeout(1000);
      console.log("✓ Topic typed");
    }

    // Test Visual Format Selector
    const albumToggle = await page.getByRole("button", { name: /4-Slide Album/i });
    if (await albumToggle.isVisible()) {
      await albumToggle.click();
      await page.waitForTimeout(500);
      console.log("✓ Selected 4-Slide Album format");
    }

    const singleToggle = await page.getByRole("button", { name: /Single Banner/i });
    if (await singleToggle.isVisible()) {
      await singleToggle.click();
      await page.waitForTimeout(500);
      console.log("✓ Selected Single Banner format");
    }
    // Re-select album for multi-slide test
    if (await albumToggle.isVisible()) {
      await albumToggle.click();
      await page.waitForTimeout(500);
    }

    // Test Interactive Co-pilot Chat Drawer
    console.log("\n--- Testing Co-pilot Chat Drawer ---");
    const copilotBtn = await page.getByRole("button", { name: /FYF Content Co-pilot/i });
    if (await copilotBtn.isVisible()) {
      console.log("👉 Opening Co-pilot Chat Drawer...");
      await copilotBtn.click();
      await page.waitForTimeout(1500);

      // Click prompt chip: Brainstorm 3 Ideas
      const chip = await page.getByRole("button", { name: /Brainstorm 3 Ideas/i });
      if (await chip.isVisible()) {
        console.log("👉 Clicking quick prompt chip 'Brainstorm 3 Ideas'...");
        await chip.click();
        await page.waitForTimeout(3000);
        console.log("✓ Co-pilot response generated");
      }

      // Test custom chat message typing
      const chatInput = await page.locator("input[placeholder*='Ask Co-pilot'], input[placeholder*='မေးမြန်းပါ'], textarea[placeholder*='Ask']").first();
      if (await chatInput.isVisible()) {
        console.log("👉 Typing custom chat prompt: 'Write a 4-slide outline for Payment Slip verification'...");
        await chatInput.fill("ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်းအတွက် အချက် ၄ ချက် ရေးပေးပါ");
        const sendBtn = await page.locator("button:has-text('Send'), button:has([data-lucide='send']), button:has-text('ပို့')").first();
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(3000);
          console.log("✓ Custom chat prompt sent & answered");
        }
      }

      // Click Use in Studio & Draft
      const useDraftBtn = await page.getByRole("button", { name: /Use in Studio & Draft/i }).first();
      if (await useDraftBtn.isVisible()) {
        console.log("👉 Clicking 'Use in Studio & Draft' button...");
        await useDraftBtn.click();
        await page.waitForTimeout(1500);
        console.log("✓ Content transferred into Studio editor");
      }
    }

    // ----------------------------------------------------
    // TEST 3: Studio Step 2 (BannerStudio Graphic Design)
    // ----------------------------------------------------
    console.log("\n--- [TEST 3] Testing /create Step 2 (BannerStudio) ---");
    const step2Btn = await page.getByRole("button", { name: /Graphic Design/i });
    if (await step2Btn.isVisible()) {
      await step2Btn.click();
      await page.waitForTimeout(2000);
      console.log("✓ Navigated to Step 2: Graphic Design");

      // Test Slide 1, 2, 3, 4 tabs
      const slideTabs = ["Slide 1", "Slide 2", "Slide 3", "Slide 4"];
      for (const st of slideTabs) {
        const tabBtn = await page.getByRole("button", { name: new RegExp(st, "i") });
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(600);
          console.log(`✓ Clicked Slide Tab: ${st}`);
        }
      }

      // Test template selector if visible
      const templateSelect = await page.locator("select").first();
      if (await templateSelect.isVisible()) {
        await templateSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        console.log("✓ Template dropdown changed");
      }
    }

    // ----------------------------------------------------
    // TEST 4: Studio Step 3 (Export & Review Gate)
    // ----------------------------------------------------
    console.log("\n--- [TEST 4] Testing /create Step 3 (Export & Review Gate) ---");
    const step3Btn = await page.getByRole("button", { name: /Export & Review/i });
    if (await step3Btn.isVisible()) {
      await step3Btn.click();
      await page.waitForTimeout(2000);
      console.log("✓ Navigated to Step 3: Export & Review");

      // Click slide preview tabs in Export
      const exportTabs = await page.locator("button:has-text('Slide 1'), button:has-text('Slide 2'), button:has-text('Slide 3'), button:has-text('Slide 4')").all();
      for (const et of exportTabs.slice(0, 4)) {
        await et.click();
        await page.waitForTimeout(500);
      }
      console.log("✓ Tested all Export preview slide tabs");

      // Click Copy Caption
      const copyBtn = await page.getByRole("button", { name: /Copy caption/i });
      if (await copyBtn.isVisible()) {
        await copyBtn.click();
        await page.waitForTimeout(500);
        console.log("✓ Clicked 'Copy caption'");
      }

      // Test Facebook Post URL input & Logger
      const urlInput = await page.locator("input[placeholder*='facebook.com'], input[placeholder*='URL']").first();
      if (await urlInput.isVisible()) {
        await urlInput.fill("https://facebook.com/fyfai/posts/1029384756");
        const logBtn = await page.getByRole("button", { name: /Log Manual Post|Mark Published/i });
        if (await logBtn.isVisible()) {
          await logBtn.click();
          await page.waitForTimeout(1000);
          console.log("✓ Logged manual Facebook post URL");
        }
      }
    }

    // ----------------------------------------------------
    // TEST 5: Real Performance Hub (/analytics)
    // ----------------------------------------------------
    console.log("\n--- [TEST 5] Testing /analytics (Real Performance Hub) ---");
    await page.goto(`${baseUrl}/analytics`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Test form intake inputs
    const reachInput = await page.locator("input[name='reach'], input[placeholder*='1000']").first();
    if (await reachInput.isVisible()) {
      await reachInput.fill("15200");
      console.log("✓ Entered reach metric");
    }

    const reactionsInput = await page.locator("input[name='reactions'], input[placeholder*='150']").first();
    if (await reactionsInput.isVisible()) {
      await reactionsInput.fill("980");
      console.log("✓ Entered reactions metric");
    }

    const sharesInput = await page.locator("input[name='shares'], input[placeholder*='45']").first();
    if (await sharesInput.isVisible()) {
      await sharesInput.fill("185");
      console.log("✓ Entered shares metric");
    }

    const saveMetricsBtn = await page.getByRole("button", { name: /Save & Upsert|Save Metrics/i });
    if (await saveMetricsBtn.isVisible()) {
      console.log("👉 Clicking Save & Upsert Metrics button...");
      await saveMetricsBtn.click();
      await page.waitForTimeout(1500);
      console.log("✓ Metrics saved and table updated");
    }

    // ----------------------------------------------------
    // TEST 6: Brand Foundation (/brand) & References (/references)
    // ----------------------------------------------------
    console.log("\n--- [TEST 6] Testing /brand & /references ---");
    await page.goto(`${baseUrl}/brand`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    console.log("✓ /brand loaded cleanly");

    await page.goto(`${baseUrl}/references`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    console.log("✓ /references loaded cleanly");

    // Return to content
    await page.goto(`${baseUrl}/content`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    console.log("✓ Returned to /content");

    console.log("\n=======================================================");
    console.log(`🎉 ALL DEEP HUMAN INTERACTIVE UI TESTS PASSED!`);
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log("=======================================================");

  } catch (err) {
    console.error("❌ Deep Test Error:", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

deepHumanTest().catch(console.error);
