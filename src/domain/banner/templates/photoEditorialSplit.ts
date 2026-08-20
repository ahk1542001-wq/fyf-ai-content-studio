/**
 * Family 3: Photo Generation & Editorial Split Template (1080 x 1080)
 * 50/50 Split: Top Photo Frame (1080x540) + Bottom Warm Ivory Brand Panel (1080x540)
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { PhotoEditorialSplitProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

const DEFAULT_BODY_LINES = [
  'AI ဖြင့် ဖန်တီးထားသော အမြင်ဆိုင်ရာ အထောက်အထားနှင့် စနစ်ရှင်းလင်းချက်။',
  'Brand Guidelines နှင့် ညီညွတ်သော ဖွဲ့စည်းပုံဖြင့် အချက်အလက်များကို တင်ပြထားသည်။',
];

export function renderPhotoEditorialSplitSvg(props: PhotoEditorialSplitProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'EDITORIAL • SPLIT';

  const photoLabel = props.photoLabel || 'PHOTO PLAN: [APPROVED REFERENCE / BRAND GUIDED]';
  const photoStatus = props.photoStatus || 'SAMPLE LAYOUT';

  const headline = props.headline || props.burmeseTitle || 'လက်တွေ့အသုံးချ AI စနစ်နှင့် အမြင်ဒီဇိုင်း';
  const headlineLines = wrapSvgText(headline, {
    maxCharsPerLine: 36,
    maxLines: 2,
  });

  const bodyInputLines = (props.burmeseBodyLines && props.burmeseBodyLines.length > 0)
    ? props.burmeseBodyLines
    : (props.subtitle ? [props.subtitle] : DEFAULT_BODY_LINES);

  const wrappedBodyLines: string[] = [];
  for (const rawLine of bodyInputLines) {
    const wrapped = wrapSvgText(rawLine, { maxCharsPerLine: 48, maxLines: 2 });
    wrappedBodyLines.push(...wrapped);
  }
  const finalBodyLines = wrappedBodyLines.slice(0, 4);

  const referenceNote = props.referenceNote || 'REFERENCE MODE: High-fidelity brand editorial split';

  const logoBottom = props.customLogoSvg || renderHorizontalLogoSvg(56, 565, 250, 76);

  const photoContent = props.photoDataUri
    ? `<image href="${escapeXml(props.photoDataUri)}" x="0" y="0" width="${width}" height="540" preserveAspectRatio="xMidYMid slice"/>`
    : `
      <!-- Camera/Editorial Grid Mockup -->
      <g stroke="${BRAND_COLORS.SOFT_SAGE}" opacity="0.35" stroke-width="1.5">
        <line x1="360" y1="40" x2="360" y2="500"/>
        <line x1="720" y1="40" x2="720" y2="500"/>
        <line x1="40" y1="180" x2="1040" y2="180"/>
        <line x1="40" y1="360" x2="1040" y2="360"/>
        <!-- Focus Crosshairs -->
        <circle cx="540" cy="270" r="48" fill="none" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2" opacity="0.7"/>
        <line x1="510" y1="270" x2="570" y2="270" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2" opacity="0.7"/>
        <line x1="540" y1="240" x2="540" y2="300" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2" opacity="0.7"/>
      </g>
      <!-- Center Placeholder Label -->
      <text x="540" y="340" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.SOFT_SAGE}" opacity="0.8" letter-spacing="2" text-anchor="middle">
        AI VISUAL GENERATION FRAME
      </text>
    `;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(headline)}</title>
  <desc id="desc">50/50 Editorial photo and brand typography split banner.</desc>

  <!-- TOP HALF: Photo Frame (0 to 540) -->
  <g id="photo-frame">
    <rect x="0" y="0" width="${width}" height="540" fill="${BRAND_COLORS.DARK_OLIVE_SURFACE}"/>
    ${photoContent}

    <!-- Outer Frame Guidelines -->
    <rect x="40" y="40" width="1000" height="460" fill="none" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.45"/>

    <!-- Status Bar Overlay -->
    <rect x="56" y="56" width="968" height="64" rx="12" fill="${BRAND_COLORS.OLIVE_INK}" fill-opacity="0.88"/>
    <text x="84" y="96" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="1">
      ${escapeXml(photoLabel)}
    </text>
    <rect x="870" y="70" width="138" height="36" rx="18" fill="${BRAND_COLORS.VIRIDIAN}"/>
    <text x="939" y="94" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1" text-anchor="middle">
      ${escapeXml(photoStatus)}
    </text>
  </g>

  <!-- Split Divider Accent -->
  <rect x="0" y="536" width="${width}" height="8" fill="${BRAND_COLORS.VIRIDIAN}"/>

  <!-- BOTTOM HALF: Warm Ivory Brand Typography Panel (540 to 1080) -->
  <g id="brand-panel">
    <rect x="0" y="544" width="${width}" height="536" fill="${BRAND_COLORS.WARM_IVORY}"/>

    <!-- Logo on Bottom Panel -->
    ${logoBottom}

    <!-- Category Tag Pill -->
    <rect x="740" y="575" width="284" height="50" rx="25" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="882" y="607" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="19" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">
      ${escapeXml(categoryLabel)}
    </text>

    <!-- Viridian Accent Bar -->
    <rect x="56" y="660" width="80" height="5" rx="2.5" fill="${BRAND_COLORS.VIRIDIAN}"/>

    <!-- Main Headline -->
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="44" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(headlineLines, 56, 715, 54)}
    </text>

    <!-- Body Text Lines -->
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="25" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(finalBodyLines, 56, 825, 38)}
    </text>

    <!-- Bottom Footer Note -->
    <line x1="56" y1="985" x2="1024" y2="985" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="1.5" opacity="0.22"/>
    <text x="56" y="1025" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="400" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">
      ${escapeXml(referenceNote)}
    </text>

    <!-- Profile Logo Stamp -->
    ${renderProfileLogoSvg(946, 995, 78, 44)}
  </g>
</svg>
  `.trim();
}
