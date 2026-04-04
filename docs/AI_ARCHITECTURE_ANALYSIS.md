# AI Architecture & Resilience Analysis

> **Date:** 2026-04-04
> **Scope:** CogniSys BA (The Catalyst Hub) — AI logic, resilience patterns, and cost optimization
> **Audience:** Engineering team

---

## 1. System Overview

CogniSys BA implements a **dual-layer AI architecture** with client-side AI services and server-side autonomous agents, backed by a three-provider fallback chain (Gemini → Mistral → Azure OpenAI). Every AI call is proxied through Express — API keys never reach the client.

### 1.1 Technology Stack

| Layer | Technology |
|---|---|
| **AI SDK** | `@google/genai` v1.48.0 |
| **Primary LLM** | Gemini 2.5 Flash (default), Gemini 3.1 Pro (reasoning), Veo 3.1 (video) |
| **Fallback LLMs** | Mistral AI (REST), Azure OpenAI (REST) |
| **Embeddings** | Gemini `text-embedding-004` |
| **Math/Stats** | `mathjs` 15.1.1 (Monte Carlo, quantiles, cosine similarity) |
| **JSON Repair** | `jsonrepair` 3.13.3 |
| **Vector Storage** | Firestore (server) + IndexedDB (client) |
| **ML Framework** | `@tensorflow/tfjs` 4.22.0 |
| **Streaming** | SSE via Express + `SseManager` |
| **Async Tasks** | Firestore `task_queue` + `TaskWorker` with snapshot listeners |
| **Observability** | `pino` structured logging, OpenTelemetry (optional OTLP) |
| **Validation** | Zod (server), runtime structure validation (client) |
| **i18n** | `i18next` (EN, FR, AR) |

---

## 2. Architecture

### 2.1 Directory Structure (AI-relevant)

```
CogniSys-BA/
├── server/
│   ├── ai-agents/
│   │   ├── ModelRouter.ts           # Multi-provider model routing
│   │   ├── PromptManager.ts         # Firestore-backed prompt retrieval
│   │   ├── WBSGeneratorAgent.ts     # Async WBS generation
│   │   ├── RiskAssessorAgent.ts     # Async risk assessment
│   │   └── ArtifactAnalyzerAgent.ts # Document analysis
│   ├── controllers/                 # HTTP controllers (incl. AI)
│   ├── services/                    # TaskQueue, SSE, UsageMetering, Memory
│   └── featureFlags.ts              # 8 env-driven flags
│
├── services/
│   ├── aiService.ts                 # High-level AI functions
│   ├── geminiService.ts             # Core AI caller (~1500+ lines, 100+ functions)
│   ├── geminiProxy.ts               # Client proxy to /api/gemini/generate
│   ├── llmProxyService.ts           # Mistral + Azure OpenAI client proxies
│   ├── promptFactory.ts             # Sector-aware prompt templating
│   ├── cortexService.ts             # Knowledge graph + AI insights
│   ├── oracleService.ts             # Portfolio-wide RAG Q&A
│   ├── hiveService.ts               # Multi-agent orchestration state machine
│   ├── microservices.ts             # 5-agent system
│   ├── predictiveService.ts         # Portfolio predictive analytics
│   └── memoryService.ts             # Vector memory (IndexedDB + server API)
│
├── utils/
│   ├── aiUtils.ts                   # Retry, JSON repair, validation
│   └── domainRules.ts               # Business logic rules
│
├── k6/
│   └── ai.js                        # AI endpoint load tests
└── e2e/
    └── 05-ai-api.spec.ts            # AI API E2E tests
```

### 2.2 Model Provider Hierarchy

| Tier | Provider | Models | Role | Env Vars |
|---|---|---|---|---|
| **Primary** | Google Gemini | `gemini-2.5-flash`, `gemini-3.1-pro-preview`, `veo-3.1-fast-generate-preview`, `text-embedding-004` | All generation, embeddings, video | `GEMINI_API_KEY` |
| **Fallback 1** | Mistral AI | `mistral-large-latest` | Quota overflow | `MISTRAL_API_KEY` |
| **Fallback 2** | Azure OpenAI | Configured deployment | Secondary fallback | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME` |

**Model selection:**
- **Client-side:** `activeModelId` state in `geminiService.ts` with runtime switching via `setAiModelId()`. Default: `gemini-2.5-flash`.
- **Server-side:** `ModelRouter.ts` uses `ModelType` enum (`REASONING`, `SPEED`, `MISTRAL`, `AZURE`) to route.
- **Tier resolution:** `resolveModelTier()` in `geminiProxy.ts` maps model IDs to `flash` or `pro` via keyword matching.

---

## 3. How the AI Logic Works

### 3.1 Prompt Management

**Two-tier system:**

**Client-side — `PromptFactory`** (`services/promptFactory.ts`)
- `createContextAwarePrompt()` — wraps user tasks with: system instruction, sector compliance rules, project context, governance constraints, output format
- `createLiveSystemInstruction()` — generates persistent context for chat/live modes
- **8 sector compliance profiles:** FINTECH (PCI-DSS, SOC2, KYC/AML), BIOTECH_PHARMA (FDA 21 CFR Part 11, HIPAA, GxP), GREEN_ENERGY (ISO 14001, IEC 61850), SAAS_CLOUD (GDPR, OWASP), INDUSTRY_4_0 (ISA/IEC 62443), AGRITECH_FOODTECH (FSMA), CIRCULAR_ECONOMY (Material Passports), GENERAL (BABOK)
- **Multi-language:** EN, FR, AR with explicit language injection

**Server-side — `PromptManager`** (`server/ai-agents/PromptManager.ts`)
- Retrieves versioned prompts from Firestore `prompts` collection by ID
- Currently minimal (single `getPrompt()` method) — designed for future expansion

### 3.2 Response Processing Pipeline

```
Raw LLM Output
    ↓
cleanJsonString()     — Strip markdown fences, bold markers, extract outermost {} or []
    ↓
safeParseJSON()       — jsonrepair auto-fix → parse → fallback default on failure
    ↓
validateStructure()   — Check required keys exist; throw on missing
    ↓
[IF FAIL] repairJson() — Send broken JSON back to AI with repair prompt
    ↓                   Cascade: active model → fallback → Mistral → Azure
[IF PASS] Extract final output
```

**Double-Pass Validator Pattern:** For complex artifacts (Data Models, Traceability Graphs, BPMN Flows), prompts instruct the model to output `_draft_logic`, `_audit_log`, and `final_diagram` fields. The system extracts only `final_diagram`.

### 3.3 Multi-Agent "Hive" System

**Agents** (`hiveService.ts` + `microservices.ts`):

| Agent | Role | Capabilities |
|---|---|---|
| **Orchestrator** | Routing brain | Reads history, delegates to workers, injects long-term memories |
| **Scout** | Market research | Google Search Grounding, source/citation extraction |
| **Guardian** | Compliance & ethics | Sector-specific rule validation, bias/privacy auditing |
| **Integromat** | Systems integration | 11 tools: Jira, GitHub, SQL, video gen, BPMN, sequence diagrams, mind maps, presentations, memory read/write |
| **Simulation** | Predictive modeling | Monte Carlo parameter estimation, calibrated by past memories |

**Execution flow:**
```
HiveService.processStep()
  → Identify active agent
  → If Orchestrator: decide next action
  → If delegate: call target worker
  → If HITL required: return `waiting_approval` state
  → Otherwise: return completed state
```

**Context pruning:** When message history exceeds 12 items, older messages are summarized via AI to prevent token overflow.

### 3.4 Async Task Queue

Long-running AI tasks (WBS generation, risk assessment) use a Firestore-backed queue:

```
Client request → Firestore task_queue (pending)
  → TaskWorker snapshot listener picks up task
  → Sets status to processing
  → Executes AI agent
  → Sets status to completed/failed
  → Results streamed via SSE at /api/ai/stream/:operationId
```

### 3.5 RAG Capability

- **Oracle Service** (`oracleService.ts`): Portfolio-wide semantic search across all initiatives and their artifacts
- **Integromat Agent**: Can save/read from vector memory for contextual awareness
- **Memory Service**: Dual-layer — server-side Firestore vectors + client-side IndexedDB fallback

---

## 4. Current Resilience Patterns

### 4.1 Exponential Backoff Retry

**Location:** `utils/aiUtils.ts` — `withRetry(fn, retries=5, delay=2000, backoff=2)`

- 5 retries with exponential backoff: 2s → 4s → 8s → 16s → 32s
- Random jitter: 0–1000ms added to each delay
- **Non-retryable:** 403 (safety blocks), permission issues
- **Retryable:** 5xx server errors, RPC/XHR failures, 429 (quota exceeded, RESOURCE_EXHAUSTED)

### 4.2 Model Fallback Chains

Every AI call follows a 4-model cascade:
1. Active model (e.g., `gemini-2.5-flash`)
2. Fallback Gemini model
3. Mistral
4. Azure OpenAI

Quota exhaustion on primary Gemini sets `isPrimaryModelExhausted = true` and dispatches a `quota-exceeded` window event, skipping that model in subsequent calls.

### 4.3 Error Classification

**Location:** `handleAiError()` in `geminiService.ts`

| Error Pattern | User-Facing Message |
|---|---|
| 429 / Quota | "AI Service Quota Exceeded. The free tier limit has been reached..." |
| Safety / blocked | "The request was blocked by safety filters. Please refine your input." |
| 500 / 503 / Overloaded | "AI Service is temporarily overloaded. Retrying usually fixes this." |

### 4.4 Server-Side Safety

- **`safeError()`**: Never exposes error messages, stack traces, or API error payloads. Returns generic `"Internal server error"`.
- **`safeErrorHtml()`**: Same principle for HTML responses (OAuth flow).
- **Rate limiting** (3 tiers):
  - General API: 100 req / 15 min
  - AI endpoints: 20 req / 15 min
  - Auth endpoints: 10 req / 15 min

### 4.5 Graceful Degradation

| Service | Fallback Behavior |
|---|---|
| `recommendTechniques()` | Hardcoded techniques when API limits hit |
| `CortexService.generateInsights()` | Fallback insight explaining API unavailability |
| `getEmbedding()` | Returns empty array `[]` (non-blocking) |
| `MemoryService.search()` | Returns empty array on server failure |

### 4.6 Usage Metering

**Location:** `UsageMeteringService.ts`

- Tracks AI calls and token counts per organization per month
- **Plan-based quotas:** Free = 100 AI calls/month; Pro/Enterprise = unlimited
- `enforceQuota()` throws 429 when limits exceeded

---

## 5. Current Cost Optimization

| Strategy | Implementation |
|---|---|
| **Default to Flash** | `gemini-2.5-flash` is default; pro tier only for complex reasoning |
| **Model tier routing** | `resolveModelTier()` auto-selects flash vs. pro by keyword |
| **Usage metering** | Plan-based quotas per org per month |
| **Context pruning** | Hive summarizes history at 12 messages |
| **Vector memory caps** | Server: 200/org; Client: 100. Oldest pruned automatically |
| **Fallback chain efficiency** | Cheapest models tried first |
| **Embedding caching** | Stored in Firestore vector memory, avoids repeated API calls |
| **Client-side math** | Monte Carlo via `mathjs` — zero LLM cost |
| **Server-side API keys** | All calls proxied; no client-side key exposure |

---

## 6. Gaps & Recommendations

### 6.1 Resilience — Missing Patterns

| Gap | Recommendation | Priority |
|---|---|---|
| **No circuit breaker** | Implement circuit breaker per provider (open/half-open/closed states). After N consecutive failures, skip provider for a cooldown period instead of wasting retries. | **HIGH** |
| **No proactive health checks** | Add periodic health probes per provider (lightweight test prompt every 60s). Mark unhealthy providers as unavailable before user requests hit them. | **HIGH** |
| **No request idempotency** | Add idempotency keys to async task submissions. Prevent duplicate execution on network retries. | **HIGH** |
| **No dead letter queue** | Failed tasks currently just mark `failed`. Add DLQ with failure reason, retry count, and manual retry capability. | **MEDIUM** |
| **Basic observability** | OpenTelemetry is present but minimal. Add per-model latency histograms, cost tracking, error rate counters, and token usage metrics. | **MEDIUM** |
| **No all-providers-fail fallback** | When ALL 3 providers fail, return cached/partial results with clear user messaging instead of generic error. | **MEDIUM** |
| **No request timeout enforcement** | Add per-request timeouts (e.g., 30s for chat, 120s for generation) to prevent hung connections from consuming resources. | **MEDIUM** |
| **No retry budget** | Unbounded retries under load can amplify failures. Implement retry budget (e.g., max 20% of total requests can be retries). | **LOW** |

### 6.2 Cost Optimization — Missing Strategies

| Gap | Recommendation | Priority |
|---|---|---|
| **No response caching** | Add semantic cache layer (e.g., Upstash Redis or in-memory LRU). Cache identical or near-identical prompts with TTL. Estimated savings: 20-40% on repeated queries. | **HIGH** |
| **No token budgeting** | Enforce `maxOutputTokens` per operation type. SWOT analysis doesn't need 8K tokens; cap at reasonable limits per artifact type. | **HIGH** |
| **Dumb model routing** | Currently keyword-based. Implement request complexity scoring (input length, task type, required reasoning depth) to pick cheapest viable model. | **HIGH** |
| **No batching for embeddings** | Batch embedding calls instead of one-per-request. Gemini supports batch embedding API. | **MEDIUM** |
| **No usage analytics dashboard** | Track cost per org, per feature, per model. Identify waste and optimize prompt engineering. | **MEDIUM** |
| **No prompt compression** | System prompts are verbose. Compress for routine operations; use full prompts only for complex tasks. | **MEDIUM** |
| **No local fallback** | Consider small open-source models (Ollama, local Llama) for trivial tasks like JSON repair, classification, or simple extraction. | **LOW** |
| **No speculative execution** | For multi-step tasks, run independent steps in parallel rather than sequentially. | **LOW** |

### 6.3 Architecture Improvements

| Area | Recommendation |
|---|---|
| **Prompt versioning & A/B testing** | Expand `PromptManager` to support prompt versioning, A/B testing, and performance tracking per prompt version. |
| **Centralized AI configuration** | Consolidate model config, timeouts, retry settings, and token budgets into a single config module instead of scattered across services. |
| **Provider abstraction layer** | Create a unified `LLMProvider` interface so adding new providers (Anthropic, OpenRouter, local models) requires zero changes to calling code. |
| **Structured logging for AI calls** | Log every AI call with: model, input tokens, output tokens, latency, cost, success/failure, retry count. Essential for cost analysis. |
| **Feature flag for AI providers** | Add feature flags to enable/disable individual providers at runtime without redeploy. |

---

## 7. Recommended Resilient AI Service Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           API Gateway / Express          │
                    │  Rate Limiting │ Auth │ Correlation ID   │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │          Request Router                  │
                    │  Complexity Score → Model Selection      │
                    │  Idempotency Check │ Semantic Cache      │
                    └────┬───────────┬───────────┬────────────┘
                         │           │           │
              ┌──────────▼──┐ ┌──────▼────┐ ┌───▼──────────┐
              │  Gemini SDK  │ │ Mistral   │ │ Azure OpenAI │
              │  (Primary)   │ │ (FB 1)    │ │ (FB 2)       │
              └──────┬───────┘ └─────┬─────┘ └─────┬────────┘
                     │               │              │
              ┌──────▼───────────────▼──────────────▼────────┐
              │          Circuit Breaker Layer                │
              │  Per-provider: open/closed/half-open states   │
              │  Health checks every 60s                      │
              └──────────────────────┬───────────────────────┘
                                     │
              ┌──────────────────────▼───────────────────────┐
              │          Retry with Backoff                   │
              │  5 retries, exponential, jitter, budget cap   │
              └──────────────────────┬───────────────────────┘
                                     │
              ┌──────────────────────▼───────────────────────┐
              │          Response Pipeline                    │
              │  cleanJSON → safeParse → validate → repair    │
              │  Token counting → Cost tracking → Logging     │
              └──────────────────────┬───────────────────────┘
                                     │
              ┌──────────────────────▼───────────────────────┐
              │          Result Cache + DLQ                   │
              │  Cache successful responses (TTL)             │
              │  Dead letter queue for failures               │
              └───────────────────────────────────────────────┘
```

---

## 8. Key Files Reference

| File | Purpose |
|---|---|
| `server/ai-agents/ModelRouter.ts` | Server-side model routing |
| `server/ai-agents/PromptManager.ts` | Firestore prompt retrieval |
| `server/ai-agents/WBSGeneratorAgent.ts` | Async WBS generation agent |
| `server/ai-agents/RiskAssessorAgent.ts` | Async risk assessment agent |
| `server/ai-agents/ArtifactAnalyzerAgent.ts` | Document analysis agent |
| `services/geminiService.ts` | Core AI caller (~1500+ lines, 100+ functions) |
| `services/geminiProxy.ts` | Client proxy to server AI endpoints |
| `services/llmProxyService.ts` | Mistral + Azure OpenAI proxies |
| `services/promptFactory.ts` | Sector-aware prompt templating |
| `services/hiveService.ts` | Multi-agent orchestration state machine |
| `services/microservices.ts` | 5-agent system implementation |
| `services/memoryService.ts` | Vector memory (IndexedDB + server) |
| `services/oracleService.ts` | Portfolio-wide RAG Q&A |
| `services/cortexService.ts` | Knowledge graph + AI insights |
| `utils/aiUtils.ts` | Retry logic, JSON repair, validation |
| `server/featureFlags.ts` | 8 environment-driven feature flags |
| `server/operationStore.ts` | In-memory operation tracking for SSE |
| `server/logger.ts` | Pino structured logger |
| `server/tracing.ts` | OpenTelemetry setup |

---

## 9. Summary

CogniSys BA has a **solid foundation** for AI resilience: multi-provider fallback, exponential backoff retry, graceful degradation, usage metering, and cost-aware model selection. The dual-layer architecture (client services + server agents) provides flexibility.

**Critical gaps** to address for production-grade resilience:
1. Circuit breaker pattern (prevents cascading failures)
2. Semantic response caching (20-40% cost reduction)
3. Token budgeting per operation type
4. Intelligent model routing based on request complexity
5. Dead letter queue for failed async tasks
6. Comprehensive observability (per-model cost, latency, error rates)

**Estimated impact of recommendations:**
- **Resilience:** Reduce user-facing AI errors by 60-80%
- **Cost:** Reduce AI API spend by 25-45% through caching, token budgeting, and smarter routing
- **Observability:** Enable data-driven model selection and prompt optimization
