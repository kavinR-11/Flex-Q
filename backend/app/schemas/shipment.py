"""
Pydantic Schemas for Shipment Management & Prediction
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

class ShipmentBase(BaseModel):
    shipment_id: str
    order_id: Optional[str] = None
    origin: str
    destination: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    current_lat: float
    current_lon: float
    transport_mode: Literal["ROAD", "AIR", "MARITIME", "RAIL"]
    carrier_id: str
    route_id: str
    planned_departure: datetime
    promised_delivery: datetime
    current_eta: datetime
    sla_hours: float
    sla_buffer_minutes: float
    cargo_type: str = "General Freight"
    cargo_priority: int = Field(ge=1, le=4, default=2)
    cargo_value_inr: float = 100000.0
    weight_kg: float = 500.0
    current_status: str = "in_transit"

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    actual_departure: Optional[datetime] = None
    remaining_distance_km: float = 0.0
    remaining_time_minutes: float = 0.0
    risk_score: int = Field(ge=1, le=10, default=1)
    sla_breach_probability: float = 0.05
    delay_probability: float = 0.05
    predicted_delay_minutes: float = 0.0
    risk_category: str = "Low"
    flagged_for_review: bool = False
    is_synthetic: bool = True
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShipmentRiskResponse(BaseModel):
    shipment_id: str
    risk_score: int
    sla_breach_probability: float
    delay_probability: float
    risk_category: str
    flagged_for_review: bool
    prediction_timestamp: datetime
    model_version: str

class ShipmentETAResponse(BaseModel):
    shipment_id: str
    promised_delivery: datetime
    predicted_eta: datetime
    predicted_delay_minutes: float
    remaining_distance_km: float
    remaining_time_minutes: float

class ShapFactor(BaseModel):
    feature: str
    shap_impact: float
    direction: Literal["INCREASING_RISK", "REDUCING_RISK"]

class ShipmentExplanationResponse(BaseModel):
    shipment_id: str
    risk_score: int
    top_risk_drivers: list[ShapFactor]
    disclaimer: str
