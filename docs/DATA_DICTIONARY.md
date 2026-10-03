# Data Dictionary: YOLO × FluxQ

**Platform Identity:** YOLO × FluxQ  
**Version:** 1.0.0 (Normalized Canonical Schemas)  
**Standard Compliance:** WGS84 coordinates, ISO 8601 UTC timestamps, SI metric units.

---

## 1. Normalized Shipments Schema (`data/normalized/normalized_shipments.json`)

| Field Name | Data Type | Constraint / Unit | Description |
|---|---|---|---|
| `shipment_id` | String | `SH-[0-9]{4}` | Unique primary consignment identifier (e.g. `SH-2048`) |
| `order_id` | String | `ORD-[0-9]{4,6}` | Upstream Enterprise Order Reference |
| `origin` | String | e.g. `Chennai`, `Bengaluru` | Origin dispatch hub |
| `destination` | String | e.g. `Bengaluru`, `Mumbai` | Destination delivery hub |
| `origin_lat`, `origin_lon` | Float | Decimal degrees WGS84 | Geocoded origin terminal coordinates |
| `destination_lat`, `destination_lon` | Float | Decimal degrees WGS84 | Geocoded destination terminal coordinates |
| `current_lat`, `current_lon` | Float | Decimal degrees WGS84 | Latest telematics GPS position |
| `transport_mode` | Enum | `ROAD`, `AIR`, `MARITIME`, `RAIL` | Current primary transport modality |
| `carrier_id` | String | e.g. `CARRIER-A`, `CARRIER-B` | Assigned logistics carrier |
| `route_id` | String | e.g. `RT-MAA-BLR-01` | Active corridor route identifier |
| `planned_departure` | Timestamp | ISO 8601 UTC | Scheduled departure time |
| `actual_departure` | Timestamp | ISO 8601 UTC | Actual departure from dispatch facility |
| `promised_delivery` | Timestamp | ISO 8601 UTC | Committed customer SLA delivery deadline |
| `current_eta` | Timestamp | ISO 8601 UTC | Latest dynamic estimated arrival time |
| `sla_hours` | Float | Hours ($\ge 0$) | Total allotted contract service window |
| `sla_buffer_minutes` | Float | Minutes | Remaining buffer ($t_{\text{promised}} - t_{\text{ETA}}$) |
| `cargo_type` | String | Text | Goods category (Electronics, Auto, Pharma) |
| `cargo_priority` | Integer | 1 (Critical) to 4 (Standard) | Business tier priority |
| `cargo_value_inr` | Float | INR ($\ge 0$) | Insured consignment invoice value |
| `weight_kg` | Float | Kilograms ($\ge 0$) | Gross shipment payload weight |
| `current_status` | Enum | `in_transit`, `delayed`, `critical`, `delivered` | Operational lifecycle status |
| `remaining_distance_km` | Float | Kilometers ($\ge 0$) | Geodesic / corridor distance to destination |
| `remaining_time_minutes` | Float | Minutes ($\ge 0$) | Nominal travel time remaining |
| `baseline_p_sla` | Float | $[0.0, 1.0]$ | Heuristic pre-inference baseline risk probability |
| `risk_score` | Integer | $[1, 10]$ | Standard integer score $R = \max(1, \min(10, \lceil 10p \rceil))$ |
| `risk_category` | Enum | `Low`, `Moderate`, `High`, `Critical` | Presentation operational risk tier |
| `is_synthetic` | Boolean | True / False | Explicit transparency flag for synthetic generation |
| `target_actual_arrival` | Timestamp | ISO 8601 UTC (Quarantined) | Ground truth arrival timestamp |
| `target_actual_delay_minutes` | Float | Minutes (Quarantined) | Actual delay outcome vs planned schedule |
| `target_sla_breached` | Integer | 0 or 1 (Quarantined) | Ground truth binary classification label |
| `target_delay_category` | String | Categorical (Quarantined) | `On-Time`, `Minor (< 1h)`, `Moderate (1-3h)`, `Major (> 3h)` |

---

## 2. Normalized Disruption Events Schema (`data/normalized/normalized_events.json`)

| Field Name | Data Type | Constraint / Unit | Description |
|---|---|---|---|
| `event_id` | String | `EVT-[A-Z0-9-]+` | Unique event tracking identifier |
| `event_type` | Enum | `SEVERE_WEATHER`, `TRAFFIC_CONGESTION`, `PORT_CONGESTION`, `ROAD_CLOSURE`, `HAZARD_EARTHQUAKE` | Canonical event category |
| `severity` | Float | $[0.0, 10.0]$ | Normalized disruption severity magnitude |
| `location.name` | String | Corridor / Landmark | Descriptive event location name |
| `location.latitude` | Float | $[-90, 90]$ WGS84 | Epicenter / centroid latitude |
| `location.longitude` | Float | $[-180, 180]$ WGS84 | Epicenter / centroid longitude |
| `location.impact_radius_km` | Float | Kilometers ($> 0$) | Spatial circular buffer of influence |
| `temporal.start_time` | Timestamp | ISO 8601 UTC | Disruption onset timestamp |
| `temporal.expected_end` | Timestamp | ISO 8601 UTC | Forecasted restoration / clearing timestamp |
| `impact_attributes.affected_mode` | Enum | `ROAD`, `AIR`, `MARITIME`, `ALL` | Transportation mode subject to disruption |
| `impact_attributes.estimated_delay_minutes` | Integer | Minutes ($\ge 0$) | Estimated corridor transit penalty |
| `impact_attributes.speed_reduction_pct` | Float | $[0.0, 100.0]\%$ | Percentage reduction in average transit speed |
| `provenance.source` | String | Authority Name | Telematics source attribution |
| `provenance.confidence` | Float | $[0.0, 1.0]$ | Confidence index of sensor/reporting agency |
| `provenance.is_simulated` | Boolean | True / False | Simulation transparency flag |
