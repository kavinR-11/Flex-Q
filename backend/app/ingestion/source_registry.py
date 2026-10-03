"""
Data Source Registry for YOLO x FluxQ
Maintains source definitions, metadata, schemas, and acquisition statuses.
"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class DataSourceMetadata:
    source_id: str
    name: str
    category: str
    provider: str
    url: str
    license_type: str
    geographic_coverage: str
    update_frequency: str
    local_raw_path: str
    is_authoritative: bool
    requires_auth: bool = False

DATA_SOURCE_CATALOG: dict[str, DataSourceMetadata] = {
    "weather_meteo": DataSourceMetadata(
        source_id="weather_meteo",
        name="Open-Meteo ERA5 Reanalysis & Observations",
        category="WEATHER",
        provider="Open-Meteo / ECMWF",
        url="https://archive-api.open-meteo.com/v1/archive",
        license_type="ODbL / CC-BY",
        geographic_coverage="India Logistics Nodes (Chennai, Bengaluru, Mumbai, Delhi, Hyderabad)",
        update_frequency="Hourly",
        local_raw_path="data/raw/weather/open_meteo_corridor.json",
        is_authoritative=True,
    ),
    "traffic_nhai": DataSourceMetadata(
        source_id="traffic_nhai",
        name="NHAI Highway Corridor Traffic Telematics",
        category="TRAFFIC",
        provider="MoRTH / NHAI",
        url="https://morth.nic.in/corridor-telematics",
        license_type="Open Government Data (OGD)",
        geographic_coverage="NH48, NH44, NH16, Golden Quadrilateral",
        update_frequency="Continuous / Periodic",
        local_raw_path="data/raw/traffic/nhai_corridors.json",
        is_authoritative=True,
    ),
    "port_ipa": DataSourceMetadata(
        source_id="port_ipa",
        name="Indian Ports Association Port Turnaround & Congestion",
        category="PORT",
        provider="Indian Ports Association / Ministry of Ports",
        url="http://ipa.nic.in/",
        license_type="Public Logistics Telematics",
        geographic_coverage="Chennai Port, JNPT Mumbai, Kamarajar Ennore, Tuticorin",
        update_frequency="Daily",
        local_raw_path="data/raw/ports/ipa_port_telematics.json",
        is_authoritative=True,
    ),
    "aviation_dgca": DataSourceMetadata(
        source_id="aviation_dgca",
        name="Aviation OTP & Cargo Flight Performance",
        category="AVIATION",
        provider="DGCA / AAI / BTS TranStats Baseline",
        url="https://www.dgca.gov.in/",
        license_type="Open Aviation Telematics",
        geographic_coverage="MAA, BLR, BOM, DEL, HYD",
        update_frequency="Daily / Flight-level",
        local_raw_path="data/raw/aviation/air_cargo_performance.json",
        is_authoritative=True,
    ),
    "hazard_usgs": DataSourceMetadata(
        source_id="hazard_usgs",
        name="USGS ANSS ComCat Seismic Telematics",
        category="HAZARDS",
        provider="USGS",
        url="https://earthquake.usgs.gov/fdsnws/event/1/query",
        license_type="Public Domain",
        geographic_coverage="Global / Regional South Asia",
        update_frequency="Real-time / Historical API",
        local_raw_path="data/raw/hazards/usgs_seismic_events.json",
        is_authoritative=True,
    ),
    "shipment_synthetic": DataSourceMetadata(
        source_id="shipment_synthetic",
        name="Synthetic Logistics Shipment & Disruption Telematics",
        category="SHIPMENT",
        provider="YOLO x FluxQ Physics-Based Generator",
        url="internal://generator",
        license_type="Proprietary Prototype (Synthetic)",
        geographic_coverage="India Domestic Freight Network",
        update_frequency="On-demand batch",
        local_raw_path="data/synthetic/shipments_raw.json",
        is_authoritative=False,
    ),
}

def get_source_metadata(source_id: str) -> Optional[DataSourceMetadata]:
    return DATA_SOURCE_CATALOG.get(source_id)
