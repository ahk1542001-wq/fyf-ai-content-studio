# Security Architecture & Threat Model

**Project:** FYF AI Content Studio (`fyf-ai-content-studio`)
**Phase:** Local-first release and public repository security gate
**Date:** July 23, 2026

## Current release boundary

The `/api/workspaces/**` handlers are local/demo-only and fail closed in
production by default. This repository is private while its history and FYF
data boundary are reviewed. Public deployment is not approved: enabling
`FYF_DEMO_API_ENABLED` does not add authentication and must never be used as a
public access control. Hosted auth, durable storage, and a sanitized public
mirror require a separate owner-approved design.

---

## 1. Security Design Principles

1. **Defense-in-Depth:** Prompt delimiters (e.g. XML tags) are helper hints, NOT absolute security boundaries. Hard deterministic code boundaries enforce permissions, tool parameters, and export safety.
2. **Local-first perimeter:** Local API routes are treated as operator-only. Any future hosted worker, gateway, or API must add an authenticated perimeter before exposure.
3. **No Unapproved Actions:** Agent LLMs generate suggestions. Human approval is strictly mandatory before content export. Automated Facebook posting is prohibited.
4. **Workspace isolation by default:** Every workspace-owned record is checked against its workspace ID. This protects local data today; hosted authentication, RLS, and multi-user authorization remain unselected future work.

---

## 2. Comprehensive Threat Model (18 Failure Scenarios)

| ID | Threat / Failure Category | Asset | Threat Actor / Source | Attack / Failure Path | Prevention Control | Detection Mechanism | Recovery Procedure | Verification Test |
|---|---|---|---|---|---|---|---|---|
| **T-01** | Authentication Bypass | Command API | Unauthorized External User | Direct API call without valid session cookie / bearer token | Selected Auth middleware checks session validity before command handling | Security audit logs, HTTP 401 response counts | Terminate session, deny request | Planned Phase 1 authentication integration test |
| **T-02** | Cross-Workspace IDOR | Workspace Data | Malicious Authenticated User | User A manipulates `workspaceId` to read/write User B drafts | Composite tenant keys + `assertWorkspaceAccess` + selected Auth context; RLS where supported and verified | Audit logs, HTTP 403 Forbidden alerts | Deny transaction, flag user account | Existing prototype workspace-isolation tests plus planned Phase 1 DB/RLS integration test |
| **T-03** | Prompt Injection via Research | Workflow Execution | Malicious Web Page / Attacker | Research web page embeds `<system>` instructions attempting to hijack agent behavior | Delimited untrusted context + strict schemas + tool allowlists (nodes receive no admin/secret/publish tools) | Schema validation, deterministic policy failures, audit alerts | Discard unsafe output; keep source as untrusted evidence; transition to `NEEDS_ATTENTION` when safe progress is impossible | `docs/eval-fixtures.json` (`EVAL-011`) |
| **T-04** | Server-Side Request Forgery (SSRF) | Internal Network / GCP Metadata | Malicious URL in Research Brief | Research agent attempts to fetch `http://169.254.169.254` (Cloud Metadata) or internal IP | Hostname DNS pre-resolution + IP blocking (`10.0.0.0/8`, `169.254.169.254`) + HTTPS-only enforcement | Egress network logs, DNS resolution logs | Drop request, record security alert | `docs/eval-fixtures.json` (`EVAL-018`) plus planned network integration test |
| **T-05** | Stale Approval / State Race | Content Draft | Concurrent User / Network Latency | Operator approves Draft v1 while another tab edited draft to v2 | Optimistic concurrency using exact run-bound draft identity/version and `expectedStateVersion` | HTTP 409 Conflict response | Reject approval, force UI reload of current version | `docs/eval-fixtures.json` (`EVAL-015`) plus planned DB integration test |
| **T-06** | Duplicate Task Delivery | Model Budget / State | Cloud Tasks Infrastructure | Cloud Tasks redelivers task due to network delay | Worker atomic command claim using `expectedStateVersion`; idempotent task names | Cloud Tasks duplicate delivery metrics | Worker returns HTTP 200 OK idempotent no-op | Planned integration test (`duplicate_task_delivery.spec.ts`) |
| **T-07** | Duplicate Paid Model Calls | Financial Budget | API Timeout after transmission | Worker times out waiting for LiteLLM, retries immediately while first request processed | `OUTCOME_UNKNOWN` attempt state; LiteLLM request correlation ID matching | Telemetry log alerts for timeout attempts | Reconcile request ID via LiteLLM logs before retry | Planned integration test (`outcome_unknown_reconciliation.spec.ts`) |
| **T-08** | `OUTCOME_UNKNOWN` Post-Transmission | Budget & Billing | Network Disconnect | HTTP connection breaks while Vertex AI is generating tokens | Transition model call attempt to `OUTCOME_UNKNOWN`; lock reservation | Background reconciler alert | Query LiteLLM log by correlation ID to determine actual outcome | Planned integration test (`outcome_unknown_handling.spec.ts`) |
| **T-09** | Runaway Automated Revisions | Financial Budget & Quality | Persistent Review Failure | LLM writer and reviewer loop endlessly on quality issues | Hard deterministic limit of **max 2 automated revisions** | `workflow_runs.revision_count` counter | Graph transitions run to `NEEDS_HUMAN_REVIEW` on count >= 2 | `docs/eval-fixtures.json` (`EVAL-013`) plus planned workflow integration test |
| **T-10** | Budget Race Conditions | Workspace Spend Limit | Concurrent Agent Worker Nodes | Two parallel nodes check budget simultaneously and both execute, exceeding daily limit | Atomic DB row locking (`SELECT FOR UPDATE`) & cost reservation table | Budget reconciliation audit job | Abort second call before LiteLLM proxy request | Planned integration test (`budget_concurrency.spec.ts`) |
| **T-11** | Secret Exposure | API Keys / Credentials | Source Control / Frontend Leak | Developer commits API keys or API returns raw key to frontend | Secrets stored in Secret Manager; Virtual Keys masked; `.gitignore` enforced | `tests/securityHygiene.test.ts` secret scanner | Rotate compromised key immediately | `tests/securityHygiene.test.ts` (Regex secret scan) |
| **T-12** | Sensitive Trace Leakage | Telemetry System | Observability Pipeline | Tracing exports raw prompt text or virtual keys to external log aggregator | Redaction filters in OpenTelemetry exporter; body logging disabled in LiteLLM | Log audit checks | Sanitize exporter pipeline, purge historical logs | Observability audit test |
| **T-13** | Provider Data-Governance Exposure | Intellectual Property | Model Provider (Google) | Provider processing or logging settings do not match the approved data policy | Phase 3 review of current Vertex AI terms, project settings, region, logging, and retention behavior before real customer data | GCP Audit Logs and configuration review | Stop real-data use until settings and policy are corrected | Phase 3 provider-governance gate |
| **T-14** | LiteLLM Supply-Chain Compromise | Gateway Service | Malicious Dependency Package | PyPI package compromise (e.g. March 2026 `1.82.7` / `1.82.8` malicious release) | Pin official container image digest SHA (`ghcr.io/berriai/litellm@sha256:...`); forbid `:latest` & unpinned `pip` | Container vulnerability scan, SBOM analysis | Roll back image digest to last verified stable release | Container security build scan |
| **T-15** | Database Outage / Connection Drop | State Persistence | Cloud Infrastructure | PostgreSQL database becomes unavailable during graph execution or disconnects during commit | Bounded pre-transaction connection retries; idempotent command identity; uncertain commit outcomes enter reconciliation instead of blind replay | Health checks, command lease/reconciliation alerts | Reconcile durable command/run state before retrying any state-changing transaction | Planned fault-injection test (`db_outage_recovery.spec.ts`) |
| **T-16** | Vertex AI API Outage | LLM Availability | Google Cloud Platform | Vertex AI returns HTTP 503 or quota exceeded | Worker catches failure, sets status to `NEEDS_ATTENTION`; no silent fallback | Error rate telemetry alerts | Operator manually replays run when GCP recovers | Fault-injection test (`vertex_outage_handling.spec.ts`) |
| **T-17** | Checkpoint Version Incompatibility | Workflow Execution | Deployment Pipeline | New code deployed while graph run paused at `PENDING_HUMAN_APPROVAL` | Versioned graph definitions; old runs resume using original graph schema version | Schema migration verification | Fall back incompatible runs to `NEEDS_ATTENTION` for manual review | Migration test (`graph_version_compatibility.spec.ts`) |
| **T-18** | Unsafe Manual Replay | Content Quality | Operator Error | Operator clicks replay on an outdated, rejected draft | Replay validates expected state version and requires fresh brief validation | Audit event `"manual replay initiated"` | Reject replay if state version does not match | Planned workflow integration test |

---

## 3. Security Boundary & Vulnerability Protection Standards

### 3.1 LiteLLM Container Hardening
- **Image Pinning:** Mandatory use of immutable digest SHA: `ghcr.io/berriai/litellm@sha256:<digest>`.
- **Prohibited Versions:** LiteLLM PyPI versions `1.82.7` and `1.82.8` are strictly banned due to the March 2026 supply-chain incident ([Security Update Ref](https://docs.litellm.ai/blog/security-update-march-2026)).
- **Container Environment:** Executed as non-root user (`uid 10001`), read-only root filesystem, drop all Linux capabilities (`CAP_DROP_ALL`).

### 3.2 Research Tool SSRF Protection Rules
- **Scheme Allowlist:** `https://` ONLY (`http://`, `file://`, `ftp://`, `gopher://` blocked).
- **IP Range Denylist:**
  - IPv4 Private: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`
  - Cloud Metadata: `169.254.169.254`
  - Link-Local / Loopback IPv6: `::1/128`, `fe80::/10`
- **DNS Resolution:** Hostnames are pre-resolved to IP addresses using Node.js `dns.promises.lookup()` prior to socket connection. If the resolved IP falls within a denylisted range, the connection is aborted immediately.
- **Redirect Rule:** HTTP 301/302 redirects re-trigger full DNS resolution and IP validation before following.

### 3.3 Prompt-Injection Defense Architecture
Prompt injection protection relies on a multi-layered defense strategy:
1. **Structural Delimiting:** Untrusted research inputs are wrapped in strict XML tags (`<external_untrusted_research_data>`).
2. **Privilege Separation:** Research nodes are given NO administrative, financial, database, or posting tools.
3. **Deterministic Output Validation:** Tool call arguments emitted by LLM nodes are validated against strict Zod schemas. Any tool parameter containing unexpected keys or invalid formats is rejected.
4. **Mandatory Human Gate:** Final approval is performed by a human operator. LLM outputs cannot publish content automatically.
