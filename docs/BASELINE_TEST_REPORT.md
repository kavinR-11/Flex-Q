# YOLO × FluxQ: Baseline Test Execution Report
**Repository:** `https://github.com/kavinR-11/Flex-Q`  
**Execution Timestamp:** 2026-10-03T11:57:45Z  
**Test Framework:** Pytest 9.1.1 on Python 3.12.10

---

## 1. Automated Test Suite Execution

### Command Executed:
```powershell
python -m pytest backend/tests/ tests/end_to_end/
```

### Complete Test Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\DELL\Downloads\ramyarec
plugins: anyio-4.15.1, hypothesis-6.168.3, cov-7.1.0
collected 15 items

backend\tests\test_api.py ....                                           [ 26%]
backend\tests\test_orchestrator.py ...                                   [ 46%]
tests\end_to_end\test_closed_loop.py ........                            [100%]

======================= 15 passed, 12 warnings in 8.06s =======================
```

---

## 2. Granular Test Suite Breakdown

### 2.1 Backend API Suite ([`backend/tests/test_api.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/tests/test_api.py))
- `test_health_endpoint`: Checks `/health` status and loaded service registry (`PASS`).
- `test_get_shipments`: Verifies shipment querying, filtering, and schema serialization (`PASS`).
- `test_risk_and_explanation`: Checks dynamic inference, $1-10$ integer risk score mapping, and TreeSHAP explainer output (`PASS`).
- `test_recovery_optimization_and_approval`: Verifies Google OR-Tools candidate generation and operator approval workflow (`PASS`).

### 2.2 AI Orchestrator Suite ([`backend/tests/test_orchestrator.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/tests/test_orchestrator.py))
- `test_orchestrator_sensing_and_triage`: Verifies corridor disruption projection, ML re-inference, and EWI triggering (`PASS`).
- `test_orchestrator_approval_workflow`: Verifies human sign-off, shipment state transition to `rerouted`, risk score reduction, and audit logging (`PASS`).
- `test_orchestrator_dynamic_replanning`: Verifies dynamic replanning trigger when secondary shocks invalidate an approved route (`PASS`).

### 2.3 Closed-Loop End-to-End Suite ([`tests/end_to_end/test_closed_loop.py`](file:///c:/Users/DELL/Downloads/ramyarec/tests/end_to_end/test_closed_loop.py))
- `test_scenario_01_routine_baseline_shipment`: Nominal transit without disruptions ($R \le 3$, on-time) (`PASS`).
- `test_scenario_02_severe_weather_and_ewi_trigger`: Vellore severe weather shock elevates risk $R \ge 7$ (`PASS`).
- `test_scenario_03_treeshap_explainability`: Statistical attribution factors extracted without data leakage (`PASS`).
- `test_scenario_04_classical_ortools_optimization`: SCIP MIP solver generates 4 feasible Pareto strategies (`PASS`).
- `test_scenario_05_quantum_hybrid_experiment`: Qiskit QAOA simulation, statevector sampling, and QCR calculation (`PASS`).
- `test_scenario_06_human_dispatcher_approval_and_audit`: Dispatcher approval persists route change and audit entry (`PASS`).
- `test_scenario_07_dynamic_replanning_on_secondary_disruption`: Secondary shock marks plan `SUPERSEDED` and re-optimizes (`PASS`).
- `test_scenario_08_rejection_and_manual_escalation`: Dispatcher rejection flags review and records justification (`PASS`).

---

## 3. Test Conclusion
15 out of 15 automated tests passed in 8.06 seconds with zero regressions. All critical capabilities function in the active environment.
