# FluxQ — Dataset Blueprint
## Regional, Global, Shipment, Reference, and Derived Data Strategy

**Project:** FluxQ — Predictive Shipment Risk & Intelligent Recovery Engine  
**Primary objective:** Build a training-ready data system that represents:

> **When + Where + How severe + Source of disruption + Shipment exposure → Probability of SLA breach / delay**

---

## 1. Purpose of this document

This document defines exactly what data FluxQ should collect, which data is global versus regional, which data belongs to the shipment itself, which datasets are external event sources, and how all of them should eventually be combined into a single machine-learning training dataset.

The central principle is:

> **Do not train directly on raw datasets from different providers. Normalize them first, spatially and temporally align them, then join them to shipments.**

FluxQ's project design calls for continuous signal ingestion, ML risk/ETA prediction, disruption impact analysis, optimization, and dynamic replanning.

---

# 2. FluxQ data architecture

FluxQ data should be divided into six layers:

| Layer | Purpose | Examples |
|---|---|---|
| A. Global/Common | Universal fields and event concepts | timestamp, coordinates, severity, event type |
| B. Regional | Geography-dependent operational observations | traffic, road network, port operations, airport operations |
| C. Global Disruption Events | Worldwide events that can affect logistics | geopolitical events, earthquakes, major storms |
| D. Shipment/Logistics | Describes the actual shipment | origin, destination, ETA, SLA, carrier |
| E. Reference/Static | Stable infrastructure and lookup information | ports, airports, roads, countries, carriers |
| F. Derived/Model Features | Features calculated by FluxQ | route exposure, distance to event, congestion index |

The ML model should primarily consume **E + normalized A/B/C + D + F**, not arbitrary raw provider columns.

---

# 3. What is global/common?

These fields should exist in the normalized FluxQ schema regardless of country or region.

## 3.1 Universal temporal fields

```text
event_id
timestamp
start_time
end_time
date
hour
day_of_week
month
season
```

## 3.2 Universal geographic fields

```text
latitude
longitude
country
region/state
city
location_id
geometry
```

## 3.3 Universal event fields

```text
event_type
event_subtype
severity
duration
source
source_id
confidence
```

## 3.4 Universal impact fields

```text
estimated_delay_minutes
capacity_reduction
affected_area
affected_mode
impact_radius_km
```

These are not necessarily directly available in every source. Some are derived during preprocessing.

---

# 4. Regional versus global classification

## 4.1 Weather

### Classification

**Weather observations:** Global/Common  
**Weather event datasets:** Global or regional depending on provider  
**Weather-to-logistics impact:** Regional/route-specific

### Collect

```text
temperature
precipitation
wind_speed
wind_gust
humidity
pressure
visibility
snow
storm
cyclone
flood
extreme_temperature
```

### Primary sources

1. NOAA/NCEI Storm Events Database — excellent structured severe-weather event source, but geographically focused on the United States and adjacent waters.
2. Global weather observation/reanalysis source — required if FluxQ is expanded beyond the U.S.
3. Regional meteorological source — for the MVP operating region where higher local fidelity is required.

### Important rule

Do not treat `heavy_rain = same impact everywhere`.

The weather measurement is global; its logistics impact depends on:

```text
location
road infrastructure
season
route
historical response
shipment mode
```

---

# 5. Traffic / road congestion

## Classification

**Strongly Regional**

Traffic is one of the clearest regional datasets because road infrastructure, sensor networks, traffic rules, road capacity, and driver behavior differ by geography.

### Collect

```text
timestamp
road_id
segment_id
latitude
longitude
speed
free_flow_speed
traffic_volume
occupancy
congestion_index
incident
road_closure
lane_closure
travel_time
```

### Primary source

**Caltrans PeMS**

PeMS provides real-time and historical traffic data from nearly 40,000 detectors across California and integrates traffic detectors, incidents, lane closures, traffic counts, vehicle classification, and roadway inventory.

### FluxQ rule

Use the **same normalized schema** for all regions, but do not assume California traffic patterns represent India.

For an India-focused MVP, obtain a comparable Indian traffic source rather than training on PeMS alone.

---

# 6. Port operations and port delays

## Classification

**Regional / Port-specific**

Ports are physical infrastructure nodes. Their operating characteristics differ significantly.

### Collect

```text
port_id
port_name
country
latitude
longitude
vessel_id
vessel_type
arrival_time
departure_time
port_stay
waiting_time
dwell_time
port_calls
throughput
congestion_index
```

### Primary sources

1. **UNCTAD port-call / port-performance statistics**
2. **AIS vessel movement data**
3. **World Bank container-port throughput indicators**
4. Port authority datasets where available

### Important distinction

Do not call every port dataset a "delay dataset."

Separate:

```text
PORT ACTIVITY
      ↓
arrival/departure
port stay
waiting
throughput
      ↓
derived PORT CONGESTION
      ↓
derived PORT DELAY
```

The actual shipment delay should be determined only after joining port conditions to a shipment's route and schedule.

---

# 7. Flight delays and airport operations

## Classification

**Regional/network-specific operational data**

The schema is global, but airport and airline operations are geographically specific.

### Collect

```text
flight_id
airline
aircraft
origin_airport
destination_airport
scheduled_departure
actual_departure
scheduled_arrival
actual_arrival
departure_delay
arrival_delay
cancelled
diverted
delay_reason
taxi_time
flight_distance
```

### Primary source

**U.S. BTS TranStats — Reporting Carrier On-Time Performance**

BTS provides scheduled and actual departure/arrival times, cancellations, diversions, taxi times, causes of delay/cancellation, and flight distance.

### Additional source

**FAA ASPM** for airport/aviation-system performance.

### Optional movement source

**OpenSky** for aircraft movement/state information.

### Important rule

Use:

```text
BTS → delay labels
FAA → system/airport performance
OpenSky → movement/context
```

Do not confuse aircraft movement data with actual scheduled-delay labels.

---

# 8. Geopolitical disruptions

## Classification

**Global event source + route/country-specific impact**

The event can be global, but its impact on a shipment is regional/network-specific.

### Collect

```text
event_id
event_date
event_type
event_subtype
actor
target
country
latitude
longitude
severity
fatalities
protest
riot
conflict
border_event
sanction
trade_restriction
```

### Primary sources

1. **GDELT Event Database**
2. **ACLED**

### Recommended use

GDELT is useful as a high-frequency global event stream.

ACLED is useful for structured political violence and protest data.

### FluxQ transformation

```text
GEOPOLITICAL EVENT
        ↓
location + time
        ↓
affected country/region
        ↓
distance to shipment route
        ↓
affected port/airport/border
        ↓
shipment exposure
```

Do not create only:

```text
geopolitical_risk = 1
```

Instead create measurable exposure features.

---

# 9. Other external disruptions

## Classification

**Global event schema + regional impact**

Recommended event categories:

```text
earthquake
flood
wildfire
landslide
industrial_strike
power_outage
telecom_outage
bridge_closure
road_closure
rail_disruption
airport_closure
port_closure
border_closure
infrastructure_failure
```

### Primary sources

**USGS ComCat**
- Earthquake source parameters
- magnitude
- hypocenter
- location
- event time
- global contributing seismic networks

### Other sources

For additional event classes, use authoritative national/regional emergency, infrastructure, transport, and environmental agencies.

Do not combine these sources until their event schema has been normalized.

---

# 10. Shipment-based dataset

This is the most important dataset for connecting external disruptions to actual business impact.

## Classification

**Shipment-specific**

This data should not be obtained from weather/traffic/geopolitical providers.

It should come from:

- synthetic shipment generation for the hackathon,
- historical shipment/TMS data if available,
- mock carrier/TMS APIs,
- public logistics datasets where suitable.

### Required shipment fields

```text
shipment_id
order_id
origin
destination
origin_lat
origin_lon
destination_lat
destination_lon
current_lat
current_lon

transport_mode
carrier_id
route_id

planned_departure
actual_departure
planned_arrival
current_eta
promised_delivery

sla_hours
sla_buffer_minutes

cargo_type
cargo_priority
cargo_value

current_status
remaining_distance_km
remaining_time_minutes

available_recovery_options
```

### Target fields

These are what the prediction model ultimately needs to learn.

```text
actual_arrival
actual_delay_minutes
sla_breached
delay_category
intervention_applied
recovery_success
```

---

# 11. Reference/static datasets

These are neither disruption datasets nor shipment datasets.

They provide the infrastructure context.

## Collect

### Airports

```text
airport_id
name
latitude
longitude
country
airport_type
```

### Ports

```text
port_id
name
latitude
longitude
country
port_type
```

### Road network

```text
road_id
segment_id
geometry
road_class
speed_limit
capacity
```

### Countries/regions

```text
country_code
region
state
city
geometry
```

### Carriers

```text
carrier_id
carrier_name
mode
service_region
historical_reliability
```

---

# 12. Derived FluxQ datasets

These should be generated by FluxQ rather than downloaded.

This is where the project becomes intelligent.

## 12.1 Shipment-event exposure

```text
shipment_id
event_id
distance_to_event_km
event_severity
event_duration
route_overlap
affected_mode
exposure_score
```

## 12.2 Weather exposure

```text
shipment_id
rain_intensity
wind_intensity
visibility
weather_severity
distance_to_weather_event
```

## 12.3 Traffic exposure

```text
shipment_id
route_congestion
traffic_delay_minutes
incident_distance
road_closure
```

## 12.4 Port exposure

```text
shipment_id
port_id
port_waiting_time
port_dwell_time
port_congestion
```

## 12.5 Geopolitical exposure

```text
shipment_id
country_risk_events
route_conflict_events
border_event
sanction_exposure
geopolitical_exposure_score
```

---

# 13. Final dataset inventory

| Dataset | Type | Scope | Primary source | ML role |
|---|---|---|---|---|
| Weather observations | Environmental | Global/regional | NOAA + regional/global weather source | Feature |
| Severe weather events | Event | Regional/global depending on source | NOAA NCEI | Feature/event |
| Traffic speed/flow | Transport | Regional | PeMS + regional equivalent | Feature |
| Road incidents | Transport event | Regional | PeMS + regional equivalent | Feature |
| Port calls | Maritime | Global/port-specific | UNCTAD | Feature |
| AIS vessel movement | Maritime | Global/port-specific | AIS provider | Feature |
| Port throughput | Maritime | Port-specific | World Bank/UNCTAD | Feature |
| Flight delays | Aviation | Regional/network | BTS | Feature + label/context |
| Airport performance | Aviation | Regional | FAA ASPM | Feature |
| Geopolitical events | Political | Global | GDELT | Feature |
| Political violence/conflict | Political | Global | ACLED | Feature |
| Earthquakes | Natural hazard | Global | USGS ComCat | Feature/event |
| Floods | Natural hazard | Regional/global | authoritative hazard sources | Feature/event |
| Wildfires | Natural hazard | Regional/global | authoritative fire sources | Feature/event |
| Infrastructure disruptions | Infrastructure | Regional | transport/emergency authorities | Feature/event |
| Airports | Reference | Global | airport reference dataset | Spatial join |
| Ports | Reference | Global | port reference dataset | Spatial join |
| Roads | Reference | Regional/global | road network source | Route analysis |
| Shipment records | Business | Shipment-specific | synthetic/TMS/mock API | Core input |
| Carrier performance | Business | Carrier-specific | TMS/carrier data | Feature |
| SLA outcomes | Business | Shipment-specific | synthetic/TMS | **Target** |

---

# 14. Global vs regional decision matrix

| Category | Global schema | Regional observations | Shipment-specific |
|---|:---:|:---:|:---:|
| Time | ✅ | | |
| Coordinates | ✅ | | |
| Weather measurements | ✅ | | |
| Weather impact | | ✅ | ✅ |
| Traffic | | ✅ | |
| Ports | | ✅ | |
| Flights | | ✅ | |
| Geopolitical events | ✅ | | |
| Earthquakes | ✅ | | |
| Wildfires/floods | ✅ | ✅ | |
| Road network | | ✅ | |
| Airport network | | ✅ | |
| Shipment route | | | ✅ |
| ETA | | | ✅ |
| SLA | | | ✅ |
| Carrier | | | ✅ |
| Actual delay | | | ✅ |
| SLA breach | | | **✅ Target** |

---

# 15. Recommended geographical strategy

## Phase 1 — MVP

Use **one primary operating region** for detailed transport data.

The data architecture remains global, but detailed traffic/port/airport relationships should initially be concentrated in one coherent region.

For example:

```text
INDIA
│
├── Chennai
├── Mumbai
├── Delhi/NCR
├── Bengaluru
├── Hyderabad
├── Kolkata
└── major international trade corridors
```

The exact final region should be decided before collection.

## Phase 2 — International corridors

Add:

```text
India → Middle East
India → Southeast Asia
India → Europe
India → North America
```

## Phase 3 — Global

Expand the same normalized schema to additional regions.

**Do not rebuild the ML architecture when expanding geography.**

---

# 16. What we should NOT collect yet

Avoid unnecessary scope in the first dataset build.

Do not initially collect:

```text
blockchain data
procurement data
supplier data
manufacturing data
inventory data
customer returns
social-media sentiment at huge scale
every country’s traffic data
every port's raw AIS history
every possible weather variable
```

These can dilute the core shipment-risk problem.

---

# 17. The final FluxQ training pipeline

```text
RAW EXTERNAL DATA
│
├── Weather
├── Traffic
├── Ports
├── Flights
├── Geopolitical
└── Other disruptions
│
▼
NORMALIZATION
│
▼
COMMON EVENT SCHEMA
│
▼
SPATIAL + TEMPORAL ALIGNMENT
│
▼
SHIPMENT DATA
│
▼
SHIPMENT ↔ EVENT EXPOSURE
│
▼
FEATURE ENGINEERING
│
├── weather_exposure
├── traffic_exposure
├── port_exposure
├── flight_exposure
├── geopolitical_exposure
├── external_event_exposure
├── route_historical_delay
├── carrier_reliability
└── sla_buffer
│
▼
TRAINING TABLE
│
▼
ML MODELS
│
├── SLA breach classification
└── ETA regression
│
▼
RISK SCORE 1–10
│
▼
RECOVERY OPTIMIZATION
│
▼
DYNAMIC REPLANNING
```

---

# 18. Minimum viable collection plan

Before downloading anything, collect these first:

### Tier 1 — Mandatory

1. Shipment dataset — **synthetic**
2. Weather — historical observations + events
3. Traffic — regional traffic
4. Port operations — port calls/dwell/throughput
5. Flight delays — BTS or equivalent regional aviation data
6. Geopolitical events — GDELT
7. Conflict/political violence — ACLED
8. Earthquakes — USGS
9. Infrastructure/reference maps — roads, ports, airports

### Tier 2 — Strong additions

10. AIS vessel movement
11. Flood events
12. Wildfire events
13. Airport system performance
14. Road incidents
15. Border closures/trade restrictions

### Tier 3 — Later

16. Real-time feeds
17. Carrier APIs
18. Live weather APIs
19. Live traffic APIs
20. Live vessel/flight feeds

---

# 19. Source-quality rules

Every dataset entering FluxQ should have:

```text
source_name
source_url
provider
license
geographic_coverage
temporal_coverage
update_frequency
spatial_resolution
temporal_resolution
data_quality_notes
```

Also store:

```text
raw_data
normalized_data
derived_data
```

separately.

Never overwrite raw source data.

---

# 20. Recommended authoritative sources

### Weather
**NOAA/NCEI Storm Events Database** — significant weather phenomena with bulk CSV access; note that this particular database is U.S.-focused. citeturn0search1turn0search11

### Traffic
**Caltrans PeMS** — historical and real-time traffic observations, incidents, lane closures and roadway-related information for California. citeturn0search14

### Aviation
**BTS TranStats** — flight-level scheduled/actual times, delays, cancellations, diversions and delay causes. citeturn0search17

### Geopolitical
**GDELT** — global event database covering hundreds of event categories with geographic information and frequent updates. citeturn0search9turn0search6

### Political violence
**ACLED** — structured political violence and protest data with geographic and temporal information. citeturn0search0

### Earthquakes
**USGS ANSS ComCat** — global earthquake source parameters and related products from contributing seismic networks. citeturn0search5turn0search7

---

# 21. The most important design rule

The final training row should **not** look like:

```text
weather.csv + traffic.csv + port.csv + flight.csv
```

It should look like:

```text
ONE SHIPMENT
    +
WHAT WAS HAPPENING AROUND ITS ROUTE
    +
WHEN IT WAS HAPPENING
    +
HOW SEVERE IT WAS
    +
WHICH MODE WAS AFFECTED
    +
HOW MUCH EXPOSURE THE SHIPMENT HAD
    ↓
ACTUAL DELAY / SLA BREACH
```

That is the dataset FluxQ actually needs.

---

## 22. Target ML table — final conceptual schema

```text
shipment_id

# Shipment
origin
destination
current_location
transport_mode
carrier_id
route_id

# Time
timestamp
planned_departure
planned_arrival
promised_delivery

# Shipment state
remaining_distance_km
remaining_time_minutes
sla_buffer_minutes

# Weather exposure
weather_severity
precipitation
wind_speed
visibility
weather_event_distance

# Traffic exposure
congestion_index
traffic_delay_minutes
incident_distance
road_closure

# Port exposure
port_congestion
port_waiting_time
port_dwell_time

# Flight exposure
airport_delay
flight_delay
airport_congestion

# Geopolitical exposure
geopolitical_event_count
conflict_event_count
border_event
sanction_exposure

# Other hazards
earthquake_exposure
flood_exposure
wildfire_exposure
infrastructure_disruption

# Historical/context
route_historical_delay
carrier_reliability
season
day_of_week

# Targets
predicted_eta_target
actual_delay_minutes
sla_breached
```

This is the **canonical FluxQ dataset blueprint**. We should use it as the specification before downloading the actual files.
