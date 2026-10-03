# YOLO × FluxQ: Baseline Run Verification Report
**Repository:** `https://github.com/kavinR-11/Flex-Q`  
**Execution Timestamp:** 2026-10-03T11:57:09Z  
**Environment:** Windows 10/11, Python 3.12.10, Node v24.19.0, Uvicorn, Vite v8.3.2

---

## 1. Backend Service Baseline Verification

### Startup Command:
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### Health Check Endpoint Verification:
- **URL:** `http://127.0.0.1:8000/health` (and `http://127.0.0.1:8000/api/v1/health`)
- **HTTP Status Code:** `200 OK`
- **Response Payload:**
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-10-03T11:57:09.007571+00:00",
    "services": {
      "database": "connected",
      "ml_models": {
        "sla_classifier": "loaded (lightgbm_calibrated_v1)",
        "eta_regressor": "loaded (random_forest_reg_v1)"
      },
      "classical_solver": "ready (google_or_tools_scip_mip)",
      "quantum_module": "available (qiskit_statevector_simulator)"
    }
  }
  ```

### Database Seeding Status:
- Database: `yolo_fluxq.db` (SQLite 3).
- Seeded Records: 249 active shipments, 79 normalized disruption events, 4 contracted carriers, initial audit log for baseline consignment `SH-2048`.

---

## 2. Frontend Development Server Baseline Verification

### Startup Command:
```powershell
npm run dev (in frontend/)
```

### Server Endpoint Verification:
- **Local URL:** `http://localhost:5173/`
- **HTTP Status Code:** `200 OK`
- **HTML Payload Size:** 615 bytes
- **Bundler:** Vite v8.3.2 (ready in 817 ms)
- **Production Build Status:** Verified (`dist/` generated in 725 ms via `npm run build`).

---

## 3. Baseline Run Conclusion
Both backend API services and frontend web applications start cleanly, bind to expected ports, pass health checks, and communicate without fatal runtime errors.
