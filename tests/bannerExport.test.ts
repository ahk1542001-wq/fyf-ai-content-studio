import { describe, it, expect } from 'vitest';
import {
  mapDraftToBannerProps,
  detectTemplateFamily,
  generateBannerFromDraft,
  escapeXml,
  wrapSvgText,
  calculateTspanLines,
  getGraphemeClusters,
  sanitizeSvgSnippet,
} from '../src/domain/banner';
import { svgStringToDataUrl } from '../frontend/utils/bannerExport';
import { BRAND_COLORS, BRAND_DIMENSIONS, CONTRAST_RATIOS } from '../frontend/styles/brandTokens';

describe('FYF Banner Generator Utils & Draft Mapper', () => {
  describe('Draft to Banner Props Mapper & Family Auto-Detection', () => {
    it('detects system_risk_story for risk and workflow topics', () => {
      const draft = {
        topic: 'Inventory Stock Desync Failure',
        content: 'Stock data မှားယွင်းမှုနှင့် Human Approval စစ်ဆေးရန် လုပ်ငန်းစဉ်',
        headline: 'Data မှားရင် Action မလွှဲပါနဲ့',
      };
      const family = detectTemplateFamily(draft);
      expect(family).toBe('system_risk_story');

      const mapped = mapDraftToBannerProps(draft);
      expect(mapped.family).toBe('system_risk_story');
      expect(mapped.props.headline).toBe('Data မှားရင် Action မလွှဲပါနဲ့');
    });

    it('detects ai_news_analysis for trending news and model release topics', () => {
      const draft = {
        topic: 'New Reasoning Model Release and Benchmark Update',
        content: 'AI ကုမ္ပဏီမှ နောက်ဆုံးထွက် သတင်းနှင့် စွမ်းဆောင်ရည် သုံးသပ်ချက်',
        headline: 'Reasoning AI Models Analysis',
      };
      const family = detectTemplateFamily(draft);
      expect(family).toBe('ai_news_analysis');

      const mapped = mapDraftToBannerProps(draft);
      expect(mapped.family).toBe('ai_news_analysis');
    });

    it('detects photo_editorial_split for visual generation and photo topics', () => {
      const draft = {
        topic: 'Editorial Visual Generation and Brand Guidelines',
        content: 'ဓာတ်ပုံနှင့် ရုပ်ပုံ layout split design',
        photoHeadline: 'Visual Photo Editorial',
      };
      const family = detectTemplateFamily(draft);
      expect(family).toBe('photo_editorial_split');

      const mapped = mapDraftToBannerProps(draft);
      expect(mapped.family).toBe('photo_editorial_split');
    });

    it('detects knowledge_framework for conceptual education topics', () => {
      const draft = {
        topic: 'AI Systems Architecture Principles',
        content: 'အခြေခံသဘောတရားနှင့် စနစ်တည်ဆောက်ပုံ နားလည်စေရန်',
        headline: 'System Architecture Framework',
      };
      const family = detectTemplateFamily(draft);
      expect(family).toBe('knowledge_framework');
    });

    it('allows explicit preferredFamily override', () => {
      const draft = {
        topic: 'Generic Topic',
        headline: 'Custom Headline',
      };
      const mapped = mapDraftToBannerProps(draft, 'photo_editorial_split');
      expect(mapped.family).toBe('photo_editorial_split');
    });

    it('generates full banner bundle via generateBannerFromDraft', () => {
      const draft = {
        topic: 'Payment Slip OCR Verification',
        systemBoundary: 'OCR စစ်ပြီး Slip မှန်မှသာ Approve လုပ်ပါ။',
        takeaway: 'ငွေကြေးဆုံးဖြတ်ချက်ကို လူက စစ်ပါ။',
      };
      const result = generateBannerFromDraft(draft);

      expect(result.family).toBe('system_risk_story');
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1080);
      expect(result.svg).toContain('viewBox="0 0 1080 1080"');
      expect(result.svg).toContain('OCR စစ်ပြီး Slip မှန်မှသာ Approve လုပ်ပါ။');
    });
  });

  describe('SVG Text Sanitization & Unicode Helpers', () => {
    it('escapes XML special characters safely', () => {
      expect(escapeXml('Foo & Bar')).toBe('Foo &amp; Bar');
      expect(escapeXml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeXml("It's a test")).toBe('It&apos;s a test');
      expect(escapeXml(null)).toBe('');
      expect(escapeXml(undefined)).toBe('');
    });

    it('splits Burmese strings into grapheme clusters preserving combining marks', () => {
      const text = 'မြန်မာနိုင်ငံ';
      const clusters = getGraphemeClusters(text);
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.join('')).toBe(text);
    });

    it('wraps long text into bounded lines for SVG rendering', () => {
      const longText = 'စနစ်တစ်ခုလုံး၏ အရေးပါသော လူ့ဆုံးဖြတ်ချက်စည်းမျဉ်းနှင့် အမှားကာကွယ်ခြင်းဆိုင်ရာ အချက်အလက်များ';
      const lines = wrapSvgText(longText, { maxCharsPerLine: 20, maxLines: 4 });
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.length).toBeLessThanOrEqual(4);
    });

    it('calculates tspan lines with proper vertical offset spacing', () => {
      const lines = ['Line 1', 'Line 2', 'Line 3'];
      const tspans = calculateTspanLines(lines, 56, 100, 30);
      expect(tspans).toContain('<tspan x="56" y="100">Line 1</tspan>');
      expect(tspans).toContain('<tspan x="56" y="130">Line 2</tspan>');
      expect(tspans).toContain('<tspan x="56" y="160">Line 3</tspan>');
    });

    it('sanitizes dangerous SVG snippets', () => {
      const unsafe = '<svg><script>alert(1)</script><rect onclick="evil()" width="10" height="10"/></svg>';
      const safe = sanitizeSvgSnippet(unsafe);
      expect(safe).not.toContain('<script>');
      expect(safe).not.toContain('onclick=');
    });
  });

  describe('Client Export & Data URI Helpers', () => {
    it('converts SVG string into UTF-8 URI-encoded data URL supporting Burmese characters', () => {
      const sampleSvg = '<svg viewBox="0 0 1080 1080"><text>မြန်မာစာ စမ်းသပ်မှု</text></svg>';
      const dataUrl = svgStringToDataUrl(sampleSvg);

      expect(dataUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
      expect(dataUrl).toContain(encodeURIComponent('မြန်မာစာ စမ်းသပ်မှု'));
    });
  });

  describe('Brand Tokens & Dimensions Consistency', () => {
    it('verifies strict FYF brand token constants', () => {
      expect(BRAND_COLORS.WARM_IVORY).toBe('#F4F0E6');
      expect(BRAND_COLORS.VIRIDIAN).toBe('#16856B');
      expect(BRAND_COLORS.OLIVE_INK).toBe('#30382C');
      expect(BRAND_COLORS.SOFT_SAGE).toBe('#A8B7A2');
      expect(BRAND_COLORS.SURFACE_WHITE).toBe('#FFFFFF');

      expect(BRAND_DIMENSIONS.DEFAULT_WIDTH).toBe(1080);
      expect(BRAND_DIMENSIONS.DEFAULT_HEIGHT).toBe(1080);
      expect(BRAND_DIMENSIONS.SAFE_MARGIN_X).toBe(56);
      expect(BRAND_DIMENSIONS.SAFE_WIDTH).toBe(968);

      expect(CONTRAST_RATIOS.OLIVE_ON_IVORY).toBeGreaterThan(10.0);
      expect(CONTRAST_RATIOS.VIRIDIAN_ON_IVORY).toBeGreaterThan(4.0);
    });
  });
});
