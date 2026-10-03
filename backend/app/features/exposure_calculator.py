"""
Exposure Calculator for YOLO x FluxQ
Aggregates spatial-temporal disruption event exposures into tabular model features.
"""

from backend.app.features.spatial_temporal_join import calculate_shipment_event_exposure

CARRIER_BASELINES = {
    "CARRIER-A": {"historical_reliability": 0.92, "avg_delay_rate": 0.08},
    "CARRIER-B": {"historical_reliability": 0.97, "avg_delay_rate": 0.03},
    "CARRIER-C": {"historical_reliability": 0.86, "avg_delay_rate": 0.14},
    "CARRIER-D": {"historical_reliability": 0.88, "avg_delay_rate": 0.12},
}

ROUTE_BASELINES = {
    "RT-MAA-BLR-01": {"historical_delay_mins": 35.0},
    "RT-BLR-MAA-01": {"historical_delay_mins": 30.0},
    "RT-BLR-HYD-01": {"historical_delay_mins": 45.0},
    "RT-MAA-HYD-01": {"historical_delay_mins": 55.0},
    "RT-BOM-PNQ-01": {"historical_delay_mins": 25.0},
    "RT-BOM-DEL-01": {"historical_delay_mins": 110.0},
    "RT-MAA-CJB-01": {"historical_delay_mins": 40.0},
}

def compute_shipment_exposure_profile(shipment: dict, events_list: list[dict]) -> dict:
    """
    Computes unified multi-source exposure features for a shipment.
    """
    # Defaults
    weather_severity = 1.0
    precipitation = 0.0
    wind_speed = 15.0
    visibility = 10.0
    weather_event_dist = 999.0
    
    congestion_index = 1.5
    traffic_delay_minutes = 0.0
    incident_distance = 999.0
    road_closure = 0
    
    port_congestion = 0.0
    port_waiting_time = 0.0
    
    flight_delay = 0.0
    geopolitical_event_count = 0
    earthquake_exposure = 0.0
    infrastructure_disruption = 0.0
    
    # Evaluate every event against this shipment
    for event in events_list:
        exposure = calculate_shipment_event_exposure(shipment, event)
        if not exposure:
            continue
            
        etype = exposure["event_type"]
        dist = exposure["distance_to_event_km"]
        sev = exposure["event_severity"]
        
        if etype == "SEVERE_WEATHER":
            if dist < weather_event_dist:
                weather_event_dist = dist
                weather_severity = max(weather_severity, sev)
                precipitation = max(precipitation, sev * 6.5)
                wind_speed = max(wind_speed, 25.0 + sev * 4.0)
                visibility = max(1.0, 10.0 - (sev * 0.9))
                
        elif etype in ("TRAFFIC_CONGESTION", "ROAD_CLOSURE"):
            if dist < incident_distance:
                incident_distance = dist
                congestion_index = max(congestion_index, sev)
                traffic_delay_minutes += exposure["estimated_delay_impact"] * (exposure["exposure_score"] / 10.0)
                if etype == "ROAD_CLOSURE":
                    road_closure = 1
                    
        elif etype == "PORT_CONGESTION" and shipment["transport_mode"] in ("MARITIME", "ROAD"):
            port_congestion = max(port_congestion, sev)
            port_waiting_time = max(port_waiting_time, (exposure["estimated_delay_impact"] / 60.0))
            
        elif etype == "HAZARD_EARTHQUAKE":
            earthquake_exposure = max(earthquake_exposure, sev)
            infrastructure_disruption = max(infrastructure_disruption, exposure["exposure_score"])
            
    # Carrier and route baselines
    carrier_info = CARRIER_BASELINES.get(shipment["carrier_id"], {"historical_reliability": 0.90, "avg_delay_rate": 0.10})
    route_info = ROUTE_BASELINES.get(shipment.get("route_id"), {"historical_delay_mins": 35.0})
    
    return {
        "weather_severity": round(weather_severity, 2),
        "precipitation": round(precipitation, 1),
        "wind_speed": round(wind_speed, 1),
        "visibility": round(visibility, 1),
        "weather_event_distance": round(weather_event_dist, 1),
        "congestion_index": round(congestion_index, 2),
        "traffic_delay_minutes": round(traffic_delay_minutes, 1),
        "incident_distance": round(incident_distance, 1),
        "road_closure": int(road_closure),
        "port_congestion": round(port_congestion, 2),
        "port_waiting_time": round(port_waiting_time, 1),
        "flight_delay": round(flight_delay, 1),
        "geopolitical_event_count": int(geopolitical_event_count),
        "earthquake_exposure": round(earthquake_exposure, 2),
        "infrastructure_disruption": round(infrastructure_disruption, 2),
        "route_historical_delay": round(float(route_info["historical_delay_mins"]), 1),
        "carrier_reliability": round(float(carrier_info["historical_reliability"]), 2),
    }
