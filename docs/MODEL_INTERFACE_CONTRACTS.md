# Model Interface Contracts: YOLO × FluxQ

**Scope:** Interface definitions, input feature vectors, inference schemas, calibration protocols, and model artifact versioning for YOLO × FluxQ.

---

## 1. Feature Vector Contract: Input Schema

Every inference request passes through the normalized feature pipeline:

```python
class ShipmentPredictionFeatures(BaseModel):
    # Spatial & Route identifiers
    origin: str
    destination: str
    transport_mode: Literal["ROAD", "AIR", "MARITIME", "RAIL"]
    carrier_id: str
    route_id: str

    # Temporal & State features
    dispatch_hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    month: int = Field(ge=1, le=12)
    remaining_distance_km: float = Field(ge=0.0)
    planned_transit_duration_minutes: float = Field(ge=0.0)
    elapsed_time_minutes: float = Field(ge=0.0)
    sla_buffer_minutes: float  # can be negative if already behind

    # Cargo features
    cargo_priority: int = Field(ge=1, le=5)  # 1 = Highest
    cargo_value_inr: float = Field(ge=0.0)

    # Carrier historical baseline (fitted on historical split only)
    carrier_historical_reliability: float = Field(ge=0.0, le=1.0)
    carrier_historical_on_time_rate: float = Field(ge=0.0, le=1.0)

    # Environmental & Route Exposure (calculated at prediction time)
    weather_severity_score: float = Field(ge=0.0, le=10.0)
    precipitation_mm: float = Field(ge=0.0)
    wind_speed_kmh: float = Field(ge=0.0)
    visibility_km: float = Field(ge=0.0)
    weather_event_distance_km: float = Field(ge=0.0)

    # Traffic Exposure
    congestion_index: float = Field(ge=0.0, le=10.0)
    traffic_delay_minutes: float = Field(ge=0.0)
    incident_distance_km: float = Field(ge=0.0)
    road_closure_flag: int = Field(ge=0, le=1)

    # Port & Aviation Exposure
    port_waiting_time_hours: float = Field(ge=0.0)
    port_dwell_time_days: float = Field(ge=0.0)
    flight_delay_minutes: float = Field(ge=0.0)
    airport_congestion_index: float = Field(ge=0.0, le=10.0)

    # Geopolitical & Hazard Exposure
    geopolitical_event_count: int = Field(ge=0)
    natural_hazard_exposure: float = Field(ge=0.0, le=10.0)
```

---

## 2. Model Prediction Output Contract

```python
class PredictionOutput(BaseModel):
    shipment_id: str
    prediction_timestamp: datetime
    model_version: str

    # Task A: Delay Probability
    p_delay: float = Field(ge=0.0, le=1.0, description="P(Late | X)")

    # Task B: SLA-breach Probability (Calibrated)
    p_sla_breach: float = Field(ge=0.0, le=1.0, description="Calibrated P(SLA Breach | X)")

    # Official Standardized Integer Risk Score (1 to 10)
    # R = max(1, min(10, ceil(10 * p_sla_breach)))
    risk_score: int = Field(ge=1, le=10)
    risk_category: Literal["Low", "Moderate", "High", "Critical"]

    # Task C: Expected Delivery Time and Delay
    predicted_eta: datetime
    expected_delay_minutes: float = Field(ge=0.0)

    # Operational triage recommendation
    flagged_for_review: bool
```

---

## 3. Probability Calibration Contract

Raw tree probabilities can be overconfident or poorly calibrated under class imbalance.
- **Protocol:**
  - Split dataset into: `Train` (60%), `Calibration` (20%), and `Held-out Test` (20%) using temporal ordering (no future leakage).
  - Train LightGBM classifier on `Train`.
  - Fit `CalibratedClassifierCV(estimator=base_model, method='isotonic', cv='prefit')` on the `Calibration` set.
  - Evaluate Brier Score and Expected Calibration Error (ECE) on the `Held-out Test` set.
  - Return calibrated probability $p$ to downstream risk scoring.

---

## 4. Explainability (SHAP) Contract

```python
class ShapFeatureContribution(BaseModel):
    feature_name: str
    feature_value: float | str
    shap_value: float
    direction: Literal["INCREASING_RISK", "REDUCING_RISK"]
    importance_rank: int

class ExplainabilityResponse(BaseModel):
    shipment_id: str
    base_probability: float
    predicted_probability: float
    top_risk_drivers: list[ShapFeatureContribution]
    disclaimer: str = (
        "SHAP values measure statistical attribution within the model. "
        "They do not constitute physical or causal proof of disruption etiology."
    )
```

---

## 5. Model Artifact Packaging & Versioning
- Model artifacts are saved in `backend/models/`:
  - `sla_classifier_v1.joblib`: Calibrated classifier pipeline (Preprocessor + LightGBM + Isotonic).
  - `eta_regressor_v1.joblib`: Regressor pipeline (Preprocessor + GradientBoostingRegressor).
  - `feature_metadata.json`: Feature names, types, imputation strategies, and baseline training statistics.
  - `model_metrics.json`: Evaluated test metrics (PR-AUC, ROC-AUC, Brier score, MAE, RMSE).
