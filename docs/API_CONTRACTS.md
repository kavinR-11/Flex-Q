# API Contracts: YOLO × FluxQ

**Protocol:** REST over HTTP/1.1  
**Content-Type:** `application/json`  
**Base URL:** `/api/v1`

---

## 1. Health & System Status

### `GET /health`
- **Description:** Returns backend health, database connectivity, and loaded ML model statuses.
- **Response 200 OK:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-03T10:45:00Z",
  "services": {
    "database": "connected",
    "ml_models": {
      "sla_classifier": "loaded (lightgbm_v1)",
      "eta_regressor": "loaded (gbr_v1)"
    },
    "classical_solver": "ready (google_or_tools)",
    "quantum_module": "available (qiskit_simulator)"
  }
}
```

---

## 2. Shipment Management Endpoints

### `GET /shipments`
- **Query Parameters:**
  - `status` (optional string): Filter by status (`in_transit`, `delayed`, `delivered`, `critical`).
  - `min_risk` (optional integer): Minimum risk score (1-10).
  - `origin` (optional string): Origin filter.
  - `destination` (optional string): Destination filter.
- **Response 200 OK:**
```json
[
  {
    "shipment_id": "SH-2048",
    "order_id": "ORD-9912",
    "origin": "Chennai",
    "destination": "Bengaluru",
    "carrier_id": "CARRIER-A",
    "transport_mode": "ROAD",
    "status": "in_transit",
    "cargo_priority": 1,
    "promised_delivery": "2026-10-03T18:00:00Z",
    "current_eta": "2026-10-03T20:15:00Z",
    "sla_buffer_minutes": -135,
    "risk_score": 9,
    "sla_breach_probability": 0.82,
    "risk_category": "Critical",
    "latest_event_summary": "Severe congestion on NH48 corridor"
  }
]
```

### `GET /shipments/{shipment_id}`
- **Response 200 OK:** Complete shipment profile with geographic route geometry, historical telemetry, and current active recovery recommendation.

### `POST /shipments`
- **Description:** Registers a new shipment into the system.
- **Request Body:**
```json
{
  "shipment_id": "SH-3001",
  "order_id": "ORD-8821",
  "origin": "Mumbai",
  "destination": "Delhi",
  "origin_lat": 19.0760,
  "origin_lon": 72.8777,
  "destination_lat": 28.7041,
  "destination_lon": 77.1025,
  "carrier_id": "CARRIER-B",
  "transport_mode": "ROAD",
  "planned_departure": "2026-10-03T06:00:00Z",
  "promised_delivery": "2026-10-04T12:00:00Z",
  "cargo_type": "Electronics",
  "cargo_priority": 2,
  "cargo_value": 450000.0
}
```

---

## 3. Predictive Intelligence & Explainability

### `GET /shipments/{shipment_id}/risk`
- **Response 200 OK:**
```json
{
  "shipment_id": "SH-2048",
  "sla_breach_probability": 0.824,
  "risk_score": 9,
  "risk_category": "Critical",
  "delay_probability": 0.915,
  "model_version": "lightgbm_sla_v1.0",
  "prediction_timestamp": "2026-10-03T13:02:15Z",
  "flagged_for_review": true
}
```

### `GET /shipments/{shipment_id}/eta`
- **Response 200 OK:**
```json
{
  "shipment_id": "SH-2048",
  "promised_delivery": "2026-10-03T18:00:00Z",
  "predicted_eta": "2026-10-03T20:15:00Z",
  "expected_delay_minutes": 135,
  "remaining_distance_km": 142.5,
  "remaining_time_minutes": 255
}
```

### `GET /shipments/{shipment_id}/explanation`
- **Response 200 OK:**
```json
{
  "shipment_id": "SH-2048",
  "risk_score": 9,
  "base_value": 0.18,
  "contributing_factors": [
    {
      "feature": "traffic_delay_minutes",
      "value": 110.0,
      "shap_impact": "+0.38",
      "direction": "INCREASING_RISK",
      "narrative": "Severe congestion on NH48 adds ~110 mins of delay."
    },
    {
      "feature": "sla_buffer_minutes",
      "value": -135.0,
      "shap_impact": "+0.22",
      "direction": "INCREASING_RISK",
      "narrative": "Committed SLA buffer has been eliminated."
    },
    {
      "feature": "carrier_historical_reliability",
      "value": 0.94,
      "shap_impact": "-0.08",
      "direction": "REDUCING_RISK",
      "narrative": "Carrier A historical reliability offsets lane volatility."
    }
  ],
  "disclaimer": "SHAP attributions indicate model feature contributions, not proven real-world physical causality."
}
```

---

## 4. Disruption Ingestion & Recomputation

### `POST /events`
- **Description:** Submits a new disruption event (weather, traffic, port, hazard) and triggers spatial-temporal route matching.
- **Request Body:**
```json
{
  "event_type": "TRAFFIC_CONGESTION",
  "severity": 8.5,
  "location_name": "NH48 Sriperumbudur Corridor",
  "latitude": 12.9675,
  "longitude": 79.9431,
  "impact_radius_km": 35.0,
  "affected_mode": "ROAD",
  "estimated_delay_minutes": 120,
  "start_time": "2026-10-03T13:00:00Z",
  "expected_end": "2026-10-03T17:00:00Z",
  "source": "SIMULATED_DISRUPTION_LAB"
}
```
- **Response 201 Created:**
```json
{
  "event_id": "EVT-8841",
  "affected_shipments_count": 4,
  "affected_shipment_ids": ["SH-2048", "SH-2051", "SH-2099", "SH-2104"],
  "recomputed_status": "recalculation_triggered"
}
```

### `POST /risk/recompute`
- **Description:** Triggers immediate re-evaluation of route exposure, risk scores, and ETAs for all affected shipments.

---

## 5. Recovery Optimization & Approval

### `POST /recovery/optimize`
- **Description:** Triggers Google OR-Tools combinatorial optimization across disrupted shipments.
- **Request Body:**
```json
{
  "shipment_ids": ["SH-2048"],
  "weights": {
    "cost_weight": 0.3,
    "delay_weight": 0.4,
    "sla_penalty_weight": 0.3,
    "emissions_weight": 0.0
  },
  "max_budget_inr": 10000.0,
  "enable_quantum_experiment": true
}
```
- **Response 200 OK:**
```json
{
  "recovery_id": "REC-7701",
  "solver_status": "OPTIMAL",
  "runtime_ms": 42.5,
  "objective_value": 1420.0,
  "plans": [
    {
      "plan_id": "PLAN-A",
      "strategy_name": "Lowest Cost",
      "action": "MAINTAIN_ROUTE",
      "predicted_eta": "2026-10-03T20:15:00Z",
      "additional_cost_inr": 0.0,
      "expected_delay_minutes": 135,
      "sla_status": "BREACH_LIKELY",
      "feasible": true
    },
    {
      "plan_id": "PLAN-B",
      "strategy_name": "Lowest Delay / Alternate Route",
      "action": "ALTERNATE_ROUTE",
      "route_details": "Via NH717 Bypass Corridor",
      "predicted_eta": "2026-10-03T17:50:00Z",
      "additional_cost_inr": 1200.0,
      "expected_delay_minutes": 0,
      "sla_status": "WITHIN_COMMITMENT",
      "feasible": true
    },
    {
      "plan_id": "PLAN-C",
      "strategy_name": "Expedite Express",
      "action": "EXPEDITE",
      "carrier": "Carrier B Air Logistics",
      "predicted_eta": "2026-10-03T17:30:00Z",
      "additional_cost_inr": 2500.0,
      "expected_delay_minutes": 0,
      "sla_status": "WITHIN_COMMITMENT",
      "feasible": true
    }
  ],
  "recommended_plan_id": "PLAN-B",
  "quantum_benchmark": {
    "executed": true,
    "quantum_contribution_ratio_pct": 0.0,
    "classical_objective": 1420.0,
    "quantum_objective": 1420.0,
    "quantum_runtime_ms": 310.2,
    "feasible": true,
    "backend": "qiskit_aer_statevector_simulator"
  }
}
```

### `POST /recovery/{recovery_id}/approve`
- **Description:** Human operator approves the proposed mitigation plan.
- **Request Body:**
```json
{
  "plan_id": "PLAN-B",
  "operator_id": "OP-CHENG-44",
  "notes": "Approved alternate route B via NH717 to avoid bottleneck."
}
```
- **Response 200 OK:**
```json
{
  "recovery_id": "REC-7701",
  "status": "APPROVED",
  "applied_plan_id": "PLAN-B",
  "audit_id": "AUD-99042",
  "message": "Mitigation successfully authorized and recorded."
}
```

### `POST /recovery/{recovery_id}/reject`
- **Description:** Operator rejects the proposed mitigation, escalating to manual oversight.

---

## 6. Decision Audit History

### `GET /audit/{shipment_id}`
- **Response 200 OK:** Complete chronological audit log of all risk state transitions, disruption events, optimization recommendations, operator decisions, and dynamic replanning invocations for the shipment.
