"""
Feature Preprocessor Pipeline for YOLO x FluxQ
Defines categorical encoding, numerical scaling, and missing value imputation
with strict training-only fitting.
"""

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

CATEGORICAL_FEATURES = [
    "origin",
    "destination",
    "transport_mode",
    "carrier_id",
    "route_id",
]

NUMERICAL_FEATURES = [
    "cargo_priority",
    "cargo_value_inr",
    "weight_kg",
    "dispatch_hour",
    "day_of_week",
    "month",
    "remaining_distance_km",
    "remaining_time_minutes",
    "sla_hours",
    "sla_buffer_minutes",
    "weather_severity",
    "precipitation",
    "wind_speed",
    "visibility",
    "weather_event_distance",
    "congestion_index",
    "traffic_delay_minutes",
    "incident_distance",
    "road_closure",
    "port_congestion",
    "port_waiting_time",
    "flight_delay",
    "geopolitical_event_count",
    "earthquake_exposure",
    "infrastructure_disruption",
    "route_historical_delay",
    "carrier_reliability",
]

def build_preprocessor() -> ColumnTransformer:
    cat_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    num_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", cat_transformer, CATEGORICAL_FEATURES),
            ("num", num_transformer, NUMERICAL_FEATURES),
        ],
        remainder="drop",
    )

    return preprocessor
