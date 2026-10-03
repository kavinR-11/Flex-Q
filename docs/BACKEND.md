# Backend Documentation: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Framework:** FastAPI 0.142.2 on Python 3.12.10  
**Data Layer:** SQLite / PostgreSQL with SQLAlchemy ORM  
**API Specification:** OpenAPI 3.1 (`/docs` and `/redoc`)

---

## 1. Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── health.py        # /health endpoint & service checks
│   │   ├── shipments.py     # /shipments, /risk, /eta, /explanation
│   │   ├── events.py        # /events, /risk/recompute
│   │   ├── recovery.py      # /recovery/optimize, /approve, /reject, /benchmark
│   │   └── audit.py         # /audit, /audit/{shipment_id}
│   ├── data_engineering/    # Event & shipment normalizers
│   ├── features/            # Spatial-temporal joins & exposure calculator
│   ├── ingestion/           # Data fetchers & acquisition runner
│   ├── ml/                  # Preprocessor & RiskPredictor inference
│   ├── optimization/
│   │   ├── classical/       # Google OR-Tools MIP solver
│   │   └── quantum/         # Qiskit QAOA statevector simulator
│   ├── schemas/             # Pydantic v2 typed request/response contracts
│   ├── config.py            # Global settings & CORS configuration
│   ├── database.py          # SQLAlchemy session maker & engine
│   ├── main.py              # Application entrypoint & database seeder
│   └── models_db.py         # Relational database models
├── models/                  # Serialized Joblib pipelines & training summaries
├── scripts/                 # train_models.py, evaluate_models.py
└── tests/                   # Automated pytest suites
```

---

## 2. Core Service Endpoints

### 2.1 Health & Verification
- `GET /api/v1/health`: Checks database connection, ML classifier/regressor availability, and solver states.

### 2.2 Shipment Intelligence & Explainability
- `GET /api/v1/shipments`: Search, filter, and paginate tracked shipments.
- `GET /api/v1/shipments/{id}`: Detailed shipment state.
- `POST /api/v1/shipments`: Register consignment and trigger automatic baseline risk scoring.
- `GET /api/v1/shipments/{id}/risk`: Real-time calibrated SLA breach probability and integer 1–10 score.
- `GET /api/v1/shipments/{id}/eta`: Dynamic ETA and expected delay minutes.
- `GET /api/v1/shipments/{id}/explanation`: Top local risk drivers computed via TreeSHAP.

### 2.3 Disruption Lab & Dynamic Replanning
- `GET /api/v1/events`: List active and simulated disruption alerts.
- `POST /api/v1/events`: Ingest a disruption event (weather, traffic, port, hazard) and trigger spatial-temporal exposure matching to recompute risks of all impacted shipments.
- `POST /api/v1/risk/recompute`: Fleet-wide risk refresh.

### 2.4 Classical & Quantum-Hybrid Recovery
- `POST /api/v1/recovery/optimize`: Runs Google OR-Tools MIP optimization across 4 candidate strategies (`MAINTAIN_ROUTE`, `ALTERNATE_ROUTE`, `CARRIER_SWITCH`, `EXPEDITE`), and runs optional QAOA simulation.
- `POST /api/v1/recovery/{id}/approve`: Operator authorizes recommendation, updates shipment state to `rerouted`, and writes immutable audit record.
- `POST /api/v1/recovery/{id}/reject`: Operator rejects recommendation, escalating consignment to manual oversight.
- `GET /api/v1/optimization/benchmark`: Returns comparative benchmarks between OR-Tools and QAOA.

### 2.5 Audit Trail
- `GET /api/v1/audit/{shipment_id}`: Full chronological audit trail of risk transitions, disruption events, and operator decisions.
- `GET /api/v1/audit`: System-wide audit log.
