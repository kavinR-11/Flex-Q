"""
Disruption Events & Simulation API Router for YOLO x FluxQ
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models_db import DisruptionEventDB, ShipmentDB, AuditLogDB
from backend.app.schemas.event import EventCreate, EventResponse, EventTriggerResponse, AffectedShipmentDetail
from backend.app.features.spatial_temporal_join import haversine_distance_km
from backend.app.ml.inference import RiskPredictor
from backend.app.features.exposure_calculator import compute_shipment_exposure_profile

router = APIRouter(tags=["Disruptions"])

predictor = RiskPredictor()

@router.get("/events", response_model=list[EventResponse])
def list_events(
    event_type: str = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(DisruptionEventDB)
    if event_type:
        query = query.filter(DisruptionEventDB.event_type == event_type)
    return query.order_by(DisruptionEventDB.created_at.desc()).limit(limit).all()

@router.post("/events", response_model=EventTriggerResponse, status_code=201)
def submit_disruption_event(payload: EventCreate, db: Session = Depends(get_db)):
    """
    Submits a disruption event (real or simulated) and dynamically recomputes
    risk scores and ETAs for all affected shipments along the impacted corridor.
    """
    now_utc = datetime.now(timezone.utc)
    start_time = payload.start_time or now_utc
    expected_end = payload.expected_end or (start_time + timedelta(hours=4))
    
    event_id = f"EVT-LAB-{now_utc.strftime('%H%M%S')}"

    # Save Event to DB
    evt_db = DisruptionEventDB(
        event_id=event_id,
        event_type=payload.event_type,
        severity=payload.severity,
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        impact_radius_km=payload.impact_radius_km,
        affected_mode=payload.affected_mode,
        estimated_delay_minutes=payload.estimated_delay_minutes,
        start_time=start_time,
        expected_end=expected_end,
        source=payload.source,
        is_simulated=True,
        created_at=now_utc
    )
    db.add(evt_db)
    db.commit()

    # Identify Affected Shipments
    all_shipments = db.query(ShipmentDB).filter(ShipmentDB.current_status != "delivered").all()
    affected_ids = []
    affected_details = []

    for sh in all_shipments:
        # Distance check to event epicenter
        cur_dist = haversine_distance_km(sh.current_lat, sh.current_lon, payload.latitude, payload.longitude)
        orig_dist = haversine_distance_km(sh.origin_lat, sh.origin_lon, payload.latitude, payload.longitude)
        dest_dist = haversine_distance_km(sh.destination_lat, sh.destination_lon, payload.latitude, payload.longitude)
        min_corridor_dist = min(cur_dist, orig_dist, dest_dist)

        # Mode check
        mode_match = (payload.affected_mode == "ALL") or (payload.affected_mode == sh.transport_mode)

        if min_corridor_dist <= (payload.impact_radius_km * 2.5) and mode_match:
            affected_ids.append(sh.shipment_id)
            prev_risk = sh.risk_score
            prev_p = sh.sla_breach_probability

            # Recalculate Exposure
            sh_dict = {
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
                "sla_buffer_minutes": sh.sla_buffer_minutes - (payload.estimated_delay_minutes * 0.8),
                "cargo_priority": sh.cargo_priority,
                "cargo_value_inr": sh.cargo_value_inr,
                "weight_kg": sh.weight_kg,
                "remaining_distance_km": sh.remaining_distance_km,
                "remaining_time_minutes": sh.remaining_time_minutes,
                "traffic_delay_minutes": float(payload.estimated_delay_minutes),
                "congestion_index": float(payload.severity),
                "weather_severity": float(payload.severity if payload.event_type == "SEVERE_WEATHER" else 1.0),
                "road_closure": int(payload.event_type == "ROAD_CLOSURE"),
            }

            pred = predictor.predict_shipment(sh_dict)

            # Update shipment record
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

            affected_details.append(
                AffectedShipmentDetail(
                    shipment_id=sh.shipment_id,
                    origin=sh.origin,
                    destination=sh.destination,
                    cargo_type=sh.cargo_type,
                    cargo_priority=sh.cargo_priority,
                    new_risk_score=sh.risk_score,
                    predicted_delay_minutes=sh.predicted_delay_minutes,
                    sla_breach_probability=sh.sla_breach_probability
                )
            )

            # Log to Audit Trail
            audit_entry = AuditLogDB(
                audit_id=f"AUD-{sh.shipment_id}-{now_utc.strftime('%H%M%S')}",
                shipment_id=sh.shipment_id,
                event_type="DISRUPTION_RISK_RECOMPUTED",
                previous_state={"risk_score": prev_risk, "sla_breach_prob": prev_p},
                new_state={"risk_score": sh.risk_score, "sla_breach_prob": sh.sla_breach_probability, "eta": sh.current_eta.isoformat()},
                trigger_source=f"DISRUPTION_EVENT_{event_id}",
                justification=f"Injected {payload.event_type} in {payload.location_name} (+{payload.estimated_delay_minutes}m delay)",
                timestamp=now_utc
            )
            db.add(audit_entry)

    db.commit()

    return EventTriggerResponse(
        event_id=event_id,
        affected_shipments_count=len(affected_ids),
        affected_shipment_ids=affected_ids,
        affected_shipments=affected_details,
        recomputed_status="recalculation_completed"
    )

@router.delete("/events/simulated")
def clear_simulated_events(db: Session = Depends(get_db)):
    """
    Clears all simulated events injected during Disruption Lab stress testing.
    """
    deleted = db.query(DisruptionEventDB).filter(DisruptionEventDB.is_simulated == True).delete()
    db.commit()
    return {"status": "cleared", "deleted_events": deleted}

@router.post("/risk/recompute")
def recompute_all_risks(db: Session = Depends(get_db)):
    """
    Refreshes risk predictions across all active shipments.
    """
    now_utc = datetime.now(timezone.utc)
    all_shipments = db.query(ShipmentDB).filter(ShipmentDB.current_status != "delivered").all()
    count = 0
    for sh in all_shipments:
        pred = predictor.predict_shipment({
            "origin": sh.origin,
            "destination": sh.destination,
            "transport_mode": sh.transport_mode,
            "carrier_id": sh.carrier_id,
            "route_id": sh.route_id,
            "planned_departure": sh.planned_departure.isoformat(),
            "promised_delivery": sh.promised_delivery.isoformat(),
            "current_eta": sh.current_eta.isoformat(),
            "sla_hours": sh.sla_hours,
            "sla_buffer_minutes": sh.sla_buffer_minutes,
            "cargo_priority": sh.cargo_priority,
            "cargo_value_inr": sh.cargo_value_inr,
            "weight_kg": sh.weight_kg,
            "remaining_distance_km": sh.remaining_distance_km,
            "remaining_time_minutes": sh.remaining_time_minutes,
        })
        sh.risk_score = pred["risk_score"]
        sh.sla_breach_probability = pred["p_sla_breach"]
        sh.delay_probability = pred["p_delay"]
        sh.risk_category = pred["risk_category"]
        sh.flagged_for_review = pred["flagged_for_review"]
        sh.updated_at = now_utc
        count += 1
    db.commit()
    return {"status": "success", "recomputed_shipments": count, "timestamp": now_utc.isoformat()}
