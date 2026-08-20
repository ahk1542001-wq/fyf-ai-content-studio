"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Layers,
  BarChart3,
  BookOpen,
  Settings2,
  ChevronDown,
  Building2,
  PlusCircle,
  Check,
  X
} from "lucide-react";
import { BRAND_COLORS } from "@/frontend/styles/brandTokens";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";

const navItems = [
  { href: "/create", label: "Create Studio", icon: <Sparkles size={15} /> },
  { href: "/content", label: "Drafts & Posts", icon: <Layers size={15} /> },
  { href: "/analytics", label: "Performance Hub", icon: <BarChart3 size={15} /> },
  { href: "/references", label: "Reference Vault", icon: <BookOpen size={15} /> },
  { href: "/brand", label: "Brand Identity", icon: <Settings2 size={15} /> },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // New Client Form State
  const [clientName, setClientName] = useState("");
  const [pageName, setPageName] = useState("");
  const [industry, setIndustry] = useState("Retail SME");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setIsSubmitting(true);
    try {
      await createWorkspace({
        name: clientName.trim(),
        pageName: pageName.trim() || clientName.trim(),
        industry: industry.trim(),
        targetAudience: targetAudience.trim() || "Local customers and business buyers",
        brandDescription: brandDescription.trim() || `Official content studio for ${clientName.trim()}`,
        riskSensitivity: "standard"
      });
      setClientName("");
      setPageName("");
      setTargetAudience("");
      setBrandDescription("");
      setModalOpen(false);
      setDropdownOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create client workspace";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(244, 240, 230, 0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${BRAND_COLORS.OLIVE_INK}18`,
          boxShadow: "0 1px 3px rgba(48, 56, 44, 0.04)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            height: "68px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Brand Logo & Workspace Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link
              href="/create"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                color: BRAND_COLORS.OLIVE_INK,
              }}
            >
              {/* Official Mini Origami Emblem */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  backgroundColor: BRAND_COLORS.VIRIDIAN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 2px 6px ${BRAND_COLORS.VIRIDIAN}35`,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 300 285" fill="none">
                  <g fill="#F4F0E6">
                    <path d="M42 234.5 41.5 64 69 36.5 135 36.5 156.5 59 145 114.5 72 40.5 69.5 43 69.5 96 117.5 100 69.5 151 69.5 200Z" />
                    <path d="M144 156.5 144.5 124 158.5 61 184 36.5 238 36.5Z" />
                    <path d="M143 238.5 142.5 160 189 104.5 189.5 192Z" />
                    <path d="M154 86.5 158.5 61 184 36.5 238.5 38Z" fill="#A8B7A2" />
                    <path d="M219 131.5 191.5 131 193 99.5 245.5 100Z" />
                    <path d="M192 210.5 191.5 159 237 158.5Z" />
                  </g>
                </svg>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      letterSpacing: "-0.02em",
                      color: BRAND_COLORS.OLIVE_INK,
                    }}
                  >
                    FYF AI
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                      color: BRAND_COLORS.VIRIDIAN,
                      letterSpacing: "0.5px",
                    }}
                  >
                    AGENCY V2.0
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: BRAND_COLORS.OLIVE_INK,
                    opacity: 0.65,
                    fontWeight: 500,
                  }}
                >
                  Understand AI. Build Real Systems.
                </p>
              </div>
            </Link>

            {/* Interactive Workspace Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: `${BRAND_COLORS.SOFT_SAGE}20`,
                  border: `1px solid ${BRAND_COLORS.SOFT_SAGE}60`,
                  color: BRAND_COLORS.OLIVE_INK,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Building2 size={14} color={BRAND_COLORS.VIRIDIAN} />
                <span>{currentWorkspace.name}</span>
                <ChevronDown size={13} style={{ opacity: 0.7 }} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    width: "260px",
                    backgroundColor: BRAND_COLORS.SURFACE_WHITE,
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
                    padding: "8px",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: BRAND_COLORS.SOFT_SAGE,
                      textTransform: "uppercase",
                      padding: "6px 10px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Select Active Client
                  </div>

                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {workspaces.map((ws) => {
                      const isSelected = ws.id === currentWorkspace.id;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            switchWorkspace(ws.id);
                            setDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: isSelected ? `${BRAND_COLORS.VIRIDIAN}12` : "transparent",
                            color: BRAND_COLORS.OLIVE_INK,
                            fontSize: "13px",
                            fontWeight: isSelected ? 700 : 500,
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Building2 size={13} color={isSelected ? BRAND_COLORS.VIRIDIAN : BRAND_COLORS.SOFT_SAGE} />
                            <span>{ws.name}</span>
                          </div>
                          {isSelected && <Check size={14} color={BRAND_COLORS.VIRIDIAN} />}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ height: "1px", backgroundColor: `${BRAND_COLORS.SOFT_SAGE}40`, margin: "6px 0" }} />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setModalOpen(true);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: BRAND_COLORS.VIRIDIAN,
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <PlusCircle size={14} />
                    <span>+ New Client Workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Segmented Nav Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/create" && pathname === "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? BRAND_COLORS.SURFACE_WHITE : BRAND_COLORS.OLIVE_INK,
                    backgroundColor: isActive ? BRAND_COLORS.VIRIDIAN : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? `0 2px 8px ${BRAND_COLORS.VIRIDIAN}30` : "none",
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* New Client Workspace Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(48, 56, 44, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              borderRadius: "14px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: `1px solid ${BRAND_COLORS.SOFT_SAGE}40`,
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: `1px solid ${BRAND_COLORS.SOFT_SAGE}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: BRAND_COLORS.SURFACE_WHITE,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: `${BRAND_COLORS.VIRIDIAN}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={16} color={BRAND_COLORS.VIRIDIAN} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: BRAND_COLORS.OLIVE_INK }}>
                    Create Client Workspace
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: BRAND_COLORS.SOFT_SAGE }}>
                    Add a new business or client brand profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: BRAND_COLORS.SOFT_SAGE,
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClient} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="studio-field-label">Client / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shwe Taung Logistics, Apex Fitness"
                  className="input-field"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label className="studio-field-label">Facebook Page Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Fitness Myanmar"
                    className="input-field"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="studio-field-label">Industry / Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Retail, Health, Gold"
                    className="input-field"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="studio-field-label">Target Audience & Customers</label>
                <input
                  type="text"
                  placeholder="e.g. Local gym members, fitness enthusiasts in Yangon"
                  className="input-field"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div>
                <label className="studio-field-label">Brand Voice & Mission Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Energetic, motivating Burmese content for everyday workout tips."
                  className="input-field"
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="ghost-button"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !clientName.trim()}
                  className="primary-button"
                  style={{
                    padding: "8px 20px",
                    fontSize: "13px",
                    backgroundColor: BRAND_COLORS.VIRIDIAN,
                    color: BRAND_COLORS.SURFACE_WHITE,
                    fontWeight: 700,
                  }}
                >
                  {isSubmitting ? "Creating..." : "Create Client Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
