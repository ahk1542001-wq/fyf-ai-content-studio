/**
 * Unified Banner Generator & Draft-to-Props Mapping Engine
 */

import {
  BannerTemplateFamily,
  AnyBannerProps,
  SystemRiskStoryProps,
  KnowledgeFrameworkProps,
  PhotoEditorialSplitProps,
  AiNewsAnalysisProps,
  AlbumCarouselProps,
  IsometricSystemDioramaProps,
  MascotStorytellingProps,
  DarkBlueprintCircuitProps,
  LiveArchitectureUiProps,
  DraftContentForBanner,
  BannerGenerationResult,
} from './types';
import { renderSystemRiskStorySvg } from './templates/systemRiskStory';
import { renderKnowledgeFrameworkSvg } from './templates/knowledgeFramework';
import { renderAlbumCarouselSvg } from './templates/albumCarousel';
import { renderIsometricSystemDioramaSvg } from './templates/isometricSystemDiorama';
import { renderMascotStorytellingSvg } from './templates/mascotStorytelling';
import { renderDarkBlueprintCircuitSvg } from './templates/darkBlueprintCircuit';
import { renderLiveArchitectureUiSvg } from './templates/liveArchitectureUi';
import { renderPhotoEditorialSplitSvg } from './templates/photoEditorialSplit';
import { renderAiNewsAnalysisSvg } from './templates/aiNewsAnalysis';

export type TemplateRecommendation = {
  family: BannerTemplateFamily;
  rationale: string;
};

/**
 * Heuristically detects the most suitable banner template family from draft content with rationale.
 */
export function detectTemplateFamilyWithRationale(draft: DraftContentForBanner): TemplateRecommendation {
  const combinedText = [
    draft.topic || '',
    draft.goal || '',
    draft.format || '',
    draft.tone || '',
    draft.content || '',
    draft.headline || '',
    draft.photoHeadline || '',
  ]
    .join(' ')
    .toLowerCase();

  // Carousel Album keywords
  if (/\b(album|carousel|slides|multi-photo|4-slide|swipe)\b|အယ်လ်ဘမ်|ဆလိုက်/i.test(combinedText)) {
    return {
      family: 'album_carousel',
      rationale: 'Slide ၄ ပုံတွဲ ဇာတ်လမ်း အပြည့်အစုံ ဖော်ပြရန် 4-Slide Carousel Album သည် အကောင်းဆုံး ဖြစ်ပါသည်။',
    };
  }

  // News / Analysis keywords
  if (
    /\b(news|update|announcement|release|trending|model|benchmark|analysis)\b|သတင်း|သုံးသပ်ချက်/i.test(
      combinedText
    )
  ) {
    return {
      family: 'ai_news_analysis',
      rationale: 'အချက်အလက်နှင့် FYF သုံးသပ်ချက် နှိုင်းယှဉ်ပြရန် AI News & Analysis သည် အကောင်းဆုံး ဖြစ်ပါသည်။',
    };
  }

  // Risk / Workflow / Human approval / Error / Failure / Slip keywords
  if (
    /\b(risk|failure|error|desync|slip|workflow|stage|approval|boundary|human)\b|ငွေလွှဲ|စစ်ဆေး|အမှား|ဆုံးဖြတ်ချက်|လုပ်ငန်းစဉ်/i.test(
      combinedText
    )
  ) {
    return {
      family: 'system_risk_story',
      rationale: '၅ ဆင့် လုပ်ငန်းစဉ်နှင့် စစ်ဆေးမှုဘောင်များ တင်ပြရန် System Risk Story သည် အကောင်းဆုံး ဖြစ်ပါသည်။',
    };
  }

  // Photo / Visual / Editorial Split keywords
  if (
    /\b(photo|image|visual|camera|editorial|split)\b|ဓာတ်ပုံ|ရုပ်ပုံ|ပုံရိပ်|ရုပ်ထွက်/i.test(
      combinedText
    )
  ) {
    return {
      family: 'photo_editorial_split',
      rationale: 'AI ရုပ်ပုံနှင့် စာသား ၅၀/၅၀ ခွဲခြားပြသရန် Photo Editorial Split သည် အကောင်းဆုံး ဖြစ်ပါသည်။',
    };
  }

  // Default to Knowledge & Frameworks
  return {
    family: 'knowledge_framework',
    rationale: 'အဓိက အချက် (၃) ချက်နှင့် မူဘောင်များ ရှင်းပြရန် Knowledge Framework သည် အကောင်းဆုံး ဖြစ်ပါသည်။',
  };
}

/**
 * Heuristically detects the most suitable banner template family from draft content.
 */
export function detectTemplateFamily(draft: DraftContentForBanner): BannerTemplateFamily {
  return detectTemplateFamilyWithRationale(draft).family;
}

/**
 * Creates default props for a given banner family with an optional topic.
 */
export function createDefaultBannerProps(
  family: BannerTemplateFamily,
  topic?: string
): AnyBannerProps {
  const baseTopic = topic || 'AI Systems Workflow';

  switch (family) {
    case 'system_risk_story':
      return {
        categoryLabel: 'RISK STORY • SYSTEM',
        headline: `${baseTopic} က Decision မဟုတ်ပါ။`,
        subtitle: 'AI က Pattern ရှာမယ်။ Final Call ကို လူကပိုင်တယ်။',
        stages: [
          { stageNumber: '01', title: 'Data Ingestion', description: 'အရောင်း၊ အော်ဒါနှင့် Stock အချက်အလက်များ စုစည်းခြင်း' },
          { stageNumber: '02', title: 'Automation Extraction', description: 'စနစ်မှ လိုအပ်သော ဒေတာများကို အလိုအလျောက် ခွဲထုတ်ခြင်း' },
          { stageNumber: '03', title: 'AI Risk Analysis', description: 'ပုံမှန်မဟုတ်သော အချက်များနှင့် ကွာဟချက်ကို စစ်ဆေးခြင်း' },
          { stageNumber: '04', title: 'Human Verification Gate', description: 'လူကိုယ်တိုင် ဘဏ်အကောင့်နှင့် စည်းမျဉ်းများကို စစ်ဆေးအတည်ပြုခြင်း', isHumanApproval: true },
          { stageNumber: '05', title: 'Verified Action', description: 'အတည်ပြုပြီးမှသာ ငွေလွှဲခြင်းနှင့် ပစ္စည်းထုတ်ပေးခြင်း ပြုလုပ်ခြင်း' },
        ],
        boundaryText: 'AI က Analysis နဲ့ Options အထိသာ။',
        limitsText: 'Data မပြည့်ရင် Recommendation ကို မယုံရသေး။',
        takeawayText: 'Report ကို automate လုပ်ပါ။ ဆုံးဖြတ်ချက်ကို မလွှဲပါနဲ့။',
      } as SystemRiskStoryProps;

    case 'knowledge_framework':
      return {
        categoryLabel: 'KNOWLEDGE • FRAMEWORK',
        topicSequence: 'SYSTEM THINKING / 01',
        headline: 'AI Agent ကို အလုပ်ပေးပါ။ Control ကိုတော့ မပေးလိုက်ပါနဲ့။',
        subtitle: 'လုပ်ငန်းခွင်သုံး AI စနစ်တစ်ခု တည်ဆောက်ရာတွင် သိထားသင့်သော အခြေခံစည်းမျဉ်း (၃) ချက်',
        points: [
          { number: 1, title: 'Context & Goal', description: 'AI မစခင် Input၊ စည်းမျဉ်းနဲ့ ဒေတာကို ရှင်းအောင်သတ်မှတ်ပါ။' },
          { number: 2, title: 'Decision Boundary', description: 'AI အကြံပေးနိုင်တဲ့ အတိုင်းအတာနဲ့ လူက စစ်ရမယ့်အပိုင်း ခွဲခြားပါ။' },
          { number: 3, title: 'Verified Output', description: 'စစ်ဆေးပြီးမှသာ External Action သို့မဟုတ် Customer ဆီ ပို့ပါ။' },
        ],
        keyIdeaTitle: 'KEY IDEA',
        keyIdeaText: 'AI ကို အလုပ်လုပ်ခိုင်းပါ။ စီးပွားရေးဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။',
        footerTagline: 'Understand AI. Build Real Systems.',
      } as KnowledgeFrameworkProps;

    case 'isometric_system_diorama':
      return {
        categoryLabel: '3D SYSTEM DIORAMA • FYF AI',
        headline: `${baseTopic} နှင့် လူစစ်ဆေးမှု Checkpoint`,
        subtext: 'Data ဝင်ရောက်ခြင်း ➔ AI ခွဲခြမ်းစိတ်ဖြာခြင်း ➔ လူကိုယ်တိုင် အတည်ပြုခြင်း ➔ ပြင်ပသို့ ထုတ်ပေးခြင်း',
      } as IsometricSystemDioramaProps;

    case 'mascot_storytelling':
      return {
        categoryLabel: 'MASCOT STORY • FYF AI',
        headline: `သတိပြုရန်: ${baseTopic} အားလုံးကို အမှန်မထင်ပါနဲ့။`,
        mascotQuote: '“Slip ပေါ်က စာဖတ်တာက AI အလုပ်၊ ဘဏ်ထဲ ငွေတကယ်ဝင်မဝင် စစ်တာက မင်းရဲ့ အလုပ်!”',
        points: [
          { title: 'The Illusion (ထင်ယောင်ထင်မှား)', desc: 'AI က Slip ပေါ်က Text ကို 100% တိကျစွာ OCR ဖတ်ပြနိုင်တယ်။' },
          { title: 'The Risk (ဆုံးရှုံးနိုင်ခြေ)', desc: 'ဒါပေမဲ့ Fake Slip သို့မဟုတ် Edit ထားတဲ့ ပုံဆိုရင် AI က မသိနိုင်ပါ။' },
          { title: 'The Rule (အခြေခံစည်းမျဉ်း)', desc: 'ဘဏ် Statement နဲ့ လူက Confirm ပြီးမှ ပစ္စည်းထုတ်ပေးပါ။' },
        ],
        takeaway: 'Understand AI. Build Real Systems.',
      } as MascotStorytellingProps;

    case 'dark_blueprint_circuit':
      return {
        categoryLabel: 'SYSTEM ARCHITECTURE • BLUEPRINT',
        headline: `Production AI Architecture: လူစစ်ဆေးမှု Gate စနစ်`,
        nodes: [
          { tag: '01_INGEST', title: 'Input Stream', desc: 'အော်ဒါ၊ စာရင်းနှင့် Slip အချက်အလက်များ', status: 'LIVE_OK' },
          { tag: '02_INFERENCE', title: 'LLM Extraction', desc: 'AI မှ ဒေတာ အချက်အလက် ခွဲထုတ်ခြင်း', status: '99.4% ACC' },
          { tag: '03_GATEWAY', title: 'Human Review Gate', desc: 'လူကိုယ်တိုင် စစ်ဆေးအတည်ပြုချက် ရယူခြင်း', status: 'PROTECTED', isHighlight: true },
          { tag: '04_DISPATCH', title: 'System Dispatch', desc: 'ဘဏ်စာရင်းနှင့် ERP သို့ စာရင်းသွင်းခြင်း', status: 'RESTRICTED' },
        ],
      } as DarkBlueprintCircuitProps;

    case 'live_architecture_ui':
      return {
        categoryLabel: 'PRODUCTION SYSTEM • TRACE',
        headline: `လုပ်ငန်းခွင်သုံး AI စနစ်၏ Live Trace နှင့် လူစစ်ဆေးမှု Checkpoint`,
      } as LiveArchitectureUiProps;

    case 'album_carousel':
      return {
        categoryLabel: 'CAROUSEL ALBUM • FYF AI',
        headline: `${baseTopic}: Multi-Slide Carousel Guide`,
        subtitle: 'Understand AI. Build Real Systems.',
        currentSlideIndex: 0,
        slides: [
          {
            title: `${baseTopic}: Slip ဖတ်တတ်တိုင်း Order မထုတ်ပါနဲ့။`,
            subtitle: 'AI OCR နဲ့ Bank Verification ကြားက ကြီးမားတဲ့ လုံခြုံရေး ကွာဟချက်',
            topicTag: 'OPERATIONAL RISK / LESSON 04',
            hookQuestion: 'Customer ပို့တဲ့ Slip ကို AI က အလိုအလျောက် Approve လုပ်မိရင် ဘာတွေ ဆုံးရှုံးနိုင်လဲ?',
          },
          {
            title: 'ဖြစ်တတ်သော အမှား • The False Automation',
            problemStep1: { number: '01', title: 'Customer Slip ပို့လာခြင်း', desc: 'Customer ဆီက Mobile Banking Slip ရောက်လာတယ်။' },
            problemStep2: { number: '02', title: 'AI OCR မှားယွင်း အတည်ပြုခြင်း', desc: 'OCR က Slip ပေါ်က စာသားကို ဖတ်ပြီး ဘဏ်မစစ်ဘဲ Order "Paid" အဖြစ် အလိုအလျောက် ပြောင်းမိခြင်း။' },
            riskWarning: 'သတိပြုရန်: AI OCR သည် စာဖတ်ပေးနိုင်သော်လည်း ဘဏ်ထဲ ငွေတကယ်ဝင်မဝင်ကို မသိနိုင်ပါ။',
          },
          {
            title: 'မှန်ကန်သော စနစ် • The Safe FYF Workflow',
            solutionStep1: { number: '03', title: 'AI Extraction', desc: 'AI က Slip ပေါ်က Amount နဲ့ Txn ID ကို စာရင်းထဲ ကူးယူပေးမယ်။' },
            solutionStep2: { number: '04', title: 'Human Verification Gate', desc: 'ဘဏ် Statement / SMS နဲ့ တကယ် ငွေဝင်မဝင် လူက ပြန်စစ်ပြီး Confirm မယ်။', isHumanApproval: true },
            solutionStep3: { number: '05', title: 'Verified Dispatch', desc: 'အတည်ပြုပြီးမှ Warehouse က Delivery ထုတ်ပေးမယ်။' },
          },
          {
            quoteText: 'AI ကို Data ဖတ်ခိုင်းပါ။ ငွေကြေးနဲ့ ပစ္စည်းထုတ်ပေးတဲ့ အတည်ပြုချက်ကိုတော့ လူက စစ်ပါ။',
            boundaryRule: 'AI က OCR Data Extraction အထိသာ လုပ်ဆောင်မည်။',
            limitRule: 'ဘဏ်ငွေဝင်ကြောင်း သေချာမှု မရှိလျှင် ပစ္စည်းမထုတ်ပေးရ။',
            tagline: 'Understand AI. Build Real Systems.',
          },
        ],
      } as AlbumCarouselProps;

    case 'photo_editorial_split':
      return {
        categoryLabel: 'EDITORIAL • SPLIT',
        photoLabel: 'PHOTO PLAN: [APPROVED REFERENCE / BRAND GUIDED]',
        photoStatus: 'SAMPLE LAYOUT',
        headline: `${baseTopic} နှင့် လက်တွေ့စနစ်`,
        burmeseTitle: `${baseTopic} နှင့် လက်တွေ့စနစ်`,
        burmeseBodyLines: [
          'AI ဖြင့် ဖန်တီးထားသော အမြင်ဆိုင်ရာ အထောက်အထားနှင့် စနစ်ရှင်းလင်းချက်။',
          'Brand Guidelines နှင့် ညီညွတ်သော ဖွဲ့စည်းပုံဖြင့် အချက်အလက်များကို တင်ပြထားသည်။',
        ],
        referenceNote: 'REFERENCE MODE: High-fidelity brand editorial split',
      } as PhotoEditorialSplitProps;

    case 'ai_news_analysis':
    default:
      return {
        categoryLabel: 'AI NEWS • ANALYSIS',
        sectionTag: 'TRENDING TECH / ANALYSIS',
        headline: `${baseTopic} နှင့် မြန်မာစီးပွားရေးလုပ်ငန်းများအတွက် အရေးပါသော အချက်များ`,
        confirmedFacts: [
          'အဓိက AI ကုမ္ပဏီမှ Model အသစ်နှင့် Workflow API များကို တရားဝင်မိတ်ဆက်ခဲ့သည်။',
          'Automated reasoning နှင့် tool calling စွမ်းဆောင်ရည် သိသိသာသာ တိုးတက်လာသည်။',
        ],
        fyfAnalysis: [
          'Prompt ကောင်းရုံဖြင့် အလုပ်မပြီးပါ။ Error Handling နှင့် Human Gate ထည့်သွင်းရန် လိုအပ်သည်။',
          'Production Data နှင့် ချိတ်ဆက်ရာတွင် Rate Limit နှင့် Cost ကို ထည့်တွက်ရမည်။',
        ],
        openQuestions: [
          'လုပ်ငန်းတွင်း အမှားအယွင်းမဖြစ်စေရန် မည်သည့် Decision အဆင့်တွင် လူက အတည်ပြုမည်နည်း?',
        ],
        sourceName: 'Official Technical Release & Benchmarks',
        publishedDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
      } as AiNewsAnalysisProps;
  }
}

/**
 * Maps content draft fields into structured banner props for the detected or preferred family.
 */
export function mapDraftToBannerProps(
  draft: DraftContentForBanner,
  preferredFamily?: BannerTemplateFamily
): { family: BannerTemplateFamily; props: AnyBannerProps } {
  const family = preferredFamily || detectTemplateFamily(draft);
  const headline = draft.headline || draft.topic || 'AI Systems Workflow';
  const defaultProps = createDefaultBannerProps(family, draft.topic);

  switch (family) {
    case 'system_risk_story': {
      const def = defaultProps as SystemRiskStoryProps;
      const stages = [...def.stages];
      if (draft.humanApprovalStep) {
        stages[3] = {
          ...stages[3],
          description: draft.humanApprovalStep,
        };
      }
      return {
        family,
        props: {
          ...def,
          headline,
          stages,
          takeawayText: draft.takeaway || def.takeawayText,
          boundaryText: draft.systemBoundary || def.boundaryText,
        },
      };
    }

    case 'knowledge_framework': {
      const def = defaultProps as KnowledgeFrameworkProps;
      const points =
        draft.keyPoints && draft.keyPoints.length > 0
          ? draft.keyPoints.slice(0, 3).map((kp, idx) => ({
              number: idx + 1,
              title: def.points[idx]?.title || `Point 0${idx + 1}`,
              description: kp,
            }))
          : def.points;

      return {
        family,
        props: {
          ...def,
          headline,
          points,
          keyIdeaText: draft.takeaway || def.keyIdeaText,
        },
      };
    }

    case 'isometric_system_diorama': {
      const def = defaultProps as IsometricSystemDioramaProps;
      return {
        family,
        props: {
          ...def,
          headline,
          subtext: draft.takeaway || def.subtext,
        },
      };
    }

    case 'mascot_storytelling': {
      const def = defaultProps as MascotStorytellingProps;
      return {
        family,
        props: {
          ...def,
          headline,
          mascotQuote: draft.hook || def.mascotQuote,
          takeaway: draft.takeaway || def.takeaway,
        },
      };
    }

    case 'dark_blueprint_circuit': {
      const def = defaultProps as DarkBlueprintCircuitProps;
      return {
        family,
        props: {
          ...def,
          headline,
        },
      };
    }

    case 'live_architecture_ui': {
      const def = defaultProps as LiveArchitectureUiProps;
      return {
        family,
        props: {
          ...def,
          headline,
        },
      };
    }

    case 'album_carousel': {
      const def = defaultProps as AlbumCarouselProps;
      return {
        family,
        props: {
          ...def,
          headline,
        },
      };
    }

    case 'photo_editorial_split': {
      const def = defaultProps as PhotoEditorialSplitProps;
      return {
        family,
        props: {
          ...def,
          headline,
          burmeseTitle: headline,
        },
      };
    }

    case 'ai_news_analysis':
    default: {
      const def = defaultProps as AiNewsAnalysisProps;
      return {
        family,
        props: {
          ...def,
          headline,
          sourceName: draft.sourceUrl || def.sourceName,
        },
      };
    }
  }
}

/**
 * Renders an SVG string for any given family and properties.
 */
export function renderBannerSvg(family: BannerTemplateFamily, props: AnyBannerProps): string {
  switch (family) {
    case 'system_risk_story':
      return renderSystemRiskStorySvg(props as SystemRiskStoryProps);
    case 'knowledge_framework':
      return renderKnowledgeFrameworkSvg(props as KnowledgeFrameworkProps);
    case 'isometric_system_diorama':
      return renderIsometricSystemDioramaSvg(props as IsometricSystemDioramaProps);
    case 'mascot_storytelling':
      return renderMascotStorytellingSvg(props as MascotStorytellingProps);
    case 'dark_blueprint_circuit':
      return renderDarkBlueprintCircuitSvg(props as DarkBlueprintCircuitProps);
    case 'live_architecture_ui':
      return renderLiveArchitectureUiSvg(props as LiveArchitectureUiProps);
    case 'album_carousel':
      return renderAlbumCarouselSvg(props as AlbumCarouselProps);
    case 'photo_editorial_split':
      return renderPhotoEditorialSplitSvg(props as PhotoEditorialSplitProps);
    case 'ai_news_analysis':
      return renderAiNewsAnalysisSvg(props as AiNewsAnalysisProps);
    default:
      return renderSystemRiskStorySvg(props as SystemRiskStoryProps);
  }
}

/**
 * Full convenience generation pipeline: map draft, render SVG, and return bundle.
 */
export function generateBannerFromDraft(
  draft: DraftContentForBanner,
  preferredFamily?: BannerTemplateFamily
): BannerGenerationResult {
  const { family, props } = mapDraftToBannerProps(draft, preferredFamily);
  const svg = renderBannerSvg(family, props);
  return {
    family,
    svg,
    props,
    width: props.width || 1080,
    height: props.height || 1080,
  };
}
