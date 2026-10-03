"""
Shipment Data Generator & Loader for YOLO x FluxQ
Generates realistic, physics-grounded synthetic shipment records
along active logistics corridors with verified waypoint physics,
carrier behaviors, and ground-truth delay/SLA targets.
"""

import json
import os
from datetime import datetime, timedelta, timezone
import numpy as np

CITIES = {
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "region": "South"},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946, "region": "South"},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "region": "West"},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867, "region": "South"},
    "Delhi": {"lat": 28.7041, "lon": 77.1025, "region": "North"},
    "Pune": {"lat": 18.5204, "lon": 73.8567, "region": "West"},
    "Coimbatore": {"lat": 11.0168, "lon": 76.9558, "region": "South"},
}

CARRIERS = {
    "CARRIER-A": {"name": "Apex Ground Express", "mode": "ROAD", "reliability": 0.92, "cost_factor": 1.0},
    "CARRIER-B": {"name": "BlueDart Priority Fleet", "mode": "AIR", "reliability": 0.97, "cost_factor": 2.2},
    "CARRIER-C": {"name": "Corridor Logistics Heavy Freight", "mode": "ROAD", "reliability": 0.86, "cost_factor": 0.85},
    "CARRIER-D": {"name": "Deccan Coastal & Rail Haul", "mode": "MARITIME", "reliability": 0.88, "cost_factor": 0.65},
}

LANES = [
    {"origin": "Chennai", "destination": "Bengaluru", "distance_km": 345.0, "nominal_hours": 7.0, "route_id": "RT-MAA-BLR-01"},
    {"origin": "Bengaluru", "destination": "Chennai", "distance_km": 345.0, "nominal_hours": 7.0, "route_id": "RT-BLR-MAA-01"},
    {"origin": "Bengaluru", "destination": "Hyderabad", "distance_km": 570.0, "nominal_hours": 10.5, "route_id": "RT-BLR-HYD-01"},
    {"origin": "Chennai", "destination": "Hyderabad", "distance_km": 630.0, "nominal_hours": 12.0, "route_id": "RT-MAA-HYD-01"},
    {"origin": "Mumbai", "destination": "Pune", "distance_km": 150.0, "nominal_hours": 3.5, "route_id": "RT-BOM-PNQ-01"},
    {"origin": "Mumbai", "destination": "Delhi", "distance_km": 1420.0, "nominal_hours": 26.0, "route_id": "RT-BOM-DEL-01"},
    {"origin": "Chennai", "destination": "Coimbatore", "distance_km": 505.0, "nominal_hours": 9.5, "route_id": "RT-MAA-CJB-01"},
]

def generate_shipments(num_records: int = 2500, seed: int = 42) -> list[dict]:
    rng = np.random.default_rng(seed)
    shipments = []
    
    base_time = datetime(2026, 10, 1, 6, 0, 0, tzinfo=timezone.utc)
    
    # Ensure canonical demonstration shipment SH-2048 from YOLO.pdf Section 18 exists
    sh_2048 = {
        "shipment_id": "SH-2048",
        "order_id": "ORD-2048-REF",
        "origin": "Chennai",
        "destination": "Bengaluru",
        "origin_lat": 13.0827,
        "origin_lon": 80.2707,
        "destination_lat": 12.9716,
        "destination_lon": 77.5946,
        "current_lat": 12.9675,
        "current_lon": 79.9431,
        "transport_mode": "ROAD",
        "carrier_id": "CARRIER-A",
        "route_id": "RT-MAA-BLR-01",
        "planned_departure": (base_time + timedelta(hours=2)).isoformat(),
        "actual_departure": (base_time + timedelta(hours=2, minutes=5)).isoformat(),
        "promised_delivery": (base_time + timedelta(hours=12)).isoformat(), # 18:00
        "current_eta": (base_time + timedelta(hours=11, minutes=20)).isoformat(), # 17:20 initially
        "sla_hours": 10.0,
        "sla_buffer_minutes": 40.0,
        "cargo_type": "Automotive Electronics (Hyundai Mobis tier)",
        "cargo_priority": 1,
        "cargo_value_inr": 850000.0,
        "weight_kg": 1250.0,
        "current_status": "in_transit",
        "remaining_distance_km": 215.0,
        "remaining_time_minutes": 270.0,
        "is_synthetic": True,
        # Targets
        "actual_arrival": (base_time + timedelta(hours=14, minutes=15)).isoformat(), # 20:15 without recovery
        "actual_delay_minutes": 135.0,
        "sla_breached": 1,
        "delay_category": "Major Delay",
        "recovery_success": 1
    }
    shipments.append(sh_2048)
    
    for i in range(1, num_records):
        sh_id = f"SH-{2000 + i}"
        lane = rng.choice(LANES)
        carrier_id = rng.choice(list(CARRIERS.keys()))
        carrier = CARRIERS[carrier_id]
        
        dep_offset_hours = float(rng.uniform(0, 48))
        planned_dep = base_time + timedelta(hours=dep_offset_hours)
        dep_delay_mins = float(rng.exponential(scale=15.0)) if rng.random() < 0.25 else float(rng.uniform(0, 10))
        actual_dep = planned_dep + timedelta(minutes=dep_delay_mins)
        
        # Operational mode adjustment
        nominal_hours = lane["nominal_hours"]
        if carrier["mode"] == "AIR":
            nominal_hours = max(2.0, nominal_hours * 0.35)
        elif carrier["mode"] == "MARITIME":
            nominal_hours = nominal_hours * 1.8
            
        planned_arr = planned_dep + timedelta(hours=nominal_hours)
        sla_buffer_hours = float(rng.choice([1.0, 1.5, 2.0, 3.0, 4.0]))
        promised_delivery = planned_arr + timedelta(hours=sla_buffer_hours)
        
        # Route progress
        progress_pct = float(rng.uniform(0.1, 0.9))
        remaining_km = round(lane["distance_km"] * (1.0 - progress_pct), 1)
        
        # Current location interpolation
        orig_meta = CITIES[lane["origin"]]
        dest_meta = CITIES[lane["destination"]]
        cur_lat = round(orig_meta["lat"] + (dest_meta["lat"] - orig_meta["lat"]) * progress_pct, 4)
        cur_lon = round(orig_meta["lon"] + (dest_meta["lon"] - orig_meta["lon"]) * progress_pct, 4)
        
        # Transit physics & disruption shocks
        has_congestion = rng.random() < 0.30
        congestion_delay_mins = float(rng.gamma(shape=2.0, scale=35.0)) if has_congestion else 0.0
        
        has_weather = rng.random() < 0.20
        weather_delay_mins = float(rng.gamma(shape=1.5, scale=40.0)) if has_weather else 0.0
        
        total_delay_mins = dep_delay_mins + congestion_delay_mins + weather_delay_mins
        actual_transit_hours = nominal_hours + (total_delay_mins / 60.0)
        actual_arr = actual_dep + timedelta(hours=actual_transit_hours)
        
        sla_breached = 1 if actual_arr > promised_delivery else 0
        actual_delay_duration = max(0.0, (actual_arr - planned_arr).total_seconds() / 60.0)
        
        sla_buffer_mins = (promised_delivery - planned_arr).total_seconds() / 60.0 - (total_delay_mins * progress_pct)
        current_eta = planned_arr + timedelta(minutes=total_delay_mins * 0.85)
        
        # Status determination
        if sla_breached:
            status = "delayed" if progress_pct >= 0.9 else "critical"
        elif total_delay_mins > 30:
            status = "delayed"
        else:
            status = "in_transit"
            
        delay_cat = "On-Time" if actual_delay_duration <= 15 else (
            "Minor (< 1h)" if actual_delay_duration <= 60 else (
                "Moderate (1-3h)" if actual_delay_duration <= 180 else "Major (> 3h)"
            )
        )
        
        shipments.append({
            "shipment_id": sh_id,
            "order_id": f"ORD-{10000 + i}",
            "origin": lane["origin"],
            "destination": lane["destination"],
            "origin_lat": orig_meta["lat"],
            "origin_lon": orig_meta["lon"],
            "destination_lat": dest_meta["lat"],
            "destination_lon": dest_meta["lon"],
            "current_lat": cur_lat,
            "current_lon": cur_lon,
            "transport_mode": carrier["mode"],
            "carrier_id": carrier_id,
            "route_id": lane["route_id"],
            "planned_departure": planned_dep.isoformat(),
            "actual_departure": actual_dep.isoformat(),
            "promised_delivery": promised_delivery.isoformat(),
            "current_eta": current_eta.isoformat(),
            "sla_hours": round(nominal_hours + sla_buffer_hours, 1),
            "sla_buffer_minutes": round(sla_buffer_mins, 1),
            "cargo_type": rng.choice(["Automotive Components", "Pharmaceuticals", "Electronics", "Precision Tooling", "Textiles"]),
            "cargo_priority": int(rng.choice([1, 2, 3, 4], p=[0.15, 0.35, 0.35, 0.15])),
            "cargo_value_inr": float(round(rng.uniform(50000, 2500000), -2)),
            "weight_kg": float(round(rng.uniform(200, 18000), 1)),
            "current_status": status,
            "remaining_distance_km": remaining_km,
            "remaining_time_minutes": round(max(30.0, (remaining_km / 55.0) * 60.0), 1),
            "is_synthetic": True,
            # Ground truth outcome targets
            "actual_arrival": actual_arr.isoformat(),
            "actual_delay_minutes": round(actual_delay_duration, 1),
            "sla_breached": int(sla_breached),
            "delay_category": delay_cat,
            "recovery_success": 1 if sla_breached and rng.random() < 0.8 else 0
        })
        
    return shipments

def save_shipments_data(output_path: str = "data/synthetic/shipments_raw.json", num_records: int = 2500):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    data = generate_shipments(num_records=num_records)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return len(data)
