# Project Requirements: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Problem Statement:** Theme 4 — Logistics and Supply Chain, PS 1 — Shipment Delivery Risk Score  
**Standard Compliance:** Strict adheres to [`docs/SOURCE_DOCUMENT_REVIEW.md`](file:///c:/Users/DELL/Downloads/ramyarec/docs/SOURCE_DOCUMENT_REVIEW.md) and [`FluxQ_Dataset_Blueprint.md`](file:///c:/Users/DELL/Downloads/ramyarec/FluxQ_Dataset_Blueprint.md).

---

## 1. Functional Requirements (FR)

- **FR-01: Shipment Registration & Management**
  - Ingest, query, and register shipment records with unique `shipment_id`, `origin`, `destination`, `origin_lat/lon`, `destination_lat/lon`, `current_lat/lon`, `carrier_id`, `route_id`, `transport_mode`, `dispatch_time`, `promised_delivery`, `current_eta`, `sla_hours`, `sla_buffer_minutes`, `cargo_type`, `cargo_priority`, `cargo_value`, and `status`.

- **FR-02: Signal & Disruption Ingestion**
  - Ingest external disruption signals across 5 key categories: Weather, Traffic/Road, Port/Maritime, Aviation, and Geopolitical/Natural Hazards.
  - Support event ingestion via API and synthetic scenario injection for testing.

- **FR-03: Real-Time Risk Prediction**
  - Estimate calibrated SLA-breach probability $p = P(\text{SLA Breach} \mid X) \in [0, 1]$.
  - Estimate delay probability $P(\text{Late} \mid X)$.

- **FR-04: Standardized Risk Score**
  - Compute the official integer risk score:
    $$R = \max(1, \min(10, \lceil 10 \cdot p \rceil))$$
  - Categorize scores into operational presentation bands:
    - 1–3: Low
    - 4–6: Moderate
    - 7–8: High
    - 9–10: Critical

- **FR-05: ETA & Delay Regression**
  - Estimate updated expected arrival time $\widehat{\text{ETA}} = f(X)$.
  - Calculate expected delay duration $\widehat{D} = \max(0, \widehat{\text{ETA}} - \text{ETA}_{\text{promised}})$.

- **FR-06: Model Explainability**
  - Compute feature contributions using SHAP (Shapley Additive exPlanations) or TreeSHAP to expose the exact drivers of the risk score (e.g. route congestion, low SLA buffer, adverse weather proximity).
  - Explicitly document that feature attribution represents model influence, not proven physical causation.

- **FR-07: Early Warning Indicators (EWI) & Disruption Detection**
  - Automatically detect incoming disruption events affecting active shipment routes within spatial-temporal buffers.
  - Trigger risk recomputation when SLA breach probability exceeds thresholds (e.g., $\ge 50\%$) or ETA exceeds SLA.

- **FR-08: Classical Recovery Optimization (Google OR-Tools)**
  - Formulate constrained combinatorial optimization for disrupted shipments across available recovery options:
    - `MAINTAIN_ROUTE`: Continue current plan (cost 0, higher delay risk).
    - `ALTERNATE_ROUTE`: Switch to unblocked road corridor (balanced cost & time).
    - `CARRIER_SWITCH`: Reassign to partner carrier with available lane capacity.
    - `EXPEDITE`: Fast-track via air/express logistics (highest cost, minimizes delay).
    - `HOLD_MONITOR`: Temporarily hold shipment at nearest terminal to observe conditions.
    - `ESCALATE`: Escalate to manual human logistics control.
  - Multi-objective minimization:
    $$\min \sum_i \sum_a x_{i,a} (\alpha C_{i,a} + \beta D_{i,a} + \gamma B_{i,a} + \delta E_{i,a})$$
    subject to capacity limits $\sum_i q_i x_{i,a} \le \text{Cap}_a$, feasibility, and budget limits.

- **FR-09: Multi-Plan Trade-off Generation**
  - Generate and display multiple ranked feasible recovery alternatives:
    - Plan A: Lowest Cost
    - Plan B: Lowest Delay
    - Plan C: Lowest SLA-Breach Risk
    - Plan D: Balanced Operational Trade-off

- **FR-10: Dynamic Replanning Engine**
  - When secondary events occur (e.g., alternate route becomes blocked, carrier capacity drops), automatically invalidate infeasible plans and re-solve only affected subproblems.

- **FR-11: Human-in-the-Loop Operator Approval**
  - Enforce explicit human approval workflow (`POST /recovery/{id}/approve`, `POST /recovery/{id}/reject`). No physical dispatch or state modification without operator signature.

- **FR-12: Full Decision Audit Trail**
  - Persist an immutable audit log linking: `shipment_id`, triggering event, previous risk, updated risk, solver formulation, candidate plans, operator decision, timestamp, and resulting state.

- **FR-13: Quantum-Hybrid Optimization Module (Priority 2)**
  - Isolate a small residual assignment subproblem (e.g. 3-8 shipments competing for scarce priority carrier slots).
  - Formulate as QUBO: $E(x) = E_{\text{cost}}(x) + \lambda E_{\text{constraint}}(x)$.
  - Execute via Qiskit QAOA / statevector simulator.
  - Classical validation of bitstrings; compute Quantum Contribution Ratio (QCR):
    $$\text{QCR} = \frac{J_{\text{classical}} - J_{\text{hybrid}}}{J_{\text{classical}}} \times 100\%$$
  - Provide guaranteed classical fallback when QAOA is unavailable or sub-optimal.

---

## 2. Non-Functional Requirements (NFR)

- **NFR-01: Reliability & Fallbacks**
  - The core system must remain 100% operational if the quantum module is disabled or fails.
  - The application must handle missing sensor feeds gracefully with default uncertainty buffers.

- **NFR-02: Data & Leakage Integrity**
  - Strictly zero future-target leakage in feature engineering. Preprocessing and scalers fit only on training split.
  - Clearly tag synthetic demonstration data; never present synthetic evaluation as verified real-world carrier metrics.

- **NFR-03: Performance & Responsiveness**
  - Model inference latency $\le 100\text{ms}$ per shipment.
  - Classical OR-Tools optimization $\le 2\text{s}$ for routine operational fleets ($\le 100$ shipments).
  - API response time $\le 200\text{ms}$ for standard dashboard queries.

- **NFR-04: UI/UX Excellence**
  - Modern, dark-mode control room aesthetic inspired by state-of-the-art enterprise logistics towers.
  - Interactive Leaflet/OpenStreetMap route and disruption visualization.
  - Rich interactive telemetry charts (Recharts) for risk distribution, ETA trends, and solver trade-offs.

- **NFR-05: Security & Reproducibility**
  - No committed credentials. Environment variable configuration via `.env`.
  - Pydantic schema validation on all inputs and outputs.
  - Reproducible random seeds for ML and optimization.
