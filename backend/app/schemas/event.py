"""
Pydantic Schemas for Disruption Event Management & Simulation
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

class EventCreate(BaseModel):
    event_type: Literal[
        "SEVERE_WEATHER",
        "TRAFFIC_CONGESTION",
        "PORT_CONGESTION",
        "FLIGHT_DELAY",
        "HAZARD_EARTHQUAKE",
        "ROAD_CLOSURE"
    ]
    severity: float = Field(ge=0.0, le=10.0)
    location_name: str
    latitude: float
    longitude: float
    impact_radius_km: float = 25.0
    affected_mode: Literal["ROAD", "AIR", "MARITIME", "RAIL", "ALL"] = "ROAD"
    estimated_delay_minutes: int = 60
    start_time: Optional[datetime] = None
    expected_end: Optional[datetime] = None
    source: str = "SIMULATED_DISRUPTION_LAB"

class EventResponse(BaseModel):
    event_id: str
    event_type: str
    severity: float
    location_name: str
    latitude: float
    longitude: float
    impact_radius_km: float
    affected_mode: str
    estimated_delay_minutes: int
    start_time: datetime
    expected_end: datetime
    source: str
    is_simulated: bool

    class Config:
        from_attributes = True

class AffectedShipmentDetail(BaseModel):
    shipment_id: str
    origin: str
    destination: str
    cargo_type: str
    cargo_priority: int
    new_risk_score: int
    predicted_delay_minutes: float
    sla_breach_probability: float

class EventTriggerResponse(BaseModel):
    event_id: str
    affected_shipments_count: int
    affected_shipment_ids: list[str]
    affected_shipments: Optional[list[AffectedShipmentDetail]] = None
    recomputed_status: str
