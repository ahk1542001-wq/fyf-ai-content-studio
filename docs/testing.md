# Evaluation Strategy & Verification Architecture

**Project:** FYF AI Content Studio (`fyf-ai-content-studio`)
**Phase:** Phase 0A (Implementation Specification)
**Date:** July 23, 2026

---

## 1. Overview & Verification Strategy

Evaluation in FYF AI relies on a two-tier target verification structure. The existing 129 prototype tests do not yet implement every target case below.
1. **Automated Unit & Security Tests (100% Pass Threshold Required):** Phase 1+ code-driven assertions for schema validity, workspace tenant isolation, deterministic risk guard evaluation, prompt injection resistance, SSRF URL blocking, and idempotency.
2. **Evaluation Benchmark Suite (`docs/eval-fixtures.json`):** Non-secret test scenarios measuring content quality, Burmese formatting, brand voice matching, factual citation coverage, and revision loop bounds.

---

## 2. Evaluation Metrics

Quality metrics are tracked per workflow run and aggregated for pilot evaluation:

- **Schema Validity Rate (%)**: Percentage of agent outputs passing Zod schema validation (Must be 100%).
- **Security & Authorization Pass Rate (%)**: Security fixtures (SSRF, IDOR, Prompt Injection, Stale Approval) MUST achieve **100% pass**. Any failure is a blocking defect.
- **Citation Coverage Rate (%)**: Percentage of factual claims linked to valid `research_sources` URLs.
- **Unsupported-Claim Rate (%)**: Percentage of factual statements lacking citations (Target: < 5%).
- **Brand-Voice Alignment Score (0-100)**: Quantitative score measuring tone rules, Burmese clarity, and absence of prohibited phrases.
- **Human Edit Distance**: Character edit distance between approved draft text and final operator manual export.
- **Automated Revision Count**: Number of loop revisions prior to human approval (Strict Max: 2).
- **Cost per Accepted Draft ($)**: Total token cost incurred from brief submission to final manual export.
- **Latency per Accepted Draft (sec)**: Total wall-clock time from brief submission to `PENDING_HUMAN_APPROVAL`.

---

## 3. Seed Evaluation Fixture Dataset

Seed evaluation scenarios are defined in `docs/eval-fixtures.json` covering 18 benchmark cases across 5 categories:

1. **Content Quality & Formatting:** `EVAL-001` (Burmese formatting), `EVAL-002` (FYF brand voice), `EVAL-003` (Wrong brand voice), `EVAL-009` (Weak CTA), `EVAL-010` (Excessive length).
2. **Fact & Citation Verification:** `EVAL-004` (Unsupported claim), `EVAL-005` (Missing citation), `EVAL-006` (Stale source).
3. **Risk & Safety Compliance:** `EVAL-007` (Risky promise), `EVAL-008` (Prohibited phrase), `EVAL-014` (Human edit safety check).
4. **Security & Authorization (100% Pass Required):** `EVAL-011` (Prompt injection in research), `EVAL-012` (Invalid tool parameters), `EVAL-015` (Stale approval), `EVAL-016` (Duplicate command), `EVAL-017` (Cross-workspace IDOR), `EVAL-018` (SSRF URL blocking).
5. **Workflow & Loop Limits:** `EVAL-013` (Revision limit max 2 enforcement).

---

## 4. Benchmark Runner Command (Phase 4+)

In Phase 4, an automated test runner (`npm run test:eval`) will execute `eval-fixtures.json` against the live Vertex AI models and record pass/fail results in `docs/eval-results.json`.

```bash
# Execute evaluation suite (Phase 4+)
npm run test:eval
```
