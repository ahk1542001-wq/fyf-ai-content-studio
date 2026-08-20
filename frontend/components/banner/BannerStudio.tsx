"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Sliders,
  Layers,
  Box,
  MessageSquare,
  Terminal,
  Activity,
  ImageIcon,
  Eye,
  Save,
} from "lucide-react";
import { BannerPreview } from "./BannerPreview";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
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
  SystemRiskStoryStage,
  KnowledgeFrameworkPoint,
  MascotStorytellingPoint,
  DarkBlueprintCircuitNode,
} from "@/src/domain/banner/types";
import {
  renderBannerSvg,
  createDefaultBannerProps,
  mapDraftToBannerProps,
  detectTemplateFamily,
  detectTemplateFamilyWithRationale,
  TemplateRecommendation,
} from "@/src/domain/banner/generator";

export interface BannerStudioProps {
  draft?: DraftContentForBanner;
  initialFamily?: BannerTemplateFamily;
  onSave?: (result: BannerGenerationResult) => void;
  onChange?: (result: BannerGenerationResult) => void;
  className?: string;
  readOnly?: boolean;
}

interface FamilyTabConfig {
  id: BannerTemplateFamily;
  label: string;
  badge: string;
  category: "album" | "framework" | "tech";
  description: string;
  icon: React.ReactNode;
}

const TEMPLATE_FAMILIES: FamilyTabConfig[] = [
  {
    id: "album_carousel",
    label: "1. Carousel Album (4 Slides)",
    badge: "Multi-Slide Story Arc",
    category: "album",
    description: "Slide ၄ ပုံတွဲ: Cover ➔ ဖြစ်တတ်သောအမှား ➔ မှန်ကန်သောစနစ် ➔ Key Takeaway။",
    icon: <Layers size={16} />,
  },
  {
    id: "system_risk_story",
    label: "2. System / Risk Story",
    badge: "5-Stage Workflow",
    category: "framework",
    description: "၅ ဆင့် လုပ်ငန်းစဉ်၊ လူကိုယ်တိုင် စစ်ဆေးအတည်ပြုချက် Gate နှင့် စနစ်စည်းမျဉ်း ဘောင်များ။",
    icon: <Sliders size={16} />,
  },
  {
    id: "knowledge_framework",
    label: "3. Knowledge & Frameworks",
    badge: "3 Points & 3D Mascot",
    category: "framework",
    description: "အဓိက အချက် (၃) ချက်၊ 3D Origami Mascot လမ်းညွှန်နှင့် အရေးကြီးသော Key Idea Takeaway။",
    icon: <Sparkles size={16} />,
  },
  {
    id: "isometric_system_diorama",
    label: "4. 3D Isometric System",
    badge: "Glass & Matte Diorama",
    category: "framework",
    description: "Apple/Stripe 3D isometric platform၊ Viridian data highway နှင့် စစ်ဆေးမှု gate။",
    icon: <Box size={16} />,
  },
  {
    id: "mascot_storytelling",
    label: "5. Mascot Storytelling",
    badge: "Puck in Action",
    category: "framework",
    description: "3D Origami Puck Mascot ၏ ရွှေစည်းမျဉ်း Speech Bubble နှင့် ဖြစ်ရပ်နှိုင်းယှဉ်ချက် (၂) ခု။",
    icon: <MessageSquare size={16} />,
  },
  {
    id: "dark_blueprint_circuit",
    label: "6. Dark Blueprint Engine",
    badge: "Laser Tracing & Nodes",
    category: "tech",
    description: "Deep charcoal background၊ glowing Viridian laser circuits နှင့် architecture nodes။",
    icon: <Terminal size={16} />,
  },
  {
    id: "live_architecture_ui",
    label: "7. Real Architecture UI",
    badge: "Linear/Raycast IDE Trace",
    category: "tech",
    description: "Dark-mode developer window၊ live execution trace logs နှင့် JSON state inspector။",
    icon: <Activity size={16} />,
  },
  {
    id: "photo_editorial_split",
    label: "8. Photo Editorial Split",
    badge: "50/50 Visual Panel",
    category: "framework",
    description: "အပေါ်ခြမ်း AI ရုပ်ပုံ/သရုပ်ဖော်ပုံနှင့် အောက်ခြမ်း Brand Typography ရှင်းလင်းချက်။",
    icon: <ImageIcon size={16} />,
  },
  {
    id: "ai_news_analysis",
    label: "9. AI News & Analysis",
    badge: "3-Card Fact vs FYF",
    category: "framework",
    description: "အတည်ပြုချက်များ၊ FYF စနစ်သုံးသပ်ချက်နှင့် စဉ်းစားစရာ မေးခွန်းများ Stack။",
    icon: <Eye size={16} />,
  },
];

export const BannerStudio: React.FC<BannerStudioProps> = ({
  draft,
  initialFamily,
  onSave,
  onChange,
  className = "",
  readOnly = false,
}) => {
  const recommendation = useMemo<TemplateRecommendation | null>(() => {
    if (!draft) return null;
    return detectTemplateFamilyWithRationale(draft);
  }, [draft]);

  const startingFamily = useMemo<BannerTemplateFamily>(() => {
    if (initialFamily) return initialFamily;
    if (draft) return detectTemplateFamily(draft);
    return "system_risk_story";
  }, [initialFamily, draft]);

  const [activeFamily, setActiveFamily] = useState<BannerTemplateFamily>(startingFamily);
  const [filterCategory, setFilterCategory] = useState<"all" | "album" | "framework" | "tech">("all");

  const [propsState, setPropsState] = useState<AnyBannerProps>(() => {
    if (draft) {
      return mapDraftToBannerProps(draft, startingFamily).props;
    }
    return createDefaultBannerProps(startingFamily);
  });

  useEffect(() => {
    if (draft) {
      const mapped = mapDraftToBannerProps(draft, initialFamily || activeFamily);
      setActiveFamily(mapped.family);
      setPropsState(mapped.props);
    }
  }, [draft, initialFamily]);

  const handleFamilyChange = (newFamily: BannerTemplateFamily) => {
    setActiveFamily(newFamily);
    if (draft) {
      const mapped = mapDraftToBannerProps(draft, newFamily);
      setPropsState(mapped.props);
    } else {
      setPropsState(createDefaultBannerProps(newFamily));
    }
  };

  const handleResetToAutoMapped = () => {
    if (draft) {
      const mapped = mapDraftToBannerProps(draft, activeFamily);
      setPropsState(mapped.props);
    } else {
      setPropsState(createDefaultBannerProps(activeFamily));
    }
  };

  const renderedSvg = useMemo<string>(() => {
    try {
      return renderBannerSvg(activeFamily, propsState);
    } catch (err) {
      console.error("Failed to render banner SVG:", err);
      return "";
    }
  }, [activeFamily, propsState]);

  const currentResult = useMemo<BannerGenerationResult>(() => {
    return {
      family: activeFamily,
      svg: renderedSvg,
      props: propsState,
      width: propsState.width || 1080,
      height: propsState.height || 1080,
    };
  }, [activeFamily, renderedSvg, propsState]);

  useEffect(() => {
    onChange?.(currentResult);
  }, [currentResult, onChange]);

  const updateProps = <T extends AnyBannerProps>(updater: (prev: T) => T) => {
    setPropsState((prev) => updater(prev as T));
  };

  const filteredFamilies = useMemo(() => {
    if (filterCategory === "all") return TEMPLATE_FAMILIES;
    return TEMPLATE_FAMILIES.filter((f) => f.category === filterCategory);
  }, [filterCategory]);

  // Render property editor for Album Carousel
  const renderAlbumCarouselEditor = () => {
    const p = propsState as AlbumCarouselProps;
    const currentSlide = p.currentSlideIndex || 0;

    const setSlide = (idx: number) => {
      updateProps<AlbumCarouselProps>((prev) => ({ ...prev, currentSlideIndex: idx }));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label font-semibold">Carousel Slide Navigator (Slide ၄ ပုံ ရွေးချယ်ရန်)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "8px" }}>
            {[
              { idx: 0, label: "01. Cover" },
              { idx: 1, label: "02. The Risk" },
              { idx: 2, label: "03. Solution" },
              { idx: 3, label: "04. Takeaway" },
            ].map((s) => (
              <button
                key={s.idx}
                type="button"
                onClick={() => setSlide(s.idx)}
                style={{
                  padding: "10px 6px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundColor: currentSlide === s.idx ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.WARM_IVORY,
                  color: currentSlide === s.idx ? BRAND_COLORS.SURFACE_WHITE : BRAND_COLORS.OLIVE_INK,
                  border: `1px solid ${currentSlide === s.idx ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}60`}`,
                  textAlign: "center",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="studio-field-label">Album Post Topic / Series</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<AlbumCarouselProps>((prev) => ({ ...prev, headline: e.target.value }))}
            placeholder="Slip ဖတ်တတ်တိုင်း Order မထုတ်ပါနဲ့။"
          />
        </div>

        {currentSlide === 0 && (
          <div style={{ padding: "14px", backgroundColor: `${BRAND_COLORS.SOFT_SAGE}15`, borderRadius: "8px" }} className="space-y-3">
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>Slide 1: Cover မျက်နှာဖုံး အချက်အလက်များ</h4>
            <div>
              <label className="studio-field-label">မျက်နှာဖုံး ခေါင်းစဉ်ကြီး</label>
              <input
                type="text"
                className="input-field"
                value={p.slides?.[0]?.title || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProps<AlbumCarouselProps>((prev) => {
                    const next = [...prev.slides] as typeof prev.slides;
                    next[0] = { ...next[0], title: val };
                    return { ...prev, slides: next };
                  });
                }}
              />
            </div>
            <div>
              <label className="studio-field-label">ဆွဲဆောင်မှု မေးခွန်း (Mascot Box ထဲရှိ စာသား)</label>
              <textarea
                className="input-field"
                rows={2}
                value={p.slides?.[0]?.hookQuestion || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProps<AlbumCarouselProps>((prev) => {
                    const next = [...prev.slides] as typeof prev.slides;
                    next[0] = { ...next[0], hookQuestion: val };
                    return { ...prev, slides: next };
                  });
                }}
              />
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div style={{ padding: "14px", backgroundColor: `${BRAND_COLORS.SOFT_SAGE}15`, borderRadius: "8px" }} className="space-y-3">
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#EF4444" }}>Slide 2: ဖြစ်တတ်သော အမှားနှင့် ဆုံးရှုံးနိုင်ခြေ Risk</h4>
            <div>
              <label className="studio-field-label">အမှားအဆင့် ခေါင်းစဉ် (Step 02)</label>
              <input
                type="text"
                className="input-field"
                value={p.slides?.[1]?.problemStep2?.title || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProps<AlbumCarouselProps>((prev) => {
                    const next = [...prev.slides] as typeof prev.slides;
                    next[1] = { ...next[1], problemStep2: { ...next[1].problemStep2, title: val } };
                    return { ...prev, slides: next };
                  });
                }}
              />
            </div>
            <div>
              <label className="studio-field-label">သတိပြုရန် Risk သတိပေးချက် ဘောက်စ်</label>
              <textarea
                className="input-field"
                rows={2}
                value={p.slides?.[1]?.riskWarning || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProps<AlbumCarouselProps>((prev) => {
                    const next = [...prev.slides] as typeof prev.slides;
                    next[1] = { ...next[1], riskWarning: val };
                    return { ...prev, slides: next };
                  });
                }}
              />
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div style={{ padding: "14px", backgroundColor: `${BRAND_COLORS.VIRIDIAN}10`, borderRadius: "8px" }} className="space-y-3">
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>Slide 3: မှန်ကန်သော FYF Workflow စနစ်</h4>
            <div>
              <label className="studio-field-label">လူကိုယ်တိုင် စစ်ဆေးသည့် အဆင့် ခေါင်းစဉ် (Step 04)</label>
              <input
                type="text"
                className="input-field"
                value={p.slides?.[2]?.solutionStep2?.title || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProps<AlbumCarouselProps>((prev) => {
                    const next = [...prev.slides] as typeof prev.slides;
                    next[2] = { ...next[2], solutionStep2: { ...next[2].solutionStep2, title: val } };
                    return { ...prev, slides: next };
                  });
                }}
              />
            </div>
          </div>
        )}

        {currentSlide === 3 && (
          <div style={{ padding: "14px", backgroundColor: `${BRAND_COLORS.SOFT_SAGE}15`, borderRadius: "8px" }} className="space-y-3">
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN }}>Slide 4: Key Takeaway နှင့် စနစ်စည်းမျဉ်းများ</h4>
            <div>
              <label className="studio-field-label">အဓိက စည်းမျဉ်း ကိုးကားစာသား (Main Quote)</label>
              <textarea
                className="input-field"
                rows={3}
                value={p.slides?.[3]?.quoteText || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProps<AlbumCarouselProps>((prev) => {
                    const next = [...prev.slides] as typeof prev.slides;
                    next[3] = { ...next[3], quoteText: val };
                    return { ...prev, slides: next };
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render property editor for Family 2: System / Risk Story
  const renderSystemRiskStoryEditor = () => {
    const p = propsState as SystemRiskStoryProps;
    const stages = p.stages || [];

    const handleStageChange = (
      index: number,
      field: keyof SystemRiskStoryStage,
      value: string | boolean
    ) => {
      updateProps<SystemRiskStoryProps>((prev) => {
        const nextStages = [...(prev.stages || [])];
        nextStages[index] = { ...nextStages[index], [field]: value };
        return { ...prev, stages: nextStages };
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">ပင်မ ခေါင်းစဉ်ကြီး (Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<SystemRiskStoryProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
        <div>
          <label className="studio-field-label">ခေါင်းစဉ်ခွဲ ရှင်းလင်းချက် (Subtitle)</label>
          <input
            type="text"
            className="input-field"
            value={p.subtitle || ""}
            onChange={(e) => updateProps<SystemRiskStoryProps>((prev) => ({ ...prev, subtitle: e.target.value }))}
          />
        </div>
        <div className="pt-2">
          <label className="studio-field-label font-semibold">၅ ဆင့် လုပ်ငန်းစဉ် အဆင့်များ (5-Stage Steps)</label>
          <div className="space-y-3 mt-2">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  backgroundColor: stage.isHumanApproval ? `${BRAND_COLORS.VIRIDIAN}10` : BRAND_COLORS.SURFACE_WHITE,
                  border: `1px solid ${stage.isHumanApproval ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}40`}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>အဆင့် {stage.stageNumber || `0${idx + 1}`}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: BRAND_COLORS.VIRIDIAN, fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(stage.isHumanApproval)}
                      onChange={(e) => handleStageChange(idx, "isHumanApproval", e.target.checked)}
                    />
                    <span>လူစစ်ဆေးမှု Gate</span>
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: "12px" }}
                    value={stage.title}
                    onChange={(e) => handleStageChange(idx, "title", e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: "12px" }}
                    value={stage.description}
                    onChange={(e) => handleStageChange(idx, "description", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render property editor for Family 3: Knowledge & Frameworks
  const renderKnowledgeFrameworkEditor = () => {
    const p = propsState as KnowledgeFrameworkProps;
    const points = p.points || [];

    const handlePointChange = (
      index: number,
      field: keyof KnowledgeFrameworkPoint,
      value: string | number
    ) => {
      updateProps<KnowledgeFrameworkProps>((prev) => {
        const nextPoints = [...(prev.points || [])];
        nextPoints[index] = { ...nextPoints[index], [field]: value };
        return { ...prev, points: nextPoints };
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">ပင်မ ခေါင်းစဉ်ကြီး (Hero Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<KnowledgeFrameworkProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
        <div className="pt-2">
          <label className="studio-field-label font-semibold">အဓိက အချက် (၃) ချက် (3 Teaching Points)</label>
          <div className="space-y-3 mt-2">
            {points.slice(0, 3).map((pt, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                  border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.VIRIDIAN, display: "block", marginBottom: "6px" }}>
                  အချက် ၀{pt.number || idx + 1}
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: "12px" }}
                    value={pt.title}
                    onChange={(e) => handlePointChange(idx, "title", e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: "12px" }}
                    value={pt.description}
                    onChange={(e) => handlePointChange(idx, "description", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="studio-field-label">Key Idea Box (Mascot အောက်ရှိ အဓိက စိတ်ကူး)</label>
          <textarea
            className="input-field"
            rows={2}
            value={p.keyIdeaText || ""}
            onChange={(e) => updateProps<KnowledgeFrameworkProps>((prev) => ({ ...prev, keyIdeaText: e.target.value }))}
          />
        </div>
      </div>
    );
  };

  // Render property editor for Family 4: 3D Isometric System
  const renderIsometricEditor = () => {
    const p = propsState as IsometricSystemDioramaProps;
    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">ပင်မ ခေါင်းစဉ်ကြီး (Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<IsometricSystemDioramaProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
        <div>
          <label className="studio-field-label">စနစ် လုပ်ငန်းစဉ် ရှင်းလင်းချက် (Flow Subtext)</label>
          <textarea
            className="input-field"
            rows={3}
            value={p.subtext || ""}
            onChange={(e) => updateProps<IsometricSystemDioramaProps>((prev) => ({ ...prev, subtext: e.target.value }))}
          />
        </div>
      </div>
    );
  };

  // Render property editor for Family 5: Mascot Storytelling
  const renderMascotStoryEditor = () => {
    const p = propsState as MascotStorytellingProps;
    const points = p.points || [];

    const handlePointChange = (index: number, field: keyof MascotStorytellingPoint, value: string) => {
      updateProps<MascotStorytellingProps>((prev) => {
        const next = [...(prev.points || [])];
        next[index] = { ...next[index], [field]: value };
        return { ...prev, points: next };
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">သတိပေးချက် ခေါင်းစဉ် (Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<MascotStorytellingProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
        <div>
          <label className="studio-field-label">Puck Mascot ၏ ရွှေစည်းမျဉ်း (Dialogue Quote)</label>
          <textarea
            className="input-field"
            rows={3}
            value={p.mascotQuote || ""}
            onChange={(e) => updateProps<MascotStorytellingProps>((prev) => ({ ...prev, mascotQuote: e.target.value }))}
          />
        </div>
        <div className="pt-2">
          <label className="studio-field-label font-semibold">ဖြစ်ရပ်နှိုင်းယှဉ်ချက် (၃) ချက်</label>
          <div className="space-y-3 mt-2">
            {points.map((pt, idx) => (
              <div key={idx} style={{ padding: "10px", borderRadius: "6px", backgroundColor: BRAND_COLORS.SURFACE_WHITE, border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40` }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ fontSize: "12px", marginBottom: "6px" }}
                  value={pt.title}
                  onChange={(e) => handlePointChange(idx, "title", e.target.value)}
                />
                <textarea
                  className="input-field"
                  rows={2}
                  style={{ fontSize: "12px" }}
                  value={pt.desc}
                  onChange={(e) => handlePointChange(idx, "desc", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render property editor for Family 6: Dark Blueprint
  const renderDarkBlueprintEditor = () => {
    const p = propsState as DarkBlueprintCircuitProps;
    const nodes = p.nodes || [];

    const handleNodeChange = (index: number, field: keyof DarkBlueprintCircuitNode, value: string) => {
      updateProps<DarkBlueprintCircuitProps>((prev) => {
        const next = [...(prev.nodes || [])];
        next[index] = { ...next[index], [field]: value };
        return { ...prev, nodes: next };
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">Architecture ခေါင်းစဉ် (Title)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<DarkBlueprintCircuitProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
        <div className="pt-2">
          <label className="studio-field-label font-semibold">System Nodes (၄ ခု)</label>
          <div className="space-y-3 mt-2">
            {nodes.map((n, idx) => (
              <div key={idx} style={{ padding: "10px", borderRadius: "6px", backgroundColor: n.isHighlight ? `${BRAND_COLORS.VIRIDIAN}10` : BRAND_COLORS.SURFACE_WHITE, border: `1px solid ${n.isHighlight ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}40`}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px", marginBottom: "6px" }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: "12px" }}
                    value={n.tag}
                    onChange={(e) => handleNodeChange(idx, "tag", e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: "12px" }}
                    value={n.title}
                    onChange={(e) => handleNodeChange(idx, "title", e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  className="input-field"
                  style={{ fontSize: "12px" }}
                  value={n.desc}
                  onChange={(e) => handleNodeChange(idx, "desc", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render property editor for Family 7: Real Architecture UI
  const renderLiveUiEditor = () => {
    const p = propsState as LiveArchitectureUiProps;
    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">IDE Window ခေါင်းစဉ်ကြီး (Main Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<LiveArchitectureUiProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
      </div>
    );
  };

  // Render property editor for Family 8: Photo Editorial Split
  const renderPhotoEditorialSplitEditor = () => {
    const p = propsState as PhotoEditorialSplitProps;
    const handleBodyLinesChange = (text: string) => {
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      updateProps<PhotoEditorialSplitProps>((prev) => ({ ...prev, burmeseBodyLines: lines }));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">အောက်ခြမ်း မြန်မာ ခေါင်းစဉ် (Burmese Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.burmeseTitle || p.headline || ""}
            onChange={(e) => {
              const val = e.target.value;
              updateProps<PhotoEditorialSplitProps>((prev) => ({ ...prev, burmeseTitle: val, headline: val }));
            }}
          />
        </div>
        <div>
          <label className="studio-field-label">ရှင်းလင်းချက် စာသားများ (တစ်ကြောင်းလျှင် တစ်ပိုဒ်)</label>
          <textarea
            className="input-field"
            rows={4}
            value={(p.burmeseBodyLines || []).join("\n")}
            onChange={(e) => handleBodyLinesChange(e.target.value)}
          />
        </div>
        <div>
          <label className="studio-field-label">ဓာတ်ပုံ သို့မဟုတ် Image URL ထည့်သွင်းရန်</label>
          <input
            type="text"
            className="input-field"
            value={p.photoDataUri || ""}
            onChange={(e) => updateProps<PhotoEditorialSplitProps>((prev) => ({ ...prev, photoDataUri: e.target.value }))}
            placeholder="data:image/png;base64,... သို့မဟုတ် Image Link"
          />
        </div>
      </div>
    );
  };

  // Render property editor for Family 9: AI News & Analysis
  const renderAiNewsAnalysisEditor = () => {
    const p = propsState as AiNewsAnalysisProps;
    const handleLinesChange = (key: "confirmedFacts" | "fyfAnalysis" | "openQuestions", text: string) => {
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      updateProps<AiNewsAnalysisProps>((prev) => ({ ...prev, [key]: lines }));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="studio-field-label">သတင်း ခေါင်းစဉ်ကြီး (Main Headline)</label>
          <input
            type="text"
            className="input-field"
            value={p.headline || ""}
            onChange={(e) => updateProps<AiNewsAnalysisProps>((prev) => ({ ...prev, headline: e.target.value }))}
          />
        </div>
        <div>
          <label className="studio-field-label">အတည်ပြုချက်များ (Confirmed Facts - ၁ ကြောင်း ၁ ချက်)</label>
          <textarea
            className="input-field"
            rows={3}
            value={(p.confirmedFacts || []).join("\n")}
            onChange={(e) => handleLinesChange("confirmedFacts", e.target.value)}
          />
        </div>
        <div>
          <label className="studio-field-label">FYF စနစ် သုံးသပ်ချက် (FYF Analysis - ၁ ကြောင်း ၁ ချက်)</label>
          <textarea
            className="input-field"
            rows={3}
            value={(p.fyfAnalysis || []).join("\n")}
            onChange={(e) => handleLinesChange("fyfAnalysis", e.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`banner-studio-container ${className}`} style={{ width: "100%" }}>
      {/* AI Recommendation Banner */}
      {recommendation && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            marginBottom: "16px",
            backgroundColor: "#FFFBEB",
            border: "1px solid #F59E0B",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>⭐</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#92400E", fontWeight: 700 }}>
                  AI Recommended Visual Style:
                </strong>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    backgroundColor: "#D97706",
                    color: "#FFFFFF",
                  }}
                >
                  {TEMPLATE_FAMILIES.find((f) => f.id === recommendation.family)?.label || recommendation.family}
                </span>
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#78350F", lineHeight: 1.3 }}>
                {recommendation.rationale}
              </p>
            </div>
          </div>
          {activeFamily !== recommendation.family && (
            <button
              type="button"
              onClick={() => handleFamilyChange(recommendation.family)}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: "6px",
                backgroundColor: BRAND_COLORS.VIRIDIAN,
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(22, 133, 107, 0.3)",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              ⭐ Apply Best Match
            </button>
          )}
        </div>
      )}

      {/* Visual Category Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        {[
          { id: "all", label: "🌟 All 9 Visual Styles" },
          { id: "album", label: "📚 Multi-Slide Album" },
          { id: "framework", label: "🏛️ Warm Ivory Frameworks" },
          { id: "tech", label: "⚡ Dark Tech Engines" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilterCategory(cat.id as typeof filterCategory)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: filterCategory === cat.id ? 700 : 500,
              backgroundColor: filterCategory === cat.id ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.SURFACE_WHITE,
              color: filterCategory === cat.id ? BRAND_COLORS.SURFACE_WHITE : BRAND_COLORS.OLIVE_INK,
              border: `1px solid ${filterCategory === cat.id ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}60`}`,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Visual Family Cards Grid */}
      <div
        className="template-family-selector"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {filteredFamilies.map((fam) => {
          const isActive = activeFamily === fam.id;
          const isRecommended = recommendation?.family === fam.id;
          return (
            <button
              key={fam.id}
              type="button"
              onClick={() => handleFamilyChange(fam.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "14px 16px",
                borderRadius: "10px",
                border: isActive
                  ? `2px solid ${BRAND_COLORS.VIRIDIAN}`
                  : isRecommended
                    ? `1.5px solid #F59E0B`
                    : `1px solid ${BRAND_COLORS.SOFT_SAGE}50`,
                backgroundColor: isActive
                  ? BRAND_COLORS.WARM_IVORY
                  : isRecommended
                    ? "#FFFDF5"
                    : BRAND_COLORS.SURFACE_WHITE,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                boxShadow: isActive
                  ? `0 4px 14px ${BRAND_COLORS.VIRIDIAN}25`
                  : isRecommended
                    ? "0 3px 10px rgba(217, 119, 6, 0.15)"
                    : "0 1px 3px rgba(48, 56, 44, 0.03)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: isActive ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK }}>{fam.icon}</span>
                  <strong
                    style={{
                      fontSize: "13px",
                      color: isActive ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                      fontWeight: 700,
                    }}
                  >
                    {fam.label}
                  </strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {isRecommended && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#D97706",
                        backgroundColor: "#FEF3C7",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        border: "1px solid #F59E0B",
                      }}
                    >
                      ⭐ Best Match
                    </span>
                  )}
                  {isActive && <CheckCircle2 size={16} color={BRAND_COLORS.VIRIDIAN} />}
                </div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: isActive
                    ? `${BRAND_COLORS.VIRIDIAN}20`
                    : `${BRAND_COLORS.SOFT_SAGE}25`,
                  color: isActive ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK,
                  marginBottom: "4px",
                }}
              >
                {fam.badge}
              </span>
              <p
                style={{
                  fontSize: "11px",
                  color: BRAND_COLORS.OLIVE_INK,
                  opacity: 0.8,
                  margin: 0,
                  lineHeight: "1.4",
                }}
              >
                {fam.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Studio Grid: Left Editor | Right Live Preview */}
      <div
        className="banner-studio-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Contextual Property Editor */}
        <div
          className="banner-editor-panel"
          style={{
            padding: "20px",
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "12px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
            boxShadow: "0 2px 10px rgba(48, 56, 44, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", color: BRAND_COLORS.OLIVE_INK, fontWeight: 700 }}>
                Visual Properties Editor (စာသားနှင့် အချက်အလက် ပြင်ဆင်ရန်)
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.7 }}>
                ခေါင်းစဉ်၊ အချက်အလက်များနှင့် လူကိုယ်တိုင် စစ်ဆေးမည့် အဆင့်များကို စိတ်ကြိုက် ပြင်ဆင်နိုင်ပါသည်။
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={handleResetToAutoMapped}
                className="text-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: BRAND_COLORS.VIRIDIAN,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
                <span>မူလ အချက်အလက် ပြန်ယူရန်</span>
              </button>
            )}
          </div>

          {activeFamily === "album_carousel" && renderAlbumCarouselEditor()}
          {activeFamily === "system_risk_story" && renderSystemRiskStoryEditor()}
          {activeFamily === "knowledge_framework" && renderKnowledgeFrameworkEditor()}
          {activeFamily === "isometric_system_diorama" && renderIsometricEditor()}
          {activeFamily === "mascot_storytelling" && renderMascotStoryEditor()}
          {activeFamily === "dark_blueprint_circuit" && renderDarkBlueprintEditor()}
          {activeFamily === "live_architecture_ui" && renderLiveUiEditor()}
          {activeFamily === "photo_editorial_split" && renderPhotoEditorialSplitEditor()}
          {activeFamily === "ai_news_analysis" && renderAiNewsAnalysisEditor()}
        </div>

        {/* Right Column: Sticky Live Vector Preview */}
        <div
          className="banner-preview-column"
          style={{
            position: "sticky",
            top: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <BannerPreview
            svgString={renderedSvg}
            templateFamily={activeFamily}
            categoryLabel={propsState.categoryLabel}
            showControls={true}
          />

          {onSave && !readOnly && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => onSave(currentResult)}
                className="primary-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: BRAND_COLORS.VIRIDIAN,
                  color: BRAND_COLORS.SURFACE_WHITE,
                  fontWeight: 600,
                  padding: "10px 18px",
                  borderRadius: "6px",
                }}
              >
                <Save size={16} />
                <span>Confirm Visual Plan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
