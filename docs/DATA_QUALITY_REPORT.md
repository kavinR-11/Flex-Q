# Data Quality Report: YOLO × FluxQ

**Assessment Stage:** Post-Ingestion Quality & Schema Profiling  
**Date:** October 3, 2026  
**Auditor:** Lead Data Engineer

---

## 1. Schema Completeness & Null Analysis

| Dataset | Total Records | Missing Primary Keys | Null Values in Core Fields | Spatial Bounds Check | Valid Timestamp Formats |
|---|---|---|---|---|---|
| **Weather** (`open_meteo_corridor.json`) | 60 | 0 (100% valid) | 0 (0.0%) | 100% within $[8.0, 29.0]^\circ\text{N}$, $[72.0, 81.0]^\circ\text{E}$ | 100% ISO 8601 UTC |
| **Traffic** (`nhai_corridors.json`) | 88 | 0 (100% valid) | 0 (0.0%) | 100% on mapped NH48/NH44/NH16 segments | 100% ISO 8601 UTC |
| **Ports** (`ipa_port_telematics.json`) | 24 | 0 (100% valid) | 0 (0.0%) | 100% at valid container port terminals | 100% ISO 8601 UTC |
| **Aviation** (`air_cargo_performance.json`) | 54 | 0 (100% valid) | 0 (0.0%) | 100% between valid airport IATA hubs | 100% ISO 8601 UTC |
| **Hazards** (`usgs_seismic_events.json`) | 4 | 0 (100% valid) | 0 (0.0%) | 100% verified geographic coordinates | 100% ISO 8601 UTC |
| **Shipments** (`shipments_raw.json`) | 2,500 | 0 (100% valid) | 0 (0.0%) | 100% on valid Indian highway/city corridors | 100% ISO 8601 UTC |

---

## 2. Realistic Physics & Target Distribution Sanity
- **Shipments Dataset (`2,500` records):**
  - **Overall SLA Breach Rate:** 27.6% (690 breached vs. 1,810 on-time) — provides realistic class imbalance without extreme sparsity.
  - **SLA Buffer Distribution:** Median buffer $+120.0$ minutes, min $-135.0$ minutes (disrupted), max $+240.0$ minutes.
  - **Cargo Priorities:** 1 (Critical): 14.8%, 2 (High): 34.6%, 3 (Standard): 35.4%, 4 (Low): 15.2%.
  - **Transport Modes:** Road: 74.2%, Air: 16.8%, Maritime: 9.0%.
  - **Reference Case Included:** `SH-2048` (Chennai $\rightarrow$ Bengaluru, Carrier A, Promised 18:00, initial ETA 17:20, SLA buffer +40 mins) is verified present in record 0.

---

## 3. Data Integrity & Leakage Guardrails
- Input features (such as `planned_departure`, `promised_delivery`, `current_eta`, `remaining_distance_km`, `sla_buffer_minutes`) represent strictly information observable at the operational decision checkpoint.
- Ground truth target labels (`actual_arrival`, `actual_delay_minutes`, `sla_breached`, `delay_category`) are quarantined and only accessed during downstream training/validation pipelines.
