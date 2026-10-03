# Data Acquisition Log: YOLO × FluxQ

**Execution Date:** October 3, 2026  
**Pipeline Orchestrator:** `backend.app.ingestion.acquisition_runner`  
**Execution Runtime:** 0.30 seconds  
**Total Records Acquired:** 2,730 records across 6 source categories

---

## 1. Acquired Raw Datasets Summary

| Category | Source Name | Local Destination | Records | File Size | MD5 Checksum | Type |
|---|---|---|---|---|---|---|
| **Weather** | Open-Meteo ERA5 Reanalysis & Observations | `data/raw/weather/open_meteo_corridor.json` | 60 | 27,242 B | `a340a1b329432f48ef534a02dd676a08` | Telematics Reanalysis |
| **Traffic** | NHAI Highway Corridor Traffic Telematics | `data/raw/traffic/nhai_corridors.json` | 88 | 45,034 B | `8910215a452ef389d0e2e92ec367e9c9` | Highway Sensor Nodes |
| **Port** | IPA Port Turnaround & Congestion | `data/raw/ports/ipa_port_telematics.json` | 24 | 11,539 B | `ed2cedde4463fe77db19b12d5eec3a4f` | Maritime Gate Telematics |
| **Aviation** | DGCA / BTS Air Cargo Performance | `data/raw/aviation/air_cargo_performance.json` | 54 | 25,717 B | `7029424075f7df8b5b7b9370bb5e3e2d` | Flight OTP Records |
| **Hazards** | USGS ANSS ComCat Seismic Telematics | `data/raw/hazards/usgs_seismic_events.json` | 4 | 1,929 B | `8fc106ccba9ea8bc81faea72f7786018` | Earthquake & Disruption Events |
| **Shipments** | Synthetic Logistics Fleets (Physics-grounded) | `data/synthetic/shipments_raw.json` | 2,500 | 2,875,004 B | `bd0e50a11ba848972df5ce968b577005` | Synthetic Consignments |

---

## 2. Integrity & Checksum Verification
- All raw datasets were serialized with UTF-8 encoding.
- Checksums computed and recorded in [`data/manifests/acquisition_manifest.json`](file:///c:/Users/DELL/Downloads/ramyarec/data/manifests/acquisition_manifest.json).
- Immutability policy enforced: raw files are read-only downstream; all transformations will output to `data/normalized/` and `data/features/`.
