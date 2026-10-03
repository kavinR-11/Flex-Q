"""
Shipment Normalizer for YOLO x FluxQ
Validates shipment records, checks coordinates, cleans timelines,
and computes standardized baseline attributes.
"""

from datetime import datetime, timezone
import math

def normalize_shipment_record(raw: dict) -> dict:
    # Validate required fields
    required_keys = ["shipment_id", "origin", "destination", "transport_mode", "carrier_id", "promised_delivery"]
    for k in required_keys:
        if k not in raw:
            raise ValueError(f"Shipment record missing required key: {k}")
            
    # Validate coordinates
    for coord in ["origin_lat", "origin_lon", "destination_lat", "destination_lon", "current_lat", "current_lon"]:
        val = raw.get(coord)
        if val is None or not (-90.0 <= val <= 90.0 if "lat" in coord else -180.0 <= val <= 180.0):
            raise ValueError(f"Invalid coordinate value for {coord}: {val}")
            
    # Parse and enforce standard UTC ISO timestamps
    planned_dep = datetime.fromisoformat(raw["planned_departure"].replace("Z", "+00:00"))
    promised_del = datetime.fromisoformat(raw["promised_delivery"].replace("Z", "+00:00"))
    current_eta = datetime.fromisoformat(raw["current_eta"].replace("Z", "+00:00"))
    
    if promised_del < planned_dep:
        raise ValueError(f"Promised delivery {promised_del} is earlier than planned departure {planned_dep}")
        
    # Baseline SLA buffer in minutes: (promised_delivery - current_eta)
    current_buffer_mins = (promised_del - current_eta).total_seconds() / 60.0
    
    # Baseline heuristic risk probability prior to ML inference
    # Buffer < 0 -> high probability of breach; Buffer > 180 -> low probability
    if current_buffer_mins <= 0:
        p_sla_est = min(0.98, 0.70 + abs(current_buffer_mins) / 300.0)
    elif current_buffer_mins < 60:
        p_sla_est = 0.50 + (60 - current_buffer_mins) / 120.0
    elif current_buffer_mins < 120:
        p_sla_est = 0.25 + (120 - current_buffer_mins) / 240.0
    else:
        p_sla_est = max(0.05, 0.20 - (current_buffer_mins - 120) / 600.0)
        
    p_sla_est = round(min(0.99, max(0.01, p_sla_est)), 3)
    
    # Official standardized risk score 1-10:
    # R = max(1, min(10, ceil(10 * p)))
    risk_score = max(1, min(10, math.ceil(10.0 * p_sla_est)))
    
    risk_category = "Critical" if risk_score >= 9 else (
        "High" if risk_score >= 7 else (
            "Moderate" if risk_score >= 4 else "Low"
        )
    )
    
    return {
        "shipment_id": str(raw["shipment_id"]).strip(),
        "order_id": str(raw.get("order_id", f"ORD-{raw['shipment_id']}")).strip(),
        "origin": str(raw["origin"]).strip(),
        "destination": str(raw["destination"]).strip(),
        "origin_lat": round(float(raw["origin_lat"]), 4),
        "origin_lon": round(float(raw["origin_lon"]), 4),
        "destination_lat": round(float(raw["destination_lat"]), 4),
        "destination_lon": round(float(raw["destination_lon"]), 4),
        "current_lat": round(float(raw["current_lat"]), 4),
        "current_lon": round(float(raw["current_lon"]), 4),
        "transport_mode": str(raw["transport_mode"]).upper().strip(),
        "carrier_id": str(raw["carrier_id"]).strip(),
        "route_id": str(raw.get("route_id", "DEFAULT-ROUTE")).strip(),
        "planned_departure": planned_dep.isoformat(),
        "actual_departure": raw.get("actual_departure", planned_dep.isoformat()),
        "promised_delivery": promised_del.isoformat(),
        "current_eta": current_eta.isoformat(),
        "sla_hours": float(raw.get("sla_hours", 8.0)),
        "sla_buffer_minutes": round(current_buffer_mins, 1),
        "cargo_type": str(raw.get("cargo_type", "General Freight")),
        "cargo_priority": int(raw.get("cargo_priority", 2)),
        "cargo_value_inr": float(raw.get("cargo_value_inr", 100000.0)),
        "weight_kg": float(raw.get("weight_kg", 500.0)),
        "current_status": str(raw.get("current_status", "in_transit")),
        "remaining_distance_km": round(float(raw.get("remaining_distance_km", 100.0)), 1),
        "remaining_time_minutes": round(float(raw.get("remaining_time_minutes", 120.0)), 1),
        "baseline_p_sla": p_sla_est,
        "risk_score": risk_score,
        "risk_category": risk_category,
        "is_synthetic": bool(raw.get("is_synthetic", True)),
        # Quarantined ground truth targets
        "target_actual_arrival": raw.get("actual_arrival"),
        "target_actual_delay_minutes": float(raw.get("actual_delay_minutes", 0.0)),
        "target_sla_breached": int(raw.get("sla_breached", 0)),
        "target_delay_category": str(raw.get("delay_category", "On-Time"))
    }
