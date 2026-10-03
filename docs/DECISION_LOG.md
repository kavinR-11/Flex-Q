# Decision Log: YOLO × FluxQ

This document records key technical, architectural, and mathematical decisions made during the autonomous development of the YOLO × FluxQ platform.

---

## Decision Record 001: Primary MVP Geography & Spatial Network
- **Date:** October 3, 2026
- **Context:** The problem statement and dataset blueprint require a coherent geographic domain to ensure realistic spatial alignment between shipments, routes, weather, and congestion.
- **Options Considered:**
  1. California / US Highway Network (PeMS + BTS TranStats).
  2. India Domestic Logistics Corridor (Chennai, Bengaluru, Mumbai, Delhi, Hyderabad).
  3. Hybrid global disconnected points.
- **Decision:** Select **India Domestic Logistics Corridor** (anchored by the Chennai–Bengaluru–Mumbai Golden Quadrilateral arterial corridors) as the primary operational network for the platform.
- **Rationale:**
  - `YOLO.pdf` Section 18 explicitly demonstrates the end-to-end operational example on `Shipment SH-2048: Origin: Chennai, Destination: Bengaluru, Promised ETA: 18:00, Alternate route B`.
  - `FluxQ_Dataset_Blueprint.md` Section 15 specifically recommends India with Chennai, Mumbai, Delhi/NCR, Bengaluru, Hyderabad as Phase 1 MVP.
  - Indian highway and port nodes (Chennai Port, JNPT Mumbai, Ennore, Bangalore Inland Container Depot) provide a concrete, realistic spatial network.
- **Status:** APPROVED & ACTIVE.

---

## Decision Record 002: ML Framework & Model Architecture
- **Date:** October 3, 2026
- **Context:** Need defensible, high-accuracy tabular models for SLA-breach classification and ETA regression with SHAP explainability.
- **Options Considered:**
  1. Deep Neural Network (MLP / TabNet).
  2. Gradient Boosted Decision Trees (LightGBM / XGBoost / CatBoost) with Logistic Regression / Random Forest baselines.
- **Decision:** Implement **LightGBM / Scikit-learn Random Forest & GradientBoosting** as the candidate tier, evaluated against **Logistic Regression / Dummy baselines**. Use `shap` for TreeExplainer computation.
- **Rationale:**
  - Gradient boosted trees are the gold standard for heterogeneous tabular logistics features (coordinates, durations, buffers, weather indices).
  - Native fast inference, robust missing value handling, and exact TreeSHAP explanation computation.
- **Status:** APPROVED & ACTIVE.

---

## Decision Record 003: Optimization Hierarchy & Quantum Role Separation
- **Date:** October 3, 2026
- **Context:** The prompt strictly prioritizes working end-to-end software and classical optimization (Google OR-Tools), while keeping Quantum-Hybrid optimization (Qiskit QAOA) as an isolated experimental Priority 2.
- **Options Considered:**
  1. Attempt to run all recovery through QAOA simulator.
  2. Use Google OR-Tools as the deterministic, production-grade primary solver; pass a small reduced residual allocation problem (3-6 shipments competing for scarce slots) to Qiskit QAOA for comparative benchmarking and QCR calculation.
- **Decision:** Adopt Option 2. OR-Tools handles fleet-wide multi-objective recovery. A specialized module isolates the residual bottleneck assignment for QUBO / QAOA simulation. If quantum fails or is unavailable, OR-Tools results are seamlessly served to the operator.
- **Rationale:** Guarantees zero downtime, production-grade reliability, and strict compliance with the prompt's Priority 1 vs Priority 2 mandate.
- **Status:** APPROVED & ACTIVE.

---

## Decision Record 004: Risk Score & Threshold Formulation
- **Date:** October 3, 2026
- **Context:** Standardizing the official risk score from 1 to 10 from the predicted SLA breach probability.
- **Decision:** Implement the exact formula specified in `YOLO.pdf` Section 10.5 and the master prompt:
  $$p = P(\text{SLA breach})$$
  $$R = \max(1, \min(10, \lceil 10 \cdot p \rceil))$$
  Display probability $p$ (e.g. $82\%$) and integer score $R$ (e.g. $9/10$) distinctly.
- **Status:** APPROVED & ACTIVE.
