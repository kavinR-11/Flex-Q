"""
Central AI Orchestration Layer for YOLO × FluxQ
Coordinates: Sense -> Normalize -> Predict -> Explain -> Triage -> Optimize -> Recommend -> Human Approval -> Replan
Ensures deterministic operational safety with strict schema contracts and immutable audit trails.
"""

from datetime import datetime, timezone
import math
from typing import Dict, Any, List, Optional
import numpy as np
from sqlalchemy.orm import Session

from backend.app.models_db import (
    ShipmentDB,
    DisruptionEventDB,
    RecoveryPlanDB,
    AuditLogDB,
    CarrierDB,
)
from backend.app.ml.inference import RiskPredictor
from backend.app.optimization.classical.solver import ClassicalRecoveryOptimizer
from backend.app.optimization.quantum.qaoa_solver import QuantumHybridOptimizer
from backend.app.optimization.validation import validate_recovery_plan

predictor = RiskPredictor()
classical_solver = ClassicalRecoveryOptimizer()


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(dlambda / 2.0) ** 2))
    return R * (2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)))


class YoloFluxQOrchestrator:
    """
    Principal system orchestrator linking data ingestion, ML risk inference,
    OR-Tools classical optimization, QAOA quantum experimentation, and human approval workflows.
    """

    def __init__(self):
        self.quantum_optimizer = QuantumHybridOptimizer()

    def process_disruption_event(self, event_data: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Ingests a disruption event, spatially and temporally projects impact onto active shipments,
        recomputes risk scores with ML, triggers EWI triage, and initiates recovery recommendations.
        """
        now_utc = datetime.now(timezone.utc)
        start_time = datetime.fromisoformat(event_data.get("start_time", now_utc.isoformat()))
        expected_end = datetime.fromisoformat(event_data.get("expected_end", now_utc.isoformat()))

        # 1. Ingest Event into Database
        event_id = event_data.get("event_id", f"EVT-{int(now_utc.timestamp())}")
        evt_db = db.query(DisruptionEventDB).filter(DisruptionEventDB.event_id == event_id).first()
        if not evt_db:
            evt_db = DisruptionEventDB(
                event_id=event_id,
                event_type=event_data["event_type"],
                severity=float(event_data["severity"]),
                location_name=event_data["location_name"],
                latitude=float(event_data["latitude"]),
                longitude=float(event_data["longitude"]),
                impact_radius_km=float(event_data["impact_radius_km"]),
                affected_mode=event_data.get("affected_mode", "ROAD"),
                estimated_delay_minutes=int(event_data.get("estimated_delay_minutes", 60)),
                start_time=start_time,
                expected_end=expected_end,
                source=event_data.get("source", "ORCHESTRATOR_DISRUPTION_LAB"),
                is_simulated=event_data.get("is_simulated", True),
                created_at=now_utc,
            )
            db.add(evt_db)
            db.commit()

        # 2. Correlate with Active Shipments
        active_shipments = db.query(ShipmentDB).filter(ShipmentDB.current_status != "delivered").all()
        impacted_shipments = []
        triggered_recovery_plans = []

        for sh in active_shipments:
            # Spatial corridor check: distance from current location, origin, or destination
            cur_dist = haversine_distance_km(sh.current_lat, sh.current_lon, evt_db.latitude, evt_db.longitude)
            orig_dist = haversine_distance_km(sh.origin_lat, sh.origin_lon, evt_db.latitude, evt_db.longitude)
            dest_dist = haversine_distance_km(sh.destination_lat, sh.destination_lon, evt_db.latitude, evt_db.longitude)
            corridor_min_dist = min(cur_dist, orig_dist, dest_dist)

            # Mode check
            mode_matches = (evt_db.affected_mode == "ALL") or (evt_db.affected_mode == sh.transport_mode)
            is_exposed = corridor_min_dist <= (evt_db.impact_radius_km * 2.5) and mode_matches

            if is_exposed:
                # 3. Dynamic Re-inference via ML
                prev_state = {
                    "risk_score": sh.risk_score,
                    "sla_breach_probability": sh.sla_breach_probability,
                    "status": sh.current_status,
                }

                # Construct updated prediction features
                sh_features = {
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
                    "sla_buffer_minutes": max(0.0, sh.sla_buffer_minutes - (evt_db.estimated_delay_minutes * 0.75)),
                    "cargo_priority": sh.cargo_priority,
                    "cargo_value_inr": sh.cargo_value_inr,
                    "weight_kg": sh.weight_kg,
                    "remaining_distance_km": sh.remaining_distance_km,
                    "remaining_time_minutes": sh.remaining_time_minutes,
                    "traffic_delay_minutes": float(evt_db.estimated_delay_minutes),
                    "congestion_index": float(evt_db.severity),
                    "weather_severity": float(evt_db.severity if evt_db.event_type == "SEVERE_WEATHER" else 1.0),
                    "road_closure": int(evt_db.event_type == "ROAD_CLOSURE"),
                }

                pred = predictor.predict_shipment(sh_features)

                # Update database state
                sh.risk_score = pred["risk_score"]
                sh.sla_breach_probability = pred["p_sla_breach"]
                sh.delay_probability = pred["p_delay"]
                sh.predicted_delay_minutes = pred["predicted_delay_minutes"]
                sh.risk_category = pred["risk_category"]
                sh.flagged_for_review = pred["flagged_for_review"]
                sh.current_eta = datetime.fromisoformat(pred["predicted_eta"])
                if sh.risk_score >= 8:
                    sh.current_status = "critical"
                sh.updated_at = now_utc

                # 4. Audit Log
                audit_entry = AuditLogDB(
                    audit_id=f"AUD-EVT-{int(now_utc.timestamp())}-{sh.shipment_id}",
                    shipment_id=sh.shipment_id,
                    event_type="CORRIDOR_DISRUPTION_IMPACT",
                    previous_state=prev_state,
                    new_state={
                        "risk_score": sh.risk_score,
                        "sla_breach_probability": sh.sla_breach_probability,
                        "status": sh.current_status,
                        "event_id": evt_db.event_id,
                        "event_type": evt_db.event_type,
                    },
                    trigger_source="AI_ORCHESTRATOR",
                    justification=f"Disruption {evt_db.event_id} ({evt_db.location_name}) within corridor radius ({corridor_min_dist:.1f} km).",
                    timestamp=now_utc,
                )
                db.add(audit_entry)

                impacted_shipments.append({
                    "shipment_id": sh.shipment_id,
                    "previous_risk": prev_state["risk_score"],
                    "updated_risk": sh.risk_score,
                    "p_breach": sh.sla_breach_probability,
                    "corridor_distance_km": round(corridor_min_dist, 1),
                })

                # 5. Triage Policy: If risk >= 7 or p_breach > 0.60, trigger automated recovery optimization
                if sh.risk_score >= 7 or sh.sla_breach_probability > 0.60:
                    rec_result = self.optimize_shipment_recovery(sh.shipment_id, db)
                    triggered_recovery_plans.append(rec_result)

        db.commit()

        return {
            "orchestration_status": "COMPLETED",
            "event_id": evt_db.event_id,
            "impacted_shipments_count": len(impacted_shipments),
            "impacted_shipments": impacted_shipments,
            "automated_recovery_plans_generated": len(triggered_recovery_plans),
            "recovery_plans": triggered_recovery_plans,
        }

    def optimize_shipment_recovery(
        self,
        shipment_id: str,
        db: Session,
        weights: Optional[Dict[str, float]] = None,
        max_budget: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes classical Google OR-Tools MIP recovery optimization, validates plan feasibility,
        runs optional QAOA statevector simulation for residual combinatorial tradeoffs,
        and saves candidate plans in pending status awaiting human sign-off.
        """
        if max_budget is None:
            max_budget = 15000.0

        sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
        if not sh:
            raise ValueError(f"Shipment {shipment_id} not found")

        active_disruptions = db.query(DisruptionEventDB).all()
        disruptions_list = [
            {
                "event_id": d.event_id,
                "event_type": d.event_type,
                "severity": d.severity,
                "estimated_delay_minutes": d.estimated_delay_minutes,
            }
            for d in active_disruptions
        ]

        sh_dict = {
            "shipment_id": sh.shipment_id,
            "carrier_id": sh.carrier_id,
            "promised_delivery": sh.promised_delivery.isoformat(),
            "current_eta": sh.current_eta.isoformat(),
            "predicted_delay_minutes": sh.predicted_delay_minutes,
        }

        # 1. Classical MIP Solve
        res = classical_solver.solve_shipment_recovery(
            shipment=sh_dict,
            active_disruptions=disruptions_list,
            weights=weights,
            max_budget=max_budget,
        )

        # 2. Persist Candidate Plans with Independent Feasibility Validation
        now_utc = datetime.now(timezone.utc)
        persisted_plans = []

        # Invalidate old pending plans
        db.query(RecoveryPlanDB).filter(
            RecoveryPlanDB.shipment_id == shipment_id,
            RecoveryPlanDB.approval_status == "PENDING"
        ).update({"approval_status": "SUPERSEDED"})

        for p in res["plans"]:
            # Independent validator check
            v_check = validate_recovery_plan(
                plan=p,
                shipment_info=sh_dict,
                carrier_capacities={"CARRIER-AIR-01": 20, "CARRIER-EXP-01": 30, "CARRIER-REG-01": 50},
                blocked_lanes=[d["event_type"] for d in disruptions_list if d["event_type"] == "ROAD_CLOSURE"]
            )

            plan_db = RecoveryPlanDB(
                recovery_id=p["recovery_id"],
                shipment_id=shipment_id,
                plan_strategy=p["strategy_name"],
                action_type=p["action"],
                alternate_route_name=p["alternate_route_name"],
                alternate_carrier_id=p["alternate_carrier_id"],
                additional_cost_inr=p["additional_cost_inr"],
                predicted_eta=datetime.fromisoformat(p["predicted_eta"]),
                expected_delay_minutes=p["expected_delay_minutes"],
                sla_outcome=p["sla_outcome"],
                is_feasible=v_check["is_feasible"] and p["feasible"],
                approval_status="PENDING",
                created_at=now_utc,
            )
            db.add(plan_db)
            persisted_plans.append(p["recovery_id"])

        # 3. Optional Quantum-Hybrid Experimentation on Residual Problem
        cost_matrix = np.array([
            [1200.0, 1850.0],
            [1400.0, 1600.0]
        ])
        quantum_benchmark = self.quantum_optimizer.run_qaoa_simulation(
            cost_matrix=cost_matrix,
            classical_best_obj=float(res["plans"][0]["additional_cost_inr"]) if res["plans"] else 1200.0
        )

        db.commit()

        rec_plan_id = res.get("recommended_plan_id", persisted_plans[0] if persisted_plans else None)
        rec_plan_obj = next((p for p in res.get("plans", []) if p.get("recovery_id") == rec_plan_id), (res.get("plans", [None])[0]))

        return {
            "shipment_id": shipment_id,
            "status": "OPTIMIZED_AWAITING_APPROVAL",
            "candidate_plans_count": len(persisted_plans),
            "recommended_plan_id": rec_plan_id,
            "recommended_plan": rec_plan_obj,
            "quantum_hybrid_benchmark": quantum_benchmark,
        }

    def approve_recovery_plan(self, recovery_id: str, operator_id: str, db: Session) -> Dict[str, Any]:
        """
        Executes human-in-the-loop sign-off. Transitions recovery plan to APPROVED,
        reroutes shipment, recalculates on-time status, and logs immutable audit trail.
        """
        plan = db.query(RecoveryPlanDB).filter(RecoveryPlanDB.recovery_id == recovery_id).first()
        if not plan:
            raise ValueError(f"Recovery plan {recovery_id} not found")

        if plan.approval_status == "APPROVED":
            return {"status": "ALREADY_APPROVED", "recovery_id": recovery_id}

        sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == plan.shipment_id).first()
        if not sh:
            raise ValueError(f"Shipment {plan.shipment_id} not found")

        now_utc = datetime.now(timezone.utc)
        prev_state = {
            "status": sh.current_status,
            "carrier_id": sh.carrier_id,
            "route_id": sh.route_id,
            "risk_score": sh.risk_score,
            "eta": sh.current_eta.isoformat(),
        }

        # Apply operational plan to shipment
        sh.current_status = "rerouted"
        if plan.alternate_route_name:
            sh.route_id = f"ROUTE-ALT-{plan.alternate_route_name.replace(' ', '_').upper()}"
        if plan.alternate_carrier_id:
            sh.carrier_id = plan.alternate_carrier_id

        sh.current_eta = plan.predicted_eta
        sh.predicted_delay_minutes = plan.expected_delay_minutes
        # Rerouting resolves the impending SLA breach
        sh.risk_score = 3
        sh.sla_breach_probability = 0.18
        sh.delay_probability = 0.22
        sh.risk_category = "Low"
        sh.flagged_for_review = False
        sh.updated_at = now_utc

        # Update Recovery Plan Record
        plan.approval_status = "APPROVED"
        plan.operator_id = operator_id
        plan.decided_at = now_utc

        # Immutable Audit Record
        audit_entry = AuditLogDB(
            audit_id=f"AUD-APP-{int(now_utc.timestamp())}-{plan.recovery_id}",
            shipment_id=sh.shipment_id,
            event_type="OPERATOR_RECOVERY_APPROVED",
            previous_state=prev_state,
            new_state={
                "status": sh.current_status,
                "carrier_id": sh.carrier_id,
                "route_id": sh.route_id,
                "risk_score": sh.risk_score,
                "eta": sh.current_eta.isoformat(),
                "recovery_id": plan.recovery_id,
                "action": plan.action_type,
            },
            trigger_source="HUMAN_DISPATCHER",
            operator_id=operator_id,
            justification=f"Operator approved {plan.plan_strategy} recovery via {plan.action_type}.",
            timestamp=now_utc,
        )
        db.add(audit_entry)
        db.commit()

        return {
            "approval_status": "APPROVED",
            "recovery_id": recovery_id,
            "shipment_id": sh.shipment_id,
            "new_status": sh.current_status,
            "new_risk_score": sh.risk_score,
            "operator_id": operator_id,
            "timestamp": now_utc.isoformat(),
        }

    def reject_recovery_plan(self, recovery_id: str, operator_id: str, reason: str, db: Session) -> Dict[str, Any]:
        """
        Logs operator rejection of candidate plan and escalates shipment for manual supervisor intervention.
        """
        plan = db.query(RecoveryPlanDB).filter(RecoveryPlanDB.recovery_id == recovery_id).first()
        if not plan:
            raise ValueError(f"Recovery plan {recovery_id} not found")

        now_utc = datetime.now(timezone.utc)
        plan.approval_status = "REJECTED"
        plan.operator_id = operator_id
        plan.notes = reason
        plan.decided_at = now_utc

        audit_entry = AuditLogDB(
            audit_id=f"AUD-REJ-{int(now_utc.timestamp())}-{plan.recovery_id}",
            shipment_id=plan.shipment_id,
            event_type="OPERATOR_RECOVERY_REJECTED",
            previous_state={"approval_status": "PENDING"},
            new_state={"approval_status": "REJECTED", "reason": reason},
            trigger_source="HUMAN_DISPATCHER",
            operator_id=operator_id,
            justification=f"Dispatcher rejected recovery plan: {reason}",
            timestamp=now_utc,
        )
        db.add(audit_entry)
        db.commit()

        return {
            "approval_status": "REJECTED",
            "recovery_id": recovery_id,
            "shipment_id": plan.shipment_id,
            "reason": reason,
            "operator_id": operator_id,
        }

    def evaluate_dynamic_replanning(self, shipment_id: str, new_event: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Evaluates whether an incoming disruption invalidates an already approved or active recovery plan,
        triggering secondary replanning when necessary.
        """
        sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
        if not sh:
            raise ValueError(f"Shipment {shipment_id} not found")

        approved_plan = db.query(RecoveryPlanDB).filter(
            RecoveryPlanDB.shipment_id == shipment_id,
            RecoveryPlanDB.approval_status == "APPROVED"
        ).order_by(RecoveryPlanDB.decided_at.desc()).first()

        if not approved_plan:
            return {"replanning_required": False, "reason": "No active approved plan"}

        # Check if new event location overlaps with approved alternate route
        evt_lat = float(new_event.get("latitude", 0.0))
        evt_lon = float(new_event.get("longitude", 0.0))
        dist_to_route = haversine_distance_km(sh.current_lat, sh.current_lon, evt_lat, evt_lon)

        if dist_to_route <= float(new_event.get("impact_radius_km", 20.0)) * 1.5:
            # Plan is invalidated!
            approved_plan.approval_status = "SUPERSEDED"
            sh.current_status = "critical"
            sh.risk_score = 9
            sh.sla_breach_probability = 0.92

            # Re-optimize
            new_rec = self.optimize_shipment_recovery(shipment_id, db)
            db.commit()

            return {
                "replanning_required": True,
                "superseded_plan_id": approved_plan.recovery_id,
                "new_recovery": new_rec,
            }

        return {"replanning_required": False, "reason": "Active recovery path unaffected"}


# Singleton orchestrator instance
orchestrator = YoloFluxQOrchestrator()
