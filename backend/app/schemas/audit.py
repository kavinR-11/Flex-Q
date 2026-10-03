"""
Pydantic Schemas for Decision Auditing
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

class AuditLogEntry(BaseModel):
    audit_id: str
    shipment_id: str
    event_type: str
    previous_state: Optional[dict[str, Any]] = None
    new_state: Optional[dict[str, Any]] = None
    trigger_source: str
    operator_id: Optional[str] = None
    justification: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
