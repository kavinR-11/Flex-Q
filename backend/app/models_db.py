"""
SQLAlchemy Relational Models for YOLO x FluxQ
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship

from backend.app.database import Base

class ShipmentDB(Base):
    __tablename__ = "shipments"

    shipment_id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), index=True)
    origin = Column(String(64), nullable=False)
    destination = Column(String(64), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    current_lat = Column(Float, nullable=False)
    current_lon = Column(Float, nullable=False)
    transport_mode = Column(String(32), nullable=False)
    carrier_id = Column(String(64), nullable=False, index=True)
    route_id = Column(String(64), nullable=False)
    
    planned_departure = Column(DateTime, nullable=False)
    actual_departure = Column(DateTime, nullable=True)
    promised_delivery = Column(DateTime, nullable=False)
    current_eta = Column(DateTime, nullable=False)
    sla_hours = Column(Float, nullable=False)
    sla_buffer_minutes = Column(Float, nullable=False)
    
    cargo_type = Column(String(128), default="General Freight")
    cargo_priority = Column(Integer, default=2)
    cargo_value_inr = Column(Float, default=100000.0)
    weight_kg = Column(Float, default=500.0)
    current_status = Column(String(32), default="in_transit", index=True)
    
    remaining_distance_km = Column(Float, default=0.0)
    remaining_time_minutes = Column(Float, default=0.0)
    
    # Model Scoring Outputs
    risk_score = Column(Integer, default=1, index=True)
    sla_breach_probability = Column(Float, default=0.05)
    delay_probability = Column(Float, default=0.05)
    predicted_delay_minutes = Column(Float, default=0.0)
    risk_category = Column(String(32), default="Low")
    flagged_for_review = Column(Boolean, default=False)
    
    is_synthetic = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    recovery_plans = relationship("RecoveryPlanDB", back_populates="shipment", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLogDB", back_populates="shipment", cascade="all, delete-orphan")


class DisruptionEventDB(Base):
    __tablename__ = "disruption_events"

    event_id = Column(String(64), primary_key=True, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    severity = Column(Float, nullable=False)
    location_name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    impact_radius_km = Column(Float, nullable=False)
    affected_mode = Column(String(32), default="ROAD")
    estimated_delay_minutes = Column(Integer, default=0)
    
    start_time = Column(DateTime, nullable=False)
    expected_end = Column(DateTime, nullable=False)
    actual_end = Column(DateTime, nullable=True)
    
    source = Column(String(128), default="SIMULATED_DISRUPTION_LAB")
    confidence = Column(Float, default=0.95)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RecoveryPlanDB(Base):
    __tablename__ = "recovery_plans"

    recovery_id = Column(String(64), primary_key=True, index=True)
    shipment_id = Column(String(64), ForeignKey("shipments.shipment_id"), nullable=False, index=True)
    plan_strategy = Column(String(64), nullable=False)  # LOW_COST, MIN_DELAY, MAX_SLA, BALANCED
    action_type = Column(String(64), nullable=False)    # MAINTAIN_ROUTE, ALTERNATE_ROUTE, CARRIER_SWITCH, EXPEDITE, HOLD_MONITOR, ESCALATE
    
    alternate_route_name = Column(String(128), nullable=True)
    alternate_carrier_id = Column(String(64), nullable=True)
    additional_cost_inr = Column(Float, default=0.0)
    predicted_eta = Column(DateTime, nullable=False)
    expected_delay_minutes = Column(Float, default=0.0)
    sla_outcome = Column(String(64), default="WITHIN_COMMITMENT")
    is_feasible = Column(Boolean, default=True)
    
    approval_status = Column(String(32), default="PENDING", index=True) # PENDING, APPROVED, REJECTED, SUPERSEDED
    operator_id = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    shipment = relationship("ShipmentDB", back_populates="recovery_plans")


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(String(64), primary_key=True, index=True)
    shipment_id = Column(String(64), ForeignKey("shipments.shipment_id"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    trigger_source = Column(String(64), default="SYSTEM_ORCHESTRATOR")
    operator_id = Column(String(64), nullable=True)
    justification = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    shipment = relationship("ShipmentDB", back_populates="audit_logs")


class CarrierDB(Base):
    __tablename__ = "carriers"

    carrier_id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    mode = Column(String(32), nullable=False)
    reliability = Column(Float, default=0.90)
    cost_factor = Column(Float, default=1.0)
    available_capacity = Column(Integer, default=50)
