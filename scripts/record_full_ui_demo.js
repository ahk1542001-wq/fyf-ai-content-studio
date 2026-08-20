const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

async function recordFullDemo() {
  console.log("🎬 Starting FYF AI Content Studio Full UI Demo Recording...");

  const rawVideoDir = path.resolve(__dirname, "../output/video_raw");
  if (!fs.existsSync(rawVideoDir)) {
    fs.mkdirSync(rawVideoDir, { recursive: true });
  }

  const chromeExecutable = "/Users/mac/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromeExecutable) ? chromeExecutable : undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  const baseUrl = "http://localhost:3000";

  try {
    // ----------------------------------------------------
    // SCENE 1: Weekly Buffer Queue & 4-Pillar Content Planner (/content)
    // ----------------------------------------------------
    console.log("📍 Scene 1: Weekly Buffer Queue & 4-Pillar Content Planner (/content)");
    await page.goto(`${baseUrl}/content`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Smooth scroll down to view 4 slots
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await page.waitForTimeout(2000);

    // Click Generate Sunday Executive Summary button
    console.log("⚡ Generating Sunday Weekly Executive Summary...");
    const summaryBtn = await page.getByRole("button", { name: /Generate Sunday Executive Summary/i });
    if (await summaryBtn.isVisible()) {
      await summaryBtn.click();
      await page.waitForTimeout(3000);
    }

    // Scroll up to view updated health score
    await page.evaluate(() => window.scrollBy({ top: -300, behavior: "smooth" }));
    await page.waitForTimeout(2000);

    // Switch to Draft Library tab
    console.log("📑 Viewing Draft Library...");
    const libraryTab = await page.getByRole("button", { name: /Draft Library/i });
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
      await page.waitForTimeout(1500);

      // Click filter chips
      const approvedFilter = await page.getByRole("button", { name: /Approved/i });
      if (await approvedFilter.isVisible()) {
        await approvedFilter.click();
        await page.waitForTimeout(1500);
      }

      const allFilter = await page.getByRole("button", { name: /All/i }).first();
      if (await allFilter.isVisible()) {
        await allFilter.click();
        await page.waitForTimeout(1500);
      }
    }

    // ----------------------------------------------------
    // SCENE 2: Autonomous AI Content Studio (/create)
    // ----------------------------------------------------
    console.log("📍 Scene 2: Autonomous AI Content Studio (/create)");
    await page.goto(`${baseUrl}/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Test 4-Pillars Writing Styles Bar
    console.log("🛡️ Testing 4-Pillar Writing Styles...");
    const riskPillar = await page.getByRole("button", { name: /Risk Story/i }).first();
    if (await riskPillar.isVisible()) {
      await riskPillar.click();
      await page.waitForTimeout(1200);
    }

    const workflowPillar = await page.getByRole("button", { name: /Workflow Breakdown/i }).first();
    if (await workflowPillar.isVisible()) {
      await workflowPillar.click();
      await page.waitForTimeout(1200);
    }

    const realityPillar = await page.getByRole("button", { name: /AI Reality vs Hype/i }).first();
    if (await realityPillar.isVisible()) {
      await realityPillar.click();
      await page.waitForTimeout(1200);
    }

    // Test 1-Click Topic Suggestion Card
    console.log("💡 Testing 1-Click Topic Suggestion...");
    const topicCards = await page.locator("button:has-text('Pillar'), button:has-text('POS'), button:has-text('Slip')").all();
    if (topicCards.length > 0) {
      await topicCards[0].click();
      await page.waitForTimeout(1500);
    }

    // Test Visual Format Selector Toggle
    console.log("📱 Testing Visual Format Selector Toggle...");
    const albumToggle = await page.getByRole("button", { name: /4-Slide Album/i });
    if (await albumToggle.isVisible()) {
      await albumToggle.click();
      await page.waitForTimeout(1500);
    }

    // Test Interactive Co-pilot Chat Drawer
    console.log("💬 Opening Interactive Co-pilot Chat Drawer...");
    const copilotBtn = await page.getByRole("button", { name: /FYF Content Co-pilot/i });
    if (await copilotBtn.isVisible()) {
      await copilotBtn.click();
      await page.waitForTimeout(2000);

      // Click quick prompt chip
      const brainstormChip = await page.getByRole("button", { name: /Brainstorm 3 Ideas/i });
      if (await brainstormChip.isVisible()) {
        await brainstormChip.click();
        await page.waitForTimeout(3000);
      }

      // Click Use in Studio & Draft
      const useDraftBtn = await page.getByRole("button", { name: /Use in Studio & Draft/i }).first();
      if (await useDraftBtn.isVisible()) {
        await useDraftBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // ----------------------------------------------------
    // SCENE 3: BannerStudio Multi-Template Vector Generator
    // ----------------------------------------------------
    console.log("📍 Scene 3: BannerStudio Multi-Template Vector Generator");
    const nextStep2Btn = await page.getByRole("button", { name: /Graphic Design/i });
    if (await nextStep2Btn.isVisible()) {
      await nextStep2Btn.click();
      await page.waitForTimeout(2500);

      // Scroll down to see vector canvas
      await page.evaluate(() => window.scrollBy({ top: 200, behavior: "smooth" }));
      await page.waitForTimeout(2000);

      // Test multi-slide tab buttons in Album Carousel
      const slide2Tab = await page.getByRole("button", { name: /Slide 2/i });
      if (await slide2Tab.isVisible()) {
        await slide2Tab.click();
        await page.waitForTimeout(1500);
      }

      const slide3Tab = await page.getByRole("button", { name: /Slide 3/i });
      if (await slide3Tab.isVisible()) {
        await slide3Tab.click();
        await page.waitForTimeout(1500);
      }

      const slide4Tab = await page.getByRole("button", { name: /Slide 4/i });
      if (await slide4Tab.isVisible()) {
        await slide4Tab.click();
        await page.waitForTimeout(1500);
      }
    }

    // ----------------------------------------------------
    // SCENE 4: Export & Human Approval Gate
    // ----------------------------------------------------
    console.log("📍 Scene 4: Export & Human Approval Gate");
    const nextStep3Btn = await page.getByRole("button", { name: /Export & Review/i });
    if (await nextStep3Btn.isVisible()) {
      await nextStep3Btn.click();
      await page.waitForTimeout(2500);

      // Show slide preview tabs
      const exportSlideTabs = await page.locator("button:has-text('Slide 1'), button:has-text('Slide 2'), button:has-text('Slide 3'), button:has-text('Slide 4')").all();
      for (const tab of exportSlideTabs.slice(0, 4)) {
        await tab.click();
        await page.waitForTimeout(1200);
      }

      // Copy Caption button
      const copyBtn = await page.getByRole("button", { name: /Copy caption/i });
      if (await copyBtn.isVisible()) {
        await copyBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // ----------------------------------------------------
    // SCENE 5: Real Performance Hub (/analytics)
    // ----------------------------------------------------
    console.log("📍 Scene 5: Real Performance Hub (/analytics)");
    await page.goto(`${baseUrl}/analytics`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Scroll to view intake form and AI insights
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: "smooth" }));
    await page.waitForTimeout(2500);

    // ----------------------------------------------------
    // SCENE 6: Brand Foundation & Voice OS (/brand)
    // ----------------------------------------------------
    console.log("📍 Scene 6: Brand Foundation & Voice OS (/brand)");
    await page.goto(`${baseUrl}/brand`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Return to Content Planner as grand finale
    await page.goto(`${baseUrl}/content`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    console.log("✅ All UI Scenes Successfully Navigated and Recorded!");
  } catch (err) {
    console.error("❌ Error during demo recording:", err);
  } finally {
    const videoObj = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (videoObj) {
      const rawPath = await videoObj.path();
      console.log(`📹 Raw video saved at: ${rawPath}`);

      const finalMp4Path = path.resolve(__dirname, "../output/FYF_AI_Content_Studio_Full_UI_Demo.mp4");
      console.log(`🎞️ Transcoding to high-definition 1080p MP4: ${finalMp4Path}...`);

      try {
        execSync(
          `ffmpeg -y -i "${rawPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -crf 18 "${finalMp4Path}"`,
          { stdio: "inherit" }
        );
        console.log(`🎉 Master Full UI Demo Video successfully created at:\n👉 ${finalMp4Path}`);
      } catch (e) {
        console.error("Error during ffmpeg transcoding:", e.message);
      }
    }
  }
}

recordFullDemo().catch(console.error);
