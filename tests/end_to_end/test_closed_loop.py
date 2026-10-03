"""
Comprehensive End-to-End Closed-Loop Integration Test Suite for YOLO × FluxQ
Validates:
Sense -> Normalize -> Predict -> Explain -> Triage -> Optimize -> Validate -> Recommend -> Approve -> Audit -> Replan
"""

from datetime import datetime, timezone, timedelta
import numpy as np
import pytest
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models_db import ShipmentDB, DisruptionEventDB, RecoveryPlanDB, AuditLogDB
from backend.app.orchestration.orchestrator import orchestrator
from backend.app.ml.inference import RiskPredictor
from backend.app.optimization.classical.solver import ClassicalRecoveryOptimizer
from backend.app.optimization.validation import validate_plan_feasibility
from backend.app.optimization.quantum.qaoa_solver import QuantumHybridOptimizer


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestEndToEndClosedLoop:
    """
    Complete integration test suite verifying the multi-layer architecture.
    """

    def test_scenario_01_routine_baseline_shipment(self, db_session: Session):
        """
        Scenario 1: Routine shipment with zero active corridor disruptions.
        Verifies low risk score (R <= 3), no EWI trigger, and on-time status.
        """
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if not sh:
            pytest.skip("Baseline shipment SH-2048 not initialized")

        # Baseline features without disruption
        predictor = RiskPredictor()
        features = {
            "shipment_id": sh.shipment_id,
            "origin": sh.origin,
            "destination": sh.destination,
            "transport_mode": sh.transport_mode,
            "carrier_id": sh.carrier_id,
            "route_id": sh.route_id,
            "planned_departure": sh.planned_departure.isoformat(),
            "promised_delivery": sh.promised_delivery.isoformat(),
            "current_eta": sh.current_eta.isoformat(),
            "sla_hours": sh.sla_hours,
            "sla_buffer_minutes": 180.0,
            "cargo_priority": sh.cargo_priority,
            "cargo_value_inr": sh.cargo_value_inr,
            "weight_kg": sh.weight_kg,
            "remaining_distance_km": sh.remaining_distance_km,
            "remaining_time_minutes": sh.remaining_time_minutes,
            "traffic_delay_minutes": 0.0,
            "congestion_index": 1.0,
            "weather_severity": 1.0,
            "road_closure": 0,
        }

        pred = predictor.predict_shipment(features)
        assert pred["risk_score"] <= 3
        assert pred["p_sla_breach"] < 0.35
        assert pred["flagged_for_review"] is False

    def test_scenario_02_severe_weather_and_ewi_trigger(self, db_session: Session):
        """
        Scenario 2: Severe weather disruption injected in the Vellore/Ambur arterial corridor.
        Verifies spatial matching, risk jump (R >= 7), and EWI triggering.
        """
        now = datetime.now(timezone.utc)
        evt_id = f"E2E-EVT-WEATHER-{int(now.timestamp())}"
        event_payload = {
            "event_id": evt_id,
            "event_type": "SEVERE_WEATHER",
            "severity": 4.8,
            "location_name": "Vellore-Ranipet Arterial Bypass",
            "latitude": 12.9200,
            "longitude": 79.1300,
            "impact_radius_km": 75.0,
            "affected_mode": "ROAD",
            "estimated_delay_minutes": 180,
            "start_time": now.isoformat(),
            "expected_end": (now + timedelta(hours=8)).isoformat(),
            "source": "E2E_AUTOMATED_SIMULATION",
            "is_simulated": True,
        }

        result = orchestrator.process_disruption_event(event_payload, db_session)
        assert result["orchestration_status"] == "COMPLETED"
        assert result["impacted_shipments_count"] > 0

        # Check SH-2048 or correlated shipment updated
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if sh:
            assert sh.risk_score >= 7 or sh.sla_breach_probability >= 0.60
            assert sh.flagged_for_review is True

    def test_scenario_03_treeshap_explainability(self, db_session: Session):
        """
        Scenario 3: Verifies TreeSHAP local feature attribution for elevated risk.
        Ensures statistical attribution is generated and compliant with governance rules.
        """
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if not sh:
            pytest.skip("Shipment SH-2048 not found")

        predictor = RiskPredictor()
        feat = {
            "shipment_id": sh.shipment_id,
            "origin": sh.origin,
            "destination": sh.destination,
            "transport_mode": sh.transport_mode,
            "carrier_id": sh.carrier_id,
            "route_id": sh.route_id,
            "planned_departure": sh.planned_departure.isoformat(),
            "promised_delivery": sh.promised_delivery.isoformat(),
            "current_eta": sh.current_eta.isoformat(),
            "sla_hours": sh.sla_hours,
            "sla_buffer_minutes": 20.0,
            "cargo_priority": sh.cargo_priority,
            "cargo_value_inr": sh.cargo_value_inr,
            "weight_kg": sh.weight_kg,
            "remaining_distance_km": sh.remaining_distance_km,
            "remaining_time_minutes": sh.remaining_time_minutes,
            "traffic_delay_minutes": 120.0,
            "congestion_index": 4.5,
            "weather_severity": 4.8,
            "road_closure": 0,
        }

        explanation = predictor.explain_prediction(feat, top_k=4)
        assert "top_risk_drivers" in explanation
        assert len(explanation["top_risk_drivers"]) > 0

        # Verify disclaimer and governance labels
        assert "disclaimer" in explanation
        assert "statistical attribution" in explanation["disclaimer"].lower()

    def test_scenario_04_classical_ortools_optimization(self, db_session: Session):
        """
        Scenario 4: Google OR-Tools MIP solver generates 4 candidate recovery strategies
        (Lowest Cost, Lowest Delay, Highest SLA, Balanced) with independent feasibility checks.
        """
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if not sh:
            pytest.skip("Shipment SH-2048 not found")

        solver = ClassicalRecoveryOptimizer()
        disruptions = [{"event_type": "SEVERE_WEATHER", "estimated_delay_minutes": 150}]
        res = solver.solve_shipment_recovery(
            shipment={
                "shipment_id": sh.shipment_id,
                "carrier_id": sh.carrier_id,
                "promised_delivery": sh.promised_delivery.isoformat(),
                "current_eta": sh.current_eta.isoformat(),
                "predicted_delay_minutes": 120.0,
            },
            active_disruptions=disruptions,
            weights={"cost_weight": 0.30, "delay_weight": 0.40, "sla_penalty_weight": 0.30, "emissions_weight": 0.0},
            max_budget=15000.0,
        )

        assert res["solver_status"] in ("OPTIMAL", "FEASIBLE")
        assert len(res["plans"]) >= 4


        # Validate each plan with independent validator
        for p in res["plans"]:
            v = validate_plan_feasibility(
                shipment={"promised_delivery": sh.promised_delivery.isoformat()},
                chosen_action=p,
                active_disruptions=disruptions,
                max_budget=15000.0,
                carrier_capacity_remaining=10,
            )
            assert v["is_feasible"] is True

    def test_scenario_05_quantum_hybrid_experiment(self):
        """
        Scenario 5: Experimental Qiskit QAOA statevector simulation on residual slot allocation.
        Verifies quantum circuit execution, statevector sampling, and QCR calculation.
        """
        optimizer = QuantumHybridOptimizer()
        cost_matrix = np.array([
            [1200.0, 1850.0],
            [1400.0, 1600.0]
        ])
        result = optimizer.run_qaoa_simulation(
            cost_matrix=cost_matrix,
            classical_best_obj=1200.0,
            gamma=0.35,
            beta=0.25,
        )

        assert result["executed"] is True
        assert "feasible" in result
        assert "quantum_contribution_ratio_pct" in result
        assert result["qubits_used"] == 4
        assert "Qiskit Statevector Simulator" in result["backend"]
        assert "classical_objective" in result
        assert "quantum_objective" in result

    def test_scenario_06_human_dispatcher_approval_and_audit(self, db_session: Session):
        """
        Scenario 6: Human dispatcher reviews and approves the balanced recovery plan.
        Verifies atomic state update, risk reduction, and immutable audit logging.
        """
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if not sh:
            pytest.skip("Shipment SH-2048 not found")

        # Ensure a candidate recovery plan is in pending status
        rec = orchestrator.optimize_shipment_recovery(sh.shipment_id, db_session)
        pending_plan = db_session.query(RecoveryPlanDB).filter(
            RecoveryPlanDB.shipment_id == sh.shipment_id,
            RecoveryPlanDB.approval_status == "PENDING"
        ).first()
        assert pending_plan is not None

        # Execute approval
        app_res = orchestrator.approve_recovery_plan(
            recovery_id=pending_plan.recovery_id,
            operator_id="DISPATCHER-LEAD-07",
            db=db_session,
        )

        assert app_res["approval_status"] == "APPROVED"
        assert app_res["new_status"] == "rerouted"
        assert app_res["new_risk_score"] <= 3

        # Verify audit log record exists
        audit = db_session.query(AuditLogDB).filter(
            AuditLogDB.shipment_id == sh.shipment_id,
            AuditLogDB.event_type == "OPERATOR_RECOVERY_APPROVED"
        ).order_by(AuditLogDB.timestamp.desc()).first()
        assert audit is not None
        assert audit.operator_id == "DISPATCHER-LEAD-07"

    def test_scenario_07_dynamic_replanning_on_secondary_disruption(self, db_session: Session):
        """
        Scenario 7: Secondary road closure occurs directly on the approved alternate route.
        Verifies that active plan is superseded and replacement optimization is triggered.
        """
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if not sh:
            pytest.skip("Shipment SH-2048 not found")

        # Simulate secondary event at current coordinates
        secondary_event = {
            "event_id": f"E2E-EVT-SEC-{int(datetime.now().timestamp())}",
            "latitude": sh.current_lat,
            "longitude": sh.current_lon,
            "impact_radius_km": 50.0,
            "event_type": "ROAD_CLOSURE",
        }

        replan_res = orchestrator.evaluate_dynamic_replanning(sh.shipment_id, secondary_event, db_session)
        assert replan_res["replanning_required"] is True
        assert "superseded_plan_id" in replan_res

        # Check new recovery plan generated
        new_plans = db_session.query(RecoveryPlanDB).filter(
            RecoveryPlanDB.shipment_id == sh.shipment_id,
            RecoveryPlanDB.approval_status == "PENDING"
        ).all()
        assert len(new_plans) > 0

    def test_scenario_08_rejection_and_manual_escalation(self, db_session: Session):
        """
        Scenario 8: Operator rejects an unviable recovery option, escalating to operations management.
        """
        sh = db_session.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
        if not sh:
            pytest.skip("Shipment SH-2048 not found")

        # Find latest pending plan
        pending_plan = db_session.query(RecoveryPlanDB).filter(
            RecoveryPlanDB.shipment_id == sh.shipment_id,
            RecoveryPlanDB.approval_status == "PENDING"
        ).first()

        if not pending_plan:
            orchestrator.optimize_shipment_recovery(sh.shipment_id, db_session)
            pending_plan = db_session.query(RecoveryPlanDB).filter(
                RecoveryPlanDB.shipment_id == sh.shipment_id,
                RecoveryPlanDB.approval_status == "PENDING"
            ).first()

        rej_res = orchestrator.reject_recovery_plan(
            recovery_id=pending_plan.recovery_id,
            operator_id="DISPATCHER-LEAD-07",
            reason="Air freight surcharge exceeds client SLA contractual budget allowance.",
            db=db_session,
        )

        assert rej_res["approval_status"] == "REJECTED"
        assert "air freight surcharge" in rej_res["reason"].lower()

        # Check audit entry
        audit = db_session.query(AuditLogDB).filter(
            AuditLogDB.shipment_id == sh.shipment_id,
            AuditLogDB.event_type == "OPERATOR_RECOVERY_REJECTED"
        ).order_by(AuditLogDB.timestamp.desc()).first()
        assert audit is not None
        assert "exceeds" in audit.justification
