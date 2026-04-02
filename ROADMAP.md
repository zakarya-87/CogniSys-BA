
# 🗺️ CogniSys BA: Strategic Roadmap
## Vision: The "Autonomous Employee" Evolution

This roadmap outlines the transformation of CogniSys from a passive AI-assisted tool into **The CogniSys Hive**—an autonomous, multi-agent orchestration platform.

---

## 🏗️ Phase 1: The Neural Foundation (Architecture & State)
- [x] **State Machine Definition:** Define `HiveState`, `HiveMessage`, and `HiveStep` types.
- [x] **Agent Personas:** Implement system prompts for *Orchestrator*, *Scout*, *Guardian*, and *Integromat*.
- [x] **Routing Logic:** Implement the `processStep` function to handle `delegate` vs `reply` actions.
- [x] **Cyclic Execution:** Upgrade the UI loop to handle multi-turn conversations.

## 🛠️ Phase 2: The Tool Belt (Capabilities)
- [x] **Search Grounding:** Deep integration with Google Search Grounding for the *Scout* agent.
- [x] **Citation Engine:** Ensure all external claims include source URLs.
- [x] **Integromat Sync:** Mock APIs for Jira, GitHub, and SQL.

## 🛡️ Phase 3: Governance & Predictive Intelligence
**Goal:** Safe autonomous operation with Predictive capabilities.
- [x] **Human-in-the-Loop (HITL):** Approval UI for critical operations.
- [x] **State Checkpointing:** LocalStorage persistence.
- [x] **Predictive Core:** Monte Carlo simulations and Sensitivity Analysis.
- [x] **Ethical Guardian:** Bias and Privacy auditing.

## 👁️ Phase 4: UX & Immersion
- [x] **Live Graph Viz:** Visual node graph in the UI.
- [x] **Video Briefings:** Integration with the *Vision Video* module (Veo).
- [x] **Diagram Generation:** BPMN, Sequence, and Mind Maps.

## 🧠 Phase 5: Collective Intelligence
**Goal:** Connect isolated projects into a Semantic Knowledge Graph.
- [x] **Knowledge Graph Architecture:** Define Nodes (Initiative, Person, Risk) and Edges.
- [x] **Cortex Visualizer:** Interactive SVG graph of the enterprise portfolio.
- [x] **Cross-Project Insights:** Gemini agent scanning the graph for hidden patterns and shared risks.

## 🔮 Phase 6: Deep Semantic Retrieval
**Goal:** Query the full knowledge base.
- [x] **The Oracle:** Long-context semantic search across the entire project portfolio (RAG).

## 🫀 Phase 7: The Pulse (Collaborative Ecosystem)
**Goal:** Simulate a living team environment.
- [x] **Activity Feed:** Social-style stream of all project events.
- [x] **AI Colleagues:** Specialized agents (Atlas, Sentry, etc.) that react to new artifacts.
- [x] **Reactive Feedback Loop:** Automated background reviews when artifacts are saved.

## 🏰 Phase 8: The War Room (Autonomous Strategy)
**Goal:** Real-time multi-agent debate and consensus building.
- [x] **War Room UI:** Visual roundtable for agents.
- [x] **Debate Engine:** Agents converse with each other based on persona logic.
- [x] **Consensus Synthesis:** Orchestrator summarizes the debate into an executive decision.

## ⚙️ Phase 9: The Construct (Code Generation)
**Goal:** Bridge the gap between Analysis/Design and Implementation.
- [x] **Construct UI:** IDE-style artifact viewer.
- [x] **Code Generator:** Convert Data Models, APIs, and Rules into SQL, TypeScript, and Python.
- [x] **Refinement Loop:** Chat-based code iteration.

## 👁️‍🗨️ Phase 10: The Vision Board (Multimodal)
**Goal:** Ingest visual inputs to drive requirements gathering.
- [x] **Vision Board UI:** Visual workspace for image uploads.
- [x] **Whiteboard Analysis:** Convert meeting photos to Backlog items.
- [x] **Sketch-to-Wireframe:** Convert hand-drawn UI to JSON structure.
- [x] **Legacy Scanner:** Reverse engineer requirements from screenshots.

## 🔮 Phase 11: The Predictive Core (v2.1)
**Goal:** Introduce stochastic modeling and ethical governance.
- [x] **Simulation Agent:** Specialized agent for probabilistic reasoning.
- [x] **Monte Carlo Engine:** Visual histogram of project outcomes.
- [x] **Ethical Guardian:** Structured audits for Bias and Privacy.
- [x] **Sensitivity Analysis:** Tornado charts for variable impact.

## 🧱 Phase 12: Hardening & QA (v2.2)
**Goal:** Ensure enterprise-grade reliability and test coverage.
- [x] **Unit Testing:** Vitest suite for `aiUtils` and `domainRules`.
- [x] **Error Boundaries:** Global React error catching.
- [x] **Self-Healing JSON:** Robust parsing logic to recover from AI formatting errors.
- [x] **Integration Tests:** Test the Hive loop end-to-end.

---

## 📊 Current Status
- **Version:** v2.2.0 (Hardening & QA)
- **Stability:** Enterprise Grade (High test coverage).
- **AI Models:** Gemini 2.5 Flash (Default), Veo (Video), Gemini 3.0 Pro (Complex Logic).

## 🚀 Next Steps (v2.3)
- **Vector Memory:** Allow the Simulation agent to recall past project outcomes to calibrate predictions.
- **Real Math Integration:** Replace LLM-simulated math with client-side libraries for higher precision.
