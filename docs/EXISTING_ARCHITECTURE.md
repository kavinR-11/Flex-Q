# YOLO × FluxQ: Existing Repository Architecture & Subsystem Specification

## 1. Architectural Overview & Boundaries

The **Flex-Q / YOLO × FluxQ** repository implements a 4-layer predictive intelligence and hybrid recovery optimization architecture designed for logistics and supply chain decision-support.

```
[Layer 1: Data Intelligence]
 ├── Raw Telematics Fetchers (Weather, Traffic, Port, Aviation, Hazards)
 ├── Ingestion Runners -> data/raw/
 ├── Normalizers -> data/normalized/
 └── Feature Exposure Calculator (Haversine corridor matching)
          │
          ▼ (Normalized Features)
[Layer 2: AI / ML Prediction]
 ├── Preprocessor Pipeline (OneHotEncoder + StandardScaler)
 ├── Calibrated LightGBM Classifier (SLA Breach Probability p)
 ├── Standardized Integer Risk Formula: R = max(1, min(10, ceil(10p)))
 ├── Random Forest Regressor (Predicted Delay & Dynamic ETA)
 └── TreeSHAP Explainer (Local Shapley feature attribution)
          │
          ▼ (Early Warning Indicator: R >= 7 or p > 0.60)
[Layer 3: Classical Triage & Optimization]
 ├── Google OR-Tools SCIP MIP Solver
 ├── 4 Pareto Recovery Strategies (Lowest Cost, Lowest Delay, Highest SLA, Balanced)
 ├── Hard Constraints: Strict Unicast, Blocked Lane Avoidance, Carrier Capacity
 └── Independent Feasibility Validator (Road closure & budget checks)
          │
          ▼ (Residual Slot Allocation Problem)
[Layer 4: Quantum-Hybrid Optimization Engine]
 ├── QUBO Matrix Builder & Ising Spin Hamiltonian Transformer
 ├── Qiskit 2.2 Parameterized QAOA Circuit (Depth p=1)
 ├── Statevector Simulation & Classical Candidate Feasibility Check
 └── Quantum Contribution Ratio (QCR %) & Classical Fallback Guarantee
          │
          ▼
[AI Orchestration & Governance Layer]
 ├── Deterministic Service Orchestrator (orchestrator.py)
 ├── Human-in-the-Loop Operator Sign-off (Approve / Reject)
 ├── Dynamic Replanning Trigger (Secondary corridor shock handling)
 └── Immutable Audit Trail (AuditLogDB)
          │
          ▼
[Frontend Logistics Control Tower]
 └── React 18 + TypeScript + Tailwind CSS + Leaflet (6 Operational Views)
```

---

## 2. Application Entrypoints

| Subsystem | Entrypoint File | Invocation Command | Port / Target |
|---|---|---|---|
| **Backend API** | [`backend/app/main.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/main.py) | `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000` | Port `8000` (`/docs`, `/health`) |
| **Frontend UI** | [`frontend/src/main.tsx`](file:///c:/Users/DELL/Downloads/ramyarec/frontend/src/main.tsx) | `npm run dev` (in `frontend/`) | Port `5173` |
| **Model Training**| [`backend/scripts/train_models.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/train_models.py) | `python -m backend.scripts.train_models` | Saves `backend/models/*.joblib` |
| **ML Evaluation**| [`backend/scripts/evaluate_models.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/evaluate_models.py) | `python -m backend.scripts.evaluate_models` | Evaluates held-out `test.csv` |
| **MIP Benchmark**| [`backend/app/optimization/benchmark.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/benchmark.py) | `python -m backend.app.optimization.benchmark` | Benchmarks $N \in \{10, 25, 50, 100\}$ |
| **QAOA Benchmark**| [`backend/scripts/run_qaoa_experiment.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/run_qaoa_experiment.py) | `python -m backend.scripts.run_qaoa_experiment` | Benchmarks 4, 6, 8 qubits |
| **Test Suite** | [`backend/tests/`](file:///c:/Users/DELL/Downloads/ramyarec/backend/tests/) & [`tests/`](file:///c:/Users/DELL/Downloads/ramyarec/tests/) | `python -m pytest backend/tests/ tests/end_to_end/` | 15 automated test cases |

---

## 3. Technology Stack & Component Inventory

- **Web Server:** FastAPI 0.135.1 with Uvicorn.
- **Relational Database:** SQLite 3 (`yolo_fluxq.db`) with SQLAlchemy 2.0 ORM (migration-compatible with PostgreSQL).
- **Machine Learning:** LightGBM 4.6.0, Scikit-learn 1.6.1, NumPy 2.2.6, Pandas 2.2.3.
- **Explainability:** SHAP 0.52.0 (`TreeExplainer`).
- **Classical Optimization:** Google OR-Tools 9.11.4210 (`pywraplp.Solver.CreateSolver('SCIP')`).
- **Quantum-Hybrid Simulation:** Qiskit 2.2.3 with `Statevector` backend.
- **Frontend Framework:** React 18.3.1, TypeScript 5.6.2, Vite 5.4.14, Tailwind CSS v4, Leaflet 1.9.4, Lucide-React 0.475.0.
