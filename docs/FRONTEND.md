# Frontend & Delivery Hub: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Frontend Stack:** React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Lucide React  
**Aesthetic:** Ultra-Modern Dark Theme Operations Control Room with Glassmorphism and Neon Telemetry

---

## 1. Application Layout & Architecture

The delivery hub provides a cohesive operations cockpit divided into 6 interactive functional workspaces:

```text
frontend/src/
├── components/
│   ├── Navbar.tsx             # System branding, live status pulse, tab router
│   ├── ControlTowerView.tsx   # Fleet overview KPIs, risk distributions, live disruption signals
│   ├── ShipmentsView.tsx      # Filterable consignments board, risk scores (1-10), SHAP drawer
│   ├── RouteMapView.tsx       # Leaflet interactive map with corridor vectors & disruption polygons
│   ├── RecoveryCenterView.tsx # OR-Tools MIP solver, 4 candidate plans, human approval modal, QAOA QCR
│   ├── DisruptionLabView.tsx  # Interactive scenario injection sandbox with dynamic ripple recalculation
│   └── AuditTrailView.tsx     # Cryptographic & chronological immutable decision ledger
├── services/
│   └── api.ts                 # Strongly-typed REST client connecting to FastAPI backend
├── types/
│   └── index.ts               # End-to-end TypeScript interfaces matching Pydantic schemas
├── App.tsx                    # Top-level state coordinator & 10s telemetry polling
└── index.css                  # Tailored dark-mode styling, Leaflet map filters, custom scrollbars
```

---

## 2. Core Functional Views

### 2.1 Control Tower Overview
- **Executive KPIs:** Total Active Fleet, High-Risk Consignments ($\ge 7/10$), Predicted SLA Breaches, Network Reliability Rate.
- **Risk Score Distribution:** Real-time Recharts bar chart mapping fleet across Low ($1-3$), Moderate ($4-6$), High ($7-8$), and Critical ($9-10$).
- **Live Disruption Ticker:** Streaming alerts from external and simulated event feeds.
- **High-Risk Quick Action:** One-click drill-down to evaluate recovery on vulnerable shipments.

### 2.2 Shipment Risk Intelligence Board
- **Filter & Search Engine:** Instant substring matching across shipment ID, destination, cargo, carrier, and operational status.
- **1–10 Standardized Score Badges:** Exact implementation of $R = \max(1, \min(10, \lceil 10p \rceil))$ color-coded by severity.
- **Explainability Drawer (TreeSHAP):**
  - Displays top 4 local feature contributions with directional risk attribution (`INCREASING_RISK` vs `REDUCING_RISK`).
  - Displays mandatory statistical disclaimer: *"SHAP values measure statistical attribution within the model. They do not constitute physical or causal proof of disruption etiology."*
  - Direct "Launch Recovery Optimizer" trigger.

### 2.3 Interactive Route Map
- **Geographic Network:** Covers Chennai, Bengaluru, Mumbai, and Hyderabad arterial corridors.
- **Highway Corridors:** Polylines for NH48 arterial, NH44, and Alternate Route B (NH717 bypass).
- **Disruption Impact Buffers:** Pulsing geographic circles sized to exact event radii ($15\text{--}60\text{ km}$) with severity ratings.
- **Shipment Markers:** Telematics pins displaying real-time location, risk category, and SLA buffer.

### 2.4 Autonomous Recovery Center
- **Google OR-Tools Optimization:** Solves multi-objective trade-offs across 4 distinct candidate recovery plans (`MAINTAIN_ROUTE`, `ALTERNATE_ROUTE`, `CARRIER_SWITCH`, `EXPEDITE`).
- **Interactive Multi-Objective Weights:** Real-time sliders for Cost ($\alpha$), Delay ($\beta$), and SLA Penalty ($\gamma$), plus budget cap.
- **Human Authorization Console:** Enables operators to sign off with operator ID and notes, executing `POST /recovery/{id}/approve`, transitioning shipment state to `rerouted`, and logging to audit trail.
- **Quantum-Hybrid Benchmark Panel:** Evaluates Qiskit QAOA statevector simulation on residual bottleneck slot allocation, comparing classical MIP objective against QAOA and displaying Quantum Contribution Ratio (QCR).

### 2.5 Disruption Simulation Lab
- **Curated Operational Scenarios:** 1-click injection of Monsoon Flash Inundation on NH48 Sriperumbudur, Walajapet Bridge Structural Closure, and Chennai Port Gate Congestion.
- **Custom Event Builder:** Sliders for severity ($0\text{--}10$), impact radius ($5\text{--}150\text{ km}$), delay magnitude ($10\text{--}720\text{ mins}$), and transport modality.
- **Dynamic Ripple Feedback:** Automatically recomputes risk scores and ETAs for all affected shipments, prompting dynamic replanning.

### 2.6 Decision Audit Ledger
- **Traceability:** Complete chronological log recording timestamp, operator ID, prior state, new state, and operational justification for every system and human action.
