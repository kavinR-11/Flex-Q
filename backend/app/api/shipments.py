"""
Shipment Intelligence API Router for YOLO x FluxQ
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from pydantic import BaseModel, Field
from backend.app.database import get_db
from backend.app.models_db import ShipmentDB, DisruptionEventDB, AuditLogDB
from backend.app.schemas.shipment import (
    ShipmentResponse,
    ShipmentCreate,
    ShipmentRiskResponse,
    ShipmentETAResponse,
    ShipmentExplanationResponse,
)
from backend.app.ml.inference import RiskPredictor
from backend.app.features.exposure_calculator import compute_shipment_exposure_profile

router = APIRouter(prefix="/shipments", tags=["Shipments"])

predictor = RiskPredictor()

class ShipmentPriorityUpdate(BaseModel):
    cargo_priority: int = Field(ge=1, le=4)
    cargo_type: Optional[str] = None
    reason: Optional[str] = "Manual operator triage priority adjustment"

@router.get("", response_model=list[ShipmentResponse])
def list_shipments(
    status: Optional[str] = None,
    min_risk: Optional[int] = Query(None, ge=1, le=10),
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(ShipmentDB)
    if status:
        query = query.filter(ShipmentDB.current_status == status)
    if min_risk:
        query = query.filter(ShipmentDB.risk_score >= min_risk)
    if origin:
        query = query.filter(ShipmentDB.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(ShipmentDB.destination.ilike(f"%{destination}%"))
    if search:
        query = query.filter(
            (ShipmentDB.shipment_id.ilike(f"%{search}%"))
            | (ShipmentDB.order_id.ilike(f"%{search}%"))
            | (ShipmentDB.cargo_type.ilike(f"%{search}%"))
        )

    # Order high risk first, then by promised delivery
    shipments = query.order_by(ShipmentDB.risk_score.desc(), ShipmentDB.promised_delivery.asc()).offset(offset).limit(limit).all()
    return shipments

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_detail(shipment_id: str, db: Session = Depends(get_db)):
    sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")
    return sh

@router.post("", response_model=ShipmentResponse, status_code=201)
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == payload.shipment_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Shipment {payload.shipment_id} already exists")

    # Run initial inference
    pred = predictor.predict_shipment(payload.model_dump())

    sh_db = ShipmentDB(
        **payload.model_dump(),
        risk_score=pred["risk_score"],
        sla_breach_probability=pred["p_sla_breach"],
        delay_probability=pred["p_delay"],
        predicted_delay_minutes=pred["predicted_delay_minutes"],
        risk_category=pred["risk_category"],
        flagged_for_review=pred["flagged_for_review"],
        is_synthetic=True,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(sh_db)
    db.commit()
    db.refresh(sh_db)
    return sh_db

@router.get("/{shipment_id}/risk", response_model=ShipmentRiskResponse)
def get_shipment_risk(shipment_id: str, db: Session = Depends(get_db)):
    sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    return ShipmentRiskResponse(
        shipment_id=sh.shipment_id,
        risk_score=sh.risk_score,
        sla_breach_probability=sh.sla_breach_probability,
        delay_probability=sh.delay_probability,
        risk_category=sh.risk_category,
        flagged_for_review=sh.flagged_for_review,
        prediction_timestamp=sh.updated_at or datetime.now(timezone.utc),
        model_version="YOLO-FluxQ-LGBM-v1.0",
    )

@router.get("/{shipment_id}/eta", response_model=ShipmentETAResponse)
def get_shipment_eta(shipment_id: str, db: Session = Depends(get_db)):
    sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    return ShipmentETAResponse(
        shipment_id=sh.shipment_id,
        promised_delivery=sh.promised_delivery,
        predicted_eta=sh.current_eta,
        predicted_delay_minutes=sh.predicted_delay_minutes,
        remaining_distance_km=sh.remaining_distance_km,
        remaining_time_minutes=sh.remaining_time_minutes,
    )

@router.get("/{shipment_id}/explanation", response_model=ShipmentExplanationResponse)
def get_shipment_explanation(shipment_id: str, db: Session = Depends(get_db)):
    sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    # Fetch active disruption events to compute realistic route features for SHAP
    events = db.query(DisruptionEventDB).all()
    events_dicts = [
        {
            "event_id": e.event_id,
            "event_type": e.event_type,
            "severity": e.severity,
            "location": {"latitude": e.latitude, "longitude": e.longitude, "impact_radius_km": e.impact_radius_km},
            "temporal": {"start_time": e.start_time.isoformat(), "expected_end": e.expected_end.isoformat()},
            "impact_attributes": {"affected_mode": e.affected_mode, "estimated_delay_minutes": e.estimated_delay_minutes},
        }
        for e in events
    ]

    sh_dict = {
        "shipment_id": sh.shipment_id,
        "origin": sh.origin,
        "destination": sh.destination,
        "origin_lat": sh.origin_lat,
        "origin_lon": sh.origin_lon,
        "destination_lat": sh.destination_lat,
        "destination_lon": sh.destination_lon,
        "current_lat": sh.current_lat,
        "current_lon": sh.current_lon,
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
    }

    exposure = compute_shipment_exposure_profile(sh_dict, events_dicts)
    full_feat = {**sh_dict, **exposure}

    explanation = predictor.explain_prediction(full_feat, top_k=4)

    return ShipmentExplanationResponse(
        shipment_id=sh.shipment_id,
        risk_score=sh.risk_score,
        top_risk_drivers=explanation["top_risk_drivers"],
        disclaimer=explanation["disclaimer"],
    )

@router.patch("/{shipment_id}/priority", response_model=ShipmentResponse)
def update_shipment_priority(
    shipment_id: str,
    payload: ShipmentPriorityUpdate,
    db: Session = Depends(get_db)
):
    sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == shipment_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")
    
    old_priority = sh.cargo_priority
    old_type = sh.cargo_type
    old_risk = sh.risk_score
    old_status = sh.current_status

    sh.cargo_priority = payload.cargo_priority
    if payload.cargo_type:
        sh.cargo_type = payload.cargo_type
    elif payload.cargo_priority == 1:
        sh.cargo_type = "Life-Saving Medical (Insulin/Cold-Chain)"
    elif payload.cargo_priority == 2:
        sh.cargo_type = "High-Value Electronics"
    elif payload.cargo_priority == 3:
        sh.cargo_type = "Automotive / Precision Assemblies"
    elif payload.cargo_priority == 4:
        sh.cargo_type = "Standard Commercial Freight"

    if payload.cargo_priority == 1:
        sh.risk_score = max(sh.risk_score, 9)
        sh.risk_category = "Critical"
        sh.flagged_for_review = True
        if sh.current_status != "rerouted":
            sh.current_status = "critical"
        sh.sla_breach_probability = max(sh.sla_breach_probability, 0.95)
        sh.delay_probability = max(sh.delay_probability, 0.88)
        sh.predicted_delay_minutes = max(float(sh.predicted_delay_minutes or 0), 85.0)
    elif payload.cargo_priority == 2 and old_priority == 1:
        # Reverting from P1 to P2
        sh.risk_score = 3
        sh.risk_category = "Low"
        sh.flagged_for_review = False
        if sh.current_status == "critical":
            sh.current_status = "in_transit"

    sh.updated_at = datetime.now(timezone.utc)

    import uuid
    # Persist immutable audit log for this priority shift
    audit_entry = AuditLogDB(
        audit_id=f"AUD-{uuid.uuid4().hex[:12].upper()}-{sh.shipment_id}",
        shipment_id=sh.shipment_id,
        event_type="CARGO_PRIORITY_UPDATE",
        previous_state={"cargo_priority": old_priority, "cargo_type": old_type, "risk_score": old_risk, "status": old_status},
        new_state={
            "cargo_priority": sh.cargo_priority,
            "cargo_type": sh.cargo_type,
            "risk_score": sh.risk_score,
            "status": sh.current_status
        },
        trigger_source="CONTROL_TOWER_OPERATOR",
        operator_id="CONTROL_TOWER_DISPATCHER",
        justification=payload.reason or f"Priority adjusted to Tier {payload.cargo_priority}",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(sh)
    return sh

