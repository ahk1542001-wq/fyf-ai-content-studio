/**
 * FYF Banner Template Types & Interfaces
 */

export type BannerTemplateFamily =
  | 'system_risk_story'
  | 'knowledge_framework'
  | 'isometric_system_diorama'
  | 'mascot_storytelling'
  | 'dark_blueprint_circuit'
  | 'live_architecture_ui'
  | 'photo_editorial_split'
  | 'ai_news_analysis'
  | 'album_carousel';

export interface BaseBannerProps {
  /** Top pill badge text or category descriptor (e.g. "RISK STORY • SYSTEM") */
  categoryLabel?: string;
  /** Main primary headline (Burmese or English) */
  headline: string;
  /** Subtitle or secondary line */
  subtitle?: string;
  /** Optional custom logo SVG override snippet */
  customLogoSvg?: string;
  /** Optional custom width (defaults to 1080) */
  width?: number;
  /** Optional custom height (defaults to 1080) */
  height?: number;
}

export interface IsometricSystemDioramaProps extends BaseBannerProps {
  subtext?: string;
}

export interface MascotStorytellingPoint {
  title: string;
  desc: string;
}

export interface MascotStorytellingProps extends BaseBannerProps {
  mascotQuote: string;
  points: MascotStorytellingPoint[];
  takeaway?: string;
}

export interface DarkBlueprintCircuitNode {
  tag: string;
  title: string;
  desc: string;
  status: string;
  isHighlight?: boolean;
}

export interface DarkBlueprintCircuitProps extends BaseBannerProps {
  nodes: DarkBlueprintCircuitNode[];
}

export interface LiveArchitectureUiProps extends BaseBannerProps {
  pipelineTitle?: string;
  statusPayloadSnippet?: string;
}

export interface SystemRiskStoryStage {
  /** Stage step number, e.g. "01", "02", "03", "04", "05" */
  stageNumber: string;
  /** Stage step title, e.g. "Trigger", "Context", "AI Decision", "Human Approval", "Output" */
  title: string;
  /** Stage description text (Burmese/English) */
  description: string;
  /**
   * If true, highlights stage badge and border in Viridian (#16856B).
   * Usually Stage 04 (Human Approval).
   */
  isHumanApproval?: boolean;
}

export interface SystemRiskStoryProps extends BaseBannerProps {
  /** Exactly or up to 5 workflow stages */
  stages: SystemRiskStoryStage[];
  /** Boundary explanation text in the lower panel */
  boundaryText: string;
  /** Limits explanation text in the lower panel */
  limitsText: string;
  /** Final takeaway / moral line at the bottom */
  takeawayText: string;
}

export interface KnowledgeFrameworkPoint {
  /** Numbered index (1, 2, 3) */
  number: number;
  /** Point title / heading */
  title: string;
  /** Burmese explanation */
  description: string;
}

export interface KnowledgeFrameworkProps extends BaseBannerProps {
  /** Topic sequence or category tag, e.g. "SYSTEM THINKING / 01" or "AI AGENTS + AUTOMATION" */
  topicSequence?: string;
  /** List of 3 core teaching points */
  points: KnowledgeFrameworkPoint[];
  /** Highlight box header in mascot card (defaults to "KEY IDEA") */
  keyIdeaTitle?: string;
  /** Key takeaway / takeaway idea in the right mascot panel */
  keyIdeaText: string;
  /** Bottom tagline (defaults to "Understand AI. Build Real Systems.") */
  footerTagline?: string;
}

export interface PhotoEditorialSplitProps extends BaseBannerProps {
  /** Status / reference label on top photo overlay */
  photoLabel?: string;
  /** Status tag (e.g. "SAMPLE LAYOUT", "APPROVED REFERENCE") */
  photoStatus?: string;
  /** Main bold Burmese headline on the lower ivory panel */
  burmeseTitle?: string;
  /** Paragraph / bullet lines of Burmese body text */
  burmeseBodyLines: string[];
  /** Reference mode note at the bottom */
  referenceNote?: string;
  /** Optional custom photo image URL or Data URI */
  photoDataUri?: string;
}

export interface AiNewsAnalysisProps extends BaseBannerProps {
  /** Subhead / section tag, e.g. "TRENDING TECH / ANALYSIS" */
  sectionTag?: string;
  /** Confirmed news facts bullet points */
  confirmedFacts: string[];
  /** FYF system analysis & implications */
  fyfAnalysis: string[];
  /** Open questions or human oversight boundaries */
  openQuestions: string[];
  /** Original news / intelligence source */
  sourceName: string;
  /** Publication date string */
  publishedDate: string;
  /** Last updated date string */
  updatedDate: string;
}

export interface AlbumCarouselProps extends BaseBannerProps {
  /** 0-based active slide index (0 to 3) */
  currentSlideIndex: number;
  slides: [
    {
      title: string;
      subtitle: string;
      topicTag: string;
      hookQuestion: string;
    },
    {
      title: string;
      problemStep1: { number: string; title: string; desc: string };
      problemStep2: { number: string; title: string; desc: string };
      riskWarning: string;
    },
    {
      title: string;
      solutionStep1: { number: string; title: string; desc: string };
      solutionStep2: { number: string; title: string; desc: string; isHumanApproval?: boolean };
      solutionStep3: { number: string; title: string; desc: string };
    },
    {
      quoteText: string;
      boundaryRule: string;
      limitRule: string;
      tagline: string;
    }
  ];
}

export type BannerTemplatePropsMap = {
  system_risk_story: SystemRiskStoryProps;
  knowledge_framework: KnowledgeFrameworkProps;
  isometric_system_diorama: IsometricSystemDioramaProps;
  mascot_storytelling: MascotStorytellingProps;
  dark_blueprint_circuit: DarkBlueprintCircuitProps;
  live_architecture_ui: LiveArchitectureUiProps;
  photo_editorial_split: PhotoEditorialSplitProps;
  ai_news_analysis: AiNewsAnalysisProps;
  album_carousel: AlbumCarouselProps;
};

export type AnyBannerProps =
  | SystemRiskStoryProps
  | KnowledgeFrameworkProps
  | IsometricSystemDioramaProps
  | MascotStorytellingProps
  | DarkBlueprintCircuitProps
  | LiveArchitectureUiProps
  | PhotoEditorialSplitProps
  | AiNewsAnalysisProps
  | AlbumCarouselProps;

export interface DraftContentForBanner {
  id?: string;
  topic?: string;
  goal?: string;
  format?: string;
  tone?: string;
  content?: string;
  headline?: string;
  hook?: string;
  takeaway?: string;
  visualPrompt?: string;
  photoHeadline?: string;
  keyPoints?: string[];
  systemBoundary?: string;
  humanApprovalStep?: string;
  sourceUrl?: string;
}

export interface BannerGenerationResult {
  family: BannerTemplateFamily;
  svg: string;
  props: AnyBannerProps;
  width: number;
  height: number;
}
