/**
 * FYF Brand Design Tokens
 * Source of Truth: /projects/FYF_AI_Brand/BRAND_FOUNDATION.md
 * Standard Dimensions: 1080 x 1080 (Square Format)
 */

export const BRAND_COLORS = {
  // Main background canvas
  WARM_IVORY: '#F4F0E6',
  // Primary action, focal accents, key boundary highlights
  VIRIDIAN: '#16856B',
  // Structure, small/body text, outlines, headings, badges
  OLIVE_INK: '#30382C',
  // Secondary structure, boundary panel bg (opacity 0.30), decorative fold accents
  SOFT_SAGE: '#A8B7A2',
  // Card backgrounds and reversed elements
  SURFACE_WHITE: '#FFFFFF',
  // Dark overlay background for photo / editorial
  DARK_OLIVE_SURFACE: '#242B21',
} as const;

export type BrandColor = (typeof BRAND_COLORS)[keyof typeof BRAND_COLORS];

export const BRAND_FONTS = {
  // English headings and labels
  ENGLISH_HEADING: 'Arial, Helvetica, sans-serif',
  // English body
  ENGLISH_BODY: 'Arial, Helvetica, sans-serif',
  // Burmese headings
  BURMESE_HEADING: "'Noto Sans Myanmar', 'Myanmar Sangam MN', sans-serif",
  // Burmese and mixed-language body
  BURMESE_BODY: "'Noto Sans Myanmar', 'Myanmar Sangam MN', sans-serif",
  // Unified fallback font stack for SVG templates
  SVG_DEFAULT_STACK: "'Noto Sans Myanmar', 'Myanmar Sangam MN', Arial, Helvetica, sans-serif",
} as const;

export const BRAND_DIMENSIONS = {
  DEFAULT_WIDTH: 1080,
  DEFAULT_HEIGHT: 1080,
  SAFE_MARGIN_X: 56,
  SAFE_MARGIN_Y: 52,
  SAFE_WIDTH: 968, // 1080 - (56 * 2)
  HEADER_DIVIDER_Y: 180,
  FOOTER_DIVIDER_Y: 976,
  SPLIT_TOP_HEIGHT: 540,
  SPLIT_BOTTOM_HEIGHT: 540,
} as const;

export const CONTRAST_RATIOS = {
  OLIVE_ON_IVORY: 10.68,
  IVORY_ON_OLIVE: 10.68,
  OLIVE_ON_SAGE: 5.76,
  VIRIDIAN_ON_IVORY: 4.01,
  SAGE_ON_IVORY: 1.85,
  VIRIDIAN_ON_OLIVE: 2.66,
} as const;
