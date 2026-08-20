# Agent & Bounded Tool Catalog

**Project:** FYF AI Content Studio (`fyf-ai-content-studio`)
**Phase:** Phase 0A (Implementation Specification)
**Date:** July 23, 2026

---

## 1. Purpose and Trust Boundaries

To ensure security, strict tenant isolation, financial control, and execution predictability, system execution is divided into an untrusted LLM reasoning tier and a trusted deterministic application tier:

1. **LLM Agent Scope:** LLM agents may generate structured content proposals, strategies, draft text artifacts, review findings, and bounded research query parameters.
2. **No Direct Credential Access:** LLM agents never receive database credentials, provider API credentials, LiteLLM virtual keys, administrative bearer tokens, authorization headers, or raw system secrets.
3. **No Direct Database Mutation:** LLM agents never directly execute PostgreSQL queries, schema alterations, or database mutations.
4. **No Direct Gateway Administration:** LLM agents never directly invoke LiteLLM administration, key management, or routing endpoints.
5. **No Direct Workflow State Control:** LLM agents never directly authorize state transitions, approve content, or trigger manual exports.
6. **No Client-Supplied Tenant Selection:** LLM agents never select or override a workspace ID from caller-supplied input.
7. **Trusted Context Authorization:** Deterministic application code derives workspace identity, actor identity, and permission boundaries exclusively from the authenticated execution context (session/token).
8. **Schema Validation & Rejection:** All LLM outputs are schema-validated using strict Zod parsers before deterministic application code consumes them. Invalid output is rejected; deterministic code must never guess missing fields or fallback to unverified defaults.
9. **Untrusted Data Boundaries:** Tool responses, external web content, and research extracts are treated as untrusted data and must be sanitized and validated before use.

---

## 2. Agent Execution Contracts

### 2.1 Overview Matrix

| Agent Name | Durable Entry State | Input Scope | Output Scope | Max Model Calls / Graph Attempt | Direct Capabilities |
|---|---|---|---|---|---|
| **Content Strategy Agent** | `STRATEGIZING` | Validated brief, brand profile, approved sample posts, optional validated run-specific research summary | Structured content strategy proposal | 1 | None (No DB, network, or state control) |
| **Conditional Research Agent** | `RESEARCHING` | Brief requirements (`research_required = true`), workspace research parameters | Structured search/fetch request parameters | 1 | None (Requests executed by deterministic controller) |
| **Content Writer Agent** | `DRAFTING` / `REVISING` | Approved strategy, brand context, validated research, previous draft & feedback | Structured draft content artifact | 1 | None (No DB persistence or state control) |
| **Brand Voice Reviewer** | `REVIEWING` | Immutable draft version, brand profile guidelines | Structured brand voice review result | 1 | Ephemeral review check only |
| **Fact Check Reviewer** | `REVIEWING` | Immutable draft version, validated research sources | Structured fact-check review result | 1 | Ephemeral review check only |
| **Risk Policy Reviewer** | `REVIEWING` | Immutable draft version, workspace risk sensitivity policy | Structured risk policy review result | 1 | Ephemeral review check only |
| **Format & Platform Reviewer** | `REVIEWING` | Immutable draft version, platform guidelines | Structured format review result | 1 | Ephemeral review check only |

### 2.2 Detailed Agent Descriptions

#### A. Content Strategy Agent
- **Durable Entry State:** `STRATEGIZING`
- **Input Context:** Validated content brief (`app.content_briefs`), workspace brand profile (`app.brand_profiles`), approved few-shot sample posts (`app.brand_examples`), and an optional validated run-specific research summary linked through `app.research_sources`. `app.research_cache` remains reusable untrusted retrieval storage; deterministic code selects, validates, sanitizes, and summarizes approved run-specific context before any LLM receives it. No agent receives raw cached pages or full fetched web bodies.
- **Output Artifact:** Structured JSON content strategy detailing post angle, pillar alignment, key messaging points, and CTA proposal.
- **Execution Limits:** Maximum 1 model call per graph attempt.
- **Boundaries:** Possesses no direct tools, database access, network privileges, or state transition authority. Model-call failures transition through the model-call lifecycle to `FAILED_CONFIRMED` or `OUTCOME_UNKNOWN`. Deterministic controllers validate output schemas and govern subsequent graph execution.

#### B. Conditional Research Agent
- **Execution Rule:** Runs only when `content_briefs.research_required = true`.
- **Durable Entry State:** `RESEARCHING`
- **Input Context:** Brief topic and research requirements.
- **Output Artifact:** Structured search query or target URL parameters.
- **Boundaries:** Cannot directly execute network calls. The deterministic `ResearchProvider` controller validates and executes approved search and fetch requests. If required research fails, yields untrusted sources, or fails citation validation, deterministic execution safely transitions the run to `NEEDS_ATTENTION`. Never silently falls back to unsupported factual generation. The underlying research provider remains unresolved and provider-neutral in V1.

#### C. Content Writer Agent
- **Durable Entry State:** `DRAFTING` (initial) or `REVISING` (subsequent iteration).
- **Input Context:** Approved strategy, brand profile, validated research provenance, and (when revising) the previous draft text with structured human/reviewer feedback.
- **Output Artifact:** Structured post draft content artifact.
- **Execution Limits:** Maximum 1 model call per graph attempt.
- **Boundaries:** Cannot save its own draft to PostgreSQL or alter workflow run state. Deterministic application logic validates schema conformity, computes version metrics, and invokes `saveDraftVersion`.

#### D. Four Ephemeral Review Checks
- **Reviewer Roles:** Precisely four distinct reviewer checks:
  1. `brand_voice`: Verifies alignment with brand tone, pillar, and forbidden phrase lists.
  2. `fact_check`: Verifies factual claims against retained research provenance.
  3. `risk_policy`: Assesses content against workspace risk sensitivity rules.
  4. `format_platform`: Validates length, formatting, and structural constraints for Facebook post format.
- **Execution Rules:**
  - All four checks read the same immutable draft version (`app.draft_versions`).
  - Checks execute in parallel only after deterministic graph fan-out.
  - Each check produces precisely one structured review result.
  - Maximum 1 model call per reviewer per graph attempt.
  - Reviewers cannot mutate draft text, invoke other agents/tools, transition workflow states, approve content, or trigger exports.
  - Deterministic fan-in validates all four outputs, rejecting missing, duplicate, malformed, or stale-version results.
  - Deterministic aggregation logic evaluates overall pass/fail status and decides the next workflow transition:
    - All passed ➔ `PENDING_HUMAN_APPROVAL`
    - Any failed check with `revision_count < 2` ➔ `REVISING`
    - Any failed check with `revision_count >= 2` ➔ `NEEDS_HUMAN_REVIEW`
  - Severe policy findings remain structured review issues and do not create an unapproved reviewer-controlled transition. Any separate security transition must be an explicitly approved deterministic workflow rule.
  - Reviewer checks do not create separate durable workflow statuses.

---

## 3. Deterministic Service/Tool Matrix

All services listed below are executed strictly by deterministic application code in trusted execution context. **No service in this matrix is directly invokable by an LLM.**

| Service Identifier | Category | LLM Directly Invokes? | Side Effects? | External Network? | Authorization Owner | Retry Owner | Idempotency Mechanism |
|---|---|---|---|---|---|---|---|
| `loadBrandProfile` | Read-Only Service | No | No | No | Trusted Context | Deterministic Caller | Read query |
| `loadApprovedExamples` | Read-Only Service | No | No | No | Trusted Context | Deterministic Caller | Read query |
| `loadWorkflowContext` | Read-Only Service | No | No | No | Trusted Context | Deterministic Caller | Read query |
| `validateResearchRequest` | Security Service | No | No | No | Internal Worker | None | Pure validation |
| `searchResearchSources` | Research Service | No | No | Yes (HTTPS) | Internal Worker | Deterministic Caller | Query hash |
| `validateResearchUrl` | Security Service | No | DNS lookup | Yes (DNS only) | Internal Worker | Deterministic Caller | Pure validation |
| `fetchResearchSource` | Research Service | No | Outbound network fetch; no DB write | Yes (HTTPS) | Internal Worker | Deterministic Caller | Validated request identity |
| `validateCitationCoverage` | Validation Service | No | No | No | Internal Worker | None | Pure calculation |
| `persistResearchProvenance` | Research Service | No | Sole DB writer for `app.research_cache` and `app.research_sources` | No | Internal Worker | Transaction Boundary | Run ID + Source URL + Content Hash |
| `prepareModelCall` | Model Lifecycle | No | DB atomic attempt + reservation | No | Internal Worker | Transaction Retry | Logical Attempt ID (`call_key` + attempt) |
| `markModelCallInFlight` | Model Lifecycle | No | DB attempt update | No | Internal Worker | Transaction Retry | CAS state check (`RESERVED` ➔ `IN_FLIGHT`) |
| `finalizeModelCall` | Model Lifecycle | No | DB attempt + ledger update | No | Internal Worker | Transaction Retry | Attempt ID PK |
| `saveDraftVersion` | Artifact Service | No | DB artifact + draft write | No | Internal Worker | Transaction Retry | `requestHash` + version CAS |
| `recordReviewResult` | Review Service | No | DB review result write | No | Internal Worker | Transaction Retry | Run + Draft + Reviewer + Schema Version + Result Hash |
| `aggregateReviewResults` | Review Service | No | State evaluation | No | Internal Worker | None | Pure deterministic logic |
| `pauseForHumanApproval` | Workflow Control | No | Graph interrupt state persist | No | Internal Worker | None | Checkpoint state |
| `applyHumanDecision` | Workflow Control | No | DB approval + command write | No | Authenticated Session | Command Idempotency | Command Idempotency Key + `requestHash` |
| `packageManualExport` | Export Service | No | DB export record write | No | Authenticated Session | Command Idempotency | Scope Key + Draft Version + Content Hash |

---

## 4. Detailed Service/Tool Contracts

### 4.1 Tenant Workspace Authorization Rules
- `workspaceId` is an internal tenant isolation identifier derived exclusively from trusted execution context.
- It must NEVER be trusted from caller LLM output or unauthenticated browser inputs.
- All database queries for tenant-owned records MUST filter by both `workspace_id` and the entity primary key.
- Cross-workspace queries must fail cleanly without revealing whether the target resource exists.
- Human commands derive actor identity and workspace membership from the authenticated server session.

---

### 4.2 Read-Only Services

#### `loadBrandProfile`
- **Purpose:** Loads workspace brand profile guidelines, forbidden phrases, tone rules, and CTAs from `app.brand_profiles`.
- **Category:** Read-Only Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`.
- **Output:** Structured brand profile object.
- **Authorization:** Derived from trusted execution context.
- **Retry Policy:** Bounded retry on pre-query connection failure only.

#### `loadApprovedExamples`
- **Purpose:** Fetches approved few-shot post samples from `app.brand_examples`.
- **Category:** Read-Only Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, pillar string, max limit.
- **Output:** List of approved sample posts.
- **Authorization:** Derived from trusted execution context.
- **Retry Policy:** Bounded retry on pre-query connection failure only.

#### `loadWorkflowContext`
- **Purpose:** Retrieves the current state snapshot, brief, strategy, and draft history for a workflow run.
- **Category:** Read-Only Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`.
- **Output:** Structured workflow context object.
- **Authorization:** Derived from trusted execution context.
- **Retry Policy:** Bounded retry on pre-query connection failure only.

---

### 4.3 Research Services

#### `validateResearchRequest`
- **Purpose:** Validates research parameters against length limits, query syntax, timeout boundaries, and research requirements.
- **Category:** Security Validation Service (LLM Directly Invokes? No)
- **Input:** Raw LLM research parameter proposal.
- **Output:** Validated research request descriptor or structural validation error.
- **Rules:** LLM cannot choose credentials, headers, network destinations, timeout, or payload limits.

#### `searchResearchSources`
- **Purpose:** Executes web search queries using the server-configured `ResearchProvider` interface.
- **Category:** External Research Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, validated query descriptor.
- **Output:** List of search result metadata records.
- **Rules:** Provider remains unresolved and provider-neutral in V1. Uses server-managed credentials; stores no credentials or authorization headers. Search results are treated as untrusted data.

#### `validateResearchUrl`
- **Purpose:** Enforces Strict SSRF prevention rules before outbound HTTP connection.
- **Category:** Security Validation Service (LLM Directly Invokes? No)
- **Input:** Target URL string.
- **Output:** Validation status, resolved IP, and restriction reason.
- **Rules:** Enforces HTTPS only. Resolves DNS prior to connection; this is external DNS network activity, not a network-free calculation. Blocks loopback (`127.0.0.0/8`), private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), Cloud metadata endpoints (`169.254.169.254`), multicast, and IPv6 equivalents. Re-validates after every HTTP redirect. Limits max redirects (max 3). Protects against DNS rebinding. Rejects embedded HTTP basic auth credentials and non-standard ports. Does not expose resolved internal IP data to LLM nodes.

#### `fetchResearchSource`
- **Purpose:** Retrieves external web content for research analysis using server-managed HTTP client.
- **Category:** External-network read-only service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, validated URL.
- **Output:** Extracted text payload, content hash, title, and retrieval metadata.
- **Rules:** Not inherently idempotent by URL because content changes over time. Max byte limit (2 MB) and fetch timeout (8,000 ms) are server-controlled constants. Maximum 1 retry is allowed ONLY on definitive pre-connection failure. Partial-response disconnects are rejected as incomplete. The service validates SSRF rules before the initial connection and after every redirect, returns sanitized extracted content plus retrieval metadata, and performs no PostgreSQL write. It never logs full research bodies in `app.audit_events`.

#### `validateCitationCoverage`
- **Purpose:** Deterministically verifies that every factual claim in a draft maps to a retained provenance record in `app.research_sources`.
- **Category:** Deterministic Validation Service (LLM Directly Invokes? No)
- **Input:** Draft text, claims list, retained source URLs for the run.
- **Output:** Validation status and list of unsupported claims.
- **Rules:** Structural return only. No LLM node can override a failed citation validation.

#### `persistResearchProvenance`
- **Purpose:** Acts as the sole database writer for verified reusable retrieval data in `app.research_cache` and immutable run-specific provenance in `app.research_sources`.
- **Category:** State-Changing Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, source metadata, content hash, citation metadata.
- **Output:** Saved source record ID.
- **Rules:** In one idempotent transaction, upserts reusable validated retrieval data into `app.research_cache` and inserts or returns the run-specific `app.research_sources` record. The logical identity is `(workspace_id, workflow_run_id, source_url, content_hash)`. Same identity and content hash returns existing records; conflicting content evidence is rejected or explicitly versioned and never silently overwrites immutable provenance.

---

### 4.4 Model-Call Lifecycle Services

#### `prepareModelCall`
- **Purpose:** Deterministic preflight verification and atomic creation of attempt and budget reservation records.
- **Category:** Model Lifecycle Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `callKey`, `agentRole`, `requestHash`, `traceCorrelationId`.
- **Output:** Structured attempt preparation object containing `modelCallAttemptId`, `budgetReservationId`, `requestedAlias`, pinned profile version, and estimated max cost.
- **Guarantees:**
  1. Verifies that `app.model_profiles` has at most one enabled profile for the specified workspace and role (`UNIQUE (workspace_id, role_id) WHERE enabled = TRUE`). Zero enabled profiles is a configuration error that halts transmission and moves run to `NEEDS_ATTENTION`.
  2. Verifies workspace budget policy (`app.budget_policies`).
  3. Atomically inserts `app.model_call_attempts` (`status = 'RESERVED'`) and `app.budget_reservations` (`status = 'RESERVED'`) in a single PostgreSQL transaction.
  4. Returns existing attempt details if re-invoked with the same attempt identity (`workspace_id`, `workflow_run_id`, `call_key`, `attempt_number`).
  5. Does NOT transmit requests to LiteLLM or model providers.

#### `markModelCallInFlight`
- **Purpose:** Atomically transitions model call attempt from `RESERVED` to `IN_FLIGHT` immediately prior to network transmission.
- **Category:** Model Lifecycle Service (LLM Directly Invokes? No)
- **Input:** `modelCallAttemptId`, expected status (`RESERVED`).
- **Output:** Updated status.
- **Rules:** Uses compare-and-swap update. Duplicate calls return current state. Does not call external APIs. Cannot transition `OUTCOME_UNKNOWN` back to `IN_FLIGHT`.

#### `finalizeModelCall`
- **Purpose:** Persists model attempt outcome, releases/commits budget reservations, and records financial ledger entries.
- **Category:** Model Lifecycle Service (LLM Directly Invokes? No)
- **Input:** `modelCallAttemptId`, `budgetReservationId`, final status (`SUCCEEDED`, `FAILED_CONFIRMED`, `OUTCOME_UNKNOWN`, or `RECONCILED`), reconciliation evidence when status is `RECONCILED`, and status-dependent provider/model IDs, token counts, latency, cost, and provider request ID when known.
- **Output:** Confirmation object.
- **Rules:**
  1. Updates `app.model_call_attempts` status.
  2. Creates at most one finalized `app.usage_ledger` record for an attempt and returns the existing record on an idempotent replay.
  3. `SUCCEEDED` requires confirmed provider/model identity and usage/cost evidence, commits the supported budget amount, and creates or returns the finalized usage record.
  4. `FAILED_CONFIRMED` releases or commits only the amount supported by confirmed provider evidence and creates a usage record only when confirmed billable usage evidence exists.
  5. `OUTCOME_UNKNOWN` does not create a finalized usage ledger record, does not blindly release or commit the reservation, preserves reconciliation identifiers, moves the workflow to `NEEDS_ATTENTION`, and NEVER triggers an automatic duplicate model request.
  6. `RECONCILED` requires reconciliation evidence, commits or releases the reservation according to the confirmed outcome, and creates or returns a finalized usage record only when usage evidence is established.
  7. Stores sanitized metrics, token counts, latency, and cost estimates only when known. NEVER stores raw prompts, system instructions, chain-of-thought, or completion response bodies in ledger or audit tables.

---

### 4.5 Artifact & Review Services

#### `saveDraftVersion`
- **Purpose:** Validates and persists new or revised draft content into `app.content_artifacts` and `app.draft_versions`.
- **Category:** State-Changing Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `commandId`, `idempotencyKey`, `requestHash`, `artifactId` (if existing), `expectedCurrentVersion`, draft content, `contentHash`, version reason, `traceCorrelationId`.
- **Output:** Saved draft version details (`artifactId`, `draftVersionId`, `version`, `contentHash`).
- **Rules:**
  - Uses optimistic concurrency control (`expectedCurrentVersion`).
  - Server calculates the next sequential version number; LLM cannot select or overwrite version numbers.
  - Replay with the same command/idempotency identity, `requestHash`, and `contentHash` returns the existing stored version.
  - Replay with the same command/idempotency identity but a different `requestHash` or `contentHash` returns a conflict.
  - Direct human edits use the `SAVE_HUMAN_EDIT` command, create an immutable draft version, and return workflow state to `REVIEWING`.
  - No human or model edit can bypass deterministic validation gates.

#### `recordReviewResult`
- **Purpose:** Persists individual reviewer check findings into `app.review_results`.
- **Category:** State-Changing Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `draftVersionId`, `draftVersion`, `reviewerRole` (`brand_voice`, `fact_check`, `risk_policy`, or `format_platform`), `resultSchemaVersion`, `resultHash`, `passed`, structured issues array, `traceCorrelationId`.
- **Output:** `reviewResultId`.
- **Rules:** Uses logical identity `(workspace_id, workflow_run_id, draft_version_id, reviewer_role, result_schema_version)`. The run-bound composite foreign key also verifies the matching display `draft_version`. Same identity and `resultHash` returns the stored result; the same identity with a different `resultHash` returns conflict. Rejects stale, mismatched, or cross-run draft reviews. Review findings do not directly alter workflow state.

#### `aggregateReviewResults`
- **Purpose:** Deterministically evaluates the four review results for a draft version and determines the next workflow transition.
- **Category:** Deterministic Control Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `draftVersionId`, `draftVersion`, `resultSchemaVersion`.
- **Output:** Deterministic next-state decision (`PENDING_HUMAN_APPROVAL`, `REVISING`, or `NEEDS_HUMAN_REVIEW`).
- **Rules:** Loads exactly four review results for the immutable draft version. Rejects missing, duplicate, malformed, or wrong-schema results. All pass transitions to `PENDING_HUMAN_APPROVAL`; any failure with `revision_count < 2` transitions to `REVISING`; any failure with `revision_count >= 2` transitions to `NEEDS_HUMAN_REVIEW`. Does not invoke an LLM.

---

### 4.6 Human & Workflow Control Services

#### `pauseForHumanApproval`
- **Purpose:** Triggers a deterministic LangGraph interrupt to pause execution while awaiting human operator intervention.
- **Category:** Workflow Control Service (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `currentDraftVersionId`, `currentDraftVersion`.
- **Output:** Interrupt checkpoint confirmation.
- **Rules:** The deterministic aggregator first persists durable state `PENDING_HUMAN_APPROVAL` or `NEEDS_HUMAN_REVIEW`, then persists the graph checkpoint. This pause is valid only when the durable run is already in one of those two states; it is not invoked while durable state remains `REVIEWING`. It does not create a human decision record. Resume commands require `expectedStateVersion` and `expectedDraftVersion`. Not an LLM tool.

#### `applyHumanDecision`
- **Purpose:** Validates and executes human operator decisions (`approve`, `revise`, `cancel`).
- **Category:** State-Changing Command (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `expectedDraftVersionId`, `expectedDraftVersion`, `expectedStateVersion`, `decision` (`approve`, `revise`, `cancel`), feedback text, `idempotencyKey`, `requestHash`.
- **Output:** Command execution result and new state.
- **Rules:**
  - Actor identity and workspace membership derived from authenticated session.
  - Requires `expectedDraftVersionId`, `expectedDraftVersion`, and `expectedStateVersion`. Rejects stale, mismatched, or cross-run draft identity/state with conflict error.
  - Decision `approve`: transitions run through `APPROVED` to `READY_FOR_EXPORT` after deterministic checks.
  - Decision `revise`: records feedback and creates explicit revision command.
  - Decision `cancel`: transitions run to `CANCELLED`.
  - Human text edits use `SAVE_HUMAN_EDIT`, create a new immutable draft version, and return state to `REVIEWING`.
  - Uses command outbox idempotency (`workspace_id`, `command_type`, `idempotency_key`).

#### `packageManualExport`
- **Purpose:** Prepares formatted post content for manual operator copying/exporting and logs an immutable export record.
- **Category:** State-Changing Command (LLM Directly Invokes? No)
- **Input:** Trusted `workspaceId`, `workflowRunId`, `expectedDraftVersionId`, `expectedDraftVersion`, `expectedStateVersion`, `idempotencyKey`, `requestHash`.
- **Output:** Export package containing `exportId`, `formattedText`, and `exportedAt`.
- **Rules:**
  - Valid ONLY when workflow status is `READY_FOR_EXPORT`. Rejects non-ready runs with `INVALID_EXPORT_STATE`.
  - Re-validates draft version, state version, content hash, formatting, and safety checks before exporting.
  - Idempotency scope: Command outbox key (`workspace_id`, `command_type`, `idempotency_key`, `request_hash`) + Export uniqueness (`workspace_id`, `workflow_run_id`, `draft_version_id`, `content_hash`).
  - Replay with identical parameters returns existing export record without duplicating audit entries.
  - Produces manual export package ONLY. Contains NO Facebook API integration, NO social publishing credentials, and NO automatic posting capabilities.

---

## 5. Retry and Uncertain-Outcome Policy

To prevent data corruption, duplicate financial charges, and infinite execution loops:

1. **Read-Only Operations:**
   - May retry only after a definitive pre-query connection failure or safe read timeout.
   - Retries use exponential backoff under a server-configured bounded retry policy. An LLM, browser, research result, or external caller cannot set or increase retry counts, timeouts, payload sizes, or backoff policy.
2. **State-Changing Transactions:**
   - Transactional writes MUST retry only the complete idempotent transaction when PostgreSQL explicitly reports a serialization failure (`40001`) or deadlock (`40P01`) prior to commit acknowledgement.
   - Connection loss occurring during or after transaction transmission with an uncertain commit outcome MUST NOT be blindly retried.
   - Uncertain commit outcomes are reconciled using stored idempotency keys, request hashes, record primary keys, and outbox status.
   - Retries must never create duplicate draft versions, review results, commands, budget reservations, usage ledger entries, human approvals, audit events, or export records.
3. **No Dual Retry Ownership:**
   - Every operation has precisely one designated retry owner (either the deterministic caller or the database transaction boundary).

---

## 6. Tool-Input Security & Data-Minimization Requirements

### 6.1 Input Sanitization
- All LLM-generated tool parameter proposals must be validated against Zod schemas.
- Text inputs must normalize encoding, reject prohibited control characters, and enforce strict schemas and bounded size limits. External content remains explicitly delimited untrusted data and is never treated as system or developer instructions. It cannot authorize tools, state transitions, credentials, or exports; deterministic allowlists and authorization checks remain authoritative. Legitimate Burmese or other multilingual content must not be altered through speculative prompt-injection stripping.

### 6.2 Audit Event Data Minimization
- Audit records (`app.audit_events`) MUST contain only approved operational metadata keys:
  - `event_type`
  - `workspace_id`
  - `workflow_run_id`
  - `command_id` / `model_call_attempt_id`
  - `actor_id` / `actor_type`
  - `previous_status` / `new_status`
  - `bounded_error_code`
  - `duration_ms`
  - `trace_correlation_id`
- Audit records MUST NEVER store:
  - Raw prompts or system instructions
  - Full model completion responses
  - Full research web page bodies
  - Database credentials or connection strings
  - LiteLLM virtual keys or administrative master keys
  - External provider credentials or API tokens
  - HTTP authorization headers or cookies
  - Chain-of-thought internal reasoning outputs
- Simple read-only queries do not generate audit log entries unless specifically required by workspace compliance policy.

---

## 7. Parallelism and Step Limits

1. **Maximum Automated Revision Cycles:** Fixed at precisely **2** automated revision loops. Reaching 2 revisions without full approval transitions the run safely to `NEEDS_HUMAN_REVIEW`.
2. **Model Call Allocation:** Precisely 1 model call per graph attempt for Content Strategy Agent, Content Writer Agent, and each Ephemeral Review Check.
3. **Parallel Execution Scope:** Parallel execution is permitted ONLY for independent, read-only reviewer checks evaluating the same immutable draft version.
4. **Sequential Dependencies:** All state-changing transactions, strategy generation, drafting, and human approvals MUST remain strictly sequential.
5. **Total Step Budget Gate:** Every workflow run has an explicit total step budget. Exceeding the step budget halts execution and transitions the run to `NEEDS_ATTENTION`. Total step budget numerical limits are marked as a Phase 0B configuration parameter requiring verification prior to runtime implementation.
6. **No Self-Modifying Limits:** LLM agents cannot alter, extend, or bypass step budgets, token allocations, cost limits, or retry policies.

---

## 8. Deferred Capabilities and Phase 0B Gates

### 8.1 Excluded/Deferred System Capabilities (V1 Scope Exclusions)
The following technologies and capabilities are explicitly excluded from V1 and deferred to future phases:
- External workflow engine integration
- Google ADK framework
- Temporal orchestration engine
- 9Router model proxy
- Unreviewed or third-party MCP servers
- Agent-to-Agent (A2A) autonomous protocols
- Automatic Facebook publishing or direct social media posting APIs
- Fallback LLM providers (Vertex AI is the exclusive V1 provider)
- Arbitrary shell, code execution, or terminal access tools
- Local file system read/write tools
- Email, SMS, or external messaging dispatch tools
- Payment processing or billing integration APIs
- Long-term conversational memory systems
- Vector database vector search / RAG stores
- Knowledge graph databases

### 8.2 Fixed V1 Technical Scope
- **Model Gateway:** LiteLLM Proxy Gateway container.
- **LLM Provider:** Google Vertex AI (exclusive V1 provider).
- **Model Selection & Region:** Specific Gemini model IDs and Vertex AI regional endpoints remain unset until Phase 3 verification gates.
- **Research Provider:** Provider interface remains unresolved and provider-neutral in V1.

---

### Cross-Document Contract Resolution
- `app.draft_versions.content_hash` is the immutable server-computed draft hash used for replay protection.
- `app.review_results` declares `draft_version_id`, `result_schema_version`, `result_hash`, run-bound draft foreign-key integrity, and the matching logical uniqueness constraint.
- `app.research_sources` declares run-specific provenance uniqueness across workspace, workflow run, source URL, and content hash.
- `docs/data-model.md` is authoritative for the exact logical columns, keys, and constraints. Phase 0B must validate their implementability in the selected PostgreSQL/ORM stack before migrations are approved.
