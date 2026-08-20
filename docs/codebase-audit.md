# Codebase Audit & Migration Inventory

**Project:** FYF AI Content Agent Service (`FYF-AI-Content-Agent-Service`)
**Phase:** Phase 0A (Existing-System Audit and Implementation Specification)
**Date:** July 23, 2026

---

## 1. Executive Summary

This document performs an empirical audit of the earlier prototype codebase (now migrated to `FYF-AI-Content-Agent-Service`). The repository currently functions as a Phase 0.5 prototype ("Private Operator App" for Facebook content creation using SQLite demo snapshots, mock Gemini/Facebook/Sheets adapters, and synchronous draft lifecycle logic).

To transition into the confirmed **Agent-as-a-Service** architecture for FYF AI (LangGraph.js orchestration, private Cloud Run worker, Cloud Tasks dispatch, PostgreSQL state, and LiteLLM Proxy gateway targeting Vertex AI/Gemini), every subsystem in the existing codebase is audited and classified below into one of five categories:
- **PRESERVE:** Retain as-is or use directly in Phase 1+.
- **ADAPT:** Modify interface/logic to integrate with PostgreSQL and LangGraph.
- **REWRITE:** Completely re-implement to meet production durable state/graph requirements.
- **RETIRE:** Cease usage in V1 (remove mock behavior, do not carry over to production).
- **UNKNOWN:** Requires further owner review or spike validation.

---

## 2. Repository Structure & Runtime Inventory

```
FYF-AI-Content-Agent-Service/ (former fyf_web_app_test prototype)
├── package.json               [PRESERVE] - Next.js 15, React 19, Vitest, Playwright, Tailwind CSS setup
├── app/                       [ADAPT]    - Next.js App Router (UI screens and API routes)
│   ├── page.tsx               [ADAPT]    - Root dashboard entry point
│   ├── layout.tsx             [PRESERVE] - App layout shell and font configuration
│   └── api/workspaces/        [REWRITE]  - Demo API endpoints to be replaced by durable Command API
├── backend/                   [REWRITE/ADAPT]
│   ├── types.ts               [ADAPT]    - Extend types for LangGraph state, model profiles, audit schemas
│   ├── demoRepository.ts      [RETIRE]   - Synchronous demo repository using SQLite demo state
│   ├── draftLifecycle.ts      [REWRITE]  - Demo lifecycle logic (coupled to mock adapters & Forex)
│   ├── contentQuality.ts      [ADAPT]    - Reusable Burmese text quality scoring heuristics
│   ├── promptBuilder.ts       [ADAPT]    - Prompt formatting templates (adapt for LangGraph prompt nodes)
│   ├── workspaceGuards.ts     [PRESERVE] - Workspace isolation helper functions (`assertWorkspaceAccess`)
│   └── apiResponse.ts         [PRESERVE] - Standardized API error/response envelope helpers
├── integrations/              [RETIRE/REWRITE]
│   ├── mockGemini.ts          [RETIRE]   - Replace with LiteLLM model calls in LangGraph nodes
│   ├── mockFacebook.ts        [RETIRE]   - Retire completely. V1 supports manual export only
│   ├── mockSheets.ts          [RETIRE]   - Replace with PostgreSQL-backed structured brand profiles
│   ├── mockAnalytics.ts       [RETIRE]   - Mock analytics replaced by PostgreSQL `usage_ledger`
│   └── riskGuard.ts           [ADAPT]    - Preserve deterministic pattern; decouple Forex-specific rules
├── database/                  [RETIRE/REWRITE]
│   ├── schema/schema.sql      [ADAPT]    - Base reference for PostgreSQL Drizzle ORM schema
│   ├── sqliteDemo.ts          [RETIRE]   - SQLite snapshot store (remove after Postgres migration)
│   └── demo-data/             [RETIRE]   - Seed demo data (preserve curated brand examples only)
├── frontend/                  [PRESERVE/ADAPT]
│   ├── screens/               [PRESERVE] - 5-screen IA: Today, Create, Review, Export, Settings
│   └── styles/                [PRESERVE] - CSS styling tokens, Tailwind utilities, responsive layouts
├── tests/                     [PRESERVE/ADAPT]
│   ├── lifecycle.test.ts      [ADAPT]    - Adapt test intentions for LangGraph state machine
│   ├── riskGuard.test.ts      [PRESERVE] - Deterministic risk rule test patterns
│   ├── apiRoutes.test.ts      [REWRITE]  - Re-align with Command API endpoints
│   ├── securityHygiene.test.ts[ADAPT]    - Fix workspace path resolution in hygiene suite
│   ├── contentQuality.test.ts [PRESERVE] - Content quality scoring unit tests
│   └── ui/                    [PRESERVE] - Playwright smoke tests for UI interaction
└── docs/                      [ADAPT/NEW] - Architecture, security, testing, handoff, audit specs
```

---

## 3. Subsystem Audit & Migration Classifications

### 3.1 Data Access & Repository Layer
- **Current State:** `backend/demoRepository.ts` maintains an in-memory/SQLite snapshot state (`DemoAppState`) loaded via `database/sqliteDemo.ts`.
- **Classification:** **RETIRE** (Repo) / **REWRITE** (Data Layer)
- **Evidence:** `backend/demoRepository.ts#L92-L107`, `database/sqliteDemo.ts#L69-L90`
- **Reason:** In-memory SQLite snapshots cannot support multi-instance Cloud Run workers, atomic DB transactions, or concurrency-safe budget reservations.
- **Migration Risk:** Medium. Existing frontend relies on demo repository response structures. API response envelopes must remain compatible.
- **Required Verification:** Phase 1 PostgreSQL Drizzle ORM schema tests and tenant isolation tests.

### 3.2 Draft Lifecycle & State Machine
- **Current State:** `backend/draftLifecycle.ts` contains synchronous helper functions (`generateDraft`, `saveDraftEdit`, `applyAiFix`, `approveDraft`, `scheduleDraft`, `publishDraft`, `recoverDraft`).
- **Classification:** **REWRITE**
- **Evidence:** `backend/draftLifecycle.ts#L49-L50`, `backend/draftLifecycle.ts#L124-L145`
- **Reason:** Function logic is tightly coupled to `DemoRepository`, `mockGemini`, `mockFacebook`, and Forex-specific rewrites (`buildSafeForexRewrite`). Status values (`needs_review`, `scheduled`, `published`) conflict with V1 workflow states (`BRIEF_SUBMITTED`, `PENDING_HUMAN_APPROVAL`, `READY_FOR_EXPORT`).
- **Preserved Concepts:** Edit-lock semantics (editing an approved draft resets status to review), draft versioning history, audit event logging.
- **Migration Risk:** High. Must ensure graph node state transitions strictly mirror the new state-machine specification without lost revisions.
- **Required Verification:** Phase 2 LangGraph state machine integration tests and pause/resume tests.

### 3.3 Risk Guard & Safety Rules
- **Current State:** `integrations/riskGuard.ts` evaluates text using regular expressions (`guaranteed_profit`, `unrealistic_income`, `direct_financial_advice`, `high_pressure`, `misleading_claim`, `unsafe_trading_promise`).
- **Classification:** **ADAPT**
- **Evidence:** `integrations/riskGuard.ts#L9-L52`, `integrations/riskGuard.ts#L77-L91`
- **Reason:** The *deterministic pattern* (regex matching + severity classification + safer rewrite suggestions) is highly effective and must be preserved. However, the current rules are heavily tailored to Forex trading (e.g. `buildSafeForexRewrite`). FYF AI content focuses on AI automation and agentic workflows.
- **Action:** Preserve the deterministic execution engine in `riskGuard.ts`; adapt rule patterns to be workspace-configurable stored in PostgreSQL (`brand_profiles.forbidden_phrases` and `workspace_risk_rules`).
- **Migration Risk:** Low. Rule evaluation logic is pure and deterministic.
- **Required Verification:** `tests/riskGuard.test.ts` updated with FYF AI brand risk scenarios.

### 3.4 Integration Adapters
- **`integrations/mockGemini.ts`:**
  - **Classification:** **RETIRE**
  - **Evidence:** `integrations/mockGemini.ts#L15-L39`
  - **Reason:** Replaced by HTTP calls from Cloud Run worker nodes to LiteLLM Proxy (`/v1/chat/completions`) using vertex_ai Gemini models.
- **`integrations/mockFacebook.ts`:**
  - **Classification:** **RETIRE**
  - **Evidence:** `integrations/mockFacebook.ts#L4-L13`
  - **Reason:** V1 pilot supports manual content export only. Automated Facebook publishing is strictly prohibited in V1.
- **`integrations/mockSheets.ts`:**
  - **Classification:** **RETIRE**
  - **Evidence:** `integrations/mockSheets.ts#L3-L5`
  - **Reason:** Replaced by structured PostgreSQL queries against `brand_profiles` and `brand_examples`.

### 3.5 UI & Design Assets
- **Current State:** `frontend/screens/` implements a dense 5-screen interface (**Today**, **Create**, **Review**, **Export**, **Settings**).
- **Classification:** **PRESERVE**
- **Evidence:** `frontend/screens/` directory structure, `docs/architecture.md#L21-L28`
- **Reason:** The UI layout, Burmese typography support, responsive panels, customization controls, and manual export UI are clean, verified, and align perfectly with FYF AI pilot requirements.
- **Adaptation:** Connect frontend screens to the new Next.js Command API (`/api/v1/workflows`) and asynchronous status endpoints.
- **Migration Risk:** Low. Components are modular and isolated from backend data logic.
- **Required Verification:** Playwright UI smoke tests (`npm run smoke:ui`).

### 3.6 Security & Workspace Boundaries
- **Current State:** `backend/workspaceGuards.ts` provides `assertWorkspaceAccess` and `filterByWorkspace`.
- **Classification:** **PRESERVE**
- **Evidence:** `backend/workspaceGuards.ts#L1-L10`
- **Reason:** Workspace isolation helper functions are lightweight and correct. They will be used alongside PostgreSQL Row Level Security (RLS).
- **Required Verification:** `tests/securityHygiene.test.ts` and cross-workspace access API tests.

---

## 4. Summary Migration Matrix

| Component / Subsystem | Path / Location | Current Role | Target V1 Role | Action | Migration Risk |
|---|---|---|---|---|---|
| Next.js App Shell | `app/layout.tsx`, `app/page.tsx` | UI container | UI container for control panel | PRESERVE | Low |
| UI Screens (5-screen IA) | `frontend/screens/*` | React UI screens | React UI screens (connected to Command API) | PRESERVE | Low |
| Workspace Guards | `backend/workspaceGuards.ts` | Isolation helper | Isolation helper + DB RLS | PRESERVE | Low |
| Quality Scoring | `backend/contentQuality.ts` | Quality heuristics | Deterministic quality check node | ADAPT | Low |
| Prompt Templates | `backend/promptBuilder.ts` | Prompt string builder | Node prompt generator | ADAPT | Low |
| Risk Guard Engine | `integrations/riskGuard.ts` | Forex risk check | FYF AI brand risk check | ADAPT | Low |
| Database Schema | `database/schema/schema.sql` | SQLite DDL | Baseline for Drizzle PostgreSQL DDL | ADAPT | Medium |
| Draft Lifecycle | `backend/draftLifecycle.ts` | Sync demo lifecycle | LangGraph.js state machine | REWRITE | High |
| Demo Repository | `backend/demoRepository.ts` | SQLite demo state | PostgreSQL Drizzle ORM repository | REWRITE | High |
| Demo API Routes | `app/api/workspaces/*` | Sync demo endpoints | Async Command API & Status API | REWRITE | High |
| SQLite Snapshot Store | `database/sqliteDemo.ts` | Local DB persistence | Retired after Postgres verification | RETIRE | Medium |
| Mock Gemini Adapter | `integrations/mockGemini.ts` | Fake LLM generator | LiteLLM Proxy endpoint calls | RETIRE | Low |
| Mock Facebook Adapter | `integrations/mockFacebook.ts` | Fake FB publisher | Retired (Manual export only) | RETIRE | Low |
| Mock Sheets Adapter | `integrations/mockSheets.ts` | Fake Sheets fetch | PostgreSQL `brand_examples` table | RETIRE | Low |

---

## 5. Phase 0A Inventory Audit Sign-off

- **Production Code Added:** 0 lines (Documentation and specification only).
- **Dependencies Installed/Modified:** 0 dependencies.
- **External Network Calls:** 0 calls.
- **Cloud Resources Created:** 0 resources.
- **SQLite Files Deleted:** None. All demo adapters and files remain intact for current test execution.
