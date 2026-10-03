"""
Event Normalizer for YOLO x FluxQ
Converts raw heterogeneous feeds (weather, traffic, port, flight, seismic)
into the unified canonical DisruptionEvent schema.
"""

from datetime import datetime, timezone
import json

def normalize_weather_event(wx_record: dict) -> dict | None:
    # Only observations with significant atmospheric impact qualify as operational disruption events
    if wx_record.get("severity_score", 0.0) < 3.0:
        return None
        
    start_dt = wx_record["timestamp"]
    # Estimate a standard 6-hour convective weather impact window
    start_time = datetime.fromisoformat(start_dt.replace("Z", "+00:00"))
    expected_end = start_time.replace(hour=(start_time.hour + 6) % 24)
    
    return {
        "event_id": f"EVT-{wx_record['observation_id']}",
        "event_type": "SEVERE_WEATHER",
        "severity": round(float(wx_record["severity_score"]), 1),
        "location": {
            "name": f"{wx_record['location_name']} Weather Node",
            "latitude": round(float(wx_record["latitude"]), 4),
            "longitude": round(float(wx_record["longitude"]), 4),
            "country": "IND",
            "impact_radius_km": 35.0 if wx_record["severity_score"] < 6.0 else 60.0
        },
        "temporal": {
            "start_time": start_time.isoformat(),
            "expected_end": expected_end.isoformat(),
            "actual_end": None
        },
        "impact_attributes": {
            "affected_mode": "ROAD",
            "estimated_delay_minutes": int(wx_record["severity_score"] * 18),
            "capacity_reduction_pct": round(float(wx_record["severity_score"] * 6.5), 1),
            "speed_reduction_pct": round(float(wx_record["severity_score"] * 7.0), 1)
        },
        "provenance": {
            "source": wx_record.get("source", "Open-Meteo ERA5 Reanalysis"),
            "confidence": 0.92,
            "is_simulated": True
        }
    }

def normalize_traffic_event(trf_record: dict) -> dict | None:
    # Only records with active congestion index >= 4.0 or an incident reported qualify as disruption events
    if trf_record.get("congestion_index", 0.0) < 4.0 and not trf_record.get("incident_reported", False):
        return None
        
    start_dt = trf_record["timestamp"]
    start_time = datetime.fromisoformat(start_dt.replace("Z", "+00:00"))
    expected_end = start_time.replace(hour=(start_time.hour + 4) % 24)
    
    # Calculate midpoint coordinates along segment
    mid_lat = round(12.9675 + (float(trf_record.get("delay_minutes", 0)) * 0.001), 4)
    mid_lon = round(79.9431 + (float(trf_record.get("delay_minutes", 0)) * 0.001), 4)
    
    event_type = "ROAD_CLOSURE" if trf_record.get("lane_closure_flag", 0) == 1 else "TRAFFIC_CONGESTION"
    severity = min(10.0, max(1.0, float(trf_record["congestion_index"])))
    
    return {
        "event_id": f"EVT-TRF-{trf_record['segment_id']}-{trf_record['timestamp'][:13].replace(':', '')}",
        "event_type": event_type,
        "severity": round(severity, 1),
        "location": {
            "name": f"{trf_record['segment_name']} Corridor",
            "latitude": mid_lat,
            "longitude": mid_lon,
            "country": "IND",
            "impact_radius_km": 20.0
        },
        "temporal": {
            "start_time": start_time.isoformat(),
            "expected_end": expected_end.isoformat(),
            "actual_end": None
        },
        "impact_attributes": {
            "affected_mode": "ROAD",
            "estimated_delay_minutes": int(trf_record["delay_minutes"]),
            "capacity_reduction_pct": 50.0 if trf_record.get("lane_closure_flag") else 25.0,
            "speed_reduction_pct": round(float((1.0 - trf_record["current_speed_kmh"] / trf_record["free_flow_speed_kmh"]) * 100.0), 1)
        },
        "provenance": {
            "source": trf_record.get("source", "NHAI Corridor Telematics"),
            "confidence": 0.95,
            "is_simulated": True
        }
    }

def normalize_port_event(port_record: dict) -> dict | None:
    if port_record.get("port_congestion_index", 0.0) < 4.0:
        return None
        
    start_time = datetime.fromisoformat(f"{port_record['date']}T00:00:00+00:00")
    expected_end = datetime.fromisoformat(f"{port_record['date']}T23:59:59+00:00")
    
    return {
        "event_id": f"EVT-{port_record['report_id']}",
        "event_type": "PORT_CONGESTION",
        "severity": round(float(port_record["port_congestion_index"]), 1),
        "location": {
            "name": port_record["port_name"],
            "latitude": round(float(port_record["latitude"]), 4),
            "longitude": round(float(port_record["longitude"]), 4),
            "country": "IND",
            "impact_radius_km": 25.0
        },
        "temporal": {
            "start_time": start_time.isoformat(),
            "expected_end": expected_end.isoformat(),
            "actual_end": None
        },
        "impact_attributes": {
            "affected_mode": "MARITIME",
            "estimated_delay_minutes": int(port_record["vessel_waiting_time_hours"] * 60),
            "capacity_reduction_pct": round(float(port_record["berth_occupancy_rate"] * 40.0), 1),
            "speed_reduction_pct": 0.0
        },
        "provenance": {
            "source": port_record.get("source", "IPA / UNCTAD"),
            "confidence": 0.90,
            "is_simulated": True
        }
    }

def normalize_hazard_event(hazard_record: dict) -> dict:
    return {
        "event_id": hazard_record["event_id"],
        "event_type": hazard_record["event_type"],
        "severity": round(float(hazard_record["severity"]), 1),
        "location": {
            "name": hazard_record["location_name"],
            "latitude": round(float(hazard_record["latitude"]), 4),
            "longitude": round(float(hazard_record["longitude"]), 4),
            "country": "IND",
            "impact_radius_km": round(float(hazard_record["impact_radius_km"]), 1)
        },
        "temporal": {
            "start_time": hazard_record["start_time"],
            "expected_end": hazard_record["expected_end"],
            "actual_end": None
        },
        "impact_attributes": {
            "affected_mode": hazard_record["affected_mode"],
            "estimated_delay_minutes": hazard_record["estimated_delay_minutes"],
            "capacity_reduction_pct": 60.0,
            "speed_reduction_pct": 40.0
        },
        "provenance": {
            "source": hazard_record["source"],
            "confidence": 0.98,
            "is_simulated": hazard_record.get("is_simulated", False)
        }
    }
