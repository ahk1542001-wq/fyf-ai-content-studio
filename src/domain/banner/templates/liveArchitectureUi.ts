/**
 * Family: Linear / Raycast Style "Real Architecture UI" Template (1080 x 1080)
 * Modern Dark-Mode IDE / Studio Window with Traffic Light Dots, Live Pipeline Traces, and Human Approval Modal.
 */

import { BRAND_COLORS, BRAND_FONTS } from '@/frontend/styles/brandTokens';
import { renderHorizontalLogoSvg, renderProfileLogoSvg } from '../assets/logoVectors';
import { LiveArchitectureUiProps } from '../types';
import { escapeXml, wrapSvgText, calculateTspanLines } from '../utils/svgSanitizer';

export function renderLiveArchitectureUiSvg(props: LiveArchitectureUiProps): string {
  const width = props.width || 1080;
  const height = props.height || 1080;
  const categoryLabel = props.categoryLabel || 'PRODUCTION SYSTEM • TRACE';
  const headline = props.headline || 'လုပ်ငန်းခွင်သုံး AI စနစ်၏ Live Trace နှင့် လူစစ်ဆေးမှု Checkpoint';
  const headlineLines = wrapSvgText(headline, { maxCharsPerLine: 34, maxLines: 2 });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <filter id="windowShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="28" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Canvas Background (Warm Ivory with subtle technical tint) -->
  <rect width="${width}" height="${height}" fill="${BRAND_COLORS.WARM_IVORY}"/>

  <!-- Brand Header -->
  ${renderHorizontalLogoSvg(56, 52, 280, 85)}

  <rect x="718" y="62" width="306" height="58" rx="29" fill="${BRAND_COLORS.OLIVE_INK}"/>
  <text x="871" y="99" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="16" fill="${BRAND_COLORS.WARM_IVORY}" letter-spacing="1.5" text-anchor="middle">${escapeXml(categoryLabel)}</text>

  <line x1="56" y1="155" x2="1024" y2="155" stroke="${BRAND_COLORS.OLIVE_INK}" stroke-width="2" opacity="0.22"/>

  <!-- Headline -->
  <text font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="700" font-size="42" fill="${BRAND_COLORS.OLIVE_INK}">
    ${calculateTspanLines(headlineLines, 56, 215, 52)}
  </text>

  <!-- Dark IDE Window (Raycast / Linear UI Centerpiece) -->
  <g transform="translate(56, 305)" filter="url(#windowShadow)">
    <!-- Window Body Frame -->
    <rect width="968" height="570" rx="16" fill="#181F17" stroke="#30382C" stroke-width="2"/>

    <!-- Window Titlebar -->
    <rect width="968" height="48" rx="16" fill="#131912"/>
    <rect y="32" width="968" height="16" fill="#131912"/>
    <line x1="0" y1="48" x2="968" y2="48" stroke="#30382C" stroke-width="1"/>

    <!-- macOS Traffic Light Buttons -->
    <circle cx="28" cy="24" r="6.5" fill="#EF4444"/>
    <circle cx="48" cy="24" r="6.5" fill="#EAB308"/>
    <circle cx="68" cy="24" r="6.5" fill="#22C55E"/>

    <!-- Window Title -->
    <text x="484" y="30" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="600" font-size="13" fill="#A8B7A2" text-anchor="middle">
      fyf-pipeline-runtime :: trace-id: txn_84719a (LIVE PRODUCTION)
    </text>

    <!-- Left Column: Pipeline Execution Nodes -->
    <g transform="translate(30, 75)">
      <!-- Trace Node 1 -->
      <rect width="420" height="74" rx="8" fill="#1F281E" stroke="#30382C" stroke-width="1"/>
      <circle cx="25" cy="37" r="5" fill="#22C55E"/>
      <text x="45" y="28" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.WARM_IVORY}">1. OCR Document Parse</text>
      <text x="45" y="52" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="12" fill="#A8B7A2">Slip စာဖတ်ခြင်း • 50,000 MMK • Latency: 182ms</text>
      <text x="395" y="42" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="11" fill="#22C55E" text-anchor="end">[200 OK]</text>

      <!-- Trace Node 2 -->
      <g transform="translate(0, 90)">
        <rect width="420" height="74" rx="8" fill="#1F281E" stroke="#30382C" stroke-width="1"/>
        <circle cx="25" cy="37" r="5" fill="#22C55E"/>
        <text x="45" y="28" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="${BRAND_COLORS.WARM_IVORY}">2. Context &amp; Ledger Match</text>
        <text x="45" y="52" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="12" fill="#A8B7A2">Customer: @victor • Order: #1048 ကိုက်ညီမှုစစ်</text>
        <text x="395" y="42" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="11" fill="#22C55E" text-anchor="end">[PASS]</text>
      </g>

      <!-- Trace Node 3: HUMAN GATE (AWAITING APPROVAL) -->
      <g transform="translate(0, 180)">
        <rect width="420" height="96" rx="8" fill="#2D2115" stroke="#EAB308" stroke-width="1.5"/>
        <circle cx="25" cy="48" r="6" fill="#EAB308"/>
        <text x="45" y="32" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="15" fill="#FDE047">3. Human Sign-Off Gate</text>
        <text x="45" y="56" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="600" font-size="12" fill="#FEF08A">ဘဏ် Statement / SMS ငွေဝင်ကြောင်း လူက အတည်ပြုရန်</text>
        <text x="45" y="76" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="500" font-size="11" fill="#CA8A04">Policy: Irreversible financial release locked</text>
        <text x="395" y="36" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="800" font-size="12" fill="#EAB308" text-anchor="end">[PENDING]</text>
      </g>

      <!-- Trace Node 4: Downstream -->
      <g transform="translate(0, 290)">
        <rect width="420" height="74" rx="8" fill="#131912" stroke="#30382C" stroke-width="1" stroke-dasharray="4,4" opacity="0.6"/>
        <circle cx="25" cy="37" r="5" fill="#6B7280"/>
        <text x="45" y="28" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="14" fill="#9CA3AF">4. Inventory &amp; Dispatch</text>
        <text x="45" y="52" font-family="${BRAND_FONTS.SVG_DEFAULT_STACK}" font-weight="500" font-size="12" fill="#6B7280">Gate 3 အတည်ပြုပြီးမှသာ ပစ္စည်းထုတ်ပေးမည်</text>
        <text x="395" y="42" font-family="${BRAND_FONTS.ENGLISH_HEADING}" font-weight="700" font-size="11" fill="#6B7280" text-anchor="end">[WAITING]</text>
      </g>
    </g>

    <!-- Right Column: Live Inspector / Code JSON State -->
    <g transform="translate(480, 75)">
      <rect width="458" height="465" rx="10" fill="#121711" stroke="#30382C" stroke-width="1"/>

      <!-- Code Tab Bar -->
      <rect width="458" height="36" rx="10" fill="#0E130D"/>
      <rect y="24" width="458" height="12" fill="#0E130D"/>
      <text x="20" y="24" font-family="monospace" font-weight="700" font-size="12" fill="#22C55E">STATE_PAYLOAD.json</text>
      <circle cx="435" cy="18" r="4" fill="#22C55E"/>

      <!-- JSON Code Lines with Syntax Coloring -->
      <g transform="translate(20, 60)" font-family="monospace" font-size="12" line-height="1.6">
        <text y="0" fill="#A8B7A2">{</text>
        <text y="24" fill="#A8B7A2">  <tspan fill="#60A5FA">"event_id"</tspan>: <tspan fill="#FBBF24">"evt_984120"</tspan>,</text>
        <text y="48" fill="#A8B7A2">  <tspan fill="#60A5FA">"agent_status"</tspan>: <tspan fill="#34D399">"INFERENCE_SUCCESS"</tspan>,</text>
        <text y="72" fill="#A8B7A2">  <tspan fill="#60A5FA">"extracted_amount"</tspan>: <tspan fill="#F87171">50000</tspan>,</text>
        <text y="96" fill="#A8B7A2">  <tspan fill="#60A5FA">"currency"</tspan>: <tspan fill="#FBBF24">"MMK"</tspan>,</text>
        <text y="120" fill="#A8B7A2">  <tspan fill="#60A5FA">"confidence_score"</tspan>: <tspan fill="#F87171">0.994</tspan>,</text>
        <text y="144" fill="#A8B7A2">  <tspan fill="#60A5FA">"human_gate"</tspan>: {</text>
        <text y="168" fill="#A8B7A2">    <tspan fill="#60A5FA">"gate_required"</tspan>: <tspan fill="#F87171">true</tspan>,</text>
        <text y="192" fill="#A8B7A2">    <tspan fill="#60A5FA">"gate_reason"</tspan>: <tspan fill="#FBBF24">"FINANCIAL_DISPATCH"</tspan>,</text>
        <text y="216" fill="#A8B7A2">    <tspan fill="#60A5FA">"approver"</tspan>: <tspan fill="#FBBF24">"VICTOR"</tspan>,</text>
        <text y="240" fill="#A8B7A2">    <tspan fill="#60A5FA">"status"</tspan>: <tspan fill="#FBBF24">"AWAITING_CONFIRMATION"</tspan></text>
        <text y="264" fill="#A8B7A2">  },</text>
        <text y="288" fill="#A8B7A2">  <tspan fill="#60A5FA">"irreversible_action"</tspan>: <tspan fill="#F87171">false</tspan></text>
        <text y="312" fill="#A8B7A2">}</text>
      </g>

      <!-- Terminal Status Footer -->
      <rect x="20" y="415" width="418" height="34" rx="6" fill="#1C261B"/>
      <text x="35" y="437" font-family="monospace" font-size="11" fill="#34D399">● Runtime: ACTIVE • Gate Policy: ENFORCED</text>
    </g>
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
