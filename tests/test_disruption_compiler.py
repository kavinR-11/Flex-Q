import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models_db import ShipmentDB, AuditLogDB

client = TestClient(app)

def test_pillar_1_product_priority_compilation():
    # Ensure baseline state before running
    client.post("/api/v1/compiler/reset", json={})

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

    # Check distinct priority-driven weights: spiked gamma for target, different gammas for others
    weights = data["weights"]
    assert weights["0"]["gamma"] == 2500.0 # Spiked 50x from 50.0

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
    assert data["grounded_hub_name"] is not None
    assert data["capacities"]["ACT-AIR-EXPEDITE"] == 0.0
    assert data["impacted_count"] > 0
    assert len(data["impacted_consignments"]) > 0
    
    # Grounded shipments must have recovery status and suggested plan
    first_grounded = data["impacted_consignments"][0]
    assert first_grounded["recovery_status"] == "READY_FOR_REROUTE"
    assert "Grounded" in first_grounded["failure_reason"]

def test_pillar_3_regional_disaster_compilation():
    response = client.post("/api/v1/compiler/compile", json={
        "event_type": "REGIONAL_DISASTER",
        "target_id": "CORR-NH48-W",
        "severity": 1.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["pillar_applied"] == "PILLAR_3_REGION_WINS"
    assert data["infinity_delay_warning"] is True
    assert data["impacted_count"] > 0
    # Delay array should have 10^6
    assert any(any(val >= 900000 for val in row) for row in data["D"])

    # Trapped shipments must be identified
    first_trapped = data["impacted_consignments"][0]
    assert first_trapped["predicted_delay_minutes"] >= 900000
    assert first_trapped["risk_score"] == 10

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

def test_compiler_rerouted_state_sync():
    # 1. Compile disruption for SH-2048
    compile_res = client.post("/api/v1/compiler/compile", json={
        "event_type": "PRODUCT_PRIORITY",
        "target_id": "SH-2048",
        "severity": 1.0
    })
    assert compile_res.status_code == 200

    # 2. Optimize recovery for SH-2048
    opt_res = client.post("/api/v1/recovery/optimize", json={
        "shipment_ids": ["SH-2048"],
        "max_budget_inr": 50000.0,
        "circuit_depth_p": 1
    })
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert len(opt_data["plans"]) > 0
    rec_plan = opt_data["plans"][0]
    rec_id = rec_plan["recovery_id"]

    # 3. Dispatcher approves recovery plan
    app_res = client.post(f"/api/v1/recovery/{rec_id}/approve", json={
        "plan_id": rec_plan["plan_id"],
        "operator_id": "DISPATCHER-TEST",
        "notes": "Testing compiler state synchronization"
    })
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"

    # 4. Check that live shipment has status 'rerouted'
    sh_res = client.get("/api/v1/shipments/SH-2048")
    assert sh_res.status_code == 200
    assert sh_res.json()["current_status"] == "rerouted"

    # 5. Check that compiler state reflects the rerouted status immediately
    state_res = client.get("/api/v1/compiler/state")
    assert state_res.status_code == 200
    compiler_state = state_res.json()
    
    # Find SH-2048 in impacted_consignments
    matching = [c for c in compiler_state["impacted_consignments"] if c["shipment_id"] == "SH-2048"]
    assert len(matching) > 0
    assert matching[0]["current_status"] == "rerouted"
    assert matching[0]["recovery_status"] == "REROUTED_COMPLETED"

    # Reset compiler and shipment to baseline
    client.post("/api/v1/compiler/reset", json={})


