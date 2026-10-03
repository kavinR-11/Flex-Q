"""
Normalization Pipeline Runner for YOLO x FluxQ
Orchestrates raw dataset normalization into canonical schemas.
"""

import json
import os
import time

from backend.app.data_engineering.event_normalizer import (
    normalize_weather_event,
    normalize_traffic_event,
    normalize_port_event,
    normalize_hazard_event,
)
from backend.app.data_engineering.shipment_normalizer import normalize_shipment_record

def run_normalization() -> dict:
    os.makedirs("data/normalized", exist_ok=True)
    start_time = time.time()
    print("[Normalization] Starting Data Normalization Pipeline...")
    
    # 1. Normalize Events from all raw feeds
    normalized_events = []
    
    # Weather
    weather_file = "data/raw/weather/open_meteo_corridor.json"
    if os.path.exists(weather_file):
        with open(weather_file, "r", encoding="utf-8") as f:
            wx_data = json.load(f)
        for r in wx_data:
            evt = normalize_weather_event(r)
            if evt:
                normalized_events.append(evt)
        print(f"  -> Extracted {len(normalized_events)} significant weather disruption events.")
        
    # Traffic
    traffic_file = "data/raw/traffic/nhai_corridors.json"
    traffic_evt_count = 0
    if os.path.exists(traffic_file):
        with open(traffic_file, "r", encoding="utf-8") as f:
            trf_data = json.load(f)
        for r in trf_data:
            evt = normalize_traffic_event(r)
            if evt:
                normalized_events.append(evt)
                traffic_evt_count += 1
        print(f"  -> Extracted {traffic_evt_count} traffic/closure disruption events.")
        
    # Ports
    port_file = "data/raw/ports/ipa_port_telematics.json"
    port_evt_count = 0
    if os.path.exists(port_file):
        with open(port_file, "r", encoding="utf-8") as f:
            port_data = json.load(f)
        for r in port_data:
            evt = normalize_port_event(r)
            if evt:
                normalized_events.append(evt)
                port_evt_count += 1
        print(f"  -> Extracted {port_evt_count} port delay/berth congestion events.")
        
    # Hazards
    hazard_file = "data/raw/hazards/usgs_seismic_events.json"
    hazard_evt_count = 0
    if os.path.exists(hazard_file):
        with open(hazard_file, "r", encoding="utf-8") as f:
            hz_data = json.load(f)
        for r in hz_data:
            evt = normalize_hazard_event(r)
            if evt:
                normalized_events.append(evt)
                hazard_evt_count += 1
        print(f"  -> Extracted {hazard_evt_count} seismic and infrastructure hazard events.")
        
    # Save Normalized Events
    events_output = "data/normalized/normalized_events.json"
    with open(events_output, "w", encoding="utf-8") as f:
        json.dump(normalized_events, f, indent=2)
    print(f"  => Total normalized events: {len(normalized_events)} saved to {events_output}")
    
    # 2. Normalize Shipments
    shipment_file = "data/synthetic/shipments_raw.json"
    normalized_shipments = []
    if os.path.exists(shipment_file):
        with open(shipment_file, "r", encoding="utf-8") as f:
            sh_data = json.load(f)
        for raw_sh in sh_data:
            norm_sh = normalize_shipment_record(raw_sh)
            normalized_shipments.append(norm_sh)
        print(f"  -> Successfully normalized {len(normalized_shipments)} shipments.")
        
    shipments_output = "data/normalized/normalized_shipments.json"
    with open(shipments_output, "w", encoding="utf-8") as f:
        json.dump(normalized_shipments, f, indent=2)
    print(f"  => Total normalized shipments: {len(normalized_shipments)} saved to {shipments_output}")
    
    duration = time.time() - start_time
    summary = {
        "status": "SUCCESS",
        "normalized_events_count": len(normalized_events),
        "normalized_shipments_count": len(normalized_shipments),
        "duration_seconds": round(duration, 3)
    }
    print(f"[Normalization] Completed in {duration:.2f}s.")
    return summary

if __name__ == "__main__":
    run_normalization()
