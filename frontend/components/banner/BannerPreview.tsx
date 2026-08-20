"use client";

import React, { useState } from "react";
import { Copy, Download, Image as ImageIcon, Check } from "lucide-react";
import { downloadBannerAsPng, downloadBannerAsSvg } from "@/frontend/utils/bannerExport";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import type { BannerTemplateFamily } from "@/src/domain/banner/types";

export interface BannerPreviewProps {
  svgString?: string;
  width?: number;
  height?: number;
  aspectRatio?: "1:1" | "4:5" | "16:9";
  className?: string;
  showControls?: boolean;
  categoryLabel?: string;
  templateFamily?: BannerTemplateFamily | string;
  onDownloadPng?: () => void;
  onDownloadSvg?: () => void;
  onCopySvg?: () => void;
}

const familyDisplayNames: Record<string, string> = {
  system_risk_story: "System / Risk Story",
  knowledge_framework: "Knowledge & Frameworks",
  isometric_system_diorama: "3D Isometric System",
  mascot_storytelling: "Mascot Storytelling",
  dark_blueprint_circuit: "Dark Blueprint Engine",
  live_architecture_ui: "Real Architecture UI",
  album_carousel: "Carousel Album (4 Slides)",
  photo_editorial_split: "Photo Editorial Split",
  ai_news_analysis: "AI News & Analysis",
};

export const BannerPreview: React.FC<BannerPreviewProps> = ({
  svgString,
  width = 1080,
  height = 1080,
  aspectRatio = "1:1",
  className = "",
  showControls = true,
  categoryLabel,
  templateFamily,
  onDownloadPng,
  onDownloadSvg,
  onCopySvg,
}) => {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleDownloadPng = async () => {
    if (!svgString) return;
    if (onDownloadPng) {
      onDownloadPng();
      return;
    }
    try {
      setIsExportingPng(true);
      const filename = `fyf-banner-${templateFamily || "1080x1080"}-${Date.now()}.png`;
      await downloadBannerAsPng(svgString, filename, width, height);
    } catch (err) {
      console.error("Failed to export PNG:", err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    if (onDownloadSvg) {
      onDownloadSvg();
      return;
    }
    const filename = `fyf-banner-${templateFamily || "1080x1080"}-${Date.now()}.svg`;
    downloadBannerAsSvg(svgString, filename);
  };

  const handleCopySvg = async () => {
    if (!svgString) return;
    if (onCopySvg) {
      onCopySvg();
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
      return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(svgString);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Failed to copy SVG:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2500);
    }
  };

  const aspectRatioClass =
    aspectRatio === "4:5"
      ? "aspect-[4/5]"
      : aspectRatio === "16:9"
        ? "aspect-[16/9]"
        : "aspect-square";

  const familyName = templateFamily
    ? familyDisplayNames[templateFamily] || templateFamily
    : null;

  return (
    <div
      className={`banner-preview-card ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: BRAND_COLORS.SURFACE_WHITE,
        borderRadius: "12px",
        border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
        boxShadow: "0 4px 20px rgba(48, 56, 44, 0.08)",
        overflow: "hidden",
      }}
    >
      {/* Header Info Bar */}
      <div
        className="banner-preview-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
          backgroundColor: BRAND_COLORS.WARM_IVORY,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="dimension-badge"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: "4px",
              backgroundColor: BRAND_COLORS.OLIVE_INK,
              color: BRAND_COLORS.WARM_IVORY,
              letterSpacing: "0.03em",
            }}
          >
            {width} × {height} px
          </span>
          {familyName && (
            <span
              className="family-badge"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: `${BRAND_COLORS.VIRIDIAN}18`,
                color: BRAND_COLORS.VIRIDIAN,
                border: `1px solid ${BRAND_COLORS.VIRIDIAN}40`,
              }}
            >
              {familyName}
            </span>
          )}
          {categoryLabel && (
            <span
              style={{
                fontSize: "11px",
                color: BRAND_COLORS.OLIVE_INK,
                opacity: 0.7,
                fontWeight: 500,
              }}
            >
              {categoryLabel}
            </span>
          )}
        </div>

        {showControls && svgString && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={handleCopySvg}
              title="Copy raw SVG XML"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 500,
                color: BRAND_COLORS.OLIVE_INK,
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {copyStatus === "copied" ? (
                <>
                  <Check size={14} color={BRAND_COLORS.VIRIDIAN} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy SVG</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              title="Download vector SVG file"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 500,
                color: BRAND_COLORS.OLIVE_INK,
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Download size={14} />
              <span>SVG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExportingPng}
              title="Download 1080x1080 raster PNG"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: BRAND_COLORS.SURFACE_WHITE,
                backgroundColor: BRAND_COLORS.VIRIDIAN,
                border: "none",
                borderRadius: "6px",
                cursor: isExportingPng ? "not-allowed" : "pointer",
                opacity: isExportingPng ? 0.7 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <Download size={14} />
              <span>{isExportingPng ? "Rendering..." : "Download PNG"}</span>
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas Viewport */}
      <div
        className={`banner-canvas-viewport ${aspectRatioClass}`}
        style={{
          width: "100%",
          position: "relative",
          backgroundColor: BRAND_COLORS.WARM_IVORY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {svgString ? (
          <div
            className="banner-svg-wrapper"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        ) : (
          <div
            className="banner-empty-placeholder"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "40px 20px",
              textAlign: "center",
              color: BRAND_COLORS.OLIVE_INK,
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "28px",
                backgroundColor: `${BRAND_COLORS.SOFT_SAGE}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: BRAND_COLORS.OLIVE_INK,
              }}
            >
              <ImageIcon size={28} />
            </div>
            <strong style={{ fontSize: "15px", color: BRAND_COLORS.OLIVE_INK }}>
              No Banner Generated Yet
            </strong>
            <p
              style={{
                fontSize: "13px",
                color: BRAND_COLORS.OLIVE_INK,
                opacity: 0.75,
                maxWidth: "320px",
                margin: 0,
              }}
            >
              Select a topic or edit properties to render the live 1080×1080 vector banner graphic.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
