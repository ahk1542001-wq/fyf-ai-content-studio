# Product Decisions Log

**Project:** FYF AI Content Studio (`fyf-ai-content-studio`)
**Phase:** Phase 0A (Implementation Specification)
**Date:** July 23, 2026

> [!WARNING]
> This file preserves the earlier hosted Agent-as-a-Service design record. Those decisions are historical/deferred and are not the current product contract. The current product is the private, local-first FYF AI Content Studio described in `README.md` and `docs/architecture.md`.

---

## 1. Historical Hosted Positioning & Decisions (Deferred)

1. **Agent-as-a-Service System:** FYF AI is an autonomous content team. The operator or customer provides a brief, and the system executes strategy, conditional research, drafting, brand voice review, and quality review, returning a completed post for human approval.
2. **Initial Pilot Scope:** FYF AI Facebook page content focusing on AI automation and AI agents. First operator, customer, and human approver is Victor.
3. **Vertex AI / Gemini Exclusive Provider (V1):** Selected because the owner has active Google Cloud trial credits and no paid API balances for external providers (OpenAI/Anthropic/Groq).
4. **Mandatory Human Approval:** No post leaves the system without explicit human review and approval.
5. **Manual Export Only:** Content is exported via manual copy to Facebook. Automated social media posting is prohibited in V1.
6. **Strict Revision Limit:** Maximum of **2 automated revision attempts** per workflow run. If quality checks fail after 2 revisions, the run transitions to `NEEDS_HUMAN_REVIEW`.
7. **Concurrency-Safe Budgeting:** Pre-call atomic cost reservations prevent overspend during parallel node executions.
8. **LiteLLM Supply Chain Protection:** Mandatory image digest SHA pinning; PyPI releases `1.82.7` / `1.82.8` are strictly banned due to the March 2026 incident.

---

## 2. Deferred Capabilities (Roadmap Status)

| Capability | Status | Adoption Trigger |
|---|---|---|
| **Second LLM Provider / Fallback** | Deferred | Vertex outages block workflows; Gemini fails quality threshold; GCP credits expire. |
| **Multi-Tenant Public Onboarding** | Deferred | >=1 external business ready for repeated use; FYF pilot reliability proven. |
| **Billing & Subscriptions** | Deferred | Repeatable paid offer, defined pricing unit, paying customer ready. |
| **Automated Facebook Publishing** | Deferred | Manual FYF operations show high reliability over repeated posts; owner approves live API. |
| **Content Scheduling** | Deferred | Manual export is a proven bottleneck; automated publishing approved first. |
| **Large RAG / Vector Search** | Deferred | Structured brand profiles fail context retrieval on large corpus (>100 pages). |
| **Knowledge Graph** | Deferred | Workflow requires multi-hop entity queries that SQL cannot answer. |
| **Long-Term Memory** | Deferred | Repeated user sessions require stable preferences not representable in brand profile. |
| **Multimodal Generation** | Deferred | Text workflow stable; FYF AI repeatedly requires image/video creation. |
| **Dynamic Provider Routing** | Deferred | Production logs prove static role routing fails cost/latency targets after 2nd provider added. |
| **Temporal Workflow Engine** | Deferred | LangGraph + Cloud Tasks insufficient for multi-week / complex sagas. |
| **External Workflow Adapters** | Deferred | A future product need must be validated before any external workflow adapter is designed or enabled. |
