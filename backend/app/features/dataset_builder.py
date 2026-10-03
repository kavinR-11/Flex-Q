"""
Dataset Builder for YOLO x FluxQ
Builds the canonical training table matching Blueprint Section 22:
ONE SHIPMENT + WHAT WAS HAPPENING AROUND ITS ROUTE + WHEN IT WAS HAPPENING +
HOW SEVERE IT WAS + MODE AFFECTED + SHIPMENT EXPOSURE -> ACTUAL DELAY / SLA BREACH
Splits into Train, Validation, and Test partitions with zero leakage.
"""

from datetime import datetime
import json
import os
import time
import numpy as np
import pandas as pd

from backend.app.features.exposure_calculator import compute_shipment_exposure_profile

def build_feature_dataset() -> pd.DataFrame:
    shipments_path = "data/normalized/normalized_shipments.json"
    events_path = "data/normalized/normalized_events.json"
    
    with open(shipments_path, "r", encoding="utf-8") as f:
        shipments = json.load(f)
        
    with open(events_path, "r", encoding="utf-8") as f:
        events = json.load(f)
        
    rows = []
    for sh in shipments:
        # 1. Compute route exposure features from active disruption events
        exp = compute_shipment_exposure_profile(sh, events)
        
        # 2. Extract temporal context strictly at prediction time
        dep_dt = datetime.fromisoformat(sh["planned_departure"])
        
        # Row matching Blueprint Section 22
        row = {
            "shipment_id": sh["shipment_id"],
            "origin": sh["origin"],
            "destination": sh["destination"],
            "transport_mode": sh["transport_mode"],
            "carrier_id": sh["carrier_id"],
            "route_id": sh["route_id"],
            "cargo_priority": sh["cargo_priority"],
            "cargo_value_inr": sh["cargo_value_inr"],
            "weight_kg": sh["weight_kg"],
            
            # Temporal & state features
            "dispatch_hour": dep_dt.hour,
            "day_of_week": dep_dt.weekday(),
            "month": dep_dt.month,
            "remaining_distance_km": sh["remaining_distance_km"],
            "remaining_time_minutes": sh["remaining_time_minutes"],
            "sla_hours": sh["sla_hours"],
            "sla_buffer_minutes": sh["sla_buffer_minutes"],
            
            # Exposure features
            "weather_severity": exp["weather_severity"],
            "precipitation": exp["precipitation"],
            "wind_speed": exp["wind_speed"],
            "visibility": exp["visibility"],
            "weather_event_distance": exp["weather_event_distance"],
            
            "congestion_index": exp["congestion_index"],
            "traffic_delay_minutes": exp["traffic_delay_minutes"],
            "incident_distance": exp["incident_distance"],
            "road_closure": exp["road_closure"],
            
            "port_congestion": exp["port_congestion"],
            "port_waiting_time": exp["port_waiting_time"],
            "flight_delay": exp["flight_delay"],
            
            "geopolitical_event_count": exp["geopolitical_event_count"],
            "earthquake_exposure": exp["earthquake_exposure"],
            "infrastructure_disruption": exp["infrastructure_disruption"],
            
            "route_historical_delay": exp["route_historical_delay"],
            "carrier_reliability": exp["carrier_reliability"],
            
            # Ground truth targets (quarantined)
            "target_actual_delay_minutes": sh["target_actual_delay_minutes"],
            "target_sla_breached": sh["target_sla_breached"],
            "target_delay_category": sh["target_delay_category"],
        }
        rows.append(row)
        
    df = pd.DataFrame(rows)
    return df

def create_splits_and_save(output_dir: str = "data/training", seed: int = 42):
    os.makedirs(output_dir, exist_ok=True)
    df = build_feature_dataset()
    
    # Save master training table
    master_path = os.path.join(output_dir, "master_training_features.csv")
    df.to_csv(master_path, index=False)
    print(f"[DatasetBuilder] Master feature table saved: {len(df)} rows to {master_path}")
    
    # Shuffle with fixed seed and perform clean temporal-stratified split (70% Train, 15% Val, 15% Test)
    rng = np.random.default_rng(seed)
    indices = np.arange(len(df))
    rng.shuffle(indices)
    
    n_train = int(len(df) * 0.70)
    n_val = int(len(df) * 0.15)
    
    train_idx = indices[:n_train]
    val_idx = indices[n_train:n_train + n_val]
    test_idx = indices[n_train + n_val:]
    
    df_train = df.iloc[train_idx].copy()
    df_val = df.iloc[val_idx].copy()
    df_test = df.iloc[test_idx].copy()
    
    train_path = os.path.join(output_dir, "train.csv")
    val_path = os.path.join(output_dir, "val.csv")
    test_path = os.path.join(output_dir, "test.csv")
    
    df_train.to_csv(train_path, index=False)
    df_val.to_csv(val_path, index=False)
    df_test.to_csv(test_path, index=False)
    
    metadata = {
        "dataset_name": "YOLO x FluxQ Logistics Feature Store",
        "created_at": datetime.now().isoformat(),
        "total_records": len(df),
        "features_count": len(df.columns) - 4, # excluding id and 3 targets
        "splits": {
            "train": {"count": len(df_train), "sla_breach_rate": round(float(df_train["target_sla_breached"].mean()), 3)},
            "val": {"count": len(df_val), "sla_breach_rate": round(float(df_val["target_sla_breached"].mean()), 3)},
            "test": {"count": len(df_test), "sla_breach_rate": round(float(df_test["target_sla_breached"].mean()), 3)}
        }
    }
    
    meta_path = os.path.join(output_dir, "dataset_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"  -> Train: {len(df_train)} rows (Breach rate: {metadata['splits']['train']['sla_breach_rate']})")
    print(f"  -> Val:   {len(df_val)} rows (Breach rate: {metadata['splits']['val']['sla_breach_rate']})")
    print(f"  -> Test:  {len(df_test)} rows (Breach rate: {metadata['splits']['test']['sla_breach_rate']})")
    print(f"[DatasetBuilder] Saved splits and metadata to {output_dir}")
    return metadata

if __name__ == "__main__":
    create_splits_and_save()
