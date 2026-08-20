/**
 * Family 1: System / Risk Story Template (1080 x 1080)
 * 5-Stage Step Cards with Stage 4 (Human Approval) Highlight & Boundary Panel
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { SystemRiskStoryProps, SystemRiskStoryStage } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

const DEFAULT_STAGES: SystemRiskStoryStage[] = [
  { stageNumber: '01', title: 'Data Ingestion', description: 'အော်ဒါ၊ စာရင်းနှင့် Stock အချက်အလက်များ စုစည်းခြင်း' },
  { stageNumber: '02', title: 'Automation Extraction', description: 'စနစ်မှ လိုအပ်သော ဒေတာများကို အလိုအလျောက် ခွဲထုတ်ခြင်း' },
  { stageNumber: '03', title: 'AI Risk Analysis', description: 'ပုံမှန်မဟုတ်သော အချက်များနှင့် Risk အခြေအနေကို စစ်ဆေးခြင်း' },
  { stageNumber: '04', title: 'Human Verification Gate', description: 'လူကိုယ်တိုင် ဘဏ်အကောင့်နှင့် စည်းမျဉ်းများကို စစ်ဆေးအတည်ပြုခြင်း', isHumanApproval: true },
  { stageNumber: '05', title: 'Verified Action', description: 'အတည်ပြုပြီးမှသာ ငွေလွှဲခြင်းနှင့် ပစ္စည်းထုတ်ပေးခြင်း ပြုလုပ်ခြင်း' },
];

export function renderSystemRiskStorySvg(props: SystemRiskStoryProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'RISK STORY • SYSTEM';

  const headline = props.headline || 'Sales Report က Decision မဟုတ်ပါ။';
  const headlineLines = wrapSvgText(headline, {
    maxCharsPerLine: 34,
    maxLines: 2,
  });

  const headlineStartY = 215;
  const headlineLineHeight = 54;
  const subtitleStartY = headlineStartY + (headlineLines.length * headlineLineHeight) + 6;

  const subtitleLines = wrapSvgText(props.subtitle || 'AI က Pattern ရှာမယ်။ Final Call ကို လူကပိုင်တယ်။', {
    maxCharsPerLine: 48,
    maxLines: 2,
  });

  const stages = (props.stages && props.stages.length > 0) ? props.stages.slice(0, 5) : DEFAULT_STAGES;

  const renderedStagesSvg = stages
    .map((stage, idx) => {
      const yOffset = idx * 88;
      const isHighlighted = stage.isHumanApproval ?? (idx === 3);
      const badgeFill = isHighlighted ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK;
      const titleFill = isHighlighted ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.VIRIDIAN;
      const isLast = idx === stages.length - 1;

      return `
      <!-- Stage ${stage.stageNumber} -->
      <g transform="translate(0, ${yOffset})">
        <rect x="0" y="0" width="68" height="68" rx="14" fill="${badgeFill}"/>
        <text x="34" y="43" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="24" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${escapeXml(stage.stageNumber)}</text>
        <text x="86" y="28" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${titleFill}">${escapeXml(stage.title)}</text>
        <text x="86" y="56" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(stage.description)}</text>
        ${!isLast ? `<line x1="34" y1="68" x2="34" y2="88" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="3" opacity="0.6"/>` : ''}
      </g>
      `.trim();
    })
    .join('\n');

  const boundaryText = props.boundaryText || 'AI က Analysis နဲ့ Options အထိသာ။';
  const limitsText = props.limitsText || 'Data မပြည့်ရင် Recommendation ကို မယုံရသေး။';
  const takeawayText = props.takeawayText || 'Report ကို automate လုပ်ပါ။ ဆုံးဖြတ်ချက်ကို မလွှဲပါနဲ့။';

  const logoHeader = props.customLogoSvg || renderHorizontalLogoSvg(56, 52, 280, 85);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(headline)}</title>
  <desc id="desc">Five-stage workflow showing AI processing and human approval boundary.</desc>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>

  <!-- Decorative Corner Accent -->
  <path d="M848 0 L1080 0 L1080 232 Z" fill="${BRAND_COLORS.SOFT_SAGE}" opacity="0.20"/>

  <!-- Logo Header -->
  ${logoHeader}

  <!-- Category Pill Badge -->
  <rect x="718" y="62" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
  <text x="871" y="99" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.8" text-anchor="middle">${escapeXml(categoryLabel)}</text>

  <!-- Header Divider -->
  <line x1="56" y1="155" x2="1024" y2="155" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Main Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="46" fill="${BRAND_COLORS.VIRIDIAN}">
    ${calculateTspanLines(headlineLines, 56, headlineStartY, headlineLineHeight)}
  </text>

  <!-- Subtitle -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="24" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(subtitleLines, 56, subtitleStartY, 32)}
  </text>

  <!-- 5-Stage Step Cards -->
  <g transform="translate(56, 385)">
    ${renderedStagesSvg}
  </g>

  <!-- Boundary & Limits Panel -->
  <rect x="56" y="840" width="968" height="84" rx="14" fill="${BRAND_COLORS.SOFT_SAGE}" fill-opacity="0.28"/>
  <text font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="16" fill="${BRAND_COLORS.OLIVE_INK}" letter-spacing="1">
    <tspan x="84" y="872">BOUNDARY:</tspan>
    <tspan x="84" y="904">LIMITS:</tspan>
  </text>
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="18" fill="${BRAND_COLORS.OLIVE_INK}">
    <tspan x="200" y="872">${escapeXml(boundaryText)}</tspan>
    <tspan x="200" y="904">${escapeXml(limitsText)}</tspan>
  </text>

  <!-- Footer Separator -->
  <line x1="56" y1="950" x2="1024" y2="950" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Footer Takeaway -->
  <text x="56" y="995" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="600" font-size="24" fill="${BRAND_COLORS.OLIVE_INK}">
    ${escapeXml(takeawayText)}
  </text>

  <!-- Profile Logo Stamp -->
  ${renderProfileLogoSvg(946, 965, 78, 44)}
</svg>
  `.trim();
}
