/**
 * FYF Official Vector Logo Paths & Embed Helper
 * Source: /projects/FYF_AI_Brand/assets/logo/approved/
 */

export const FYF_HORIZONTAL_LOGO_VIEWBOX = '0 0 820 250';
export const FYF_PROFILE_LOGO_VIEWBOX = '0 0 300 285';

/**
 * Returns self-contained SVG group for the FYF Horizontal Master Logo.
 * ViewBox: 820 x 250
 */
export function getHorizontalLogoInnerSvg(): string {
  return `
    <g fill="#30382C" stroke-linejoin="round">
      <!-- First F -->
      <path d="M35 178 35.5 56 74 16.5 74.5 134Z"/>
      <path d="M76 58.5 75.5 15 198 15.5 159 58.5Z"/>
      <path d="M76 131.5 75.5 89 162 88.5 125 131.5Z"/>

      <!-- Folded Y -->
      <path d="M201 15.5 247 15.5 277.5 46 278 104.5Z"/>
      <path d="M261 183.5 260.5 89 280.5 107 278.5 46 308 15.5 380 15.5 309.5 91 309.5 135Z"/>
      <path d="M364 177.5 362.5 57 401 15.5 401.5 134Z"/>
      <path d="M281 60.5 278.5 46 308 15.5 379.5 16Z" fill="#16856B"/>

      <!-- Second F -->
      <path d="M364 177.5 363.5 57 402 16.5 402 134Z"/>
      <path d="M404 58.5 403.5 15 523 14.5 484 58.5Z"/>
      <path d="M404 131.5 403.5 89 486 88.5 449 131.5Z"/>

      <!-- AI -->
      <path fill-rule="evenodd"
            d="M519.5 180 641 15.5 734 155.5 735.5 15 778 14.5 777 181.5 702 181.5 644 86.5 577 181.5Z
               M579.5 181 611 135.5 665 135.5 630 181.5Z"/>
    </g>

    <text x="115" y="241" fill="#30382C"
          font-family="Arial, Helvetica, sans-serif" font-size="39" font-weight="400"
          letter-spacing="13">FOR YOUR FUTURE</text>
  `.trim();
}

/**
 * Returns self-contained SVG group for the FYF Profile Master Logo.
 * ViewBox: 300 x 285
 */
export function getProfileLogoInnerSvg(includeBackground = true): string {
  const bg = includeBackground
    ? '<rect x="17" y="15" width="254" height="250" rx="31" fill="#F4F0E6"/>'
    : '';

  return `
    ${bg}
    <g fill="#30382C" stroke-linejoin="round">
      <!-- First F and its upper fold -->
      <path d="M42 234.5 41.5 64 69 36.5 135 36.5 156.5 59 145 114.5 72 40.5 69.5 43 69.5 96 117.5 100 69.5 151 69.5 200Z"/>

      <!-- Y upper arm, lower arm, and descending fold -->
      <path d="M144 156.5 144.5 124 158.5 61 184 36.5 238 36.5Z"/>
      <path d="M143 238.5 142.5 160 189 104.5 189.5 192Z"/>
      <path d="M154 86.5 158.5 61 184 36.5 238.5 38Z" fill="#16856B"/>

      <!-- Final compact F -->
      <path d="M219 131.5 191.5 131 193 99.5 245.5 100Z"/>
      <path d="M192 210.5 191.5 159 237 158.5Z"/>
    </g>
  `.trim();
}

/**
 * Embeds Horizontal Logo with exact dimensions and positioning via nested SVG.
 */
export function renderHorizontalLogoSvg(x: number, y: number, width: number, height: number): string {
  return `
    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 820 250" preserveAspectRatio="xMidYMid meet">
      ${getHorizontalLogoInnerSvg()}
    </svg>
  `.trim();
}

/**
 * Embeds Profile Logo with exact dimensions and positioning via nested SVG.
 */
export function renderProfileLogoSvg(x: number, y: number, width: number, height: number, includeBackground = true): string {
  return `
    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 300 285" preserveAspectRatio="xMidYMid meet">
      ${getProfileLogoInnerSvg(includeBackground)}
    </svg>
  `.trim();
}
