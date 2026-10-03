# Dependency Inventory: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Inventory Date:** October 3, 2026  
**Environment:** Windows 11 AMD64, Python 3.12.10, Node.js v24.19.0

---

## 1. Backend Python Dependencies (Pinned)

| Package | Version | Purpose / Role |
|---|---|---|
| `fastapi` | 0.142.2 | High-performance asynchronous REST API framework |
| `uvicorn` | 0.54.0 | ASGI web server for FastAPI |
| `pydantic` | 2.13.5 | Strict data validation and settings management |
| `scikit-learn` | 1.9.1 | Baseline ML models, metrics, calibration, preprocessing |
| `lightgbm` | 4.7.0 | Candidate gradient-boosted decision trees for SLA breach classification |
| `shap` | 0.52.0 | TreeSHAP local and global feature attribution explainability |
| `ortools` | 9.15.6755 | Google OR-Tools MIP solver for classical combinatorial recovery |
| `qiskit` | 2.5.2 | Quantum computing SDK for QUBO formulation and QAOA algorithms |
| `qiskit-aer` | 0.17.2 | High-performance quantum circuit and statevector simulator |
| `pandas` | 3.0.6 | Data engineering, ETL, feature alignment |
| `numpy` | 2.5.3 | High-performance numerical and tensor operations |
| `scipy` | 1.18.1 | Scientific and statistical computation |
| `sqlalchemy` | 2.1.3 | SQL database ORM and relational models |
| `pytest` | 9.1.1 | Unit, integration, and regression test runner |
| `httpx` | 0.28.1 | Asynchronous HTTP client for API and integration testing |
| `joblib` | 1.6.0 | Pipeline and model artifact serialization |

---

## 2. Frontend Node.js Dependencies (Target)

| Package | Version Range | Purpose / Role |
|---|---|---|
| `react` | ^18.3.1 | Core UI view rendering library |
| `react-dom` | ^18.3.1 | DOM renderer for React |
| `typescript` | ^5.6.0 | Strict type checking and interfaces |
| `vite` | ^5.4.0 | Next-generation frontend build tooling and dev server |
| `tailwindcss` | ^3.4.10 | Utility-first CSS framework for modern dark-mode control room |
| `lucide-react` | ^0.450.0 | High-clarity enterprise icons for logistics metrics |
| `recharts` | ^2.13.0 | Declarative charts for risk curves, delay trends, and Pareto trade-offs |
| `leaflet` | ^1.9.4 | Interactive geospatial mapping engine |
| `react-leaflet` | ^4.2.1 | React bindings for Leaflet maps |
| `axios` | ^1.7.7 | REST API HTTP client |

---

## 3. Environment & Tooling Verification
- All dependencies verified compatible with Python 3.12 64-bit on Windows.
- No binary conflicts between NumPy 2.x, LightGBM, and Google OR-Tools.
