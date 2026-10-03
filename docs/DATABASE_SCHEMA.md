# Database Schema: YOLO × FluxQ

**Storage Engine:** SQLite (Local/Demo embedded) and PostgreSQL-compatible via SQLAlchemy ORM.  
**Timezone Standard:** Strict UTC (`TIMESTAMPTZ` / ISO 8601 strings).  
**Geospatial Standard:** WGS84 coordinates (`latitude`, `longitude` in decimal degrees).

---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    SHIPMENTS ||--o{ PREDICTIONS : "evaluates"
    SHIPMENTS ||--o{ RECOVERY_PLANS : "receives"
    SHIPMENTS ||--o{ AUDIT_LOGS : "logs"
    DISRUPTION_EVENTS ||--o{ EVENT_SHIPMENT_EXPOSURES : "exposes"
    SHIPMENTS ||--o{ EVENT_SHIPMENT_EXPOSURES : "impacts"
    RECOVERY_PLANS ||--o{ AUDIT_LOGS : "approved_in"
    CARRIERS ||--o{ SHIPMENTS : "operates"

    SHIPMENTS {
        string shipment_id PK
        string order_id
        string origin
        string destination
        float origin_lat
        float origin_lon
        float destination_lat
        float destination_lon
        float current_lat
        float current_lon
        string transport_mode
        string carrier_id FK
        string route_id
        datetime planned_departure
        datetime promised_delivery
        datetime current_eta
        int cargo_priority
        float cargo_value
        string cargo_type
        float weight_kg
        string status
        int risk_score
        float sla_breach_probability
        datetime updated_at
    }

    DISRUPTION_EVENTS {
        string event_id PK
        string event_type
        float severity
        string location_name
        float latitude
        float longitude
        float impact_radius_km
        string affected_mode
        int estimated_delay_minutes
        datetime start_time
        datetime expected_end
        string source
        datetime created_at
    }

    EVENT_SHIPMENT_EXPOSURES {
        string exposure_id PK
        string shipment_id FK
        string event_id FK
        float distance_km
        float exposure_score
        datetime calculated_at
    }

    PREDICTIONS {
        string prediction_id PK
        string shipment_id FK
        datetime prediction_timestamp
        float delay_probability
        float sla_breach_probability
        int risk_score
        datetime predicted_eta
        float expected_delay_minutes
        json shap_factors
        string model_version
    }

    RECOVERY_PLANS {
        string recovery_id PK
        string shipment_id FK
        string plan_strategy
        string action_type
        string alternate_route_name
        string alternate_carrier_id
        float additional_cost_inr
        datetime predicted_eta
        int delay_reduction_minutes
        string sla_outcome
        boolean is_feasible
        string approval_status
        string operator_id
        datetime decided_at
    }

    AUDIT_LOGS {
        string audit_id PK
        string shipment_id FK
        string event_type
        string previous_state
        string new_state
        string trigger_source
        string operator_id
        string justification
        datetime timestamp
    }

    CARRIERS {
        string carrier_id PK
        string carrier_name
        string primary_mode
        float historical_on_time_rate
        float available_capacity_units
        float cost_multiplier
    }
```

---

## 2. Table Definitions (DDL Highlights)

### 2.1 `shipments`
- Primary key: `shipment_id VARCHAR(64) PRIMARY KEY`
- Key tracking fields: `origin`, `destination`, `origin_lat`, `origin_lon`, `destination_lat`, `destination_lon`, `current_lat`, `current_lon`, `route_id`, `transport_mode`, `carrier_id`
- Temporal deadlines: `planned_departure`, `promised_delivery`, `current_eta`
- Operational state: `status` (`in_transit`, `delayed`, `delivered`, `critical`, `rerouted`)
- Computed cache: `risk_score INTEGER`, `sla_breach_probability FLOAT`, `sla_buffer_minutes FLOAT`

### 2.2 `disruption_events`
- Primary key: `event_id VARCHAR(64) PRIMARY KEY`
- Categorization: `event_type VARCHAR(64)` (`TRAFFIC_CONGESTION`, `SEVERE_WEATHER`, `PORT_CONGESTION`, `FLIGHT_DELAY`, `HAZARD_EARTHQUAKE`, `ROAD_CLOSURE`)
- Metrics: `severity FLOAT` (0.0 to 10.0), `impact_radius_km FLOAT`, `estimated_delay_minutes INTEGER`
- Spatial & Temporal: `latitude FLOAT`, `longitude FLOAT`, `start_time TIMESTAMPTZ`, `expected_end TIMESTAMPTZ`

### 2.3 `recovery_plans`
- Primary key: `recovery_id VARCHAR(64) PRIMARY KEY`
- Reference: `shipment_id VARCHAR(64) REFERENCES shipments(shipment_id)`
- Strategic categorization: `plan_strategy` (`LOW_COST`, `MIN_DELAY`, `MAX_SLA`, `BALANCED`)
- Action assigned: `action_type` (`MAINTAIN_ROUTE`, `ALTERNATE_ROUTE`, `CARRIER_SWITCH`, `EXPEDITE`, `HOLD_MONITOR`, `ESCALATE`)
- Metrics: `additional_cost_inr FLOAT`, `predicted_eta TIMESTAMPTZ`, `is_feasible BOOLEAN`
- Lifecycle: `approval_status` (`PENDING`, `APPROVED`, `REJECTED`, `SUPERSEDED_REPLAN`)

### 2.4 `audit_logs`
- Primary key: `audit_id VARCHAR(64) PRIMARY KEY`
- Traceability: `shipment_id`, `event_type`, `previous_state JSON`, `new_state JSON`, `operator_id`, `justification`, `timestamp TIMESTAMPTZ`
