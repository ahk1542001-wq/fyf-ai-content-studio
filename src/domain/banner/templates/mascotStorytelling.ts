/**
 * Family: Tactile Mascot Storytelling Template (1080 x 1080)
 * Hero Origami Puck Mascot in action with speech dialogue bubble and comparison lesson cards.
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { renderMascotSvgVector } from '../assets/mascotDataUri';
import { MascotStorytellingProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

export function renderMascotStorytellingSvg(props: MascotStorytellingProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'MASCOT STORY • FYF AI';
  const headline = props.headline || 'သတိပြုရန်: AI ဖတ်တဲ့ စာတိုင်းကို အမှန်မထင်ပါနဲ့။';
  const headlineLines = wrapSvgText(headline, { maxCharsPerLine: 34, maxLines: 2 });
  const mascotQuote = props.mascotQuote || '“Slip ပေါ်က စာဖတ်တာက AI အလုပ်၊ ဘဏ်ထဲ ငွေတကယ်ဝင်မဝင် စစ်တာက မင်းရဲ့ အလုပ်!”';
  const quoteLines = wrapSvgText(mascotQuote, { maxCharsPerLine: 26, maxLines: 4 });

  const points = props.points || [
    { title: 'The Illusion (ထင်ယောင်ထင်မှား)', desc: 'AI က Slip ပေါ်က Text ကို 100% တိကျစွာ OCR ဖတ်ပြနိုင်တယ်။' },
    { title: 'The Risk (ဆုံးရှုံးနိုင်ခြေ)', desc: 'ဒါပေမဲ့ Fake Slip သို့မဟုတ် Edit ထားတဲ့ ပုံဆိုရင် AI က မသိနိုင်ပါ။' },
    { title: 'The Rule (အခြေခံစည်းမျဉ်း)', desc: 'ဘဏ် Statement နဲ့ လူက Confirm ပြီးမှ ပစ္စည်းထုတ်ပေးပါ။' },
  ];

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <filter id="storyCardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="${BRAND_COLORS.OLIVE_INK}" flood-opacity="0.10"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>

  <!-- Soft Accent Glow Arc -->
  <circle cx="850" cy="500" r="320" fill="${BRAND_COLORS.SOFT_SAGE}" opacity="0.25"/>

  <!-- Header -->
  ${renderHorizontalLogoSvg(56, 52, 280, 85)}

  <rect x="718" y="62" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
  <text x="871" y="99" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">${escapeXml(categoryLabel)}</text>

  <line x1="56" y1="155" x2="1024" y2="155" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="44" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(headlineLines, 56, 225, 54)}
  </text>

  <!-- Left Column: 3 Story Cards -->
  <g transform="translate(56, 310)">
    ${points.map((pt, idx) => {
      const y = idx * 160;
      const isLast = idx === 2;
      const descLines = wrapSvgText(pt.desc, { maxCharsPerLine: 28, maxLines: 2 });
      return `
        <g transform="translate(0, ${y})">
          <rect width="480" height="145" rx="18" fill="${isLast ? `${BRAND_COLORS.VIRIDIAN}12` : BRAND_COLORS.SURFACE_WHITE}" stroke="${isLast ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}60`}" stroke-width="${isLast ? '2' : '1.5'}"/>
          <circle cx="36" cy="38" r="16" fill="${isLast ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK}"/>
          <text x="36" y="44" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="15" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${idx + 1}</text>
          <text x="68" y="44" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="19" fill="${isLast ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK}">${escapeXml(pt.title)}</text>
          <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="17" fill="${BRAND_COLORS.OLIVE_INK}">
            ${calculateTspanLines(descLines, 24, 80, 26)}
          </text>
        </g>
      `;
    }).join('')}
  </g>

  <!-- Right Column: Hero Mascot Showcase with Speech Bubble -->
  <g transform="translate(580, 310)" filter="url(#storyCardShadow)">
    <!-- Mascot Container Card -->
    <rect width="444" height="465" rx="24" fill="${BRAND_COLORS.SURFACE_WHITE}" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5"/>

    <!-- Mascot Master Graphic Centered (Proper Coordinates) -->
    ${renderMascotSvgVector(102, 20, 240, 240)}

    <!-- Speech Dialogue Bubble -->
    <g transform="translate(24, 270)">
      <rect width="396" height="175" rx="16" fill="${BRAND_COLORS.WARM_IVORY}" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="1.5"/>
      <polygon points="198,0 215,-14 225,0" fill="${BRAND_COLORS.WARM_IVORY}" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="1.5"/>
      <polygon points="199,1 215,-12 224,1" fill="${BRAND_COLORS.WARM_IVORY}"/>

      <text x="20" y="32" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="1">PUCK'S GOLDEN RULE</text>
      <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="600" font-size="17" fill="${BRAND_COLORS.OLIVE_INK}">
        ${calculateTspanLines(quoteLines, 20, 62, 26)}
      </text>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(56, 805)">
    <rect width="968" height="110" rx="18" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="32" y="44" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="15" fill="${BRAND_COLORS.SOFT_SAGE}" letter-spacing="1">TAKEAWAY</text>
    <text x="32" y="78" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="600" font-size="22" fill="${BRAND_COLORS.WARM_IVORY}">
      ${escapeXml(props.takeaway || 'Understand AI. Build Real Systems.')}
    </text>
    <text x="936" y="66" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="28" fill="${BRAND_COLORS.VIRIDIAN}" text-anchor="end">➔</text>
  </g>

  <!-- Footer Separator & Logo -->
  <line x1="56" y1="950" x2="1024" y2="950" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>
  <text x="56" y="995" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.OLIVE_INK}">
    Understand AI. Build Real Systems.
  </text>
  ${renderProfileLogoSvg(946, 965, 78, 44)}
</svg>
  `.trim();
}
