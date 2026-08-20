/**
 * Family: Dark Tech Studio Blueprint / Circuit Architecture (1080 x 1080)
 * Deep charcoal background with glowing Viridian laser tracing lines, circuit nodes, and holographic data stream cards.
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderProfileLogoSvg } from '../assets/logoVectors';
import { DarkBlueprintCircuitProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

export function renderDarkBlueprintCircuitSvg(props: DarkBlueprintCircuitProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'SYSTEM ARCHITECTURE • BLUEPRINT';
  const headline = props.headline || 'Production AI Architecture: လူစစ်ဆေးမှု Gate စနစ်';
  const headlineLines = wrapSvgText(headline, { maxCharsPerLine: 32, maxLines: 2 });
  const architectureNodes = props.nodes || [
    { tag: '01_INGEST', title: 'Input Stream', desc: 'အော်ဒါ၊ စာရင်းနှင့် Slip အချက်အလက်များ', status: 'LIVE_OK' },
    { tag: '02_INFERENCE', title: 'LLM Extraction', desc: 'AI မှ ဒေတာ အချက်အလက် ခွဲထုတ်ခြင်း', status: '99.4% ACC' },
    { tag: '03_GATEWAY', title: 'Human Review Gate', desc: 'လူကိုယ်တိုင် စစ်ဆေးအတည်ပြုချက် ရယူခြင်း', status: 'PROTECTED', isHighlight: true },
    { tag: '04_DISPATCH', title: 'System Dispatch', desc: 'ဘဏ်စာရင်းနှင့် ERP သို့ စာရင်းသွင်းခြင်း', status: 'RESTRICTED' },
  ];

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <linearGradient id="darkBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141913"/>
      <stop offset="100%" stop-color="#1F271D"/>
    </linearGradient>
    <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Deep Dark Studio Canvas -->
  <rect width="${width}" height="${height}" fill="url(#darkBgGrad)"/>

  <!-- Circuit Matrix Grid -->
  <g stroke="#16856B" stroke-width="0.8" opacity="0.18">
    ${Array.from({ length: 12 }).map((_, i) => `<line x1="${i * 90}" y1="0" x2="${i * 90}" y2="1080"/>`).join('')}
    ${Array.from({ length: 12 }).map((_, i) => `<line x1="0" y1="${i * 90}" x2="1080" y2="${i * 90}"/>`).join('')}
  </g>

  <!-- Glowing Laser Tracing Highways -->
  <path d="M120,430 H960" stroke="#16856B" stroke-width="4" filter="url(#laserGlow)"/>
  <path d="M120,430 H960" stroke="#FFFFFF" stroke-width="1.5" opacity="0.9"/>
  <path d="M540,430 V690" stroke="#16856B" stroke-width="3" stroke-dasharray="6,6" opacity="0.6"/>

  <!-- Top Navigation / Brand Bar -->
  <g transform="translate(56, 52)">
    <text x="0" y="38" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="900" font-size="34" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1">
      FYF<tspan fill="#22C55E">.AI</tspan>
    </text>
    <text x="0" y="62" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="600" font-size="12" fill="${BRAND_COLORS.SOFT_SAGE}" letter-spacing="3">
      FOR YOUR FUTURE
    </text>
  </g>

  <!-- Category Badge -->
  <rect x="718" y="62" width="306" height="48" rx="24" fill="#16856B" fill-opacity="0.25" stroke="#16856B" stroke-width="1.5"/>
  <text x="871" y="93" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="15" fill="#22C55E" letter-spacing="1.5" text-anchor="middle">${escapeXml(categoryLabel)}</text>

  <line x1="56" y1="150" x2="1024" y2="150" stroke="#30382C" stroke-width="2"/>

  <!-- Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="42" fill="${BRAND_COLORS.WARM_IVORY}">
    ${calculateTspanLines(headlineLines, 56, 215, 52)}
  </text>

  <!-- 4 Circuit Architecture Node Cards -->
  <g transform="translate(56, 315)">
    ${architectureNodes.map((n, idx) => {
      const x = (idx % 2) * 490;
      const y = Math.floor(idx / 2) * 230;
      const isHero = n.isHighlight;
      const descLines = wrapSvgText(n.desc, { maxCharsPerLine: 28, maxLines: 2 });
      return `
        <g transform="translate(${x}, ${y})">
          <rect width="470" height="205" rx="16" fill="${isHero ? '#1B382B' : '#182017'}" stroke="${isHero ? '#22C55E' : '#30382C'}" stroke-width="${isHero ? '2.5' : '1.5'}" ${isHero ? 'filter="url(#laserGlow)"' : ''}/>

          <rect x="24" y="22" width="110" height="26" rx="13" fill="${isHero ? '#22C55E' : '#30382C'}"/>
          <text x="79" y="40" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="12" fill="${isHero ? '#141913' : BRAND_COLORS.SOFT_SAGE}" text-anchor="middle">${escapeXml(n.tag)}</text>

          <rect x="330" y="22" width="116" height="26" rx="6" fill="${isHero ? '#22C55E25' : '#FFFFFF10'}"/>
          <text x="388" y="40" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="600" font-size="11" fill="${isHero ? '#22C55E' : '#A8B7A2'}" text-anchor="middle">${escapeXml(n.status)}</text>

          <text x="24" y="90" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${isHero ? '#22C55E' : BRAND_COLORS.WARM_IVORY}">${escapeXml(n.title)}</text>
          <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="400" font-size="17" fill="${BRAND_COLORS.SOFT_SAGE}">
            ${calculateTspanLines(descLines, 24, 126, 25)}
          </text>

          <circle cx="430" cy="165" r="5" fill="${isHero ? '#22C55E' : '#16856B'}"/>
        </g>
      `;
    }).join('')}
  </g>

  <!-- Lower Terminal Invariant Bar -->
  <g transform="translate(56, 800)">
    <rect width="968" height="115" rx="14" fill="#141913" stroke="#22C55E" stroke-width="1.5" stroke-opacity="0.6"/>
    <text x="24" y="38" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="#22C55E" letter-spacing="2">SYSTEM INVARIANT</text>
    <text x="24" y="74" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="18" fill="${BRAND_COLORS.WARM_IVORY}">
      လူကိုယ်တိုင် စစ်ဆေးအတည်ပြုချက် မရှိဘဲ မည်သည့် External Action ကိုမျှ အလိုအလျောက် မလုပ်ဆောင်ရ။
    </text>
  </g>

  <!-- Footer -->
  <line x1="56" y1="945" x2="1024" y2="945" stroke="#30382C" stroke-width="2"/>
  <text x="56" y="990" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="22" fill="${BRAND_COLORS.WARM_IVORY}">
    Understand AI. Build Real Systems.
  </text>
  ${renderProfileLogoSvg(946, 965, 78, 44)}
</svg>
  `.trim();
}
