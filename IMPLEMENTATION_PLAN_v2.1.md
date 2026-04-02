
# 🚀 CogniSys BA v2.1: "The Predictive Core" Implementation Plan

## 1. Executive Summary
This document outlines the tactical steps to upgrade the **CogniSys BA** platform from v2.0 (Autonomous) to v2.1 (Predictive). The upgrade introduces stochastic modeling (Monte Carlo), sensitivity analysis, and ethical governance checking, integrated directly into the multi-agent Hive architecture.

**Core Objective:** Empower the system to not just *create* requirements, but to *predict* their outcomes and *validate* their ethics.

---

## 2. Architecture Changes

### A. The Agentic Layer
We are adding a **6th Node** to the Neural Graph:
*   **Agent Name:** `Simulation`
*   **Persona:** Strategic Risk Analyst & Data Scientist.
*   **Function:** Handles "What-If" scenarios, probability distributions, and sensitivity analysis.
*   **Routing:** The Orchestrator will now delegate tasks involving "prediction," "forecast," "simulation," or "impact" to this agent.

### B. The Governance Layer
We are enhancing the **Guardian** and **Predictive Core** to support:
*   **Ethical AI Audits:** Scanning for bias, fairness, and privacy-by-design principles.
*   **Privacy Checks:** Automated PII detection in requirements.

---

## 3. Step-by-Step Implementation Guide

### Phase 1: Domain Modeling (Type Definitions)
**Goal:** Define the data structures required for statistical analysis and ethics.

1.  **Update `types.ts`:**
    *   [x] Add `TMonteCarloResult`: Structure for histogram buckets (p10, p50, p90).
    *   [x] Add `TTornadoItem`: Structure for sensitivity variables (low/high impact).
    *   [x] Add `TEthicalCheck`: Structure for bias/fairness scoring.
    *   [x] Update `THiveAgent`: Add `'Simulation'` to the union type.

### Phase 2: Generative Services (The Brain)
**Goal:** Teach Gemini how to perform statistical reasoning and ethical critiques.

1.  **Update `services/geminiService.ts`:**
    *   [x] Implement `generateMonteCarloSimulation`: Prompt engineering to force the LLM to output statistical distributions based on variable parameters.
    *   [x] Implement `generateTornadoAnalysis`: Logic to isolate variables and estimate high/low impact ranges.
    *   [x] Implement `runEthicalCheck`: A strict governance prompt to audit artifacts against specific ethical frameworks (e.g., EU AI Act principles).

### Phase 3: The Simulation Microservice (The Worker)
**Goal:** Integrate the new agent into the Hive's execution graph.

1.  **Update `services/microservices.ts`:**
    *   [x] Create `SimulationService` class extending `BaseAgent`.
    *   [x] Define system prompt: "You are a Predictive Modeling Expert..."
    *   [x] Register the service in the `Microservices` export.
    *   [x] Update `OrchestratorService` prompt to instruct it on *when* to delegate to the Simulation agent.

### Phase 4: UI/UX Components (The Interface)
**Goal:** Visualize complex statistical data in an intuitive way.

1.  **Create `components/ai/PredictiveCore.tsx`:**
    *   [x] **Monte Carlo Tab:** Render an SVG Histogram visualization showing probability buckets.
    *   [x] **Sensitivity Tab:** Render a Tornado Diagram (Bar chart centered on zero) to show variable impact.
    *   [x] **Ethics Tab:** A scorecard UI for Bias, Privacy, and Fairness ratings.
2.  **Update `components/TheHive.tsx`:**
    *   [x] Add the `Simulation` agent avatar to the visualizer.
    *   [x] Update the Neural Graph to render the `Simulation` node active state.
    *   [x] Add color mapping (Amber/Orange) for the new agent.

### Phase 5: Routing & Integration
**Goal:** Expose the new capabilities to the user.

1.  **Update `constants.ts`:**
    *   [x] Add "Predictive Core" to the `Documentation & Governance` module group.
2.  **Update `components/InitiativeView.tsx`:**
    *   [x] Add the case handler for `Predictive Core` in the render switch statement.
    *   [x] Ensure the module passes the `initiative` context correctly.

---

## 4. Verification & Testing Strategy

### Scenario A: The "What-If" Test
1.  Open an Initiative.
2.  Navigate to **Predictive Core**.
3.  Run a Monte Carlo simulation with variables: "Dev Time, QA Lag, Vendor Delay".
4.  **Success Criteria:** A histogram appears showing P10, Mean, and P90 values.

### Scenario B: The Ethical Gate
1.  Open **Predictive Core** -> **Ethical Guardian**.
2.  Run an audit.
3.  **Success Criteria:** The system generates a score out of 100 and flags potential bias (e.g., "The algorithm may disadvantage users with lower credit history").

### Scenario C: The Hive Orchestration
1.  Go to **The Hive**.
2.  Type: "Simulate the risk of project delay if the vendor is 2 weeks late."
3.  **Success Criteria:**
    *   Orchestrator delegates to `Simulation`.
    *   `Simulation` agent processes the request.
    *   Result is returned in the chat window.

---

## 5. Future Roadmap (v2.2)
*   **Real Integration:** Replace LLM-simulated math with a real Javascript math library (`mathjs`) for client-side calculation to improve accuracy.
*   **Vector Memory:** Allow the Simulation agent to recall past project outcomes to calibrate predictions.
