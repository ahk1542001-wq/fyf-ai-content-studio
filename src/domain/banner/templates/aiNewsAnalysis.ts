/**
 * Family 4: AI News & Analysis Template (1080 x 1080)
 * 3 Stacked Analysis Cards (Confirmed Facts, FYF Analysis, Open Questions) + Provenance Footer
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { AiNewsAnalysisProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

const DEFAULT_CONFIRMED_FACTS = [
  'အဓိက AI ကုမ္ပဏီမှ Reasoning Model အသစ်နှင့် Workflow API များကို တရားဝင်မိတ်ဆက်ခဲ့သည်။',
  'Automated reasoning နှင့် tool calling စွမ်းဆောင်ရည် သိသိသာသာ တိုးတက်လာသည်။',
];

const DEFAULT_FYF_ANALYSIS = [
  'Prompt ကောင်းရုံဖြင့် အလုပ်မပြီးပါ။ Error Handling နှင့် Human Gate ထည့်သွင်းရန် လိုအပ်သည်။',
  'လုပ်ငန်းသုံးစနစ်များတွင် Production Data နှင့် ချိတ်ဆက်ရာတွင် Rate Limit နှင့် Cost ကို ထည့်တွက်ရမည်။',
];

const DEFAULT_OPEN_QUESTIONS = [
  'လုပ်ငန်းတွင်း အမှားအယွင်းမဖြစ်စေရန် မည်သည့် Decision အဆင့်တွင် လူက အတည်ပြုမည်နည်း?',
];

export function renderAiNewsAnalysisSvg(props: AiNewsAnalysisProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'AI NEWS • ANALYSIS';
  const sectionTag = props.sectionTag || 'TRENDING TECH / ANALYSIS';

  const headline = props.headline || 'Reasoning AI Models နှင့် မြန်မာစီးပွားရေးလုပ်ငန်းများအတွက် အရေးပါသော အချက်များ';
  const headlineLines = wrapSvgText(headline, {
    maxCharsPerLine: 38,
    maxLines: 2,
  });

  const confirmedFacts = (props.confirmedFacts && props.confirmedFacts.length > 0)
    ? props.confirmedFacts
    : DEFAULT_CONFIRMED_FACTS;

  const fyfAnalysis = (props.fyfAnalysis && props.fyfAnalysis.length > 0)
    ? props.fyfAnalysis
    : DEFAULT_FYF_ANALYSIS;

  const openQuestions = (props.openQuestions && props.openQuestions.length > 0)
    ? props.openQuestions
    : DEFAULT_OPEN_QUESTIONS;

  const sourceName = props.sourceName || 'Official Technical Release & Benchmarks';
  const publishedDate = props.publishedDate || '2026-08-19';
  const updatedDate = props.updatedDate || '2026-08-19';

  // Helper to format lines for a card
  const formatCardLines = (items: string[]) => {
    const lines: string[] = [];
    for (const item of items) {
      const wrapped = wrapSvgText(`• ${item}`, { maxCharsPerLine: 50, maxLines: 2 });
      lines.push(...wrapped);
    }
    return lines.slice(0, 3);
  };

  const card1Lines = formatCardLines(confirmedFacts);
  const card2Lines = formatCardLines(fyfAnalysis);
  const card3Lines = formatCardLines(openQuestions);

  const logoHeader = props.customLogoSvg || renderHorizontalLogoSvg(56, 42, 280, 85);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(headline)}</title>
  <desc id="desc">Fact vs FYF Analysis three-card layout with provenance footer.</desc>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>

  <!-- Top 8px Viridian Stripe -->
  <rect x="0" y="0" width="${width}" height="8" fill="${BRAND_COLORS.VIRIDIAN}"/>

  <!-- Logo Header -->
  ${logoHeader}

  <!-- Category Badge -->
  <rect x="718" y="52" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
  <text x="871" y="89" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">
    ${escapeXml(categoryLabel)}
  </text>

  <!-- Header Divider -->
  <line x1="56" y1="145" x2="1024" y2="145" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Section Tag Subhead -->
  <text x="56" y="185" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="2">
    ${escapeXml(sectionTag)}
  </text>

  <!-- Main Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="44" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(headlineLines, 56, 240, 52)}
  </text>

  <!-- Card 1: Confirmed Facts -->
  <g transform="translate(56, 320)">
    <rect x="0" y="0" width="968" height="185" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95"/>
    <rect x="0" y="0" width="8" height="185" rx="4" fill="${BRAND_COLORS.VIRIDIAN}"/>
    <text x="28" y="38" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="1">
      01. CONFIRMED FACTS • အတည်ပြုချက်များ
    </text>
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(card1Lines, 28, 76, 34)}
    </text>
  </g>

  <!-- Card 2: FYF Analysis -->
  <g transform="translate(56, 525)">
    <rect x="0" y="0" width="968" height="185" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95"/>
    <rect x="0" y="0" width="8" height="185" rx="4" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="28" y="38" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}" letter-spacing="1">
      02. FYF ANALYSIS • သုံးသပ်ချက်
    </text>
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(card2Lines, 28, 76, 34)}
    </text>
  </g>

  <!-- Card 3: Open Questions -->
  <g transform="translate(56, 730)">
    <rect x="0" y="0" width="968" height="185" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95"/>
    <rect x="0" y="0" width="8" height="185" rx="4" fill="${BRAND_COLORS.SOFT_SAGE}"/>
    <text x="28" y="38" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}" letter-spacing="1">
      03. OPEN QUESTIONS • မေးခွန်းထုတ်စရာများ
    </text>
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(card3Lines, 28, 76, 34)}
    </text>
  </g>

  <!-- Provenance Footer -->
  <line x1="56" y1="945" x2="1024" y2="945" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="1.5" opacity="0.22"/>

  <!-- Metadata Line 1 -->
  <text x="56" y="980" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="${BRAND_COLORS.OLIVE_INK}">
    SOURCE: <tspan font-weight="400">${escapeXml(sourceName)}</tspan>
  </text>
  <text x="680" y="980" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="400" font-size="17" fill="${BRAND_COLORS.OLIVE_INK}">
    PUBLISHED: ${escapeXml(publishedDate)}
  </text>

  <!-- Metadata Line 2 -->
  <text x="56" y="1018" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="${BRAND_COLORS.VIRIDIAN}">
    UNDERSTAND AI. BUILD REAL SYSTEMS.
  </text>
  <text x="680" y="1018" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="400" font-size="17" fill="${BRAND_COLORS.OLIVE_INK}">
    UPDATED: ${escapeXml(updatedDate)}
  </text>

  <!-- Profile Logo Stamp -->
  ${renderProfileLogoSvg(960, 978, 64, 40)}
</svg>
  `.trim();
}
