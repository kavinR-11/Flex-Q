"""
Application Configuration for YOLO x FluxQ
"""

import os

class Settings:
    PROJECT_NAME: str = "YOLO x FluxQ Logistics Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./yolo_fluxq.db")
    
    # Models
    MODELS_DIR: str = os.getenv("MODELS_DIR", "backend/models")
    
    # Optimization Defaults
    DEFAULT_MAX_BUDGET_INR: float = 15000.0
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
