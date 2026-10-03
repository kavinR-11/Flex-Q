# Feature Engineering: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Core Thesis:**  
$$\textbf{ONE SHIPMENT} + \textbf{WHAT HAPPENED ON ROUTE} + \textbf{WHEN} + \textbf{HOW SEVERE} + \textbf{MODE} + \textbf{EXPOSURE} \longrightarrow \textbf{DELAY / SLA BREACH}$$

---

## 1. Feature Taxonomy & Mathematical Definitions

The training dataset integrates 24 features strictly observable at the prediction timestamp.

### 1.1 Spatial & Route Features
- `origin`, `destination`: One-hot encoded corridor endpoints.
- `transport_mode`: Modal classifier (`ROAD`, `AIR`, `MARITIME`).
- `carrier_id`: Logistics operator identifier (`CARRIER-A`, `CARRIER-B`, etc.).
- `route_id`: Specific arterial highway or flight corridor.
- `remaining_distance_km`: Geodesic / network distance from current coordinates $(lat_t, lon_t)$ to destination $(lat_d, lon_d)$.

### 1.2 Temporal & Operational State Features
- `dispatch_hour`: Hour of scheduled departure ($0 \dots 23$).
- `day_of_week`: Day index ($0 \dots 6$).
- `month`: Seasonal month indicator.
- `sla_hours`: Total contract duration agreed with shipper.
- `sla_buffer_minutes`: Buffer remaining prior to SLA default:
  $$\text{sla\_buffer\_minutes} = t_{\text{promised}} - t_{\text{ETA}}$$
- `cargo_priority`: Tier rating (1 = Emergency/Automotive line-stopper, 4 = Low).
- `cargo_value_inr`: Financial consignment value.
- `weight_kg`: Physical gross freight weight.

### 1.3 Route Exposure Features (Derived from Disruption Events)
Computed by spatially and temporally intersecting shipment routes with active disruption polygons:
- `weather_severity`: Peak normalized severity ($0 \dots 10$) of convective weather along route.
- `precipitation`: Estimated rainfall rate in $\text{mm/hr}$.
- `wind_speed`: Ambient wind velocity in $\text{km/h}$.
- `visibility`: Atmospheric sight distance in $\text{km}$.
- `weather_event_distance`: Distance in $\text{km}$ to nearest meteorological disturbance.
- `congestion_index`: Real-time traffic congestion score ($0 \dots 10$).
- `traffic_delay_minutes`: Cumulative estimated highway queue delay.
- `incident_distance`: Distance in $\text{km}$ to nearest active traffic accident or roadwork.
- `road_closure`: Binary indicator ($1$ if route segment has complete closure, $0$ otherwise).
- `port_congestion`: Dwell and berth waiting index for maritime/intermodal corridors.
- `flight_delay`: Airport departure backlog delay for air cargo links.
- `earthquake_exposure`: Seismic shake severity.
- `infrastructure_disruption`: Composite infrastructure impairment score.

### 1.4 Historical Baselines
- `route_historical_delay`: Historical mean corridor delay in minutes (computed strictly from past runs).
- `carrier_reliability`: Historical on-time delivery rate ($0.0 \dots 1.0$).

---

## 2. Zero-Leakage Protocol

1. **Prediction-Time Observability:** Ground truth outcomes (`actual_arrival`, `actual_delay_minutes`, `sla_breached`) are strictly quarantined as targets and never included in feature matrices.
2. **Preprocessing Isolation:** Encoders, scalers, and imputers are fit exclusively on the `train.csv` partition (1,750 rows). The validation (`val.csv`, 375 rows) and test (`test.csv`, 375 rows) sets are strictly transformed using the parameters learned from training.
3. **Partition Stratification:** Train/val/test splits maintain balanced class distributions of the binary target `target_sla_breached` (~13-14% breach prevalence across all partitions).
