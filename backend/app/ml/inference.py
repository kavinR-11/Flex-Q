"""
Predictive Inference & Explainability Engine for YOLO x FluxQ
Provides unified model scoring:
  - Task A & B: Calibrated SLA-breach probability & standardized 1-10 risk score
  - Task C: Predicted ETA & expected delay minutes
  - Explainable AI: SHAP feature contributions
"""

from datetime import datetime, timedelta, timezone
import math
import os
import joblib
import numpy as np
import pandas as pd
import shap

from backend.app.ml.preprocessor import CATEGORICAL_FEATURES, NUMERICAL_FEATURES

class RiskPredictor:
    def __init__(self, models_dir: str = "backend/models"):
        self.models_dir = models_dir
        self.preprocessor = joblib.load(os.path.join(models_dir, "preprocessor.joblib"))
        self.classifier = joblib.load(os.path.join(models_dir, "sla_classifier_calibrated.joblib"))
        self.regressor = joblib.load(os.path.join(models_dir, "eta_regressor.joblib"))
        self.raw_tree_clf = joblib.load(os.path.join(models_dir, "raw_best_tree_clf.joblib"))
        
        # Initialize SHAP Explainer on raw tree classifier
        self.explainer = shap.TreeExplainer(self.raw_tree_clf)
        
        # Retrieve transformed feature names for SHAP attribution
        try:
            self.feature_names = self.preprocessor.get_feature_names_out()
        except Exception:
            self.feature_names = None

    def predict_shipment(self, shipment_features: dict) -> dict:
        """
        Runs full inference on a single shipment feature dictionary.
        """
        feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
        # Build 1-row DataFrame
        row_dict = {col: [shipment_features.get(col, 0)] for col in feature_cols}
        df_in = pd.DataFrame(row_dict)

        # Transform features
        X_trans = self.preprocessor.transform(df_in)

        # 1. Calibrated SLA breach probability
        probs = self.classifier.predict_proba(X_trans)[0]
        p_sla_breach = float(probs[1]) if len(probs) > 1 else float(probs[0])
        p_sla_breach = round(min(0.999, max(0.001, p_sla_breach)), 3)

        # Delay probability estimate (Task A)
        p_delay = round(min(0.999, max(p_sla_breach, p_sla_breach * 1.15)), 3)

        # Official standardized integer risk score:
        # R = max(1, min(10, ceil(10 * p)))
        risk_score = max(1, min(10, math.ceil(10.0 * p_sla_breach)))
        risk_category = (
            "Critical" if risk_score >= 9 else (
                "High" if risk_score >= 7 else (
                    "Moderate" if risk_score >= 4 else "Low"
                )
            )
        )

        # 2. Predicted delay (Task C) & ETA
        predicted_delay_mins = float(self.regressor.predict(X_trans)[0])
        predicted_delay_mins = round(max(0.0, predicted_delay_mins), 1)

        # Compute updated ETA
        current_eta_raw = shipment_features.get("current_eta")
        if current_eta_raw:
            eta_base = datetime.fromisoformat(current_eta_raw.replace("Z", "+00:00"))
        else:
            eta_base = datetime.now(timezone.utc)
            
        predicted_eta = eta_base + timedelta(minutes=predicted_delay_mins * 0.5)

        # 3. Operational Flag
        flagged_for_review = bool(risk_score >= 7 or p_sla_breach >= 0.50)

        return {
            "p_delay": p_delay,
            "p_sla_breach": p_sla_breach,
            "risk_score": risk_score,
            "risk_category": risk_category,
            "predicted_delay_minutes": predicted_delay_mins,
            "predicted_eta": predicted_eta.isoformat(),
            "flagged_for_review": flagged_for_review,
            "model_version": "YOLO-FluxQ-LGBM-v1.0",
            "prediction_timestamp": datetime.now(timezone.utc).isoformat()
        }

    def explain_prediction(self, shipment_features: dict, top_k: int = 4) -> dict:
        """
        Computes SHAP feature importance for the specific shipment.
        """
        feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
        row_dict = {col: [shipment_features.get(col, 0)] for col in feature_cols}
        df_in = pd.DataFrame(row_dict)
        X_trans = self.preprocessor.transform(df_in)

        shap_values = self.explainer.shap_values(X_trans)
        
        # Handle binary classification output format
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        else:
            sv = shap_values[0]

        feat_names = (
            list(self.feature_names) if self.feature_names is not None
            else [f"feature_{i}" for i in range(len(sv))]
        )

        factors = []
        for name, val in zip(feat_names, sv):
            clean_name = name.replace("num__", "").replace("cat__", "")
            factors.append({
                "feature": clean_name,
                "shap_impact": round(float(val), 4),
                "abs_impact": abs(float(val)),
                "direction": "INCREASING_RISK" if val > 0 else "REDUCING_RISK"
            })

        factors.sort(key=lambda x: x["abs_impact"], reverse=True)
        top_factors = factors[:top_k]

        return {
            "top_risk_drivers": top_factors,
            "disclaimer": (
                "SHAP values measure statistical attribution within the model. "
                "They do not constitute physical or causal proof of disruption etiology."
            )
        }
