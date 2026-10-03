"""
FastAPI Main Application for YOLO x FluxQ
Predictive Shipment Risk Intelligence & Hybrid Recovery Platform
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models_db import ShipmentDB, DisruptionEventDB, CarrierDB, AuditLogDB
from backend.app.api.health import router as health_router
from backend.app.api.shipments import router as shipments_router
from backend.app.api.events import router as events_router
from backend.app.api.recovery import router as recovery_router
from backend.app.api.audit import router as audit_router

def seed_database_if_empty():
    db = SessionLocal()
    try:
        count = db.query(ShipmentDB).count()
        if count > 0:
            return  # Already seeded
            
        print("[Lifespan] Seeding database with normalized shipments and events...")
        
        # 1. Seed Carriers
        if db.query(CarrierDB).count() == 0:
            carriers = [
                CarrierDB(carrier_id="CARRIER-A", name="Apex Ground Express", mode="ROAD", reliability=0.92, cost_factor=1.0, available_capacity=45),
                CarrierDB(carrier_id="CARRIER-B", name="BlueDart Priority Air", mode="AIR", reliability=0.97, cost_factor=2.2, available_capacity=15),
                CarrierDB(carrier_id="CARRIER-C", name="Corridor Logistics Freight", mode="ROAD", reliability=0.86, cost_factor=0.85, available_capacity=60),
                CarrierDB(carrier_id="CARRIER-D", name="Deccan Coastal Haul", mode="MARITIME", reliability=0.88, cost_factor=0.65, available_capacity=80),
            ]
            db.add_all(carriers)
            db.commit()

        # 2. Seed Normalized Events
        events_file = "data/normalized/normalized_events.json"
        if os.path.exists(events_file) and db.query(DisruptionEventDB).count() == 0:
            with open(events_file, "r", encoding="utf-8") as f:
                events_data = json.load(f)
            for e in events_data:
                evt_db = DisruptionEventDB(
                    event_id=e["event_id"],
                    event_type=e["event_type"],
                    severity=e["severity"],
                    location_name=e["location"]["name"],
                    latitude=e["location"]["latitude"],
                    longitude=e["location"]["longitude"],
                    impact_radius_km=e["location"]["impact_radius_km"],
                    affected_mode=e["impact_attributes"]["affected_mode"],
                    estimated_delay_minutes=e["impact_attributes"]["estimated_delay_minutes"],
                    start_time=datetime.fromisoformat(e["temporal"]["start_time"]),
                    expected_end=datetime.fromisoformat(e["temporal"]["expected_end"]),
                    source=e["provenance"]["source"],
                    confidence=e["provenance"]["confidence"],
                    is_simulated=e["provenance"]["is_simulated"],
                )
                db.add(evt_db)
            db.commit()

        # 3. Seed Normalized Shipments
        shipments_file = "data/normalized/normalized_shipments.json"
        if os.path.exists(shipments_file):
            with open(shipments_file, "r", encoding="utf-8") as f:
                shipments_data = json.load(f)
            
            seen_ids = set()
            for sh in shipments_data[:250]:
                if sh["shipment_id"] in seen_ids:
                    continue
                seen_ids.add(sh["shipment_id"])
                
                sh_db = ShipmentDB(
                    shipment_id=sh["shipment_id"],
                    order_id=sh["order_id"],
                    origin=sh["origin"],
                    destination=sh["destination"],
                    origin_lat=sh["origin_lat"],
                    origin_lon=sh["origin_lon"],
                    destination_lat=sh["destination_lat"],
                    destination_lon=sh["destination_lon"],
                    current_lat=sh["current_lat"],
                    current_lon=sh["current_lon"],
                    transport_mode=sh["transport_mode"],
                    carrier_id=sh["carrier_id"],
                    route_id=sh["route_id"],
                    planned_departure=datetime.fromisoformat(sh["planned_departure"]),
                    actual_departure=datetime.fromisoformat(sh["actual_departure"]),
                    promised_delivery=datetime.fromisoformat(sh["promised_delivery"]),
                    current_eta=datetime.fromisoformat(sh["current_eta"]),
                    sla_hours=sh["sla_hours"],
                    sla_buffer_minutes=sh["sla_buffer_minutes"],
                    cargo_type=sh["cargo_type"],
                    cargo_priority=sh["cargo_priority"],
                    cargo_value_inr=sh["cargo_value_inr"],
                    weight_kg=sh["weight_kg"],
                    current_status=sh["current_status"],
                    remaining_distance_km=sh["remaining_distance_km"],
                    remaining_time_minutes=sh["remaining_time_minutes"],
                    risk_score=sh["risk_score"],
                    sla_breach_probability=sh["baseline_p_sla"],
                    delay_probability=min(0.99, sh["baseline_p_sla"] * 1.1),
                    predicted_delay_minutes=max(0.0, -sh["sla_buffer_minutes"] if sh["sla_buffer_minutes"] < 0 else 0.0),
                    risk_category=sh["risk_category"],
                    flagged_for_review=bool(sh["risk_score"] >= 7),
                    is_synthetic=True,
                )
                db.add(sh_db)
            db.commit()

        # 4. Seed Initial Audit Log for Reference Shipment SH-2048
        if db.query(AuditLogDB).filter_by(audit_id="AUD-SH-2048-INIT").first() is None:
            audit_init = AuditLogDB(
                audit_id="AUD-SH-2048-INIT",
                shipment_id="SH-2048",
                event_type="SHIPMENT_REGISTERED",
                previous_state=None,
                new_state={"status": "in_transit", "origin": "Chennai", "destination": "Bengaluru", "risk_score": 2},
                trigger_source="INITIAL_LOGISTICS_REGISTRATION",
                operator_id="SYSTEM",
                justification="Consignment SH-2048 initialized for Chennai-Bengaluru corridor delivery.",
                timestamp=datetime.now(timezone.utc),
            )
            db.add(audit_init)
            db.commit()

        print(f"[Lifespan] Database seeding complete: {db.query(ShipmentDB).count()} shipments loaded.")
    finally:
        db.close()

# Ensure tables exist
Base.metadata.create_all(bind=engine)
seed_database_if_empty()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Predictive Shipment Risk Intelligence & Classical / Quantum-Hybrid Recovery Optimization API",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(shipments_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(recovery_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR,
    }
