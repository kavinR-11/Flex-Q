"""
Automated Integration and Unit Tests for YOLO × FluxQ AI Orchestration Layer
"""

from datetime import datetime, timezone
import pytest
from backend.app.database import SessionLocal
from backend.app.models_db import ShipmentDB, DisruptionEventDB, RecoveryPlanDB, AuditLogDB
from backend.app.orchestration.orchestrator import orchestrator


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_orchestrator_sensing_and_triage(db):
    """
    Tests disruption sensing, corridor exposure matching, ML re-inference,
    EWI triggering, and automated candidate recovery generation.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    test_event = {
        "event_id": f"TEST-EVT-ORCH-{int(datetime.now().timestamp())}",
        "event_type": "SEVERE_WEATHER",
        "severity": 4.5,
        "location_name": "Vellore Corridor Hub",
        "latitude": 12.9165,
        "longitude": 79.1325,
        "impact_radius_km": 60.0,
        "affected_mode": "ROAD",
        "estimated_delay_minutes": 150,
        "start_time": now_iso,
        "expected_end": now_iso,
        "source": "UNIT_TEST_DISRUPTION",
        "is_simulated": True,
    }

    res = orchestrator.process_disruption_event(test_event, db)
    assert res["orchestration_status"] == "COMPLETED"
    assert res["impacted_shipments_count"] > 0
    assert "automated_recovery_plans_generated" in res


def test_orchestrator_approval_workflow(db):
    """
    Tests human dispatcher approval of a candidate recovery plan:
    Verifies state transitions to 'rerouted', risk reduction, and audit logging.
    """
    # Find any pending recovery plan in the database
    pending_plan = db.query(RecoveryPlanDB).filter(RecoveryPlanDB.approval_status == "PENDING").first()
    if not pending_plan:
        # Generate one
        sh = db.query(ShipmentDB).first()
        assert sh is not None
        rec = orchestrator.optimize_shipment_recovery(sh.shipment_id, db)
        pending_plan = db.query(RecoveryPlanDB).filter(
            RecoveryPlanDB.shipment_id == sh.shipment_id,
            RecoveryPlanDB.approval_status == "PENDING"
        ).first()

    assert pending_plan is not None
    recovery_id = pending_plan.recovery_id
    shipment_id = pending_plan.shipment_id

    # Approve the plan
    app_res = orchestrator.approve_recovery_plan(
        recovery_id=recovery_id,
        operator_id="OP-SENIOR-DISPATCH-99",
        db=db,
    )
    assert app_res["approval_status"] == "APPROVED"
    assert app_res["new_status"] == "rerouted"
    assert app_res["new_risk_score"] <= 3

    # Check Audit Log was recorded
    audit = db.query(AuditLogDB).filter(
        AuditLogDB.shipment_id == shipment_id,
        AuditLogDB.event_type == "OPERATOR_RECOVERY_APPROVED"
    ).first()
    assert audit is not None
    assert audit.operator_id == "OP-SENIOR-DISPATCH-99"


def test_orchestrator_dynamic_replanning(db):
    """
    Tests dynamic replanning trigger when a secondary disruption blocks an approved recovery route.
    """
    sh = db.query(ShipmentDB).filter(ShipmentDB.current_status == "rerouted").first()
    if not sh:
        # If no rerouted shipment, pick any and create an approved plan
        sh = db.query(ShipmentDB).first()
        rec = orchestrator.optimize_shipment_recovery(sh.shipment_id, db)
        p = db.query(RecoveryPlanDB).filter(RecoveryPlanDB.shipment_id == sh.shipment_id).first()
        orchestrator.approve_recovery_plan(p.recovery_id, "OP-TEST", db)

    # Incur secondary disruption directly on top of shipment coordinates
    secondary_event = {
        "latitude": sh.current_lat,
        "longitude": sh.current_lon,
        "impact_radius_km": 50.0,
    }

    replan_res = orchestrator.evaluate_dynamic_replanning(sh.shipment_id, secondary_event, db)
    assert replan_res["replanning_required"] is True
    assert "superseded_plan_id" in replan_res
    assert "new_recovery" in replan_res
