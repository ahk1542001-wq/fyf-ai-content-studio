/**
 * Family: 3D Isometric "Glass & Matte" Miniature System (1080 x 1080)
 * Stripe / Apple inspired tactile 3D diorama with floating glass nodes, Viridian energy streams, and checkpoint gates.
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { renderMascotSvgVector } from '../assets/mascotDataUri';
import { IsometricSystemDioramaProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

export function renderIsometricSystemDioramaSvg(props: IsometricSystemDioramaProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || '3D SYSTEM DIORAMA • FYF AI';
  const headline = props.headline || 'လုပ်ငန်းခွင်သုံး AI စနစ်နှင့် လူစစ်ဆေးမှု Checkpoint';
  const headlineLines = wrapSvgText(headline, { maxCharsPerLine: 34, maxLines: 2 });
  const subtext = props.subtext || 'Data ဝင်ရောက်ခြင်း ➔ AI ခွဲခြမ်းစိတ်ဖြာခြင်း ➔ လူကိုယ်တိုင် အတည်ပြုခြင်း ➔ ပြင်ပသို့ ထုတ်ပေးခြင်း';
  const subtextLines = wrapSvgText(subtext, { maxCharsPerLine: 46, maxLines: 2 });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <!-- Gradients for 3D Isometric Facets -->
    <linearGradient id="isoBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EAE3D2"/>
      <stop offset="100%" stop-color="#DDD3BF"/>
    </linearGradient>
    <linearGradient id="glassTop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#F4F0E6" stop-opacity="0.75"/>
    </linearGradient>
    <linearGradient id="viridianGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16856B"/>
      <stop offset="100%" stop-color="#0E5E4B"/>
    </linearGradient>
    <filter id="isoShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${BRAND_COLORS.OLIVE_INK}" flood-opacity="0.14"/>
    </filter>
    <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Warm Ivory Canvas -->
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>

  <!-- Subtle Blueprint Grid Pattern -->
  <g stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1" opacity="0.25">
    <line x1="0" y1="180" x2="1080" y2="180"/>
    <line x1="0" y1="360" x2="1080" y2="360"/>
    <line x1="0" y1="540" x2="1080" y2="540"/>
    <line x1="0" y1="720" x2="1080" y2="720"/>
    <line x1="0" y1="900" x2="1080" y2="900"/>
    <line x1="180" y1="0" x2="180" y2="1080"/>
    <line x1="360" y1="0" x2="360" y2="1080"/>
    <line x1="540" y1="0" x2="540" y2="1080"/>
    <line x1="720" y1="0" x2="720" y2="1080"/>
    <line x1="900" y1="0" x2="900" y2="1080"/>
  </g>

  <!-- Header Section -->
  ${renderHorizontalLogoSvg(56, 52, 280, 85)}

  <!-- Category Badge -->
  <rect x="718" y="62" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
  <text x="871" y="99" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="18" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">${escapeXml(categoryLabel)}</text>

  <line x1="56" y1="155" x2="1024" y2="155" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="44" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(headlineLines, 56, 225, 54)}
  </text>

  <!-- 3D Isometric Platform (Main Centerpiece) -->
  <g transform="translate(540, 525)" filter="url(#isoShadow)">
    <!-- Base Platform Shadow -->
    <polygon points="0,170 380,30 0,-110 -380,30" fill="${BRAND_COLORS.OLIVE_INK}" opacity="0.10"/>

    <!-- Bottom Base Slab -->
    <polygon points="-380,30 0,170 0,200 -380,60" fill="#C9BDA4"/>
    <polygon points="0,170 380,30 380,60 0,200" fill="#B8AB90"/>
    <polygon points="0,-110 380,30 0,170 -380,30" fill="url(#isoBaseGrad)" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="2"/>

    <!-- Isometric Glowing Energy Pipes (Viridian Data Highway) -->
    <path d="M-260,-40 L-100,20 L100,-60 L260,0" fill="none" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="8" stroke-linecap="round" filter="url(#glowEffect)"/>
    <path d="M-260,-40 L-100,20 L100,-60 L260,0" fill="none" stroke="#A8B7A2" stroke-width="3" stroke-linecap="round"/>

    <!-- Isometric Node 1: Ingestion Pillar (Left) -->
    <g transform="translate(-240, -50)">
      <polygon points="-50,0 0,25 0,70 -50,45" fill="#30382C" opacity="0.85"/>
      <polygon points="0,25 50,0 50,45 0,70" fill="#242B21" opacity="0.95"/>
      <polygon points="0,-25 50,0 0,25 -50,0" fill="url(#glassTop)" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2"/>
      <text x="0" y="5" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.OLIVE_INK}" text-anchor="middle">01 INPUT</text>
      <circle cx="0" cy="-35" r="14" fill="${BRAND_COLORS.VIRIDIAN}"/>
      <text x="0" y="-30" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="11" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">DATA</text>
    </g>

    <!-- Isometric Node 2: AI Processing Cube (Center Left) -->
    <g transform="translate(-80, 10)">
      <polygon points="-60,0 0,30 0,90 -60,60" fill="#16856B" opacity="0.75"/>
      <polygon points="0,30 60,0 60,60 0,90" fill="#0E5E4B" opacity="0.90"/>
      <polygon points="0,-30 60,0 0,30 -60,0" fill="url(#glassTop)" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2.5"/>
      <text x="0" y="5" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.VIRIDIAN}" text-anchor="middle">02 AI MODEL</text>
    </g>

    <!-- Isometric Node 3: HUMAN VERIFICATION GATE (Hero Center Tower) -->
    <g transform="translate(90, -70)">
      <polygon points="-75,0 0,38 0,120 -75,82" fill="url(#viridianGlow)"/>
      <polygon points="0,38 75,0 75,82 0,120" fill="#0A4234"/>
      <polygon points="0,-38 75,0 0,38 -75,0" fill="#FFFFFF" stroke="${BRAND_COLORS.WARM_IVORY}" stroke-width="3"/>
      <rect x="-60" y="-12" width="120" height="24" rx="12" fill="${BRAND_COLORS.VIRIDIAN}"/>
      <text x="0" y="5" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="12" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">03 HUMAN GATE</text>

      <circle cx="0" cy="-60" r="28" fill="${BRAND_COLORS.SURFACE_WHITE}" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="3" filter="url(#glowEffect)"/>
      <text x="0" y="-52" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="800" font-size="22" fill="${BRAND_COLORS.VIRIDIAN}" text-anchor="middle">✓</text>
    </g>

    <!-- Isometric Node 4: Verified Output Platform (Right) -->
    <g transform="translate(260, -10)">
      <polygon points="-50,0 0,25 0,70 -50,45" fill="#30382C" opacity="0.85"/>
      <polygon points="0,25 50,0 50,45 0,70" fill="#242B21" opacity="0.95"/>
      <polygon points="0,-25 50,0 0,25 -50,0" fill="url(#glassTop)" stroke="${BRAND_COLORS.VIRIDIAN}" stroke-width="2"/>
      <text x="0" y="5" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.OLIVE_INK}" text-anchor="middle">04 ACTION</text>
      <circle cx="0" cy="-35" r="14" fill="${BRAND_COLORS.VIRIDIAN}"/>
      <text x="0" y="-30" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="10" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">DISPATCH</text>
    </g>

    <!-- Mascot Standing at the Control Platform -->
    <g transform="translate(-180, 20)">
      ${renderMascotSvgVector(0, 0, 160, 180)}
    </g>
  </g>

  <!-- Lower Callout Panel -->
  <g transform="translate(56, 805)">
    <rect width="968" height="120" rx="18" fill="${BRAND_COLORS.SURFACE_WHITE}" opacity="0.95" stroke="${BRAND_COLORS.SOFT_SAGE}" stroke-width="1.5"/>
    <rect x="24" y="24" width="160" height="32" rx="16" fill="${BRAND_COLORS.VIRIDIAN}"/>
    <text x="104" y="46" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.WARM_IVORY}" text-anchor="middle">CORE PRINCIPLE</text>
    <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="19" fill="${BRAND_COLORS.OLIVE_INK}">
      ${calculateTspanLines(subtextLines, 204, 48, 28)}
    </text>
  </g>

  <!-- Footer -->
  <line x1="56" y1="950" x2="1024" y2="950" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>
  <text x="56" y="995" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.OLIVE_INK}">
    Understand AI. Build Real Systems.
  </text>
  ${renderProfileLogoSvg(946, 965, 78, 44)}
</svg>
  `.trim();
}
