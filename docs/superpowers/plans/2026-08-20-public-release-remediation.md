# Public Release Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Remove the known Next/sharp advisory from the release candidate and document a non-destructive, history-safe public release boundary.

**Architecture:** Keep the private working repository and its history intact. Upgrade the Next runtime and its aligned ESLint integration in place, migrate the request gate from the deprecated middleware convention to the Next 16 proxy convention, then verify the full application. Separately, produce a release audit that defines an allowlisted public snapshot and excludes local data, generated artifacts, held files, and legacy identifying history.

**Tech Stack:** Next.js 16.3.1, React 19, TypeScript, ESLint 9, Vitest, SQLite/filesystem local runtime, Git.

**Spec:** `docs/security.md`, `docs/roadmap.md`, and the current release-gate requirements in `README.md`.

## Global Constraints

- Do not push, deploy, change repository visibility, or create a public mirror in this task.
- Do not delete private history, local databases, generated outputs, held files, or user-authored worktree changes.
- Keep `next` and `eslint-config-next` aligned at `16.3.1`.
- Keep Node `>=22` as the supported runtime.
- Production content/runtime model routing remains Vertex; this remediation does not add hosted auth or a new persistence service.
- The public candidate must be a clean allowlisted snapshot, not a cleanup of the private repository.

### Task 1: Upgrade the Next security baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `proxy.ts`
- Delete: `middleware.ts`
- Verify: `tsconfig.json`, `next-env.d.ts`, `eslint.config.mjs`

**Interfaces:**
- `proxy(request: NextRequest): NextResponse` keeps the existing demo-API gate behavior.
- `config.matcher` remains `['/api/workspaces/:path*']`.

- [ ] Record the current package and middleware state, then install exact `next@16.3.1` and `eslint-config-next@16.3.1`.
- [ ] Run the existing test, lint, and typecheck commands to expose migration failures before changing source.
- [ ] Rename the exported request gate to `proxy` in `proxy.ts`; preserve the matcher and response contract exactly.
- [ ] Regenerate only Next-managed type metadata if needed; do not edit generated output by hand.
- [ ] Re-run focused API gate tests, then the full verification suite.

### Task 2: Public-history release boundary

**Files:**
- Create: `docs/public-release-audit.md`
- Verify: `README.md`, `docs/security.md`, `.gitignore`, Git history, tracked/untracked paths

**Interfaces:**
- The report records evidence and exclusions only; it does not mutate or publish history.
- The report must distinguish release-candidate content from private-only artifacts.

- [ ] Inventory tracked, untracked, ignored, and historical paths without printing secret values or database contents.
- [ ] Define the allowlist for source, tests, documentation, package metadata, and brand assets that are actually referenced.
- [ ] Record excluded held files, local databases, generated output, one-off scripts, machine-specific instructions, and legacy client identifiers.
- [ ] Record the remaining gates: secret scan, diff check, tests, lint, typecheck, build, audit, license/visibility decision, and owner approval before push.
- [ ] Keep the private repository and all excluded history unchanged.

### Task 3: Final verification

- [ ] Run the complete Vitest suite, lint, typecheck with `--incremental false`, production build, `npm audit --omit=dev --audit-level=high`, `git diff --check`, and targeted release scans.
- [ ] Verify no held files were staged or deleted and no push/deploy occurred.
- [ ] Report exact results and residual risks; do not call the repository public-release-ready if any gate fails.
