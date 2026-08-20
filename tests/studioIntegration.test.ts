import { describe, it, expect, beforeEach } from "vitest";
import {
  generateBannerFromDraft,
  renderBannerSvg,
  renderPhotoEditorialSplitSvg,
  renderAiNewsAnalysisSvg,
  createDefaultBannerProps,
} from "../src/domain/banner";
import { svgStringToDataUrl } from "../frontend/utils/bannerExport";
import { BRAND_COLORS } from "../frontend/styles/brandTokens";
import { DemoRepository, createDemoState } from "../backend/demoRepository";
import { generateTopicRecommendations } from "../backend/topicEngine";
import type {
  BannerTemplateFamily,
  DraftContentForBanner,
  SystemRiskStoryProps,
  KnowledgeFrameworkProps,
  PhotoEditorialSplitProps,
  AiNewsAnalysisProps,
} from "../src/domain/banner/types";

describe("Milestone M4: Studio UI Integration & Graphic Experience Test Suite", () => {
  let repository: DemoRepository;

  beforeEach(() => {
    repository = new DemoRepository(createDemoState());
  });

  describe("1. Topic Recommendations & Draft Prefill Mapping", () => {
    it("generates data-driven topic recommendations from repository insights", () => {
      const recommendations = generateTopicRecommendations("ws-fyf", repository);
      expect(recommendations.length).toBeGreaterThanOrEqual(4);

      // Verify all items have complete prefill metadata
      for (const rec of recommendations) {
        expect(rec.id).toBeTruthy();
        expect(rec.topic).toBeTruthy();
        expect(rec.topicBurmese).toBeTruthy();
        expect(rec.angle).toBeTruthy();
        expect(rec.tone).toBeTruthy();
        expect(rec.targetAudience).toBeTruthy();
        expect(rec.performanceRationale).toBeTruthy();
        expect(rec.suggestedCta).toBeTruthy();
        expect(rec.suggestedVisualFamily).toBeDefined();
      }
    });

    it("maps recommendation suggestedVisualFamily keys to domain BannerTemplateFamily correctly", () => {
      function mapFamily(suggested?: string): BannerTemplateFamily {
        switch (suggested) {
          case "system_story":
          case "system_risk_story":
            return "system_risk_story";
          case "framework_mascot":
          case "knowledge_framework":
            return "knowledge_framework";
          case "editorial_split":
          case "photo_editorial_split":
            return "photo_editorial_split";
          case "fact_analysis":
          case "ai_news_analysis":
            return "ai_news_analysis";
          default:
            return "system_risk_story";
        }
      }

      expect(mapFamily("system_story")).toBe("system_risk_story");
      expect(mapFamily("framework_mascot")).toBe("knowledge_framework");
      expect(mapFamily("editorial_split")).toBe("photo_editorial_split");
      expect(mapFamily("fact_analysis")).toBe("ai_news_analysis");
      expect(mapFamily("unknown")).toBe("system_risk_story");
    });
  });

  describe("2. End-to-End Draft-to-Banner Mapping for 4 Verified Reference Posts", () => {
    it("maps T1 (Human Approval in Order Automation) to system_risk_story", () => {
      const t1Draft: DraftContentForBanner = {
        topic: "Human Approval in Order Automation",
        goal: "Teach SME owners how to automate order intake without losing human control",
        headline: "Order Processing မှာ Automation သုံးမယ်ဆိုရင်",
        hook: "Order တက်လာတိုင်း System က auto ပို့လိုက်ရင် ဘာဖြစ်မလဲ?",
        content: "Customer စိတ်တိုင်းကျ ဖြစ်မဖြစ်၊ Stock ရှိမရှိ၊ Discount ကန့်သတ်ချက်တို့ကို စစ်ဆေးရန် လူ့ဆုံးဖြတ်ချက် လိုအပ်သည်။",
        takeaway: "Automation က အလုပ်မြန်စေတယ်။ အတည်ပြုချက်က စီးပွားရေးကို ကာကွယ်တယ်။",
        systemBoundary: "AI က Order Data စုစည်းပြီး အကြံပြုချက်အထိသာ လုပ်ဆောင်သည်။",
        humanApprovalStep: "Margin နှင့် Stock အခြေအနေကို လူကိုယ်တိုင် စစ်ဆေးအတည်ပြုသည်။",
      };

      const result = generateBannerFromDraft(t1Draft);
      expect(result.family).toBe("system_risk_story");
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1080);
      expect(result.svg).toContain('viewBox="0 0 1080 1080"');
      expect(result.svg).toContain("Order Processing မှာ Automation");
      expect(result.svg).toContain("လူကိုယ်တိုင် စစ်ဆေးအတည်ပြုသည်။");
      expect(result.svg).toContain("Order Data စုစည်းပြီး");
      expect(result.svg).toContain(BRAND_COLORS.VIRIDIAN);
    });

    it("maps T2 (Daily Sales Reporting Workflow) to knowledge_framework", () => {
      const t2Draft: DraftContentForBanner = {
        topic: "Daily Sales Reporting Automation with LangGraph",
        goal: "Demonstrate multi-step workflow structure",
        headline: "Daily Sales Report ကို Agent ဖြင့် အလိုအလျောက် ထုတ်ယူခြင်း",
        hook: "အရောင်းဒေတာတွေကို ညနေတိုင်း စာရင်းချုပ်ရတာ အချိန်ကုန်နေပါသလား?",
        keyPoints: [
          "POS နှင့် Database မှ Sales ဒေတာများကို အလိုအလျောက် ဆွဲယူခြင်း",
          "ထူးခြားသော ကိန်းဂဏန်းနှင့် Trend များကို AI ဖြင့် သုံးသပ်ခြင်း",
          "စစ်ဆေးပြီးသော Report ကို Management ထံ တင်ပြခြင်း",
        ],
        takeaway: "Report ကို automate လုပ်ပါ။ ဆုံးဖြတ်ချက်ကို မလွှဲပါနဲ့။",
      };

      const result = generateBannerFromDraft(t2Draft, "knowledge_framework");
      expect(result.family).toBe("knowledge_framework");
      expect(result.svg).toContain("Daily Sales Report ကို Agent");
      expect(result.svg).toContain("POS နှင့် Database မှ Sales");
      expect(result.svg).toContain("KEY IDEA");
      expect(result.svg).toContain("Report ကို automate");
      expect(result.svg).toContain("ဆုံးဖြတ်ချက်ကို");
    });

    it("maps T3 (Inventory Stock Desync Failure) to system_risk_story", () => {
      const t3Draft: DraftContentForBanner = {
        topic: "Stock Desync Failure: POS vs E-Commerce Inventory Mismatch",
        headline: "POS နှင့် E-Commerce ကြား Stock မကိုက်ညီမှုကြောင့် ဖြစ်ပေါ်လာနိုင်သော ဆုံးရှုံးမှုများ",
        hook: "Online မှာ ပစ္စည်းရှိတယ်ပြပြီး ဆိုင်မှာ ပစ္စည်းပြတ်နေတဲ့ ပြဿနာ",
        systemBoundary: "AI က Sync Status နှင့် Discrepancy Alert ကိုသာ ထုတ်ပေးသည်။",
        takeaway: "ဒေတာမပြည့်စုံပါက အော်ဒါအတည်ပြုခြင်းကို ရပ်ဆိုင်းထားပါ။",
      };

      const result = generateBannerFromDraft(t3Draft);
      expect(result.family).toBe("system_risk_story");
      expect(result.svg).toContain("Stock မကိုက်ညီမှုကြောင့်");
      expect(result.svg).toContain("Sync Status");
      expect(result.svg).toContain("Discrepancy Alert");
    });

    it("maps T4 (Payment Slip OCR & Human Verification Gate) to system_risk_story", () => {
      const t4Draft: DraftContentForBanner = {
        topic: "Payment Slip OCR & Human Verification Gate",
        headline: "ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်းနှင့် လူ့အတည်ပြုချက် Gate",
        hook: "အတုအပများသော Slip များကို AI ဖြင့် ဘယ်လို စစ်ဆေးမလဲ?",
        humanApprovalStep: "ငွေပမာဏနှင့် Account နံပါတ် အမှန်တကယ် ဝင်မဝင် လူက ဘဏ် App တွင် စစ်ဆေးသည်။",
        systemBoundary: "OCR သည် စာသားဖတ်ရှုခြင်းအတွက်သာ ဖြစ်ပြီး ငွေဝင်ကြောင်း အာမမခံပါ။",
        takeaway: "ငွေကြေးဆိုင်ရာ လုပ်ငန်းစဉ်များတွင် Human Gate မဖြစ်မနေ ထားရှိပါ။",
      };

      const result = generateBannerFromDraft(t4Draft);
      expect(result.family).toBe("system_risk_story");
      expect(result.svg).toContain("ငွေလွှဲပြေစာ OCR စစ်ဆေးခြင်း");
      expect(result.svg).toContain("လူက ဘဏ် App တွင် စစ်ဆေးသည်။");
    });

    it("maps Photo Editorial and AI News topics to their respective families", () => {
      const photoDraft: DraftContentForBanner = {
        topic: "Photo Editorial Brand Layout",
        headline: "AI Visual Branding and Editorial Design",
        content: "ဓာတ်ပုံနှင့် အမြင်ဒီဇိုင်းဆိုင်ရာ လမ်းညွှန်ချက်များ",
      };
      const photoResult = generateBannerFromDraft(photoDraft);
      expect(photoResult.family).toBe("photo_editorial_split");
      expect(photoResult.svg).toContain("id=\"photo-frame\"");

      const newsDraft: DraftContentForBanner = {
        topic: "AI News Update and Model Release Analysis",
        headline: "Latest AI Model Benchmarks",
        content: "သတင်းနှင့် သုံးသပ်ချက်",
      };
      const newsResult = generateBannerFromDraft(newsDraft);
      expect(newsResult.family).toBe("ai_news_analysis");
      expect(newsResult.svg).toContain("CONFIRMED FACTS");
    });
  });

  describe("3. Banner SVG Structural Integrity & Sanitization", () => {
    it("renders valid SVG viewBox and dimensions across all 4 families", () => {
      const families: BannerTemplateFamily[] = [
        "system_risk_story",
        "knowledge_framework",
        "photo_editorial_split",
        "ai_news_analysis",
      ];

      for (const family of families) {
        const props = createDefaultBannerProps(family);
        const svg = renderBannerSvg(family, props);

        expect(svg).toMatch(/^<svg\b/);
        expect(svg).toMatch(/<\/svg>$/);
        expect(svg).toContain('viewBox="0 0 1080 1080"');
        expect(svg).toContain('width="1080"');
        expect(svg).toContain('height="1080"');
        expect(svg).toContain(BRAND_COLORS.WARM_IVORY);
        expect(svg).toContain(BRAND_COLORS.VIRIDIAN);
        expect(svg).toContain(BRAND_COLORS.OLIVE_INK);
      }
    });

    it("sanitizes user inputs to prevent XSS or XML entity breakdown", () => {
      const maliciousDraft: DraftContentForBanner = {
        topic: "Risk Test",
        headline: 'Headline & "Quotes" <Tag> <script>alert("xss")</script>',
        systemBoundary: "Boundary > Limit & 'Security'",
      };

      const result = generateBannerFromDraft(maliciousDraft, "system_risk_story");
      expect(result.svg).not.toContain("<script>");
      expect(result.svg).not.toContain("<Tag>");
      expect(result.svg).toContain("&amp;");
      expect(result.svg).toContain("&lt;script&gt;");
      expect(result.svg).toContain("&quot;Quotes&quot;");
    });
  });

  describe("4. Canvas Export Utility Integration", () => {
    it("converts SVG string with Burmese Unicode glyphs to a safe data URL", () => {
      const svg = '<svg viewBox="0 0 1080 1080"><text>မြန်မာစာ စမ်းသပ်မှု</text></svg>';
      const dataUrl = svgStringToDataUrl(svg);

      expect(dataUrl.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
      expect(dataUrl).toContain(encodeURIComponent("မြန်မာစာ စမ်းသပ်မှု"));
    });
  });

  describe("5. Studio Custom Property Mutation & Reactive Updates", () => {
    it("mutates SystemRiskStory stage properties and reflects changes in rendered SVG", () => {
      const baseProps = createDefaultBannerProps("system_risk_story") as SystemRiskStoryProps;
      const customProps: SystemRiskStoryProps = {
        ...baseProps,
        headline: "Custom Mutated Headline 123",
        stages: [
          ...baseProps.stages.slice(0, 3),
          {
            stageNumber: "04",
            title: "Custom Human Gate",
            description: "Custom verification description for stage 4",
            isHumanApproval: true,
          },
          baseProps.stages[4],
        ],
        boundaryText: "Custom Boundary Rule",
        limitsText: "Custom Limits Rule",
        takeawayText: "Custom Takeaway Rule",
      };

      const svg = renderBannerSvg("system_risk_story", customProps);
      expect(svg).toContain("Custom Mutated Headline 123");
      expect(svg).toContain("Custom Human Gate");
      expect(svg).toContain("Custom verification description for stage 4");
      expect(svg).toContain("Custom Boundary Rule");
      expect(svg).toContain("Custom Limits Rule");
      expect(svg).toContain("Custom Takeaway Rule");
    });

    it("mutates KnowledgeFramework points and reflects updates in rendered SVG", () => {
      const baseProps = createDefaultBannerProps("knowledge_framework") as KnowledgeFrameworkProps;
      const customProps: KnowledgeFrameworkProps = {
        ...baseProps,
        headline: "Mutated Framework Title",
        topicSequence: "WORKFLOW / 99",
        points: [
          { number: 1, title: "Alpha", description: "Alpha Description" },
          { number: 2, title: "Beta", description: "Beta Description" },
          { number: 3, title: "Gamma", description: "Gamma Description" },
        ],
        keyIdeaText: "Mutated Key Idea",
      };

      const svg = renderBannerSvg("knowledge_framework", customProps);
      expect(svg).toContain("Mutated Framework Title");
      expect(svg).toContain("WORKFLOW / 99");
      expect(svg).toContain("Alpha");
      expect(svg).toContain("Beta");
      expect(svg).toContain("Gamma");
      expect(svg).toContain("Mutated Key Idea");
    });

    it("mutates PhotoEditorialSplit body lines and reflects updates in rendered SVG", () => {
      const baseProps = createDefaultBannerProps("photo_editorial_split") as PhotoEditorialSplitProps;
      const customProps: PhotoEditorialSplitProps = {
        ...baseProps,
        headline: "Editorial Headline Mutation",
        burmeseBodyLines: ["Custom Point 1", "Custom Point 2", "Custom Point 3"],
        referenceNote: "Custom Reference Note 2026",
      };

      const svg = renderPhotoEditorialSplitSvg(customProps);
      expect(svg).toContain("Editorial Headline Mutation");
      expect(svg).toContain("Custom Point 1");
      expect(svg).toContain("Custom Point 2");
      expect(svg).toContain("Custom Point 3");
      expect(svg).toContain("Custom Reference Note 2026");
    });

    it("mutates AiNewsAnalysis 3 cards and reflects updates in rendered SVG", () => {
      const baseProps = createDefaultBannerProps("ai_news_analysis") as AiNewsAnalysisProps;
      const customProps: AiNewsAnalysisProps = {
        ...baseProps,
        headline: "News Analysis Headline Mutation",
        confirmedFacts: ["Confirmed News Point A", "Confirmed News Point B"],
        fyfAnalysis: ["FYF Deep Take X", "FYF Deep Take Y"],
        openQuestions: ["Open Critical Question Z?"],
        sourceName: "Independent Tech Journal",
      };

      const svg = renderAiNewsAnalysisSvg(customProps);
      expect(svg).toContain("News Analysis Headline Mutation");
      expect(svg).toContain("Confirmed News Point A");
      expect(svg).toContain("Confirmed News Point B");
      expect(svg).toContain("FYF Deep Take X");
      expect(svg).toContain("Open Critical Question Z?");
      expect(svg).toContain("Independent Tech Journal");
    });
  });
});
