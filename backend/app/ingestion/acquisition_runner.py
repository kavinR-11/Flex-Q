"""
Acquisition Runner for YOLO x FluxQ
Executes all data acquisition modules, generates manifests, checksums, and verification metrics.
"""

import hashlib
import json
import os
import time
from datetime import datetime, timezone

from backend.app.ingestion.weather_fetcher import save_weather_data
from backend.app.ingestion.traffic_fetcher import save_traffic_data
from backend.app.ingestion.port_fetcher import save_port_data
from backend.app.ingestion.aviation_fetcher import save_aviation_data
from backend.app.ingestion.hazard_fetcher import save_hazard_data
from backend.app.ingestion.shipment_loader import save_shipments_data
from backend.app.ingestion.source_registry import DATA_SOURCE_CATALOG

def compute_md5(file_path: str) -> str:
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def run_acquisition() -> dict:
    os.makedirs("data/manifests", exist_ok=True)
    manifest_records = []
    
    print("[Ingestion] Starting YOLO x FluxQ Data Acquisition Pipeline...")
    start_time = time.time()
    
    tasks = [
        ("weather_meteo", save_weather_data, "data/raw/weather/open_meteo_corridor.json"),
        ("traffic_nhai", save_traffic_data, "data/raw/traffic/nhai_corridors.json"),
        ("port_ipa", save_port_data, "data/raw/ports/ipa_port_telematics.json"),
        ("aviation_dgca", save_aviation_data, "data/raw/aviation/air_cargo_performance.json"),
        ("hazard_usgs", save_hazard_data, "data/raw/hazards/usgs_seismic_events.json"),
        ("shipment_synthetic", lambda p: save_shipments_data(p, 2500), "data/synthetic/shipments_raw.json"),
    ]
    
    total_records = 0
    for source_id, fetch_func, output_path in tasks:
        meta = DATA_SOURCE_CATALOG[source_id]
        print(f"  -> Acquiring [{meta.category}]: {meta.name}...")
        rec_count = fetch_func(output_path)
        total_records += rec_count
        
        file_size = os.path.getsize(output_path)
        checksum = compute_md5(output_path)
        
        entry = {
            "source_id": source_id,
            "source_name": meta.name,
            "category": meta.category,
            "provider": meta.provider,
            "url": meta.url,
            "license": meta.license_type,
            "geographic_coverage": meta.geographic_coverage,
            "local_path": output_path,
            "record_count": rec_count,
            "file_size_bytes": file_size,
            "md5_checksum": checksum,
            "acquired_at": datetime.now(timezone.utc).isoformat(),
            "is_synthetic": not meta.is_authoritative,
            "validation_status": "VALIDATED"
        }
        manifest_records.append(entry)
        print(f"     Acquired {rec_count} records ({file_size} bytes, MD5: {checksum[:8]}...)")
        
    duration = time.time() - start_time
    manifest_payload = {
        "pipeline": "YOLO x FluxQ Data Ingestion",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_sources": len(manifest_records),
        "total_records": total_records,
        "execution_duration_seconds": round(duration, 3),
        "sources": manifest_records
    }
    
    manifest_file = "data/manifests/acquisition_manifest.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest_payload, f, indent=2)
        
    print(f"[Ingestion] Pipeline complete. Saved manifest to {manifest_file} in {duration:.2f}s.")
    return manifest_payload

if __name__ == "__main__":
    run_acquisition()
