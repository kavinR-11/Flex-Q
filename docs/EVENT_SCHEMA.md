# Event Schema: YOLO × FluxQ

**Scope:** Canonical external disruption event schemas, severity normalization, spatial-temporal indexing, and synthetic scenario events.

---

## 1. Unified Event Taxonomy

All disruption signals entering YOLO × FluxQ are mapped into the following canonical JSON schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DisruptionEvent",
  "type": "object",
  "properties": {
    "event_id": {
      "type": "string",
      "pattern": "^EVT-[A-Z0-9]{4,12}$"
    },
    "event_type": {
      "type": "string",
      "enum": [
        "SEVERE_WEATHER",
        "TRAFFIC_CONGESTION",
        "PORT_CONGESTION",
        "FLIGHT_DELAY",
        "HAZARD_EARTHQUAKE",
        "ROAD_CLOSURE",
        "GEOPOLITICAL_INCIDENT"
      ]
    },
    "severity": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 10.0,
      "description": "Normalized intensity score from 0 (minor) to 10 (catastrophic)"
    },
    "location": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "latitude": { "type": "number", "minimum": -90.0, "maximum": 90.0 },
        "longitude": { "type": "number", "minimum": -180.0, "maximum": 180.0 },
        "country": { "type": "string", "default": "IND" },
        "impact_radius_km": { "type": "number", "minimum": 0.1 }
      },
      "required": ["latitude", "longitude", "impact_radius_km"]
    },
    "temporal": {
      "type": "object",
      "properties": {
        "start_time": { "type": "string", "format": "date-time" },
        "expected_end": { "type": "string", "format": "date-time" },
        "actual_end": { "type": ["string", "null"], "format": "date-time" }
      },
      "required": ["start_time", "expected_end"]
    },
    "impact_attributes": {
      "type": "object",
      "properties": {
        "affected_mode": {
          "type": "string",
          "enum": ["ROAD", "AIR", "MARITIME", "RAIL", "ALL"]
        },
        "estimated_delay_minutes": { "type": "integer", "minimum": 0 },
        "capacity_reduction_pct": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
        "speed_reduction_pct": { "type": "number", "minimum": 0.0, "maximum": 100.0 }
      },
      "required": ["affected_mode", "estimated_delay_minutes"]
    },
    "provenance": {
      "type": "object",
      "properties": {
        "source": { "type": "string" },
        "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
        "is_simulated": { "type": "boolean" }
      },
      "required": ["source", "confidence", "is_simulated"]
    }
  },
  "required": ["event_id", "event_type", "severity", "location", "temporal", "impact_attributes", "provenance"]
}
```

---

## 2. Event Severity Mapping Rules

| Event Type | Raw Source Metric | Normalized Severity (0–10) |
|---|---|---|
| **Severe Weather** | Rain $\ge 50\text{mm/hr}$ or Wind $\ge 70\text{km/h}$ | 7.0 – 9.5 |
| **Traffic Congestion** | PeMS/Sensor speed $< 20\text{km/h}$ (Free flow $80\text{km/h}$) | 6.0 – 9.0 |
| **Port Congestion** | Berth wait time $> 48\text{hours}$ | 7.5 – 10.0 |
| **Flight Delay** | Flight delayed $> 180\text{minutes}$ or Cancelled | 8.0 – 10.0 |
| **Earthquake** | USGS Magnitude $M \ge 6.0$ | 8.5 – 10.0 |
| **Road Closure** | Complete arterial shutdown (NH48) | 10.0 (Hard infeasibility) |

---

## 3. Spatial Matching & Exposure Calculation

Given shipment route coordinates $R_i = \{(lat_k, lon_k)\}$ and disruption center $C_e = (lat_e, lon_e)$ with impact radius $r_e$:
1. Compute minimum Haversine distance:
   $$d(R_i, C_e) = \min_{p \in R_i} \text{Haversine}(p, C_e)$$
2. If $d(R_i, C_e) \le r_e$ and time windows overlap:
   $$\text{overlap} = 1.0 - \frac{d(R_i, C_e)}{r_e}$$
   $$\text{exposure\_score} = \text{overlap} \times \text{severity}_e \times \mathbb{I}(\text{mode matches})$$
3. When exposure score exceeds threshold ($> 2.5$), the Early Warning Indicator (EWI) triggers risk recomputation and optimization.
