/**
 * Family 2: Knowledge & Frameworks Template (1080 x 1080)
 * Hero Headline + 3 Numbered Point Cards + Presenting 3D Mascot Card + Key Idea Box
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { renderMascotSvgVector } from '../assets/mascotDataUri';
import { KnowledgeFrameworkProps, KnowledgeFrameworkPoint } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

const DEFAULT_POINTS: KnowledgeFrameworkPoint[] = [
  { number: 1, title: 'Context & Goal', description: 'AI မစခင် Input၊ စည်းမျဉ်းနဲ့ ဒေတာကို ရှင်းအောင်သတ်မှတ်ပါ။' },
  { number: 2, title: 'Decision Boundary', description: 'AI အကြံပေးနိုင်တဲ့ အတိုင်းအတာနဲ့ လူက စစ်ရမယ့်အပိုင်း ခွဲခြားပါ။' },
  { number: 3, title: 'Verified Output', description: 'စစ်ဆေးပြီးမှသာ External Action သို့မဟုတ် Customer ဆီ ပို့ပါ။' },
];

export function renderKnowledgeFrameworkSvg(props: KnowledgeFrameworkProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'KNOWLEDGE • FRAMEWORK';
  const topicSequence = props.topicSequence || 'SYSTEM THINKING / 01';

  const headline = props.headline || 'AI Agent ကို အလုပ်ပေးပါ။ Control ကိုတော့ မပေးလိုက်ပါနဲ့။';
  const headlineLines = wrapSvgText(headline, {
    maxCharsPerLine: 34,
    maxLines: 2,
  });

  const points = (props.points && props.points.length > 0) ? props.points.slice(0, 3) : DEFAULT_POINTS;

  const renderedPointsSvg = points
    .map((pt, idx) => {
      const cardY = 340 + idx * 160;
      const centerY = cardY + 70;
      const titleY = cardY + 44;
      const descY = cardY + 76;

      const descLines = wrapSvgText(pt.description, { maxCharsPerLine: 38, maxLines: 2 });

      return `
      <!-- Point Card ${pt.number} -->
      <g>
        <rect x="56" y="${cardY}" width="620" height="145" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>
        <!-- Number Circle -->
        <circle cx="104" cy="${centerY}" r="26" fill="${BRAND_COLORS.VIRIDIAN}"/>
        <text x="104" y="${centerY + 8}" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${pt.number}</text>
        <!-- Title -->
        <text x="146" y="${titleY}" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.VIRIDIAN}">${escapeXml(pt.title)}</text>
        <!-- Description -->
        <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="18" fill="${BRAND_COLORS.OLIVE_INK}">
          ${calculateTspanLines(descLines, 146, descY, 26)}
        </text>
      </g>
      `.trim();
    })
    .join('\n');

  const keyIdeaTitle = props.keyIdeaTitle || 'KEY IDEA';
  const keyIdeaText = props.keyIdeaText || 'AI ကို အလုပ်လုပ်ခိုင်းပါ။ စီးပွားရေးဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။';
  const keyIdeaLines = wrapSvgText(keyIdeaText, { maxCharsPerLine: 28, maxLines: 4 });

  const footerTagline = props.footerTagline || 'Understand AI. Build Real Systems.';
  const logoHeader = props.customLogoSvg || renderHorizontalLogoSvg(56, 52, 280, 85);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(headline)}</title>
  <desc id="desc">Knowledge framework with teaching point cards, mascot guide, and key idea takeaway.</desc>
  <defs>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="${BRAND_COLORS.OLIVE_INK}" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>

  <!-- Decorative Accent -->
  <path d="M848 0 L1080 0 L1080 232 Z" fill="${BRAND_COLORS.SOFT_SAGE}" opacity="0.20"/>

  <!-- Logo Header -->
  ${logoHeader}

  <!-- Category Badge -->
  <rect x="718" y="62" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
  <text x="871" y="99" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">${escapeXml(categoryLabel)}</text>

  <!-- Header Divider -->
  <line x1="56" y1="155" x2="1024" y2="155" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Topic Sequence Tag -->
  <text x="56" y="195" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="2">
    ${escapeXml(topicSequence)}
  </text>

  <!-- Hero Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="44" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(headlineLines, 56, 245, 54)}
  </text>

  <!-- Left Column: 3 Numbered Point Cards -->
  ${renderedPointsSvg}

  <!-- Right Column: Mascot & Key Idea Card -->
  <g filter="url(#cardShadow)">
    <rect x="700" y="340" width="324" height="465" rx="22" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>

    <!-- 3D Origami Mascot Graphic Centered -->
    ${renderMascotSvgVector(742, 350, 240, 260)}

    <!-- Key Idea Highlight Box inside Card -->
    <rect x="716" y="620" width="292" height="165" rx="16" fill="${BRAND_COLORS.SOFT_SAGE}" fill-opacity="0.25"/>
    <text x="732" y="652" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="16" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="1">${escapeXml(keyIdeaTitle)}</text>
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="17" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(keyIdeaLines, 732, 684, 25)}
    </text>
  </g>

  <!-- Footer Separator -->
  <line x1="56" y1="945" x2="1024" y2="945" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Footer Tagline -->
  <text x="56" y="990" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.OLIVE_INK}">
    ${escapeXml(footerTagline)}
  </text>

  <!-- Profile Logo Stamp -->
  ${renderProfileLogoSvg(946, 965, 78, 44)}
</svg>
  `.trim();
}
