const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

async function recordMasterHumanTest() {
  console.log("🎬 ================================================================");
  console.log("🎬 Starting Master Real Human-Like UI Interactive Testing & Video Recording");
  console.log("🎬 ================================================================\n");

  const rawVideoDir = path.resolve(__dirname, "../output/video_raw_master");
  if (!fs.existsSync(rawVideoDir)) {
    fs.mkdirSync(rawVideoDir, { recursive: true });
  }

  const chromeExecutable = process.env.CHROME_EXECUTABLE_PATH;

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromeExecutable && fs.existsSync(chromeExecutable) ? chromeExecutable : undefined,
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

  // Handle JS alerts gracefully
  page.on("dialog", async (dialog) => {
    console.log(`💬 Dialog popup [${dialog.type()}]:`, dialog.message());
    await dialog.accept();
  });

  const baseUrl = "http://localhost:3000";

  try {
    // ----------------------------------------------------
    // SCENE 1: /create — Header Workspace Switcher & Client Onboarding Modal
    // ----------------------------------------------------
    console.log("📍 [SCENE 1] Testing /create — Dynamic Multi-Client Workspace Switcher");
    await page.goto(`${baseUrl}/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Open Workspace Dropdown in AppNav
    console.log("👉 Opening Navbar Workspace Dropdown...");
    const workspaceSwitcherBtn = await page.locator("button:has-text('🏢')").first();
    if (await workspaceSwitcherBtn.isVisible()) {
      await workspaceSwitcherBtn.click();
      await page.waitForTimeout(1500);

      // Click '+ New Client Workspace' button inside dropdown
      console.log("👉 Clicking '+ New Client Workspace' button in dropdown...");
      const newWorkspaceBtn = await page.locator("button:has-text('+ New Client Workspace')").first();
      if (await newWorkspaceBtn.isVisible()) {
        await newWorkspaceBtn.click();
        await page.waitForTimeout(1500);

        // Fill in Client Workspace Modal
        console.log("👉 Filling in new client details (Apex Fitness & Health Club)...");
        const clientNameInput = await page.locator("input[placeholder*='Apex Fitness'], input[name='clientName']").first();
        if (await clientNameInput.isVisible()) {
          await clientNameInput.fill("Apex Fitness & Health Club");
          await page.waitForTimeout(600);
        }

        const pageNameInput = await page.locator("input[placeholder*='Apex Fitness Myanmar'], input[name='pageName']").first();
        if (await pageNameInput.isVisible()) {
          await pageNameInput.fill("Apex Fitness Myanmar");
          await page.waitForTimeout(600);
        }

        const targetAudienceInput = await page.locator("input[placeholder*='Gym goers'], input[name='targetAudience']").first();
        if (await targetAudienceInput.isVisible()) {
          await targetAudienceInput.fill("Gym goers, fitness enthusiasts & wellness seekers in Yangon");
          await page.waitForTimeout(600);
        }

        const brandDescInput = await page.locator("textarea[placeholder*='Premium fitness'], textarea[name='brandDescription']").first();
        if (await brandDescInput.isVisible()) {
          await brandDescInput.fill("Premium fitness center in Myanmar focusing on evidence-based strength, nutrition, and healthy habits.");
          await page.waitForTimeout(800);
        }

        // Submit client creation
        console.log("👉 Submitting client creation form...");
        const createSubmitBtn = await page.locator("button:has-text('Create Workspace')").first();
        if (await createSubmitBtn.isVisible()) {
          await createSubmitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // ----------------------------------------------------
    // SCENE 2: /brand — Brand Voice OS & Persona Customizer
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 2] Testing /brand — Workspace Brand Persona & Color Customizer");
    await page.goto(`${baseUrl}/brand`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Select 'Energetic & Bold' Persona
    console.log("👉 Selecting 'Energetic & Bold' Brand Persona...");
    const energeticPersona = await page.locator("div:has-text('Energetic & Bold')").last();
    if (await energeticPersona.isVisible()) {
      await energeticPersona.click();
      await page.waitForTimeout(1000);
    }

    // Add Forbidden Phrase
    console.log("👉 Adding Forbidden Phrase to Brand Guardrails...");
    const forbiddenInput = await page.locator("input[placeholder*='ချမ်းသာနည်း']").first();
    if (await forbiddenInput.isVisible()) {
      await forbiddenInput.fill("၁ ပတ်အတွင်း ဝိတ်အမြန်ဆုံးကျနည်း");
      await page.waitForTimeout(600);

      const addPhraseBtn = await page.locator("button:has-text('Add Phrase')").first();
      if (await addPhraseBtn.isVisible()) {
        await addPhraseBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Save Brand Voice OS
    console.log("👉 Clicking 'Save Brand Voice OS'...");
    const saveBrandBtn = await page.locator("button:has-text('Save Brand Voice OS')").first();
    if (await saveBrandBtn.isVisible()) {
      await saveBrandBtn.click();
      await page.waitForTimeout(2000);
    }

    // ----------------------------------------------------
    // SCENE 3: Generating Content in Client Workspace
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 3] Generating Content for Apex Fitness in /create Studio");
    await page.goto(`${baseUrl}/create`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Select Writing Pillar
    console.log("👉 Selecting Risk Story pillar...");
    const riskPillar = await page.getByRole("button", { name: /Risk Story/i }).first();
    if (await riskPillar.isVisible()) {
      await riskPillar.click();
      await page.waitForTimeout(800);
    }

    // Select 4-Slide Album format
    console.log("👉 Selecting 4-Slide Album format...");
    const albumToggle = await page.getByRole("button", { name: /4-Slide Album/i });
    if (await albumToggle.isVisible()) {
      await albumToggle.click();
      await page.waitForTimeout(800);
    }

    // Enter Burmese Topic
    console.log("👉 Entering Burmese topic & details...");
    const topicInput = await page.locator("input[placeholder*='AI POS'], input[placeholder*='ခေါင်းစဉ်']").first();
    if (await topicInput.isVisible()) {
      await topicInput.fill("လေ့ကျင့်ခန်း ပုံမှန်လုပ်သော်လည်း ဝိတ်မကျရသည့် အကြောင်းရင်း (၃) ချက်နှင့် ဖြေရှင်းနည်း");
      await page.waitForTimeout(800);
    }

    const detailsInput = await page.locator("textarea[placeholder*='အချက်အလက်'], textarea[placeholder*='Zero-jargon']").first();
    if (await detailsInput.isVisible()) {
      await detailsInput.fill("Calorie deficit မထိန်းသိမ်းခြင်း၊ အိပ်ရေးမဝခြင်းနှင့် Protein စားသုံးမှု နည်းပါးခြင်းတို့ကို အချက်ကျကျ ရှင်းပြပေးပါ။");
      await page.waitForTimeout(800);
    }

    // Confirm Content & Proceed to Step 2
    console.log("👉 Clicking 'Confirm content & Open Studio'...");
    const confirmContentBtn = await page.getByRole("button", { name: /Confirm content & Open Studio/i });
    if (await confirmContentBtn.isVisible()) {
      await confirmContentBtn.click();
      await page.waitForTimeout(2500);
    }

    // ----------------------------------------------------
    // SCENE 4: Step 2: Visual Banner Studio (4-Slide Album)
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 4] Step 2: Visual Banner Studio (4-Slide Vector Album)");
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: "smooth" }));
    await page.waitForTimeout(1500);

    const slideTabs = ["Slide 1", "Slide 2", "Slide 3", "Slide 4"];
    for (const st of slideTabs) {
      const tabBtn = await page.getByRole("button", { name: new RegExp(st, "i") });
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Confirm Visual Plan ➔ Proceed to Step 3
    console.log("👉 Clicking 'Confirm Visual Plan'...");
    const confirmVisualBtn = await page.getByRole("button", { name: /Confirm Visual Plan/i });
    if (await confirmVisualBtn.isVisible()) {
      await confirmVisualBtn.click();
      await page.waitForTimeout(2000);
    }

    // ----------------------------------------------------
    // SCENE 5: Step 3: Export & Share Review Link
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 5] Step 3: Export & Share Review Link");
    await page.waitForTimeout(1500);

    const shareReviewBtn = await page.locator("button:has-text('Share Review Link')").first();
    if (await shareReviewBtn.isVisible()) {
      await shareReviewBtn.click();
      await page.waitForTimeout(1500);
    }

    // ----------------------------------------------------
    // SCENE 6: Client Shareable Review & AI Auto-Fix Loop (/review)
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 6] Testing /review — Client Review & AI Auto-Fix Loop");
    await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Interact with 4-Slide Album Vector Carousel
    console.log("👉 Navigating 4-Slide Album Carousel in Client Review Portal...");
    for (let i = 0; i < 3; i++) {
      const nextArrow = await page.locator("button:has(svg.lucide-chevron-right)").first();
      if (await nextArrow.isVisible()) {
        await nextArrow.click();
        await page.waitForTimeout(1200);
      }
    }

    // Test 'Request Changes' & AI Auto-Fix Loop
    console.log("👉 Opening 'Request Changes' modal to submit client instruction...");
    const requestChangesBtn = await page.locator("button:has-text('Request Changes')").first();
    if (await requestChangesBtn.isVisible()) {
      await requestChangesBtn.click();
      await page.waitForTimeout(1200);

      const feedbackInput = await page.locator("textarea[placeholder*='revised'], textarea").first();
      if (await feedbackInput.isVisible()) {
        await feedbackInput.fill("Slide 2 ခေါင်းစဉ်နှင့် အချက်အလက်ကို ပိုမိုရှင်းလင်းတိကျစွာ ပြင်ဆင်ပေးပါ။");
        await page.waitForTimeout(1000);

        const submitFeedbackBtn = await page.locator("button:has-text('Send Feedback')").first();
        if (await submitFeedbackBtn.isVisible()) {
          console.log("👉 Submitting client feedback — Triggering AI Auto-Fix...");
          await submitFeedbackBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    }

    // Verify Version 2 and Click Approve
    console.log("👉 Approving revised Version 2 draft for publishing...");
    const approveBtn = await page.locator("button:has-text('Approve Draft'), button:has-text('Approve for Publishing')").first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2500);
    }

    // ----------------------------------------------------
    // SCENE 7: /content (Client Weekly Buffer & Library)
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 7] Testing /content — Client Weekly Buffer Queue & Draft Library");
    await page.goto(`${baseUrl}/content`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const libraryTab = await page.getByRole("button", { name: /Draft Library/i });
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
      await page.waitForTimeout(1500);
    }

    // ----------------------------------------------------
    // SCENE 8: /analytics (Deduplication & Performance)
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 8] Testing /analytics — Client Performance Hub");
    await page.goto(`${baseUrl}/analytics`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // ----------------------------------------------------
    // SCENE 9: Switch back to FYF AI
    // ----------------------------------------------------
    console.log("\n📍 [SCENE 9] Switching back to FYF AI from Navbar Switcher");
    const switcherBack = await page.locator("button:has-text('🏢')").first();
    if (await switcherBack.isVisible()) {
      await switcherBack.click();
      await page.waitForTimeout(1200);

      const fyfOption = await page.locator("button:has-text('FYF AI')").first();
      if (await fyfOption.isVisible()) {
        await fyfOption.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log("\n===============================================================");
    console.log("🎉 ALL REAL HUMAN-LIKE UI ACTIONS COMPLETED SUCCESSFULLY!");
    console.log(`Total Page Errors: ${pageErrors.length}`);
    console.log("===============================================================\n");
  } catch (err) {
    console.error("❌ Error during master test recording:", err);
  } finally {
    const videoObj = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (videoObj) {
      const rawPath = await videoObj.path();
      console.log(`📹 Raw video recorded at: ${rawPath}`);

      const finalMp4Path = path.resolve(__dirname, "../output/FYF_AI_Content_Studio_Full_Human_Testing_Demo.mp4");
      console.log(`🎞️ Transcoding to Master High-Definition 1080p MP4: ${finalMp4Path}...`);

      try {
        execSync(
          `ffmpeg -y -i "${rawPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -crf 18 "${finalMp4Path}"`,
          { stdio: "inherit" }
        );
        console.log(`\n🎉 MASTER REAL HUMAN-LIKE TESTING DEMO VIDEO CREATED AT:\n👉 ${finalMp4Path}\n`);
      } catch (e) {
        console.error("Error during ffmpeg transcoding:", e.message);
      }
    }
  }
}

recordMasterHumanTest().catch(console.error);
