"""
Disruption Compiler API Router for YOLO x FluxQ
Translates real-world disruptions into mathematical matrices, weights, and constraints.
"""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.app.database import get_db
from backend.app.models_db import ShipmentDB
from backend.app.services.disruption_compiler import DisruptionCompiler

router = APIRouter(tags=["Disruption Compiler"])

compiler_service = DisruptionCompiler()

class CompileRequest(BaseModel):
    event_type: str = "PRODUCT_PRIORITY"  # PRODUCT_PRIORITY | TRANSPORT_FAILURE | REGIONAL_DISASTER
    target_id: str = "SH-2048"            # Consignment ID, Hub Name, or Region Corridor
    severity: float = 1.0

# In-memory cached compiler state
_last_compiled_state = None

@router.post("/compiler/compile")
def compile_disruption_event(payload: CompileRequest, db: Session = Depends(get_db)):
    global _last_compiled_state
    state = compiler_service.compile_disruption(
        db=db,
        event_type=payload.event_type,
        target_id=payload.target_id,
        severity=payload.severity
    )
    _last_compiled_state = state
    return state

@router.get("/compiler/state")
def get_compiler_state(db: Session = Depends(get_db)):
    global _last_compiled_state
    if not _last_compiled_state:
        # Default baseline compilation with no active pillar override
        _last_compiled_state = compiler_service.compile_disruption(
            db=db,
            event_type="BASELINE",
            target_id="NONE",
            severity=1.0
        )
    elif "impacted_consignments" in _last_compiled_state and _last_compiled_state["impacted_consignments"]:
        # Synchronize live status from DB for all flagged consignments
        ids = [c["shipment_id"] for c in _last_compiled_state["impacted_consignments"]]
        db_ships = {s.shipment_id: s for s in db.query(ShipmentDB).filter(ShipmentDB.shipment_id.in_(ids)).all()}
        for c in _last_compiled_state["impacted_consignments"]:
            db_s = db_ships.get(c["shipment_id"])
            if db_s:
                c["current_status"] = db_s.current_status
                c["carrier_id"] = db_s.carrier_id
                c["risk_score"] = db_s.risk_score
                if db_s.current_status == "rerouted":
                    c["recovery_status"] = "REROUTED_COMPLETED"
    return _last_compiled_state

@router.post("/compiler/reset")
def reset_compiler_state(db: Session = Depends(get_db)):
    global _last_compiled_state
    # Restore sample shipments priority to baseline if needed
    sh = db.query(ShipmentDB).filter(ShipmentDB.shipment_id == "SH-2048").first()
    if sh:
        sh.cargo_priority = 2
        sh.cargo_type = "High-Value Electronics"
        sh.risk_score = 2
        sh.current_status = "on-time"
        db.commit()

    _last_compiled_state = compiler_service.compile_disruption(
        db=db,
        event_type="BASELINE",
        target_id="NONE",
        severity=1.0
    )
    return {"status": "reset", "state": _last_compiled_state}
