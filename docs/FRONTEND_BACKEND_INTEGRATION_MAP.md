# YOLO × FluxQ: Frontend-to-Backend Integration Map

This document establishes the end-to-end integration mapping between every Stitch prototype screen, reusable UI component, and the real FastAPI backend services, databases, ML models, and optimization solvers.

---

## Screen 1: Control Tower (`control-tower`)

* **Purpose:** Real-time multimodal network operations monitoring, KPI scorecards, risk distribution, corridor alert tickers, and operational alert feeds.
* **Component:** `frontend/src/components/ControlTowerView.tsx`
* **API Endpoints:**
  * `GET /api/v1/health`
  * `GET /api/v1/shipments?limit=150`
  * `GET /api/v1/events?limit=50`
* **Required Data:**
  * Active fleet volume (total count, in-transit, delayed, critical)
  * High-risk count & predicted SLA breach probability
  * On-track SLA buffer percentage & live alerts
  * Active disruption signals on map and list
* **Interactions:**
  * Clicking a high-risk KPI card filters or navigates to `shipment-risk`.
  * Clicking a map marker opens the corresponding consignment details.
  * Clicking "Mitigate" on an alert navigates directly to `recovery-center` with pre-filled context.
* **States:**
  * *Loading:* Pulsing spinner with telematics sync banner.
  * *Empty:* Clean state card with zero alerts and green health status.
  * *Error:* Fallback display with retry button and graceful degraded telemetry mode.

---

## Screen 2: Shipment Risk Worksheet (`shipment-risk`)

* **Purpose:** Granular consignment-level predictive risk audit, TreeSHAP feature attributions, and dynamic ETA recalculation.
* **Component:** `frontend/src/components/ShipmentsView.tsx`
* **API Endpoints:**
  * `GET /api/v1/shipments` (with query filters: `status`, `min_risk`, `search`, `limit`)
  * `GET /api/v1/shipments/{id}`
  * `GET /api/v1/shipments/{id}/explanation`
* **Required Data:**
  * Consignment ID, Origin, Destination, Carrier, Transport Mode, Promised SLA vs Current Dynamic ETA, SLA Buffer (minutes), Calibrated P(SLA Breach), Delay Estimate.
  * TreeSHAP feature attribution decomposition values (e.g. corridor obstruction, buffer depletion, weather severity).
* **Interactions:**
  * Selecting a row in the worksheet loads the deep-dive drawer with SHAP breakdown and route timeline.
  * Clicking "Launch Recovery" transitions directly to `recovery-center` for the selected shipment.
* **States:**
  * *Loading:* Skeleton row table loading.
  * *Empty:* "No consignments match current filter criteria" message.
  * *Error:* Error banner with retry option.

---

## Screen 3: Route Network / Corridors Planning (`route-network`)

* **Purpose:** Kinaxis Maestro-style tabular corridor planning, capacity allocation, utilization tracking, and bottleneck identification.
* **Component:** `frontend/src/components/RouteMapView.tsx`
* **API Endpoints:**
  * `GET /api/v1/network/overview`
  * `GET /api/v1/network/corridors` (with filter params: `mode`, `overloaded_only`)
  * `GET /api/v1/events` (for disruption circle overlays)
* **Required Data:**
  * Corridor ID, Origin Hub, Linehaul Route, Destination, Mode/Carrier, Planned Volume, Available Capacity, Utilization %, Predicted Delay, SLA Penalty Exposure, Active Bottleneck.
  * Linked shipments list for expanded corridor rows.
* **Interactions:**
  * Filtering by mode (Road, Rail, Air, All) or Overloaded Only.
  * Row expansion toggles connected critical shipments (e.g. `SH-2113`, `SH-1994`).
  * "Mitigate in Recovery" button navigates to `recovery-center`.
  * "View Spatial Map" toggle synchronizes with Leaflet route topology.
* **States:**
  * *Loading:* Skeleton grid loader.
  * *Empty:* "No corridors found for selected mode" placeholder.
  * *Error:* Offline indicator with cached topology fallback.

---

## Screen 4: Disruption Lab (`disruption-lab`)

* **Purpose:** Controlled simulation and "what-if" impact assessment of environmental, infrastructural, and traffic disruptions.
* **Component:** `frontend/src/components/DisruptionLabView.tsx`
* **API Endpoints:**
  * `GET /api/v1/events`
  * `POST /api/v1/events` (creates new simulated disruption and calculates affected shipments)
* **Required Data:**
  * Event Type, Severity (1-10), Location Coordinates, Impact Radius (km), Affected Mode, Estimated Delay (min).
  * Impacted consignment list and before/after risk exposure.
* **Interactions:**
  * Selecting preset scenarios (Monsoon Flooding, Ghat Landslide, Port Berth Congestion, Cyclone E-Coast).
  * Submitting a custom scenario calls backend geospatial spatial join.
  * "Proceed to Recovery Optimization" passes affected shipment IDs to `recovery-center`.
* **States:**
  * *Loading:* Submission button spinner.
  * *Success:* Impact calculation modal with affected shipment count.
  * *Error:* Input validation message.

---

## Screen 5: Recovery Center (`recovery-center`)

* **Purpose:** Multi-objective Pareto trade-off analysis, candidate recovery plan comparison, and cryptographic operator approval.
* **Component:** `frontend/src/components/RecoveryCenterView.tsx`
* **API Endpoints:**
  * `POST /api/v1/recovery/optimize`
  * `POST /api/v1/recovery/{id}/approve`
  * `POST /api/v1/recovery/{id}/reject`
* **Required Data:**
  * Selected shipment context (`SH-2048`, `SH-2113`).
  * Google OR-Tools candidate recovery options: Plan A (Express Air), Plan B (Electric Rail Bypass), Plan C (High-Speed Haul), Plan D (Staging Hold).
  * Key deltas: Additional Cost (₹), Delay Reduction (hrs), Net SLA Penalty Saved, Feasibility Status.
* **Interactions:**
  * Objective weight sliders (Cost vs Delay vs SLA Penalty).
  * Plan selection highlights comparative cost/benefit cards.
  * Operator ID entry and rationale input.
  * "Authorize & Commit Plan" invokes backend approval endpoint, records immutable SQLite audit log, updates consignment route, and displays success badge.
* **States:**
  * *Optimizing:* OR-Tools solver execution spinner.
  * *Approved:* Green verified stamp with generated Audit ID.
  * *Rejected:* Red rejection confirmation with recorded justification.

---

## Screen 6: Decision Audit (`decision-audit`)

* **Purpose:** Complete traceability, compliance journal, and cryptographic audit log for all system and human-authorized interventions.
* **Component:** `frontend/src/components/AuditTrailView.tsx`
* **API Endpoints:**
  * `GET /api/v1/audit`
  * `GET /api/v1/audit/{shipment_id}`
* **Required Data:**
  * Audit Entry ID, Shipment ID, Event Type, Operator Signature, Justification, Timestamp, State Diff (`previous_state` -> `new_state`).
* **Interactions:**
  * Filtering by shipment ID, event type, or operator.
  * Expanding entry displays raw JSON state transition diff.
  * "Export Audit Trail (CSV)" triggers client-side download.
* **States:**
  * *Loading:* Audit journal spinner.
  * *Empty:* "No decision audit entries recorded yet".
  * *Error:* Database read failure alert.

---

## Screen 7: Quantum Lab (`quantum-lab`)

* **Purpose:** Experimental quantum-hybrid optimization research, QUBO formulation, QAOA ansatz tuning, and classical benchmark comparisons.
* **Component:** `frontend/src/components/QuantumLabView.tsx`
* **API Endpoints:**
  * `GET /api/v1/quantum/benchmark`
  * `POST /api/v1/quantum/simulate`
* **Required Data:**
  * Stored benchmarks for 4, 6, and 8-qubit combinatorial residual allocation problems.
  * Interactive simulation parameters: Num Shipments (N), Num Slots (K), Circuit Depth (p), Angles (gamma, beta), Penalty (lambda).
  * Simulation outputs: Statevector measured bitstrings, optimal cost, classical baseline, optimality gap %, ground state overlap %.
* **Interactions:**
  * Adjusting angle and depth sliders.
  * Clicking "Execute Interactive QAOA Simulation" runs Qiskit Statevector backend on the server.
  * Tab switching between Formulation, Benchmarks, Circuit Topology, and Tuning.
* **States:**
  * *Simulating:* Statevector matrix computation loader.
  * *Success:* Metric cards updated with quantum telemetry.
  * *Error:* Feasibility penalty violation alert.

---

## Screen 8: Ask FluxQ AI Assistant (`ask-fluxq`)

* **Purpose:** Conversational logistics intelligence copilot grounded in live IoT telemetry, TreeSHAP attributions, and optimization solutions.
* **Component:** `frontend/src/components/AskFluxQView.tsx`
* **API Endpoints:**
  * `POST /api/v1/assistant/chat`
* **Required Data:**
  * Copilot Engine (Hybrid Ensemble, SHAP Only, Pareto Solver, ST-GNN).
  * Context pins: Corridor, Critical Consignment, Active Simulation.
  * Grounded markdown response, grounded entity citations, suggested follow-ups, and actionable navigation buttons.
* **Interactions:**
  * Clicking suggested inquiry pills immediately submits queries.
  * Unpinning/pinning context filters.
  * Clicking action buttons (e.g. "Launch Recovery for SH-2113") navigates directly to target views with preloaded state.
* **States:**
  * *Thinking:* Copilot synthesis spinner.
  * *Empty:* Default welcoming prompt with grounding summary.
  * *Error:* Graceful fallback message with retry suggestions.

---

## Screen 9: Settings & System Telemetry (`settings-and-system`)

* **Purpose:** Platform diagnostic telemetry, microservice health probes, ML model registry cards, and API documentation access.
* **Component:** `frontend/src/components/SettingsSystemView.tsx`
* **API Endpoints:**
  * `GET /api/v1/health`
* **Required Data:**
  * Platform version, server timestamp, database connection status, model registry states (`lightgbm_calibrated_v1`, `random_forest_reg_v1`, `google_or_tools_scip`, `qiskit_statevector_aer`), sensor count, uptime SLA.
* **Interactions:**
  * "Probe Telemetry" triggers manual health ping.
  * Links to Swagger UI (`/docs`).
  * Tab navigation across System Overview, Models & Solvers, Telemetry Integrations, and Security.
* **States:**
  * *Probing:* Health check spinner.
  * *Success:* Green indicators across all 4 microservice tiers.
  * *Degraded:* Warning badge indicating which service requires attention.
