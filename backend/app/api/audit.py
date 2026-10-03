"""
Audit Trail API Router for YOLO x FluxQ
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models_db import AuditLogDB
from backend.app.schemas.audit import AuditLogEntry

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/{shipment_id}", response_model=list[AuditLogEntry])
def get_shipment_audit_trail(shipment_id: str, db: Session = Depends(get_db)):
    logs = db.query(AuditLogDB).filter(AuditLogDB.shipment_id == shipment_id).order_by(AuditLogDB.timestamp.desc()).all()
    return logs

@router.get("", response_model=list[AuditLogEntry])
def list_system_audit_logs(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    logs = db.query(AuditLogDB).order_by(AuditLogDB.timestamp.desc()).limit(limit).all()
    return logs

@router.delete("", response_model=dict)
def clear_audit_logs(db: Session = Depends(get_db)):
    """Purges all audit logs to start a fresh, clean demo session."""
    deleted_count = db.query(AuditLogDB).delete()
    db.commit()
    return {"status": "CLEARED", "deleted_entries": deleted_count}

