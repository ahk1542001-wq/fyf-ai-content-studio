/**
 * Family 5: Album Carousel Template (1080 x 1080 per slide)
 * 4 Slide Carousel: Cover -> The Risk -> The Safe Solution -> Key Takeaway
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { renderMascotSvgVector } from '../assets/mascotDataUri';
import { AlbumCarouselProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

export function renderAlbumCarouselSvg(props: AlbumCarouselProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const slideIndex = Math.max(0, Math.min(3, props.currentSlideIndex || 0));
  const categoryLabel = props.categoryLabel || 'CAROUSEL ALBUM • FYF AI';

  const slideNumber = `0${slideIndex + 1} / 04`;

  // Render specific slide
  switch (slideIndex) {
    case 0:
      return renderSlide1Cover(props, width, height, categoryLabel, slideNumber);
    case 1:
      return renderSlide2Risk(props, width, height, categoryLabel, slideNumber);
    case 2:
      return renderSlide3Solution(props, width, height, categoryLabel, slideNumber);
    case 3:
    default:
      return renderSlide4Takeaway(props, width, height, categoryLabel, slideNumber);
  }
}

function renderSlideHeader(
  categoryLabel: string,
  slideNumber: string,
  _width: number
): string {
  return `
    <!-- Top Bar -->
    ${renderHorizontalLogoSvg(56, 52, 280, 85)}

    <!-- Category / Slide Badge -->
    <rect x="718" y="62" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="871" y="99" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">${escapeXml(categoryLabel)}</text>

    <!-- Header Divider -->
    <line x1="56" y1="155" x2="1024" y2="155" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

    <!-- Slide Index Counter Top Right of Content -->
    <rect x="910" y="180" width="114" height="40" rx="20" fill="${BRAND_COLORS.VIRIDIAN}" fill-opacity="0.15"/>
    <text x="967" y="206" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="17" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="2" text-anchor="middle">${slideNumber}</text>
  `;
}

function renderSlideFooter(tagline: string): string {
  return `
    <!-- Footer Separator -->
    <line x1="56" y1="945" x2="1024" y2="945" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

    <!-- Footer Tagline -->
    <text x="56" y="990" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.OLIVE_INK}">
      ${escapeXml(tagline)}
    </text>

    <!-- Swipe indicator hint -->
    <text x="840" y="990" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="16" fill="${BRAND_COLORS.VIRIDIAN}">
      Swipe Next ➔
    </text>

    <!-- Profile Logo Stamp -->
    ${renderProfileLogoSvg(946, 965, 78, 44)}
  `;
}

/** Slide 1: Cover Slide */
function renderSlide1Cover(
  props: AlbumCarouselProps,
  width: number,
  height: number,
  categoryLabel: string,
  slideNumber: string
): string {
  const slide1 = props.slides?.[0] || {
    title: props.headline || 'Slip ဖတ်တတ်တိုင်း Order မထုတ်ပါနဲ့။',
    subtitle: props.subtitle || 'AI OCR နဲ့ Bank Verification ကြားက ကြီးမားတဲ့ လုံခြုံရေး ကွာဟချက်',
    topicTag: 'OPERATIONAL RISK / LESSON 04',
    hookQuestion: 'Customer ပို့တဲ့ Slip ကို AI က အလိုအလျောက် Approve လုပ်မိရင် ဘာတွေ ဆုံးရှုံးနိုင်လဲ?',
  };

  const titleLines = wrapSvgText(slide1.title, { maxCharsPerLine: 28, maxLines: 2 });
  const hookLines = wrapSvgText(slide1.hookQuestion, { maxCharsPerLine: 34, maxLines: 3 });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <filter id="cardShadowCover" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="${BRAND_COLORS.OLIVE_INK}" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>
  <path d="M848 0 L1080 0 L1080 232 Z" fill="${BRAND_COLORS.SOFT_SAGE}" opacity="0.20"/>

  ${renderSlideHeader(categoryLabel, slideNumber, width)}

  <!-- Topic Tag -->
  <text x="56" y="205" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="2">
    ${escapeXml(slide1.topicTag)}
  </text>

  <!-- Big Hero Cover Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="48" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(titleLines, 56, 265, 58)}
  </text>

  <!-- Subhead -->
  <text x="56" y="415" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="24" fill="${BRAND_COLORS.VIRIDIAN}">
    ${escapeXml(slide1.subtitle)}
  </text>

  <!-- Hook Question Card with Mascot on Right -->
  <g filter="url(#cardShadowCover)">
    <rect x="56" y="475" width="620" height="425" rx="22" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>

    <rect x="86" y="515" width="160" height="34" rx="17" fill="${BRAND_COLORS.VIRIDIAN}" fill-opacity="0.15"/>
    <text x="166" y="538" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="15" fill="${BRAND_COLORS.VIRIDIAN}" text-anchor="middle">KEY QUESTION</text>

    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="600" font-size="26" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(hookLines, 86, 605, 42)}
    </text>

    <text x="86" y="855" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="${BRAND_COLORS.VIRIDIAN}">
      Swipe to see the failure breakdown ➔
    </text>
  </g>

  <!-- Mascot Presenting on Right -->
  <g filter="url(#cardShadowCover)">
    <rect x="700" y="475" width="324" height="425" rx="22" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>
    ${renderMascotSvgVector(742, 510, 240, 290)}
  </g>

  ${renderSlideFooter(props.subtitle || 'Understand AI. Build Real Systems.')}
</svg>
  `.trim();
}

/** Slide 2: The Problem / Risk */
function renderSlide2Risk(
  props: AlbumCarouselProps,
  width: number,
  height: number,
  categoryLabel: string,
  slideNumber: string
): string {
  const slide2 = props.slides?.[1] || {
    title: 'ဖြစ်တတ်သော အမှား • The False Automation',
    problemStep1: { number: '01', title: 'Customer Slip ပို့လာခြင်း', desc: 'Customer ဆီက Mobile Banking Slip ရောက်လာတယ်။' },
    problemStep2: { number: '02', title: 'AI OCR မှားယွင်း အတည်ပြုခြင်း', desc: 'OCR က Slip ပေါ်က စာသားကို ဖတ်ပြီး ဘဏ်မစစ်ဘဲ Order "Paid" အဖြစ် အလိုအလျောက် ပြောင်းမိခြင်း။' },
    riskWarning: 'သတိပြုရန်: AI OCR သည် စာဖတ်ပေးနိုင်သော်လည်း ဘဏ်ထဲ ငွေတကယ်ဝင်မဝင်ကို မသိနိုင်ပါ။',
  };

  const warningLines = wrapSvgText(slide2.riskWarning, { maxCharsPerLine: 46, maxLines: 2 });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>
  ${renderSlideHeader(categoryLabel, slideNumber, width)}

  <!-- Section Title -->
  <text x="56" y="215" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="40" fill="${BRAND_COLORS.OLIVE_INK}">
    ${escapeXml(slide2.title)}
  </text>

  <!-- Problem Step 1 Card -->
  <g>
    <rect x="56" y="265" width="968" height="175" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>
    <rect x="96" y="310" width="80" height="80" rx="16" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="136" y="360" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="28" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${slide2.problemStep1.number}</text>
    <text x="210" y="325" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="24" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide2.problemStep1.title)}</text>
    <text x="210" y="370" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide2.problemStep1.desc)}</text>
  </g>

  <!-- Down Arrow -->
  <line x1="540" y1="445" x2="540" y2="475" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="3" stroke-dasharray="4,4"/>

  <!-- Problem Step 2 Card (Warning Red Highlight) -->
  <g>
    <rect x="56" y="480" width="968" height="175" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="#EF4444" stroke-width="2" stroke-opacity="0.8"/>
    <rect x="96" y="525" width="80" height="80" rx="16" fill="#EF4444"/>
    <text x="136" y="575" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="28" fill="${BRAND_COLORS.SURFACE_WHITE}" text-anchor="middle">${slide2.problemStep2.number}</text>
    <text x="210" y="540" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="24" fill="#EF4444">${escapeXml(slide2.problemStep2.title)}</text>
    <text x="210" y="585" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="20" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide2.problemStep2.desc)}</text>
  </g>

  <!-- Risk Warning Banner -->
  <rect x="56" y="695" width="968" height="185" rx="18" fill="#EF4444" fill-opacity="0.10" stroke="#EF4444" stroke-width="1.5"/>
  <text x="96" y="745" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="20" fill="#EF4444" letter-spacing="1">⚠️ OPERATIONAL RISK</text>
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="21" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(warningLines, 96, 795, 34)}
  </text>

  ${renderSlideFooter('Next: Safe Human-in-the-loop System ➔')}
</svg>
  `.trim();
}

/** Slide 3: The Safe Solution */
function renderSlide3Solution(
  props: AlbumCarouselProps,
  width: number,
  height: number,
  categoryLabel: string,
  slideNumber: string
): string {
  const slide3 = props.slides?.[2] || {
    title: 'မှန်ကန်သော စနစ် • The Safe FYF Workflow',
    solutionStep1: { number: '03', title: 'AI Extraction', desc: 'AI က Slip ပေါ်က Amount နဲ့ Txn ID ကို စာရင်းထဲ ကူးယူပေးမယ်။' },
    solutionStep2: { number: '04', title: 'Human Verification Gate', desc: 'ဘဏ် Statement / SMS နဲ့ တကယ် ငွေဝင်မဝင် လူက ပြန်စစ်ပြီး Confirm မယ်။', isHumanApproval: true },
    solutionStep3: { number: '05', title: 'Verified Dispatch', desc: 'အတည်ပြုပြီးမှ Warehouse က Delivery ထုတ်ပေးမယ်။' },
  };

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>
  ${renderSlideHeader(categoryLabel, slideNumber, width)}

  <text x="56" y="215" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="40" fill="${BRAND_COLORS.VIRIDIAN}">
    ${escapeXml(slide3.title)}
  </text>

  <!-- Step 03 -->
  <g>
    <rect x="56" y="265" width="968" height="160" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>
    <circle cx="120" cy="345" r="30" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="120" y="354" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${slide3.solutionStep1.number}</text>
    <text x="180" y="325" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.VIRIDIAN}">${escapeXml(slide3.solutionStep1.title)}</text>
    <text x="180" y="365" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide3.solutionStep1.desc)}</text>
  </g>

  <!-- Step 04: Human Approval Highlighted in Viridian -->
  <g>
    <rect x="56" y="450" width="968" height="185" rx="20" fill="${BRAND_COLORS.VIRIDIAN}" fill-opacity="0.10" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2.5"/>
    <circle cx="120" cy="542" r="34" fill="${BRAND_COLORS.VIRIDIAN}"/>
    <text x="120" y="551" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="24" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${slide3.solutionStep2.number}</text>
    <rect x="180" y="480" width="220" height="28" rx="14" fill="${BRAND_COLORS.VIRIDIAN}"/>
    <text x="290" y="499" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="13" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">HUMAN APPROVAL GATE</text>
    <text x="180" y="540" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="24" fill="${BRAND_COLORS.VIRIDIAN}">${escapeXml(slide3.solutionStep2.title)}</text>
    <text x="180" y="582" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide3.solutionStep2.desc)}</text>
  </g>

  <!-- Step 05 -->
  <g>
    <rect x="56" y="660" width="968" height="160" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5" stroke-opacity="0.5"/>
    <circle cx="120" cy="740" r="30" fill="${BRAND_COLORS.OLIVE_INK}"/>
    <text x="120" y="749" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">${slide3.solutionStep3.number}</text>
    <text x="180" y="720" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.VIRIDIAN}">${escapeXml(slide3.solutionStep3.title)}</text>
    <text x="180" y="760" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide3.solutionStep3.desc)}</text>
  </g>

  ${renderSlideFooter('Next: Key Takeaway & Manifesto ➔')}
</svg>
  `.trim();
}

/** Slide 4: Key Takeaway / Manifesto */
function renderSlide4Takeaway(
  props: AlbumCarouselProps,
  width: number,
  height: number,
  categoryLabel: string,
  slideNumber: string
): string {
  const slide4 = props.slides?.[3] || {
    quoteText: 'AI ကို Data ဖတ်ခိုင်းပါ။ ငွေကြေးနဲ့ ပစ္စည်းထုတ်ပေးတဲ့ အတည်ပြုချက်ကိုတော့ လူက စစ်ပါ။',
    boundaryRule: 'AI က OCR Data Extraction အထိသာ လုပ်ဆောင်မည်။',
    limitRule: 'ဘဏ်ငွေဝင်ကြောင်း သေချာမှု မရှိလျှင် ပစ္စည်းမထုတ်ပေးရ။',
    tagline: 'Understand AI. Build Real Systems.',
  };

  const quoteLines = wrapSvgText(slide4.quoteText, { maxCharsPerLine: 26, maxLines: 3 });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>
  ${renderSlideHeader(categoryLabel, slideNumber, width)}

  <!-- Big Quote Card -->
  <g>
    <rect x="56" y="225" width="968" height="420" rx="22" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2"/>

    <!-- Large Quote Mark -->
    <text x="100" y="305" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="72" fill="${BRAND_COLORS.VIRIDIAN}" opacity="0.25">“</text>

    <!-- Quote Body -->
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="34" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(quoteLines, 100, 360, 52)}
    </text>

    <!-- Tagline inside quote card -->
    <text x="100" y="595" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.VIRIDIAN}">
      — FYF AI Systems Philosophy
    </text>
  </g>

  <!-- Boundary & Limits Summary -->
  <g transform="translate(56, 675)">
    <rect x="0" y="0" width="968" height="190" rx="18" fill="${BRAND_COLORS.SOFT_SAGE}" fill-opacity="0.25"/>
    <text x="40" y="45" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="${BRAND_COLORS.VIRIDIAN}" letter-spacing="1">SYSTEM BOUNDARY:</text>
    <text x="260" y="45" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide4.boundaryRule)}</text>

    <line x1="40" y1="85" x2="928" y2="85" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="1" opacity="0.15"/>

    <text x="40" y="135" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="#EF4444" letter-spacing="1">SYSTEM LIMIT:</text>
    <text x="200" y="135" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">${escapeXml(slide4.limitRule)}</text>
  </g>

  ${renderSlideFooter('Save & Share this post 🔖')}
</svg>
  `.trim();
}
