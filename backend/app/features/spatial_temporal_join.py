"""
Spatial-Temporal Join Module for YOLO x FluxQ
Calculates geodetic distances (Haversine formula), checks time overlaps,
and measures exposure scores between shipments and external disruption events.
"""

import math
from datetime import datetime, timezone

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Great Circle distance between two points on Earth in kilometers.
    """
    R = 6371.0  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def check_temporal_overlap(
    sh_start_iso: str, sh_end_iso: str, evt_start_iso: str, evt_end_iso: str
) -> bool:
    """
    Returns True if shipment transit window overlaps with disruption event duration.
    """
    sh_start = datetime.fromisoformat(sh_start_iso.replace("Z", "+00:00"))
    sh_end = datetime.fromisoformat(sh_end_iso.replace("Z", "+00:00"))
    evt_start = datetime.fromisoformat(evt_start_iso.replace("Z", "+00:00"))
    evt_end = datetime.fromisoformat(evt_end_iso.replace("Z", "+00:00"))
    
    return max(sh_start, evt_start) <= min(sh_end, evt_end)

def calculate_shipment_event_exposure(shipment: dict, event: dict) -> dict | None:
    """
    Calculates spatial-temporal exposure of a shipment to a specific disruption event.
    Returns exposure dict or None if out of influence range.
    """
    evt_loc = event["location"]
    evt_lat = evt_loc["latitude"]
    evt_lon = evt_loc["longitude"]
    radius_km = evt_loc["impact_radius_km"]
    
    # Check current position distance
    cur_dist = haversine_distance_km(
        shipment["current_lat"], shipment["current_lon"], evt_lat, evt_lon
    )
    
    # Check origin/dest proximity to see if event is on the corridor
    orig_dist = haversine_distance_km(shipment["origin_lat"], shipment["origin_lon"], evt_lat, evt_lon)
    dest_dist = haversine_distance_km(shipment["destination_lat"], shipment["destination_lon"], evt_lat, evt_lon)
    corridor_dist = min(cur_dist, orig_dist, dest_dist)
    
    # Buffer threshold: inside radius or within 1.5x radius corridor
    if corridor_dist > (radius_km * 2.5):
        return None
        
    # Check temporal overlap
    if not check_temporal_overlap(
        shipment["planned_departure"], shipment["current_eta"],
        event["temporal"]["start_time"], event["temporal"]["expected_end"]
    ):
        return None
        
    # Mode relevance check
    affected_mode = event["impact_attributes"]["affected_mode"]
    mode_match = (affected_mode == "ALL") or (affected_mode == shipment["transport_mode"])
    if not mode_match:
        return None
        
    severity = float(event["severity"])
    # Normalized proximity weight: 1.0 at epicenter, decaying to 0.0 at radius edge
    proximity_weight = max(0.05, 1.0 - (corridor_dist / max(10.0, radius_km * 2.5)))
    exposure_score = round(severity * proximity_weight, 2)
    
    return {
        "shipment_id": shipment["shipment_id"],
        "event_id": event["event_id"],
        "event_type": event["event_type"],
        "distance_to_event_km": corridor_dist,
        "event_severity": severity,
        "impact_radius_km": radius_km,
        "estimated_delay_impact": event["impact_attributes"]["estimated_delay_minutes"],
        "exposure_score": exposure_score
    }
