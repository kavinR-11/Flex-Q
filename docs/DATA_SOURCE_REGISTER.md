# Data Source Register: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Primary MVP Focus:** India Domestic Logistics Corridor (Chennai, Bengaluru, Mumbai, Hyderabad, Delhi) + Global Reference Datasets.

---

## 1. Verified Data Sources Catalog

| Source Name | Category | Provider / Authority | URL / Endpoint | Geographic Coverage | License / Access | ML Role | Provenance & Quality Notes |
|---|---|---|---|---|---|---|---|
| **NOAA NCEI Storm Events** | Weather | NOAA / NCEI | `https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/` | Global / US | Open Data (Public Domain) | Severe weather pattern benchmark | Bulk CSV archive; records hail, cyclone, heavy rain, flooding events with timestamps. |
| **Open-Meteo Historical Weather** | Weather | Open-Meteo / ECMWF ERA5 | `https://archive-api.open-meteo.com/v1/archive` | Global (India corridor: Chennai, BLR, BOM) | Open Data (ODbL / CC-BY) | Weather exposure features | Direct hourly precipitation, wind gust, visibility, and temperature at exact route coordinates. |
| **USGS ANSS ComCat** | Natural Hazards | USGS | `https://earthquake.usgs.gov/fdsnws/event/1/query` | Global | Public Domain (US Gov) | Hazard exposure features | Real-time and historical seismic events ($M \ge 4.5$) with latitude/longitude/magnitude. |
| **GDELT Event Database** | Geopolitical | The GDELT Project | `https://www.gdeltproject.org/data.html` | Global | Free / Open Research | Geopolitical exposure features | Global incident streams; protests, blockades, border tensions with Goldstein scale. |
| **ACLED** | Geopolitical | Armed Conflict Location & Event Data Project | `https://acleddata.com/data-export-tool/` | South Asia & Global | Open Academic / Attribution | Civil unrest & protest exposure | Structured records of highway protests, strikes, and regional conflicts. |
| **BTS TranStats** | Aviation | US Bureau of Transportation Statistics | `https://www.transtats.bts.gov/` | Aviation Network | Public Domain | Aviation delay distribution baseline | Flight-level delay reasons (carrier, weather, NAS, security) providing delay distribution shapes. |
| **UNCTAD Maritime Indicators** | Maritime / Ports | UNCTAD | `https://unctadstat.unctad.org/` | Global / Major Ports | Open Statistics | Port dwell & turnaround baseline | Global container port turnaround times and liner shipping connectivity indicators. |
| **Indian Ports Association (IPA)** | Maritime / Ports | Indian Ports Association / Ministry of Ports | Official Logistics Portal | India (Chennai, Ennore, JNPT, Tuticorin) | Public Government Reports | Port dwell time & waiting exposure | Empirical average turnaround time (48-52 hours) and berth waiting time distributions. |
| **NHAI / MoRTH Corridors** | Road Network & Traffic | National Highways Authority of India | Toll & Corridor Telematics | NH48 (Chennai-BLR), NH44 (BLR-HYD), NH16 (Chennai-Vizag) | Public Transport Data | Road geometry, speed limits & toll nodes | Accurate coordinates, arterial distances, average truck transit speeds (40-60 km/h). |
| **Synthetic Shipment Generator** | Shipment & Logistics | YOLO × FluxQ Data Engine | Internal Module (`shipment_generator.py`) | India Multi-City Logistics Network | Internal / Generated | **Core Training & Operational Pipeline** | Generated according to strict physical logistics rules: realistic speeds, actual route waypoints, SLA buffers, and target delays. Explicitly tagged as `SYNTHETIC`. |

---

## 2. Ingestion Strategy & Quality Controls

1. **Raw Immutability:** All acquired external files are stored verbatim in `data/raw/{provider}/{category}/` without in-place modification.
2. **Provenance Tracking:** Manifest JSON files (`data/manifests/`) record the source URL, access timestamp, record count, MD5 checksum, and licensing status.
3. **Synthetic Transparency:** Synthetic shipments are cleanly isolated in `data/synthetic/` and tagged with `"is_synthetic": true` on all records to prevent any misrepresentation of ground truth.
4. **Spatial & Temporal Guardrails:** Geographic bounding boxes and time windows are strictly validated before records enter the normalization pipeline.
