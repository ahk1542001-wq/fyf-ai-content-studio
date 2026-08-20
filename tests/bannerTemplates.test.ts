import { describe, it, expect } from 'vitest';
import {
  renderSystemRiskStorySvg,
  renderKnowledgeFrameworkSvg,
  renderPhotoEditorialSplitSvg,
  renderAiNewsAnalysisSvg,
  renderBannerSvg,
  createDefaultBannerProps,
  SystemRiskStoryProps,
  KnowledgeFrameworkProps,
  PhotoEditorialSplitProps,
  AiNewsAnalysisProps,
} from '../src/domain/banner';
import { BRAND_COLORS } from '../frontend/styles/brandTokens';

describe('FYF 4-Family Approved Brand Template Banner Generator', () => {
  describe('Universal SVG Specifications & Quality Gates', () => {
    const families = [
      'system_risk_story',
      'knowledge_framework',
      'photo_editorial_split',
      'ai_news_analysis',
    ] as const;

    it.each(families)('renders family %s with valid 1080x1080 dimensions and viewBox', (family) => {
      const props = createDefaultBannerProps(family);
      const svg = renderBannerSvg(family, props);

      expect(svg).toMatch(/^<svg\b/);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg).toContain('viewBox="0 0 1080 1080"');
      expect(svg).toContain('width="1080"');
      expect(svg).toContain('height="1080"');
    });

    it.each(families)('renders family %s adhering strictly to FYF brand palette', (family) => {
      const props = createDefaultBannerProps(family);
      const svg = renderBannerSvg(family, props);

      // Must contain Warm Ivory background
      expect(svg).toContain(BRAND_COLORS.WARM_IVORY);
      // Must contain Viridian accent
      expect(svg).toContain(BRAND_COLORS.VIRIDIAN);
      // Must contain Olive Ink structure/text
      expect(svg).toContain(BRAND_COLORS.OLIVE_INK);
    });

    it.each(families)('embeds official FYF vector logo paths and tracking text', (family) => {
      const props = createDefaultBannerProps(family);
      const svg = renderBannerSvg(family, props);

      // Horizontal master text & path signatures
      expect(svg).toContain('FOR YOUR FUTURE');
      expect(svg).toContain('M35 178');
      // Profile master path signature
      expect(svg).toContain('M42 234.5');
    });

    it.each(families)('preserves Burmese Unicode characters intact without corruption or entity mangling', (family) => {
      const burmeseHeadline = 'စနစ်တစ်ခုလုံး၏ လူ့ဆုံးဖြတ်ချက်စည်းမျဉ်း';
      const props = {
        ...createDefaultBannerProps(family),
        headline: burmeseHeadline,
      };
      const svg = renderBannerSvg(family, props);

      expect(svg).toContain('စနစ်တစ်ခုလုံး၏');
      expect(svg).toContain('လူ့ဆုံးဖြတ်ချက်စည်းမျဉ်း');
    });

    it.each(families)('properly escapes XML special characters in user inputs', (family) => {
      const unsafeProps = {
        ...createDefaultBannerProps(family),
        headline: 'AI & Automation <Decision> "Testing" & \'Boundary\'',
        subtitle: 'Context & Rules > Safe & Sound',
      };
      const svg = renderBannerSvg(family, unsafeProps);

      expect(svg).toContain('&amp;');
      expect(svg).toContain('&lt;Decision&gt;');
      expect(svg).toContain('&quot;Testing&quot;');
      // Raw unescaped dangerous tags should not appear
      expect(svg).not.toContain('<Decision>');
    });
  });

  describe('Family 1: System / Risk Story (system_risk_story)', () => {
    it('renders 5 distinct workflow stage cards with stage 04 highlighted in Viridian', () => {
      const props: SystemRiskStoryProps = {
        categoryLabel: 'RISK STORY • INVENTORY',
        headline: 'Data မှားရင် Action လည်း မှားနိုင်တယ်။',
        subtitle: 'AI က Reorder အကြံပေးမယ်။ Final Order ကို လူကပိုင်တယ်။',
        stages: [
          { stageNumber: '01', title: 'Stock data', description: 'System ထဲမှာ Stock ၂ ခုလို့ပြတယ်။' },
          { stageNumber: '02', title: 'AI checks', description: 'Low Stock ကိုတွေ့ပြီး Reorder လုပ်ဖို့တွက်မယ်။' },
          { stageNumber: '03', title: 'Recommendation', description: 'Quantity နဲ့ Purchase Option ကို တင်ပြမယ်။' },
          { stageNumber: '04', title: 'Human verifies', description: 'Actual Stock • Cash Flow ကိုစစ်မယ်။', isHumanApproval: true },
          { stageNumber: '05', title: 'Approved order', description: 'Approve ပြီးမှ Supplier ဆီ Order ပို့မယ်။' },
        ],
        boundaryText: 'AI က Recommendation အထိသာ။',
        limitsText: 'Data မသစ်ရင် Order ကို မပို့ရသေး။',
        takeawayText: 'AI က အကြံပေးပါစေ။ ငွေကုန်မယ့် Action ကို လူက Approve လုပ်ပါ။',
      };

      const svg = renderSystemRiskStorySvg(props);

      expect(svg).toContain('01');
      expect(svg).toContain('02');
      expect(svg).toContain('03');
      expect(svg).toContain('04');
      expect(svg).toContain('05');

      // Human review badge fill #16856B
      expect(svg).toContain(`fill="${BRAND_COLORS.VIRIDIAN}"`);
      // Boundary panel labels and values
      expect(svg).toContain('BOUNDARY:');
      expect(svg).toContain('LIMITS:');
      expect(svg).toContain('AI က Recommendation အထိသာ။');
      expect(svg).toContain('Data မသစ်ရင် Order ကို မပို့ရသေး။');
      // Takeaway text
      expect(svg).toContain('ငွေကုန်မယ့် Action ကို လူက Approve လုပ်ပါ။');
    });
  });

  describe('Family 2: Knowledge & Frameworks (knowledge_framework)', () => {
    it('renders hero headline, 3 numbered point cards, mascot presentation card, and key idea box', () => {
      const props: KnowledgeFrameworkProps = {
        categoryLabel: 'KNOWLEDGE • FRAMEWORK',
        topicSequence: 'SYSTEM THINKING / 01',
        headline: 'AI Agent ကို အလုပ်ပေးပါ။ Control ကိုတော့ မပေးလိုက်ပါနဲ့။',
        points: [
          { number: 1, title: 'Context & Goal', description: 'AI မစခင် Input နဲ့ စည်းမျဉ်းကို ရှင်းအောင်သတ်မှတ်ပါ။' },
          { number: 2, title: 'Decision Boundary', description: 'လူက စစ်ရမယ့်အပိုင်း ခွဲခြားပါ။' },
          { number: 3, title: 'Verified Output', description: 'စစ်ဆေးပြီးမှသာ External Action ပို့ပါ။' },
        ],
        keyIdeaTitle: 'KEY IDEA',
        keyIdeaText: 'AI ကို အလုပ်လုပ်ခိုင်းပါ။ စီးပွားရေးဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။',
        footerTagline: 'Understand AI. Build Real Systems.',
      };

      const svg = renderKnowledgeFrameworkSvg(props);

      expect(svg).toContain('SYSTEM THINKING / 01');
      expect(svg).toContain('AI Agent ကို အလုပ်ပေးပါ။');
      expect(svg).toContain('Context &amp; Goal');
      expect(svg).toContain('Decision Boundary');
      expect(svg).toContain('Verified Output');
      // Mascot element presence
      expect(svg).toContain('fyf-mascot-presenting');
      // Key idea box
      expect(svg).toContain('KEY IDEA');
      expect(svg).toContain('စီးပွားရေးဆုံးဖြတ်ချက်');
      expect(svg).toContain('မလွှဲပါနဲ့။');
      expect(svg).toContain('Understand AI. Build Real Systems.');
    });
  });

  describe('Family 3: Photo Generation & Editorial Split (photo_editorial_split)', () => {
    it('renders exact 50/50 split layout with top photo overlay and bottom Warm Ivory typography panel', () => {
      const props: PhotoEditorialSplitProps = {
        categoryLabel: 'EDITORIAL • SPLIT',
        photoLabel: 'PHOTO PLAN: [APPROVED REFERENCE / BRAND GUIDED]',
        photoStatus: 'SAMPLE LAYOUT',
        headline: 'လက်တွေ့အသုံးချ AI စနစ်နှင့် အမြင်ဒီဇိုင်း',
        burmeseTitle: 'လက်တွေ့အသုံးချ AI စနစ်နှင့် အမြင်ဒီဇိုင်း',
        burmeseBodyLines: [
          'AI ဖြင့် ဖန်တီးထားသော အမြင်ဆိုင်ရာ အထောက်အထား။',
          'Brand Guidelines နှင့် ညီညွတ်သော ဖွဲ့စည်းပုံ။',
        ],
        referenceNote: 'REFERENCE MODE: High-fidelity brand editorial split',
      };

      const svg = renderPhotoEditorialSplitSvg(props);

      expect(svg).toContain('id="photo-frame"');
      expect(svg).toContain('id="brand-panel"');
      // 50/50 split divider
      expect(svg).toContain('height="8" fill="#16856B"');
      expect(svg).toContain('PHOTO PLAN: [APPROVED REFERENCE / BRAND GUIDED]');
      expect(svg).toContain('SAMPLE LAYOUT');
      expect(svg).toContain('လက်တွေ့အသုံးချ AI စနစ်နှင့် အမြင်ဒီဇိုင်း');
      expect(svg).toContain('REFERENCE MODE: High-fidelity brand editorial split');
    });

    it('embeds custom photoDataUri when provided', () => {
      const props: PhotoEditorialSplitProps = {
        headline: 'Custom Image Banner',
        burmeseBodyLines: ['Test body line'],
        photoDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const svg = renderPhotoEditorialSplitSvg(props);
      expect(svg).toContain('<image href="data:image/png;base64,');
      expect(svg).toContain('width="1080" height="540"');
    });
  });

  describe('Family 4: AI News & Analysis (ai_news_analysis)', () => {
    it('renders top Viridian stripe, 3 stacked analysis cards, and provenance footer', () => {
      const props: AiNewsAnalysisProps = {
        categoryLabel: 'AI NEWS • ANALYSIS',
        sectionTag: 'TRENDING TECH / ANALYSIS',
        headline: 'Reasoning AI Models နှင့် မြန်မာစီးပွားရေးလုပ်ငန်းများ',
        confirmedFacts: ['OpenAI Reasoning Model release', 'Tool calling speed improved'],
        fyfAnalysis: ['Prompt is not enough', 'Human in the loop required'],
        openQuestions: ['Where to place approval gate?'],
        sourceName: 'Official Benchmark Report',
        publishedDate: '2026-08-19',
        updatedDate: '2026-08-19',
      };

      const svg = renderAiNewsAnalysisSvg(props);

      expect(svg).toContain('CONFIRMED FACTS • အတည်ပြုချက်များ');
      expect(svg).toContain('FYF ANALYSIS • သုံးသပ်ချက်');
      expect(svg).toContain('OPEN QUESTIONS • မေးခွန်းထုတ်စရာများ');
      expect(svg).toContain('SOURCE:');
      expect(svg).toContain('Official Benchmark Report');
      expect(svg).toContain('PUBLISHED: 2026-08-19');
      expect(svg).toContain('UPDATED: 2026-08-19');
      expect(svg).toContain('UNDERSTAND AI. BUILD REAL SYSTEMS.');
    });
  });

  describe('Family 5: Album Carousel (album_carousel)', () => {
    it('renders all 4 carousel slides cleanly with page indicators', () => {
      const defaultProps = createDefaultBannerProps('album_carousel');

      // Test Slide 1: Cover
      const svg1 = renderBannerSvg('album_carousel', { ...defaultProps, currentSlideIndex: 0 });
      expect(svg1).toContain('01 / 04');
      expect(svg1).toContain('KEY QUESTION');
      expect(svg1).toContain('fyf-mascot-presenting');

      // Test Slide 2: Risk
      const svg2 = renderBannerSvg('album_carousel', { ...defaultProps, currentSlideIndex: 1 });
      expect(svg2).toContain('02 / 04');
      expect(svg2).toContain('The False Automation');
      expect(svg2).toContain('OPERATIONAL RISK');

      // Test Slide 3: Solution
      const svg3 = renderBannerSvg('album_carousel', { ...defaultProps, currentSlideIndex: 2 });
      expect(svg3).toContain('03 / 04');
      expect(svg3).toContain('The Safe FYF Workflow');
      expect(svg3).toContain('HUMAN APPROVAL GATE');

      // Test Slide 4: Takeaway
      const svg4 = renderBannerSvg('album_carousel', { ...defaultProps, currentSlideIndex: 3 });
      expect(svg4).toContain('04 / 04');
      expect(svg4).toContain('FYF AI Systems Philosophy');
      expect(svg4).toContain('SYSTEM BOUNDARY:');
    });
  });

  describe('WOW Visual Styles: Diorama, Mascot Story, Blueprint, Real UI', () => {
    it('renders 3D Isometric System Diorama with floating glass nodes and mascot', () => {
      const props = createDefaultBannerProps('isometric_system_diorama');
      const svg = renderBannerSvg('isometric_system_diorama', props);
      expect(svg).toContain('3D SYSTEM DIORAMA');
      expect(svg).toContain('03 HUMAN GATE');
      expect(svg).toContain('fyf-mascot-presenting');
    });

    it('renders Tactile Mascot Storytelling with dialogue speech bubble', () => {
      const props = createDefaultBannerProps('mascot_storytelling');
      const svg = renderBannerSvg('mascot_storytelling', props);
      expect(svg).toContain('MASCOT STORY');
      expect(svg).toContain('PUCK\'S GOLDEN RULE');
      expect(svg).toContain('fyf-mascot-presenting');
    });

    it('renders Dark Blueprint Engine with glowing laser circuits', () => {
      const props = createDefaultBannerProps('dark_blueprint_circuit');
      const svg = renderBannerSvg('dark_blueprint_circuit', props);
      expect(svg).toContain('SYSTEM ARCHITECTURE • BLUEPRINT');
      expect(svg).toContain('03_GATEWAY');
    });

    it('renders Real Architecture UI with macOS window bar and JSON inspector', () => {
      const props = createDefaultBannerProps('live_architecture_ui');
      const svg = renderBannerSvg('live_architecture_ui', props);
      expect(svg).toContain('PRODUCTION SYSTEM • TRACE');
      expect(svg).toContain('Human Sign-Off Gate');
      expect(svg).toContain('STATE_PAYLOAD.json');
    });
  });
});
