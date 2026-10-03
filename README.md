# YOLO × FluxQ
### Predictive Shipment Risk Intelligence & Hybrid Recovery Optimization Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![OR-Tools](https://img.shields.io/badge/Google%20OR--Tools-9.11-orange.svg)](https://developers.google.com/optimization)
[![Qiskit](https://img.shields.io/badge/Qiskit-2.2-purple.svg)](https://qiskit.org/)
[![Status](https://img.shields.io/badge/Stage--Gate%20Status-GATE%2015%20PASS-brightgreen.svg)](docs/gates/GATE_15_FINAL_ACCEPTANCE.md)

---

## 1. Overview & Problem Statement

**YOLO × FluxQ** is an end-to-end, enterprise-grade logistics intelligence and automated recovery platform engineered for **Theme 4 — Logistics and Supply Chain (Problem Statement 1: Shipment Delivery Risk Score)**.

Anchored on the critical **Chennai–Bengaluru arterial freight corridor (NH48)** and expanding across major Indian industrial hubs (Chennai, Bengaluru, Mumbai, Hyderabad, Delhi), the platform solves the foundational operational challenge of predictive delay mitigation:

$$\text{Sense} \longrightarrow \text{Normalize} \longrightarrow \text{Predict} \longrightarrow \text{Explain} \longrightarrow \text{Triage} \longrightarrow \text{Optimize} \longrightarrow \text{Recommend} \longrightarrow \text{Approve} \longrightarrow \text{Audit} \longrightarrow \text{Replan}$$

Rather than relying on reactive dispatch adjustments after an SLA is violated, **YOLO × FluxQ** continuously projects external disruption telemetry (severe convective storms, highway bottlenecks, port dwell surges, flight cancellations, seismic activity) onto shipment transit corridors, anticipates delay probability hours in advance, explains risk attribution via TreeSHAP, and solves multi-objective recovery routing via Google OR-Tools with optional Qiskit QAOA quantum-hybrid benchmarking.

---

## 2. Four-Layer System Architecture

```
+-----------------------------------------------------------------------------------+
|                           LAYER 4: QUANTUM-HYBRID OPTIMIZATION                    |
|  - Qiskit 2.2 QAOA Simulator (Depth p=1)        - Reduced Carrier Allocation QUBO |
|  - Classical Feasibility Pre/Post Verification   - Quantum Contribution Ratio (QCR)|
+-----------------------------------------------------------------------------------+
                                          ▲
                                          │ Fallback & Validation
+-----------------------------------------------------------------------------------+
|                         LAYER 3: CLASSICAL TRIAGE & OPTIMIZATION                  |
|  - Google OR-Tools SCIP MIP Engine               - 4 Candidate Pareto Strategies  |
|  - Multi-Objective Cost/Delay/SLA Trade-off     - Hard Road Closure & Capacity Constr |
+-----------------------------------------------------------------------------------+
                                          ▲
                                          │ EWI Trigger (R >= 7 or p > 0.60)
+-----------------------------------------------------------------------------------+
|                           LAYER 2: AI / ML RISK PREDICTION                        |
|  - Calibrated LightGBM SLA Breach Classifier     - Random Forest Delay Regressor   |
|  - Standardized Integer Risk Score R = max(1, min(10, ceil(10p)))                 |
|  - TreeSHAP Local Feature Attribution            - Zero-Leakage Pipeline           |
+-----------------------------------------------------------------------------------+
                                          ▲
                                          │ Normalized Exposure Features
+-----------------------------------------------------------------------------------+
|                             LAYER 1: DATA INTELLIGENCE                            |
|  - External Telematics Ingestion (Weather, Traffic, Port, Airport, Hazards)       |
|  - Geographic Corridor Projection (Haversine Radius <= 2.5x impact envelope)     |
|  - Unified Schemas & Idempotent SQLite/PostgreSQL Database                        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Key Technical Specifications & Mathematical Formulations

### Standardized Integer Risk Score:
$$R = \max(1, \min(10, \lceil 10 \cdot p_{\text{calibrated}} \rceil))$$
Mapped into operational tiers:
- **Low Risk ($R \in [1, 3]$):** Nominal transit conditions; routine automated tracking.
- **Moderate Risk ($R \in [4, 6]$):** Elevated corridor congestion; proactive buffer monitoring.
- **High Risk ($R \in [7, 8]$):** Early Warning Indicator (EWI) active; automated candidate recovery generation.
- **Critical Risk ($R \in [9, 10]$):** Impending SLA violation; immediate operator sign-off required.

### TreeSHAP Feature Attribution:
Statistical feature attribution calculated locally via Shapley values:
$$\mathbb{E}[f(x)] + \sum_{j=1}^M \phi_j(x) = f(x)$$
*(Note: SHAP values represent statistical model attribution, not physical causal proof).*

### Google OR-Tools Multi-Objective Recovery Function:
$$\min_x J_{\text{system}} = \sum_{s \in S} \sum_{k \in O_s} x_{s, k} \left[ w_{\text{cost}} c_{s, k} + w_{\text{delay}} \max(0, t_{s, k} - B_s) + w_{\text{breach}} v_s \mathbb{I}(t_{s, k} > B_s) + w_{\text{churn}} \Delta_{s, k} \right]$$
Enforces hard unicast assignment, blocked lane avoidance, and carrier capacity bounds.

### Quantum Contribution Ratio (QCR):
$$\text{QCR} = \frac{J_{\text{classical}} - J_{\text{hybrid}}}{J_{\text{classical}}} \times 100\%$$

---

## 4. Repository Structure

```
yolo-fluxq/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (/health, /shipments, /events, /recovery, /audit)
│   │   ├── schemas/         # Pydantic v2 typed request/response contracts
│   │   ├── ingestion/       # Data fetchers for weather, traffic, ports, aviation, hazards
│   │   ├── data_engineering/# Normalizers and schema standardizers
│   │   ├── features/        # Haversine distance, temporal alignment & exposure calculators
│   │   ├── ml/              # Scikit-learn preprocessors, LightGBM, Random Forest, TreeSHAP
│   │   ├── optimization/    # Google OR-Tools MIP solver & Qiskit QAOA simulator
│   │   ├── orchestration/   # Master AI orchestrator & dynamic replanning engine
│   │   ├── config.py        # Central application settings
│   │   ├── database.py      # SQLAlchemy engine & session factory
│   │   ├── models_db.py     # Relational database models
│   │   └── main.py          # FastAPI application entrypoint & auto-seeder
│   ├── models/              # Serialized joblib pipelines & benchmark JSON reports
│   ├── scripts/             # Model training, evaluation, benchmark runners
│   └── tests/               # Unit and API test suites
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI controls, badges, SHAP drawers, modals
│   │   ├── views/           # 6 operational views (Control Tower, Shipments, Map, Recovery, Lab, Audit)
│   │   ├── services/        # Axios API client
│   │   ├── types/           # TypeScript domain interfaces
│   │   ├── App.tsx          # Root shell and navigation
│   │   └── index.css        # Tailwind CSS design system
│   └── package.json         # React 18, Vite, Lucide-React, Leaflet, Tailwind v4
├── data/                    # Raw, normalized, synthetic datasets & ingestion manifests
├── docs/
│   ├── gates/               # Formal Stage-Gate Reports (GATE_00 through GATE_15)
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── MODEL_CARD.md
│   ├── ML_EVALUATION_REPORT.md
│   ├── OPTIMIZATION_MODEL.md
│   ├── CLASSICAL_BENCHMARK_REPORT.md
│   ├── ORCHESTRATION_DESIGN.md
│   ├── END_TO_END_TEST_REPORT.md
│   ├── QUBO_FORMULATION.md
│   ├── QAOA_EXPERIMENT_REPORT.md
│   ├── INSTALLATION.md
│   ├── DEMO_GUIDE.md
│   ├── KNOWN_LIMITATIONS.md
│   └── FINAL_ACCEPTANCE_REPORT.md
├── tests/
│   └── end_to_end/          # 8 closed-loop multi-scenario integration tests
├── docker-compose.yml       # Production container orchestration
├── Dockerfile.backend       # FastAPI backend container
├── Dockerfile.frontend      # React Vite Nginx container
└── README.md
```

---

## 5. Quick Start & Demonstration

### Prerequisites:
- Python 3.12+
- Node.js v20+ & npm

### 1. Launch Backend API Server
```powershell
# In project root:
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation will be available at: http://localhost:8000/docs*

### 2. Launch Frontend Operations Dashboard
```powershell
cd frontend
npm install
npm run dev
```
*Control Tower Dashboard will open at: http://localhost:5173*

### 3. Run Automated Test Suites
```powershell
python -m pytest backend/tests/ tests/end_to_end/
```
*(All 15 tests execute and pass in under 9 seconds).*

---

## 6. Stage-Gate Execution Record

| Gate | Phase | Report Link | Status |
|---|---|---|---|
| **GATE 00** | Project Discovery | [`docs/gates/GATE_00_PROJECT_DISCOVERY.md`](docs/gates/GATE_00_PROJECT_DISCOVERY.md) | **PASS** |
| **GATE 01** | System Architecture | [`docs/gates/GATE_01_ARCHITECTURE.md`](docs/gates/GATE_01_ARCHITECTURE.md) | **PASS** |
| **GATE 02** | Skills & Environment | [`docs/gates/GATE_02_TOOLS_AND_SKILLS.md`](docs/gates/GATE_02_TOOLS_AND_SKILLS.md) | **PASS** |
| **GATE 03** | Data Source Research | [`docs/gates/GATE_03_DATA_SOURCE_RESEARCH.md`](docs/gates/GATE_03_DATA_SOURCE_RESEARCH.md) | **PASS** |
| **GATE 04** | Data Acquisition | [`docs/gates/GATE_04_DATA_ACQUISITION.md`](docs/gates/GATE_04_DATA_ACQUISITION.md) | **PASS** |
| **GATE 05** | Data Normalization | [`docs/gates/GATE_05_DATA_NORMALIZATION.md`](docs/gates/GATE_05_DATA_NORMALIZATION.md) | **PASS** |
| **GATE 06** | Feature Engineering | [`docs/gates/GATE_06_FEATURE_ENGINEERING.md`](docs/gates/GATE_06_FEATURE_ENGINEERING.md) | **PASS** |
| **GATE 07** | ML Model Training | [`docs/gates/GATE_07_ML_TRAINING.md`](docs/gates/GATE_07_ML_TRAINING.md) | **PASS** |
| **GATE 08** | ML Model Validation | [`docs/gates/GATE_08_ML_VALIDATION.md`](docs/gates/GATE_08_ML_VALIDATION.md) | **PASS** |
| **GATE 09** | Backend Development | [`docs/gates/GATE_09_BACKEND.md`](docs/gates/GATE_09_BACKEND.md) | **PASS** |
| **GATE 10** | Frontend Delivery Hub | [`docs/gates/GATE_10_FRONTEND.md`](docs/gates/GATE_10_FRONTEND.md) | **PASS** |
| **GATE 11** | Classical Optimization | [`docs/gates/GATE_11_CLASSICAL_OPTIMIZATION.md`](docs/gates/GATE_11_CLASSICAL_OPTIMIZATION.md) | **PASS** |
| **GATE 12** | AI Orchestration | [`docs/gates/GATE_12_AI_ORCHESTRATION.md`](docs/gates/GATE_12_AI_ORCHESTRATION.md) | **PASS** |
| **GATE 13** | End-to-End Integration | [`docs/gates/GATE_13_END_TO_END_INTEGRATION.md`](docs/gates/GATE_13_END_TO_END_INTEGRATION.md) | **PASS** |
| **GATE 14** | Quantum-Hybrid Experiment | [`docs/gates/GATE_14_QUANTUM_EXPERIMENT.md`](docs/gates/GATE_14_QUANTUM_EXPERIMENT.md) | **PASS** |
| **GATE 15** | Final Acceptance | [`docs/gates/GATE_15_FINAL_ACCEPTANCE.md`](docs/gates/GATE_15_FINAL_ACCEPTANCE.md) | **PASS** |

---

## 7. Governance, Safety & Integrity Disclaimers
1. **Scientific Honesty:** No physical quantum supremacy or hardware advantage is claimed. QAOA simulations are conducted on classical CPUs via Qiskit Aer/Statevector, with Google OR-Tools serving as the primary operational recovery engine.
2. **Explainability Ethics:** TreeSHAP values are presented as statistical model attributions, not causal claims.
3. **Operational Authority:** Consequential freight rerouting and carrier allocation require explicit human-in-the-loop sign-off.
