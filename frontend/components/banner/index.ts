/**
 * FYF Banner Component Library & Graphic Engine Index
 */

export * from './BannerPreview';
export * from './BannerStudio';

export {
  renderBannerSvg,
  generateBannerFromDraft,
  mapDraftToBannerProps,
  detectTemplateFamily,
  createDefaultBannerProps,
} from '@/src/domain/banner';

export type {
  BannerTemplateFamily,
  BaseBannerProps,
  SystemRiskStoryProps,
  KnowledgeFrameworkProps,
  PhotoEditorialSplitProps,
  AiNewsAnalysisProps,
  AnyBannerProps,
  DraftContentForBanner,
  BannerGenerationResult,
} from '@/src/domain/banner/types';

export {
  svgStringToDataUrl,
  exportBannerSvgToPngBlob,
  downloadBannerAsPng,
  downloadBannerAsSvg,
} from '@/frontend/utils/bannerExport';
