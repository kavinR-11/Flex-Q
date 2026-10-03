# YOLO × FluxQ: Dependency Inventory & Security Audit Report
**Repository:** `https://github.com/kavinR-11/Flex-Q`  
**Audit Date:** 2026-10-03 | **Security Classification:** Internal Engineering Audit

---

## 1. Dependency Inventory & Version Pinning

### 1.1 Python Backend Dependencies ([`backend/requirements.txt`](file:///c:/Users/DELL/Downloads/ramyarec/backend/requirements.txt))

| Package | Installed Version | Role & Subsystem | Security Status |
|---|---|---|---|
| **fastapi** | `0.135.1` | REST API framework & request routing | Verified, actively maintained |
| **uvicorn** | `0.41.0` | ASGI high-performance web server | Verified |
| **pydantic** | `2.13.1` | Data validation & schema serialization | Verified |
| **pydantic-settings**| `2.13.1` | Environment settings management | Verified |
| **sqlalchemy** | `2.0.48` | Relational ORM & connection pooling | Verified |
| **scikit-learn**| `1.6.1` | Preprocessing, Random Forest regressor | Verified |
| **lightgbm** | `4.6.0` | Calibrated gradient-boosted decision trees | Verified |
| **shap** | `0.52.0` | TreeSHAP local feature attribution | Verified |
| **ortools** | `9.11.4210` | SCIP Mixed-Integer Programming solver | Verified (Google official) |
| **qiskit** | `2.2.3` | Quantum circuits & Statevector simulator | Verified (IBM / Qiskit Community) |
| **pandas** | `2.2.3` | Tabular data manipulation | Verified |
| **numpy** | `2.2.6` | Numerical linear algebra & matrices | Verified |
| **joblib** | `1.5.3` | Safe model pipeline serialization | Verified |
| **pytest** | `9.1.1` | Test runner & test framework | Verified |

### 1.2 Frontend JavaScript / TypeScript Dependencies ([`frontend/package.json`](file:///c:/Users/DELL/Downloads/ramyarec/frontend/package.json))

| Package | Installed Version | Role | Security Status |
|---|---|---|---|
| **react** | `^18.3.1` | UI Component library | Verified |
| **react-dom** | `^18.3.1` | DOM renderer | Verified |
| **typescript** | `~5.6.2` | Static type checking | Verified |
| **vite** | `^5.4.14` | Frontend build tool & dev server | Verified |
| **tailwindcss** | `^4.0.0` | Utility-first CSS design tokens | Verified |
| **leaflet** | `^1.9.4` | Interactive geospatial mapping | Verified |
| **lucide-react** | `^0.475.0` | Modern UI icon library | Verified |
| **axios** | `^1.7.9` | Typed HTTP client | Verified |

---

## 2. Security & Credentials Hygiene Audit

1. **Zero Committed Secrets:**
   A full repository regex scan confirmed that **zero API keys, private passwords, tokens, or cloud secrets** are committed to version control.
   All sensitive values are configured via environment variables with defaults template provided in [`.env.example`](file:///c:/Users/DELL/Downloads/ramyarec/.env.example).

2. **Input Sanitization & Request Validation:**
   All incoming REST payloads are strictly validated against Pydantic v2 schemas (`ShipmentCreate`, `EventCreate`, `ApprovalRequest`, `RecoveryOptimizationRequest`). Malformed inputs, negative weights, and type mismatches are rejected at the API boundary with HTTP 422 Unprocessable Entity.

3. **Safe Model Deserialization:**
   Model artifacts are serialized via standard `joblib` into local internal paths (`backend/models/*.joblib`) within the application boundary. No untrusted remote pickles or external network deserialization is permitted.

4. **CORS & Network Boundaries:**
   CORS middleware in [`backend/app/main.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/main.py) restricts allowed origins to explicit development and staging domains (`http://localhost:5173`, `http://127.0.0.1:5173`), preventing unauthorized cross-origin browser requests.

5. **Immutable Audit Trail Protection:**
   The `audit_logs` table records state snapshots with timestamps and operator IDs, preventing unauthorized alteration of previous recovery actions.
