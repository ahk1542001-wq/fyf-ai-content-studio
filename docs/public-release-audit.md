# Public Release Audit

Status: **Public snapshot published and verified — hosted deployment is intentionally out of scope**

This repository is the public FYF AI Content Studio snapshot. It was produced from a reviewed, allowlisted candidate; the private development repository and its history remain separate.

## Security baseline

- Next.js and `eslint-config-next` are pinned together at `16.3.1`.
- The request gate uses the Next 16 `proxy.ts` convention and keeps the existing `/api/workspaces/:path*` matcher.
- `npm audit --omit=dev --audit-level=high` returned `found 0 vulnerabilities` after the upgrade.
- The verified private source baseline has 22 test files / 261 tests passing, lint passing, typecheck passing, and a production build passing; the public snapshot receives an equivalent CI workflow and retains its generic private-marker hygiene guard.
- Node `>=22` remains the supported runtime.
- No credentials, provider tokens, local database contents, or generated output are part of this audit report.

## Public-candidate allowlist

The candidate may include only reviewed, reproducible product material:

- application source under `app/`, `backend/`, `config/`, `database/`, `frontend/`, `integrations/`, and `src/`;
- tests and test fixtures that contain no private data;
- package metadata and lockfile;
- reviewed documentation that describes the FYF product and its local-first boundaries;
- brand assets that are referenced by the application and cleared for public use.

## Private-only exclusions

Keep these out of a public snapshot unless separately reviewed and replaced:

- `.env` files, credentials, provider tokens, and machine-local configuration;
- SQLite/database files and generated `output/`, `coverage/`, and test-result artifacts;
- held worktree material such as `AGENTS.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, and one-off export scripts;
- unreferenced duplicate media assets;
- local instructions, personal notes, and any file containing machine-specific paths;
- legacy client-specific identifiers in current files or earlier commits.

## History findings

The private Git history contains local artifacts that are not suitable for a public mirror:

- `database/local/demo-state.sqlite` exists in history as a 2,039,808-byte object (commits `ec9baa0` and `61c2257`).
- `test-results/.last-run.json` exists in history as a 45-byte object.
- The current product source is guarded against the removed legacy client-specific identifier; the private Git history still contains that legacy context and must not be published unchanged.
- No `LICENSE` file is present at the repository root. This is a public showcase snapshot, not an open-source license grant; a future distribution change must be an explicit maintainer decision.

## Deployment-readiness result

The application is locally deployment-ready: dependency, test, lint, typecheck, build, and secret-hygiene gates are green. A clean allowlisted candidate and the public distribution boundary are prepared, but publication still needs human file review and explicit approval for the exact repository/branch and deployment target.

## Owner-selected distribution boundary

- Visibility target: public repository, once the release snapshot is approved.
- This release does not add an open-source license or grant reuse rights; a later distribution change must be an explicit owner decision.
- The private working history remains separate from this public snapshot.

## Integration boundary

The original private repository and this public snapshot intentionally have no shared history. This repository's `main` is the clean release baseline; future updates should be exported through the same allowlist process rather than merged from private history.

## Required gates before publication

- [x] Create a clean allowlisted snapshot or new public repository; do not rewrite or delete the private working history.
- [x] Review every included file for private names, machine paths, credentials, local data, and generated artifacts.
- [x] Run automated secret-pattern, filename, and history scans without printing secret values.
- [x] Verify the source tree with `npm test -- --run`, `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build`, `npm audit --omit=dev --audit-level=high`, and `git diff --check`.
- [x] Document the public distribution boundary above.
- [x] Publish the verified clean snapshot to this public repository's `main` without rewriting private history.
- [x] Use a separate public repository so private history stays isolated.
- [ ] Approve and run a separate hosted deployment target; this report does not authorize hosting or production rollout.

The public snapshot release gate is complete. Hosted deployment, authentication, durable cloud storage, and automated publishing remain intentionally out of scope.
