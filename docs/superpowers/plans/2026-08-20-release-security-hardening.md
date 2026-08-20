# Release Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the FYF AI Content Agent Service safe to publish as a private GitHub repository by fixing deterministic lint failures, failing closed for unauthenticated demo APIs in production, preventing internal error disclosure, hardening repository hygiene, and verifying the exact staged scope before a feature-branch push.

**Architecture:** Keep the existing authenticated Supabase routes unchanged. Add a small server-side demo namespace gate that permits the local pilot in development/test but returns a non-disclosing 404 for `/api/workspaces/**` in production unless an explicit server-only opt-in is present. Keep the demo SQLite repository local-only and document that the gate is not a substitute for real workspace authorization.

**Tech Stack:** Next.js 15.5.22, TypeScript, ESLint flat config, Vitest, Supabase auth, local demo SQLite repository, npm lockfile, GitHub private repository.

**Spec:** Worker findings from the 2026-08-20 FYF release/security audit; existing project rules in `AGENTS.md`, `docs/security.md`, `docs/setup.md`, and `docs/api.md`.

## Global Constraints

- Do not read or stage `.env`, `.env.local`, credential files, `output/`, `.agents/`, databases, or raw recordings.
- Do not run `npm audit fix --force`; do not upgrade Next.js major in this release-hardening change.
- Preserve unrelated pre-existing dirty files and user-authored work.
- Demo `/api/workspaces/**` remains disabled by default in production; authenticated production routes remain available.
- No GitHub push occurs until focused tests, full tests, typecheck, lint, diff check, and staged-scope review pass.

---

### Task 1: Isolate the release branch and record the baseline

**Files:**
- Create: `docs/superpowers/plans/2026-08-20-release-security-hardening.md`
- Modify: none

**Interfaces:**
- Produces: feature branch `codex/fyf-release-security` and a saved baseline in the task handoff; no source files are changed by this task.

- [ ] **Step 1: Create the feature branch without touching `main`**

```bash
git switch -c codex/fyf-release-security
```

- [ ] **Step 2: Record the mixed worktree and confirm protected paths are not staged**

```bash
git -c core.fsmonitor=false status --short --branch
git -c core.fsmonitor=false diff --check
git -c core.fsmonitor=false ls-files --error-unmatch .env .env.local 2>/dev/null || true
```

Expected: existing dirty changes remain visible; no credential files are reported; the pre-fix diff check may report the known whitespace lines.

- [ ] **Step 3: Commit the plan only after source work is ready**

Do not stage or commit in this task. The plan file is included in the final allowlist commit with the verified fixes so the branch has one reviewable release-hardening commit.

### Task 2: Make lint and repository hygiene deterministic

**Files:**
- Modify: `backend/bufferEngine.ts:1-20`
- Modify: `eslint.config.mjs`
- Modify: `scripts/deep_human_test.js:1-4`
- Modify: `scripts/record_full_ui_demo.js:1-4`
- Modify: `scripts/record_master_human_testing_video.js:1-4`
- Modify: `.gitignore`
- Test: `tests/securityHygiene.test.ts`

**Interfaces:**
- Produces: `npm run lint` with zero errors; `.agents/` and `output/` are ignored without deleting existing files.

- [ ] **Step 1: Add the failing hygiene assertions**

Extend `tests/securityHygiene.test.ts` with exact assertions:

```ts
expect(gitignore).toContain(".agents/");
expect(gitignore).toContain("output/");
```

- [ ] **Step 2: Run the focused test to verify the new assertions fail**

```bash
npx vitest run tests/securityHygiene.test.ts
```

Expected: FAIL because `.agents/` and `output/` are not yet present in `.gitignore`.

- [ ] **Step 3: Apply the minimal lint/hygiene fixes**

Remove only the unused `Draft` import from `backend/bufferEngine.ts`. Add a JavaScript-only ESLint block for `scripts/**/*.js` with CommonJS source type and `require`, `__dirname`, `console`, `process`, `window`, and `setTimeout` globals. Remove the unused `path` import from `scripts/deep_human_test.js`. Add these exact ignore entries:

```gitignore
.agents/
output/
```

- [ ] **Step 4: Run focused lint and hygiene tests**

```bash
npm run lint
npx vitest run tests/securityHygiene.test.ts
```

Expected: both pass with no lint errors.

### Task 3: Add a production fail-closed demo API gate

**Files:**
- Create: `backend/demoApiGate.ts`
- Create: `middleware.ts`
- Create: `tests/demoApiGate.test.ts`
- Modify: `.env.example`
- Modify: `docs/env.md`
- Modify: `docs/security.md`

**Interfaces:**
- Produces: `isDemoApiPath(pathname: string): boolean` and `isDemoApiEnabled(env?: { nodeEnv?: string; flag?: string }): boolean`.
- Middleware: `/api/workspaces/:path*` returns JSON 404 with code `demo_api_disabled` in production when the flag is not exactly `true`; all other paths call `NextResponse.next()`.

- [ ] **Step 1: Write failing pure-function tests**

Create `tests/demoApiGate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isDemoApiEnabled, isDemoApiPath } from "../backend/demoApiGate";

describe("demo API gate", () => {
  it("matches only the workspaces namespace", () => {
    expect(isDemoApiPath("/api/workspaces")).toBe(true);
    expect(isDemoApiPath("/api/workspaces/abc/drafts")).toBe(true);
    expect(isDemoApiPath("/api/workspaceship")).toBe(false);
    expect(isDemoApiPath("/api/generate")).toBe(false);
  });

  it("allows local development and tests", () => {
    expect(isDemoApiEnabled({ nodeEnv: "development", flag: "false" })).toBe(true);
    expect(isDemoApiEnabled({ nodeEnv: "test", flag: undefined })).toBe(true);
  });

  it("denies production unless explicitly enabled", () => {
    expect(isDemoApiEnabled({ nodeEnv: "production", flag: undefined })).toBe(false);
    expect(isDemoApiEnabled({ nodeEnv: "production", flag: "false" })).toBe(false);
    expect(isDemoApiEnabled({ nodeEnv: "production", flag: "true" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused tests to verify RED**

```bash
npx vitest run tests/demoApiGate.test.ts
```

Expected: FAIL because `backend/demoApiGate.ts` does not exist.

- [ ] **Step 3: Implement the pure gate**

Create `backend/demoApiGate.ts` with exact behavior:

```ts
export function isDemoApiPath(pathname: string): boolean {
  return pathname === "/api/workspaces" || pathname.startsWith("/api/workspaces/");
}

export function isDemoApiEnabled(env: { nodeEnv?: string; flag?: string } = {
  nodeEnv: process.env.NODE_ENV,
  flag: process.env.FYF_DEMO_API_ENABLED,
}): boolean {
  return env.nodeEnv !== "production" || env.flag === "true";
}
```

- [ ] **Step 4: Add the middleware boundary and environment contract**

Create `middleware.ts` using `NextRequest` and `NextResponse`; for a matching path and a disabled gate return `NextResponse.json({ ok: false, error: { code: "demo_api_disabled", message: "Demo API disabled in production" } }, { status: 404 })`. Add `FYF_DEMO_API_ENABLED=false` to `.env.example`. Document that the flag is a deliberate local/staging opt-in and that public deployment still requires real Supabase workspace authorization.

- [ ] **Step 5: Run focused tests and typecheck**

```bash
npx vitest run tests/demoApiGate.test.ts
npx tsc --noEmit --incremental false
```

Expected: PASS.

### Task 4: Stop internal error details from reaching clients

**Files:**
- Modify: `backend/apiResponse.ts:1-60`
- Create: `tests/apiResponse.test.ts`

**Interfaces:**
- Produces: stable 500 JSON `{ ok: false, error: { code: "internal_error", message: "Internal server error" } }` while preserving explicit 4xx responses.

- [ ] **Step 1: Write the failing error-redaction test**

Add a test that passes an error containing `/private/database.sqlite` and `provider token` to the internal-error helper and asserts neither string appears in the serialized response.

- [ ] **Step 2: Run the focused test to verify RED**

```bash
npx vitest run tests/apiResponse.test.ts
```

Expected: FAIL because the current response includes `Error.message`.

- [ ] **Step 3: Implement generic client output**

Keep the server-side log sanitized and return only the stable `internal_error` code/message for unexpected errors. Preserve current explicit `ApiError` status/code handling.

- [ ] **Step 4: Run the focused test**

```bash
npx vitest run tests/apiResponse.test.ts
```

Expected: PASS.

### Task 5: Apply only the non-breaking dependency remediation

**Files:**
- Modify: `package-lock.json`
- Do not modify: `package.json` unless npm requires an exact manifest change.

**Interfaces:**
- Produces: lockfile resolves `nanoid` to at least `3.3.18` without changing the Next.js major version.

- [ ] **Step 1: Confirm the current transitive package and audit finding**

```bash
npm ls nanoid postcss sharp next --depth=4
npm audit --omit=dev --audit-level=moderate
```

- [ ] **Step 2: Update only the lockfile-compatible transitive range**

Use the smallest lockfile-only update that resolves `nanoid >=3.3.18`; do not run `npm audit fix --force`, and do not upgrade Next.js 15 to 16 in this branch.

- [ ] **Step 3: Verify dependency state**

```bash
npm ls nanoid postcss sharp next --depth=4
npm audit --omit=dev --audit-level=moderate
```

Expected: the nanoid finding is gone; any sharp/Next major-upgrade finding is recorded as a separate residual risk rather than silently forced.

### Task 6: Verify, stage an allowlist, commit, and push

**Files:**
- Stage only verified release-hardening files from Tasks 1–5.
- Exclude: `.agents/`, `output/`, `.env*`, databases, raw recordings, and unrelated pre-existing changes.

- [ ] **Step 1: Run the complete verification gate**

```bash
npm test
npx tsc --noEmit --incremental false
npm run lint
git -c core.fsmonitor=false diff --check
```

- [ ] **Step 2: Inspect the exact staged scope before commit**

```bash
git add -- backend/bufferEngine.ts eslint.config.mjs scripts/deep_human_test.js scripts/record_full_ui_demo.js scripts/record_master_human_testing_video.js .gitignore .env.example backend/demoApiGate.ts middleware.ts backend/apiResponse.ts tests/securityHygiene.test.ts tests/demoApiGate.test.ts tests/apiResponse.test.ts docs/env.md docs/security.md package-lock.json docs/superpowers/plans/2026-08-20-release-security-hardening.md
git diff --cached --name-status
git diff --cached --check
git diff --cached -- .env .env.local '*.pem' '*.key' '*.p12' '*.pfx' 'output/**' '.agents/**'
```

Expected: only intended source/tests/docs/lockfile/plan paths are staged; protected patterns produce no staged output; no staged deletions.

- [ ] **Step 3: Commit the reviewed allowlist**

```bash
git commit -m "chore(security): harden release and demo API boundary"
```

- [ ] **Step 4: Push the feature branch using the GitHub skill workflow**

```bash
git push -u origin codex/fyf-release-security
```

Do not push `main` directly and do not create a PR unless separately requested.

## Execution status (2026-08-20)

- [x] Feature branch `codex/fyf-release-security` created without changing `main`.
- [x] Lint, `.gitignore` hygiene, production demo gate, and internal-error redaction implemented with RED → GREEN tests.
- [x] Non-breaking lockfile remediation updated `nanoid` to `3.3.18` and Next.js patch packages to `15.5.23`.
- [x] Full Vitest suite: 19 files / 249 tests passed; TypeScript, lint, and diff checks passed.
- [x] Production build passed in a clean temporary copy; direct worktree build was blocked only by the pre-existing `.next/trace` permission error.
- [ ] `sharp` remains below `0.35.0`; the available fix forces a Next.js 16 major upgrade and was intentionally not applied.
- [ ] Commit and push remain pending until the staged allowlist is finally reviewed.
