# Target Component Architecture

**Project:** FYF AI Content Studio (`fyf-ai-content-studio`)
**Phase:** Local-first Studio + approved Video Pipeline handoff
**Date:** August 20, 2026

---

## 1. System Overview

FYF AI Content Studio is a local-first workspace for creating Burmese content from FYF brand guidance. A bounded LangGraph flow creates and reviews a draft, deterministic checks protect quality, and a human reviewer approves the content before manual export or a typed handoff to the separate FYF Video Pipeline.

```
[ Next.js Control Panel UI ]
  ├── 1. Studio (/create) ──────► [ 4-Pillar AI Drafting + Co-pilot Drawer + BannerStudio ]
  ├── 2. Planner (/content) ────► [ 4-Slot Weekly Buffer Queue + Sunday Executive Summary ]
  ├── 3. Performance (/analytics) ► [ Form, CSV, Screenshot Intake + Real Signal Deduplication ]
  ├── 4. References & Brand ───► [ Brand Foundation + Rule #10 Zero-Jargon + Past Posts ]
  └── 5. Human Review Gate ────► [ Risk Guard + Human Approval + Manual Post Tracking ]
          │ (local API; demo routes fail closed in production)
          ▼
[ Domain & Engine Layer ]
  ├── Content Engine: PromptBuilder, VertexLLMGateway (local deterministic adapter in tests), Dynamic Depth
  ├── Banner Engine: 9 Template Families + 4-Slide Album Carousel SVG / PNG Exporter
  ├── Buffer Engine: 4-Slot Weekly Cadence (Mon, Wed, Fri, Sun) + Health Calculator + Summary Rollup
  └── Analytics Engine: Deduplication Upsert + Multi-Input Parsing + Metric Rationale
          │
          ▼
[ Data & Repository Layer ]
  └── DemoRepository / local SQLite Store + Audit Trail + Prompt & Draft Versioning
```

---

## 2. Core Functional Modules

### A. 4-Pillar Content Engine & Co-pilot Chat Drawer (`/create`)
- **Pillars:**
  1. `🛡️ Risk & Failure Story` (350–450w, 4-Slide Album Carousel)
  2. `⚙️ Workflow Breakdown` (350–500w, 4-Slide Album Carousel)
  3. `💡 AI Reality vs Hype` (300–400w, Single 1080x1080 Graphic)
  4. `🇲🇲 Knowledge Framework` (180–250w, Single 1080x1080 Graphic)
- **Live Auto-Detection:** Analyzes draft topic/content in real-time and dynamically selects the `⭐ Best Match` pillar.
- **Interactive Co-pilot Drawer:** Expandable chat interface offering 1-click prompt chips (`💡 Brainstorm 3 Ideas`, `📰 Grok Bot News`, `🛡️ Stock Desync`, `📋 Slip Gate`) and 1-click `✨ Use in Studio & Draft`.
- **Taste UI Palette:** Warm Ivory (`#F4F0E6`), Olive Ink (`#30382C`), Viridian (`#16856B`), Amber (`#D97706`).

### B. BannerStudio Multi-Template Vector Engine (`src/domain/banner`)
- **Single Graphic Templates:** `system_story`, `framework_mascot`, `fact_analysis`, `contrast_split`, `quote_card`, `bullet_takeaways`, `cheatsheet_card`, `simple_bold`.
- **4-Slide Album Carousel Generator (`album_carousel`):**
  - Slide 1: Hook & Headline
  - Slide 2: The Failure Incident / Risk
  - Slide 3: Safe Step 1-2-3 Human Verification Gate
  - Slide 4: Golden FYF Rule + Messenger Lead CTA
- **Export Formats:** High-res SVG and PNG downloads with live canvas rendering.

### C. Weekly Buffer Queue & 4-Pillar Content Planner (`/content`)
- **4-Slot Weekly Schedule Cadence:**
  - **Monday (09:00 AM):** 🛡️ Risk & Failure Story (4-Slide Album)
  - **Wednesday (09:00 AM):** ⚙️ Workflow Breakdown (4-Slide Album)
  - **Friday (09:00 AM):** 💡 AI Reality vs Hype (Single Graphic)
  - **Sunday (07:00 PM):** 🇲🇲 Knowledge Framework & Executive Summary
- **Buffer Health Score:** Dynamic gauge (`0% to 100%`) showing weekly readiness.
- **1-Click AI Auto-Fill:** Direct jump from empty slots to pre-filled Studio drafts.
- **Sunday Weekly Executive Summary Generator:** 1-click aggregation of the week's top 3 posts into an executive overview for SME founders with Rule #10 Zero-Jargon and Messenger Lead CTA.

### D. Real Performance Hub (`/analytics`)
- **Triple Intake Modes:**
  1. 1-Click Form Input
  2. Facebook CSV Direct Upload
  3. Mobile Screenshot / Plain Text Intake
- **Strict Deduplication:** Automatic Upsert matching by Post ID and Draft ID.
- **AI Performance Signals:** Evidence-based insights identifying winning pillars and formats.

---

## 3. Confirmed Architecture Boundaries

- **Product Model:** Local-first operator tool for FYF brand content.
- **AI boundary:** Google Vertex AI / Gemini when enabled; deterministic local adapters remain available for development and tests.
- **Storage boundary:** Local SQLite is the current runtime. Hosted auth, durable cloud storage, and multi-tenant SaaS are future decisions, not selected requirements.
- **Human Approval Gate:** Mandatory before any external publishing or export.
- **Publishing Method:** Manual export and operator tracking; no automated Facebook publishing.
- **Video boundary:** Approved content crosses into `fyf.video-content.v1`; the Studio does not render voice, visuals, motion, or MP4 output.
- **Excluded runtime systems:** External client workflows and automation are not part of FYF Studio.
