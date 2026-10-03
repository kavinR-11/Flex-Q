import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models_db import ShipmentDB, AuditLogDB

client = TestClient(app)

def test_pillar_1_product_priority_compilation():
    # Compile Pillar 1 for SH-2048
    response = client.post("/api/v1/compiler/compile", json={
        "event_type": "PRODUCT_PRIORITY",
        "target_id": "SH-2048",
        "severity": 1.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["pillar_applied"] == "PILLAR_1_PRODUCT_WINS"
    assert data["target_id"] == "SH-2048"
    assert data["triage_breakdown"]["frozen_pct"] == 86.7
    assert data["triage_breakdown"]["contested_pct"] == 13.3

    # Verify that the shipment in database was updated in real time
    sh_res = client.get("/api/v1/shipments/SH-2048")
    assert sh_res.status_code == 200
    sh = sh_res.json()
    assert sh["cargo_priority"] == 1
    assert "Medical" in sh["cargo_type"]
    assert sh["risk_score"] == 9
    assert sh["current_status"] == "critical"

    # Verify audit log was recorded
    audit_res = client.get("/api/v1/audit/SH-2048")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    assert any(log["event_type"] == "PRIORITY_OVERRIDE_PILLAR_1" for log in logs)

def test_pillar_2_transportation_failure_compilation():
    response = client.post("/api/v1/compiler/compile", json={
        "event_type": "TRANSPORT_FAILURE",
        "target_id": "Airport_Hub_BLR",
        "severity": 1.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["pillar_applied"] == "PILLAR_2_TRANSPORTATION_WINS"
    assert any("Airport_Hub_BLR" in d.get("action_id", "") or "AIR" in d.get("action_id", "") for d in data["affected_details"])

def test_pillar_3_regional_disaster_compilation():
    response = client.post("/api/v1/compiler/compile", json={
        "event_type": "REGIONAL_DISASTER",
        "target_id": "NH48_Khandala",
        "severity": 1.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["pillar_applied"] == "PILLAR_3_REGION_WINS"
    # Delay array should have 10^6
    assert any(any(val >= 900000 for val in row) for row in data["D"])

def test_shipment_priority_patch_endpoint():
    res = client.patch("/api/v1/shipments/SH-2048/priority", json={
        "cargo_priority": 1,
        "cargo_type": "Life-Saving Medical (Insulin/Cold-Chain)",
        "reason": "Test unit triage priority shift"
    })
    assert res.status_code == 200
    sh = res.json()
    assert sh["cargo_priority"] == 1
    assert sh["risk_score"] >= 9

def test_compiler_reset():
    res = client.post("/api/v1/compiler/reset", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "reset"
