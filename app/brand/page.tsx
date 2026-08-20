"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  Sparkles,
  Shield,
  Palette,
  Save,
  Building2,
  Plus,
  Trash2
} from "lucide-react";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";
import { renderMascotSvgVector } from "@/src/domain/banner/assets/mascotDataUri";
import type { BrandProfile, BrandTonePersona } from "@/backend/types";

const PERSONA_OPTIONS: Array<{
  id: BrandTonePersona;
  label: string;
  burmese: string;
  description: string;
  icon: string;
}> = [
  {
    id: "friendly_disciplined",
    label: "Disciplined SME Lab",
    burmese: "လက်တွေ့ကျသော စနစ်တည်ဆောက်သူ",
    description: "Calm, practitioner-grounded, educational, zero hype.",
    icon: "🛡️"
  },
  {
    id: "energetic_bold",
    label: "Energetic & Bold",
    burmese: "တက်ကြွပြီး ဆန်းသစ်သော ရှေ့ပြေး",
    description: "High momentum, inspiring, direct, action-oriented.",
    icon: "⚡"
  },
  {
    id: "luxury_prestigious",
    label: "Prestigious Luxury",
    burmese: "ခန့်ညားထည်ဝါသော တန်ဖိုးမြင့်အမှတ်တံဆိပ်",
    description: "Refined, exclusive, elegant, craftsmanship-first.",
    icon: "💎"
  },
  {
    id: "formal_technical",
    label: "Formal Corporate",
    burmese: "တရားဝင် လုပ်ငန်းသုံး ကော်ပိုရိတ်စနစ်",
    description: "Data-driven, compliant, structured, enterprise-ready.",
    icon: "💼"
  }
];

export default function BrandPage() {
  const { currentWorkspace } = useWorkspace();
  const activeWorkspaceId = currentWorkspace?.id || "ws-fyf";

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [tonePersona, setTonePersona] = useState<BrandTonePersona>("friendly_disciplined");
  const [primaryColor, setPrimaryColor] = useState("#16856B");
  const [secondaryColor, setSecondaryColor] = useState("#30382C");
  const [accentColor, setAccentColor] = useState("#A8B7A2");
  const [backgroundColor, setBackgroundColor] = useState("#F4F0E6");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [voiceNotes, setVoiceNotes] = useState("");
  const [customCta, setCustomCta] = useState("");
  const [forbiddenPhrases, setForbiddenPhrases] = useState<string[]>([]);
  const [newForbiddenWord, setNewForbiddenWord] = useState("");

  useEffect(() => {
    async function loadBrandProfile() {
      try {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/brand-profile`);
        if (res.ok) {
          const data = await res.json();
          if (data.brandProfile) {
            const p: BrandProfile = data.brandProfile;
            setTonePersona(p.tonePersona || "friendly_disciplined");
            setPrimaryColor(p.primaryColor || "#16856B");
            setSecondaryColor(p.secondaryColor || "#30382C");
            setAccentColor(p.accentColor || "#A8B7A2");
            setBackgroundColor(p.backgroundColor || "#F4F0E6");
            setDescription(p.description || "");
            setTargetAudience(p.targetAudience || "");
            setVoiceNotes(p.voiceNotes || "");
            setCustomCta(p.customCta || p.preferredCtas?.[0] || "");
            setForbiddenPhrases(p.forbiddenPhrases || []);
          }
        }
      } catch (err) {
        console.error("Failed to load brand profile:", err);
      }
    }
    loadBrandProfile();
  }, [activeWorkspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/brand-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tonePersona,
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          description,
          targetAudience,
          voiceNotes,
          customCta,
          forbiddenPhrases
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save brand profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddForbiddenWord = () => {
    if (!newForbiddenWord.trim()) return;
    if (!forbiddenPhrases.includes(newForbiddenWord.trim())) {
      setForbiddenPhrases([...forbiddenPhrases, newForbiddenWord.trim()]);
    }
    setNewForbiddenWord("");
  };

  const handleRemoveForbiddenWord = (word: string) => {
    setForbiddenPhrases(forbiddenPhrases.filter((w) => w !== word));
  };

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "16px 0 60px" }}>
      {/* Hero Header */}
      <div
        style={{
          padding: "32px",
          backgroundColor: BRAND_COLORS.SURFACE_WHITE,
          borderRadius: "16px",
          border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
          boxShadow: "0 4px 20px rgba(48, 56, 44, 0.04)",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                color: BRAND_COLORS.VIRIDIAN,
                letterSpacing: "0.5px"
              }}
            >
              BRAND VOICE OS • PHASE 2
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: BRAND_COLORS.OLIVE_INK, fontWeight: 600 }}>
              <Building2 size={14} color={BRAND_COLORS.VIRIDIAN} />
              {currentWorkspace?.name || "FYF AI"}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: BRAND_COLORS.OLIVE_INK, letterSpacing: "-0.02em" }}>
            Brand Voice & Identity Customizer
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: BRAND_COLORS.VIRIDIAN, fontWeight: 600 }}>
            {currentWorkspace?.pageName || "FYF AI"} အတွက် သီးသန့် Brand Persona၊ Color Tokens နှင့် Content Rules များ
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {saveSuccess && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: BRAND_COLORS.VIRIDIAN, fontSize: "13px", fontWeight: 700 }}>
              <Check size={16} /> Saved!
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: BRAND_COLORS.VIRIDIAN,
              color: BRAND_COLORS.SURFACE_WHITE,
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <Save size={15} />
            <span>{isSaving ? "Saving..." : "Save Brand Voice OS"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Persona Selector & Colors */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginBottom: "28px" }}>
        {/* Left Card: Brand Persona & Voice Settings */}
        <div
          style={{
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "14px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
            padding: "24px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <Sparkles size={18} color={BRAND_COLORS.VIRIDIAN} />
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
              Brand Persona & Tone (အသံနေအထား စည်းမျဉ်းများ)
            </h2>
          </div>

          {/* Persona Options Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {PERSONA_OPTIONS.map((opt) => {
              const isSelected = tonePersona === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setTonePersona(opt.id)}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: `1.5px solid ${isSelected ? BRAND_COLORS.VIRIDIAN : `${BRAND_COLORS.SOFT_SAGE}40`}`,
                    backgroundColor: isSelected ? `${BRAND_COLORS.VIRIDIAN}10` : BRAND_COLORS.SURFACE_WHITE,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "18px" }}>{opt.icon}</span>
                    <strong style={{ fontSize: "13px", color: isSelected ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.OLIVE_INK }}>
                      {opt.label}
                    </strong>
                  </div>
                  <div style={{ fontSize: "11px", color: BRAND_COLORS.OLIVE_INK, opacity: 0.8, marginBottom: "4px" }}>
                    {opt.burmese}
                  </div>
                  <div style={{ fontSize: "10px", color: BRAND_COLORS.SOFT_SAGE, lineHeight: 1.3 }}>
                    {opt.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Description & Target Audience */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK, marginBottom: "6px" }}>
                Brand Purpose & Core Promise (အမှတ်တံဆိပ် ဦးတည်ချက်)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. FYF AI helps Myanmar SME businesses build real AI workflows..."
                className="input-field"
                style={{ width: "100%", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK, marginBottom: "6px" }}>
                Target Audience Context (ဦးတည်သော ဖောက်သည်အလွှာ)
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Myanmar business owners, retail sellers, beginners..."
                className="input-field"
                style={{ width: "100%", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK, marginBottom: "6px" }}>
                Custom Messenger Lead CTA (Call to Action)
              </label>
              <input
                type="text"
                value={customCta}
                onChange={(e) => setCustomCta(e.target.value)}
                placeholder="e.g. သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow တည်ဆောက်လိုပါက Page Messenger သို့ စာပို့ပါ..."
                className="input-field"
                style={{ width: "100%", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK, marginBottom: "6px" }}>
                Voice & Content Writing Guidance
              </label>
              <input
                type="text"
                value={voiceNotes}
                onChange={(e) => setVoiceNotes(e.target.value)}
                placeholder="e.g. Use short paragraphs, practical examples, no complex tech jargon..."
                className="input-field"
                style={{ width: "100%", fontSize: "13px" }}
              />
            </div>
          </div>
        </div>

        {/* Right Card: Dynamic Color Tokens & Live Mascot Preview */}
        <div
          style={{
            backgroundColor: BRAND_COLORS.SURFACE_WHITE,
            borderRadius: "14px",
            border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
              <Palette size={18} color={BRAND_COLORS.VIRIDIAN} />
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
                Workspace Color Palette (အရောင်ခွဲခြားမှု)
              </h2>
            </div>

            {/* Live Color Pickers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: BRAND_COLORS.WARM_IVORY, borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>Brand Core Accent</div>
                  <div style={{ fontSize: "10px", color: BRAND_COLORS.SOFT_SAGE }}>Primary Buttons & Vectors</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: "32px", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>{primaryColor}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: BRAND_COLORS.WARM_IVORY, borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>Structure & Ink</div>
                  <div style={{ fontSize: "10px", color: BRAND_COLORS.SOFT_SAGE }}>Typography & Dark Borders</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ width: "32px", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>{secondaryColor}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: BRAND_COLORS.WARM_IVORY, borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>Background Canvas</div>
                  <div style={{ fontSize: "10px", color: BRAND_COLORS.SOFT_SAGE }}>Page & Card Background</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{ width: "32px", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>{backgroundColor}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: BRAND_COLORS.WARM_IVORY, borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>Soft Accent</div>
                  <div style={{ fontSize: "10px", color: BRAND_COLORS.SOFT_SAGE }}>Subtle Borders & Panels</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: "32px", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>{accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Mascot / Logo Vector Preview */}
          <div
            style={{
              padding: "16px",
              backgroundColor: backgroundColor,
              borderRadius: "10px",
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "150px"
            }}
          >
            <div
              style={{ width: "120px", height: "120px" }}
              dangerouslySetInnerHTML={{
                __html: `<svg viewBox="0 0 240 260" width="100%" height="100%">${renderMascotSvgVector(0, 0, 240, 260)}</svg>`
              }}
            />
          </div>
        </div>
      </div>

      {/* Forbidden Phrases & Negative Constraints Section */}
      <div
        style={{
          padding: "24px",
          backgroundColor: BRAND_COLORS.SURFACE_WHITE,
          borderRadius: "14px",
          border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
          marginBottom: "28px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Shield size={18} color={BRAND_COLORS.VIRIDIAN} />
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
            Forbidden Phrases & Negative Guardrails (အသုံးမပြုရမည့် စကားလုံးများ)
          </h2>
        </div>
        <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: BRAND_COLORS.SOFT_SAGE }}>
          AI Agent က Post ရေးသားရာတွင် ဤစကားလုံးများကို လုံးဝ (Zero-Tolerance) ရှောင်ကြဉ်ပြီး ရေးသားမည် ဖြစ်သည်။
        </p>

        {/* Tag Input */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <input
            type="text"
            value={newForbiddenWord}
            onChange={(e) => setNewForbiddenWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddForbiddenWord();
              }
            }}
            placeholder="e.g. ၁ ရက်တည်းနဲ့ ချမ်းသာနည်း၊ ၁၀၀% အာမခံ..."
            className="input-field"
            style={{ flex: 1, fontSize: "13px" }}
          />
          <button
            type="button"
            onClick={handleAddForbiddenWord}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: `1px solid ${BRAND_COLORS.VIRIDIAN}`,
              backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
              color: BRAND_COLORS.VIRIDIAN,
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <Plus size={15} /> Add Phrase
          </button>
        </div>

        {/* Existing Forbidden Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {forbiddenPhrases.map((phrase, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                backgroundColor: "#FEE2E2",
                color: "#B91C1C",
                fontSize: "12px",
                fontWeight: 600
              }}
            >
              🚫 {phrase}
              <button
                type="button"
                onClick={() => handleRemoveForbiddenWord(phrase)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#B91C1C",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
