# YOLO × FluxQ: Complete Repository File & Asset Inventory
**Repository:** `https://github.com/kavinR-11/Flex-Q`  
**Tracking Branch:** `main` | **Commit Hash:** `07dbce6`  
**Audit Date:** 2026-10-03 | **Tracked Files Count:** 159 files

---

## 1. Inventory Summary by Functional Subsystem

| Subsystem / Directory | Tracked Files | Total Bytes | Primary Role |
|---|---|---|---|
| **Root Configuration & Deploy** | 8 | ~240 KB | Gitignore, Docker configs, environment template, specifications |
| **Backend Core (`backend/app/`)** | 27 | ~95 KB | FastAPI endpoints, Pydantic schemas, DB ORM, ingestion, normalizers |
| **ML Engine (`backend/app/ml/`, `models/`)** | 11 | ~1.4 MB | LightGBM/RF models, preprocessor, SHAP explainer, metrics |
| **Optimization (`backend/app/optimization/`)**| 5 | ~22 KB | Google OR-Tools SCIP MIP solver, Qiskit QAOA simulator, validators |
| **Orchestration (`backend/app/orchestration/`)**| 1 | ~19 KB | Closed-loop AI orchestrator, dynamic replanning & approval |
| **Backend Scripts & Tests** | 5 | ~28 KB | Model trainers, evaluators, QAOA benchmarks, Pytest test suites |
| **Data Assets (`data/`)** | 14 | ~1.8 MB | Raw telematics, normalized JSONs, synthetic shipments, training splits |
| **Frontend Application (`frontend/`)** | 23 | ~140 KB | React 18, TypeScript, Tailwind CSS, Leaflet views, API client |
| **Documentation (`docs/`, `docs/gates/`)** | 63 | ~320 KB | Architecture specs, model cards, API contracts, 16 stage-gate reports |
| **End-to-End Tests (`tests/`)** | 1 | ~13 KB | Multi-scenario closed-loop integration test suite (8 scenarios) |
| **Database (`yolo_fluxq.db`)** | 1 | ~843 KB | Seeded SQLite database (249 active shipments, events, carriers) |
| **Total Tracked Assets** | **159** | **~4.9 MB** | **Complete Integrated System** |

---

## 2. Granular File-by-File Catalog

### 2.1 Backend Core & API Layer (`backend/app/`)
- [`backend/app/main.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/main.py): FastAPI application root, CORS middleware, lifespan database auto-seeder, router registrations.
- [`backend/app/config.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/config.py): Application configuration, environment settings (`pydantic-settings`).
- [`backend/app/database.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/database.py): SQLAlchemy engine, declarative base, and session generator.
- [`backend/app/models_db.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/models_db.py): Relational database models (`ShipmentDB`, `DisruptionEventDB`, `RecoveryPlanDB`, `AuditLogDB`, `CarrierDB`).
- [`backend/app/api/health.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/api/health.py): Health check endpoint verifying database connectivity, ML models, classical solver, and quantum module.
- [`backend/app/api/shipments.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/api/shipments.py): Shipment query, risk scoring, dynamic ETA, and TreeSHAP explainability endpoints.
- [`backend/app/api/events.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/api/events.py): Disruption event ingestion, corridor spatial matching, and automatic batch risk recomputation.
- [`backend/app/api/recovery.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/api/recovery.py): Recovery optimization endpoints, candidate generation, dispatcher approval/rejection workflows.
- [`backend/app/api/audit.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/api/audit.py): Immutable decision audit trail queries.
- [`backend/app/schemas/shipment.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/schemas/shipment.py): Pydantic request/response schemas for shipments, risk outputs, and SHAP factors.
- [`backend/app/schemas/event.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/schemas/event.py): Pydantic schemas for disruption event creation and impact responses.
- [`backend/app/schemas/recovery.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/schemas/recovery.py): Pydantic schemas for multi-objective optimization requests, candidate options, and QAOA benchmarks.
- [`backend/app/schemas/audit.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/schemas/audit.py): Pydantic schemas for audit log entries.

### 2.2 Data Ingestion, Engineering & Features
- [`backend/app/ingestion/source_registry.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/source_registry.py): Catalog of external telematics sources (Open-Meteo, NHAI, IPA, DGCA, USGS, GDELT).
- [`backend/app/ingestion/weather_fetcher.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/weather_fetcher.py): Weather telemetry acquisition module.
- [`backend/app/ingestion/traffic_fetcher.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/traffic_fetcher.py): Traffic congestion and highway incident fetcher.
- [`backend/app/ingestion/port_fetcher.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/port_fetcher.py): Maritime port dwell time and throughput fetcher.
- [`backend/app/ingestion/aviation_fetcher.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/aviation_fetcher.py): Airport cargo performance and flight delay fetcher.
- [`backend/app/ingestion/hazard_fetcher.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/hazard_fetcher.py): Seismic and natural hazard fetcher.
- [`backend/app/ingestion/shipment_loader.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/shipment_loader.py): Synthetic baseline shipment loader and generator.
- [`backend/app/ingestion/acquisition_runner.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ingestion/acquisition_runner.py): Orchestrates raw data acquisition into `data/raw/`.
- [`backend/app/data_engineering/shipment_normalizer.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/data_engineering/shipment_normalizer.py): Standardizes shipment schemas, timestamps, and coordinates.
- [`backend/app/data_engineering/event_normalizer.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/data_engineering/event_normalizer.py): Standardizes external disruption event schemas.
- [`backend/app/data_engineering/normalization_runner.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/data_engineering/normalization_runner.py): Executes data normalization pipelines into `data/normalized/`.
- [`backend/app/features/exposure_calculator.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/features/exposure_calculator.py): Haversine distance, route corridor buffer matching, and multi-source exposure scoring.
- [`backend/app/features/spatial_temporal_join.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/features/spatial_temporal_join.py): Point-in-corridor and time-window intersection algorithms.
- [`backend/app/features/dataset_builder.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/features/dataset_builder.py): Leakage-free training split builder (`train.csv`, `val.csv`, `test.csv`).

### 2.3 Machine Learning & Explainability Layer
- [`backend/app/ml/preprocessor.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ml/preprocessor.py): Scikit-learn ColumnTransformer (StandardScaler, SimpleImputer, OneHotEncoder).
- [`backend/app/ml/inference.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ml/inference.py): Production `RiskPredictor` implementing model loading, feature alignment, prediction, integer score mapping, and TreeSHAP explainer.
- [`backend/scripts/train_models.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/train_models.py): Training pipeline for baselines and champion LightGBM + Random Forest models.
- [`backend/scripts/evaluate_models.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/evaluate_models.py): Standalone evaluation script generating ROC-AUC, PR-AUC, Brier score, and latency benchmarks.
- Model Artifacts in `backend/models/`:
  - `sla_classifier_calibrated.joblib`: Isotonically calibrated LightGBM classifier.
  - `eta_regressor.joblib`: Random Forest delay duration regressor.
  - `preprocessor.joblib`: Fitted Scikit-learn feature preprocessor.
  - `raw_best_tree_clf.joblib`: Uncalibrated base tree model for TreeSHAP.
  - `model_metrics.json`: Stored evaluation metrics.
  - `training_summary.json`: Training logs and hyperparameters.

### 2.4 Optimization & Quantum Modules
- [`backend/app/optimization/classical/solver.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/classical/solver.py): Google OR-Tools SCIP MIP multi-objective recovery optimizer.
- [`backend/app/optimization/validation.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/validation.py): Independent candidate solution feasibility validator.
- [`backend/app/optimization/benchmark.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/benchmark.py): Fleet scaling benchmark runner ($N=10, 25, 50, 100$).
- [`backend/app/optimization/quantum/qaoa_solver.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/quantum/qaoa_solver.py): Qiskit QAOA simulator, QUBO builder, Ising mapper, and QCR calculator.
- [`backend/scripts/run_qaoa_experiment.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/run_qaoa_experiment.py): QAOA benchmarking script across 4, 6, and 8-qubit problem instances.
- Benchmark JSONs:
  - `backend/models/classical_benchmark_results.json`: OR-Tools scaling runtimes and feasibility rates.
  - `backend/models/qaoa_experiment_results.json`: QAOA simulation vs. exact classical enumeration metrics.

### 2.5 Orchestration & Governance Layer
- [`backend/app/orchestration/orchestrator.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/orchestration/orchestrator.py): Master `YoloFluxQOrchestrator` coordinating Sense $\to$ Predict $\to$ Triage $\to$ Optimize $\to$ Approve $\to$ Replan.

### 2.6 Frontend Control Tower (`frontend/`)
- [`frontend/src/App.tsx`](file:///c:/Users/DELL/Downloads/ramyarec/frontend/src/App.tsx): Main shell layout and tab navigation.
- [`frontend/src/index.css`](file:///c:/Users/DELL/Downloads/ramyarec/frontend/src/index.css): Modern dark-mode Tailwind CSS design tokens.
- [`frontend/src/services/api.ts`](file:///c:/Users/DELL/Downloads/ramyarec/frontend/src/services/api.ts): Axios API client connected to backend endpoints.
- [`frontend/src/types/index.ts`](file:///c:/Users/DELL/Downloads/ramyarec/frontend/src/types/index.ts): TypeScript interfaces for shipments, events, recovery plans, and audit entries.
- UI Views:
  - `ControlTowerView.tsx`: Global KPI metrics, risk distribution chart, activity feed.
  - `ShipmentsView.tsx`: Filterable shipment catalog with slide-over TreeSHAP explainability drawer.
  - `RouteMapView.tsx`: Leaflet interactive map with corridor nodes and disruption markers.
  - `RecoveryCenterView.tsx`: Candidate recovery strategy cards, QAOA benchmark card, approval modal.
  - `DisruptionLabView.tsx`: Scenario injection controls for interactive simulation.
  - `AuditTrailView.tsx`: Chronological immutable decision audit log.

### 2.7 Automated Test Suites
- [`backend/tests/test_api.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/tests/test_api.py): FastAPI endpoints test suite (4 tests).
- [`backend/tests/test_orchestrator.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/tests/test_orchestrator.py): AI orchestrator test suite (3 tests).
- [`tests/end_to_end/test_closed_loop.py`](file:///c:/Users/DELL/Downloads/ramyarec/tests/end_to_end/test_closed_loop.py): Multi-scenario closed-loop integration suite (8 tests).

### 2.8 Documentation & Specifications (`docs/`)
- 16 Formal Stage-Gate Reports: [`docs/gates/GATE_00`](file:///c:/Users/DELL/Downloads/ramyarec/docs/gates/GATE_00_PROJECT_DISCOVERY.md) through [`docs/gates/GATE_15`](file:///c:/Users/DELL/Downloads/ramyarec/docs/gates/GATE_15_FINAL_ACCEPTANCE.md).
- Architectural & Engineering Specifications:
  - `SYSTEM_ARCHITECTURE.md`, `API_CONTRACTS.md`, `MODEL_INTERFACE_CONTRACTS.md`, `DATABASE_SCHEMA.md`, `EVENT_SCHEMA.md`, `SECURITY_AND_PRIVACY.md`, `DATA_SOURCE_REGISTER.md`, `DATA_DICTIONARY.md`, `FEATURE_ENGINEERING.md`, `MODEL_CARD.md`, `ML_EVALUATION_REPORT.md`, `OPTIMIZATION_MODEL.md`, `CLASSICAL_BENCHMARK_REPORT.md`, `ORCHESTRATION_DESIGN.md`, `END_TO_END_TEST_REPORT.md`, `QUBO_FORMULATION.md`, `QAOA_EXPERIMENT_REPORT.md`, `INSTALLATION.md`, `DEMO_GUIDE.md`, `KNOWN_LIMITATIONS.md`, `FINAL_ACCEPTANCE_REPORT.md`.
