"""
Automated Test Suite for YOLO x FluxQ Backend
Tests health, shipments, risk explanation, event simulation, OR-Tools optimization, and audit logging.
"""

from fastapi.testclient import TestClient
import pytest
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["services"]["database"] == "connected"
    assert "loaded" in data["services"]["ml_models"]["sla_classifier"]

def test_shipment_endpoints(client):
    # List shipments
    res = client.get("/api/v1/shipments?limit=10")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    assert "shipment_id" in items[0]

    # Get reference shipment SH-2048
    res_sh = client.get("/api/v1/shipments/SH-2048")
    assert res_sh.status_code == 200
    sh_data = res_sh.json()
    assert sh_data["shipment_id"] == "SH-2048"
    assert sh_data["origin"] == "Chennai"
    assert sh_data["destination"] == "Bengaluru"
    assert 1 <= sh_data["risk_score"] <= 10

def test_risk_and_explanation(client):
    res_risk = client.get("/api/v1/shipments/SH-2048/risk")
    assert res_risk.status_code == 200
    risk_data = res_risk.json()
    assert 0.0 <= risk_data["sla_breach_probability"] <= 1.0

    res_exp = client.get("/api/v1/shipments/SH-2048/explanation")
    assert res_exp.status_code == 200
    exp_data = res_exp.json()
    assert "top_risk_drivers" in exp_data
    assert len(exp_data["top_risk_drivers"]) > 0
    assert "disclaimer" in exp_data

def test_recovery_optimization_and_approval(client):
    # Optimize recovery
    opt_payload = {
        "shipment_ids": ["SH-2048"],
        "weights": {"cost_weight": 0.3, "delay_weight": 0.4, "sla_penalty_weight": 0.3, "emissions_weight": 0.0},
        "max_budget_inr": 15000.0,
        "enable_quantum_experiment": True,
    }
    res_opt = client.post("/api/v1/recovery/optimize", json=opt_payload)
    assert res_opt.status_code == 200
    opt_data = res_opt.json()
    assert opt_data["solver_status"] in ("OPTIMAL", "FEASIBLE")
    assert len(opt_data["plans"]) == 4

    # Test approval
    rec_id = opt_data["plans"][1]["recovery_id"]
    app_res = client.post(f"/api/v1/recovery/{rec_id}/approve", json={"plan_id": "PLAN-B", "operator_id": "OP-TEST-01"})
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["status"] == "APPROVED"

    # Verify audit trail
    res_audit = client.get("/api/v1/audit/SH-2048")
    assert res_audit.status_code == 200
    logs = res_audit.json()
    assert len(logs) >= 2
