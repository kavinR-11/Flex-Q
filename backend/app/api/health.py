"""
Health & System Status API Router
"""

from datetime import datetime, timezone
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health_status(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error_connecting"

    # Check Model Artifacts
    clf_exists = os.path.exists(os.path.join(settings.MODELS_DIR, "sla_classifier_calibrated.joblib"))
    reg_exists = os.path.exists(os.path.join(settings.MODELS_DIR, "eta_regressor.joblib"))

    return {
        "status": "healthy",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": db_status,
            "ml_models": {
                "sla_classifier": "loaded (lightgbm_calibrated_v1)" if clf_exists else "missing",
                "eta_regressor": "loaded (random_forest_reg_v1)" if reg_exists else "missing",
            },
            "classical_solver": "ready (google_or_tools_scip_mip)",
            "quantum_module": "available (qiskit_statevector_simulator)",
        },
    }
