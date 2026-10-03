"""
Model Training & Calibration Pipeline for YOLO x FluxQ
Trains baselines and candidate models for:
  - Task A & B: SLA-breach classification with Isotonic probability calibration
  - Task C: ETA / delay regression
Fits preprocessor strictly on the training partition.
"""

import json
import os
import time
import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    f1_score,
    mean_absolute_error,
    precision_score,
    recall_score,
    roc_auc_score,
    root_mean_squared_error,
)

from backend.app.ml.preprocessor import (
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    build_preprocessor,
)

def train_all_models(data_dir: str = "data/training", models_dir: str = "backend/models"):
    os.makedirs(models_dir, exist_ok=True)
    start_time = time.time()
    print("[ML Training] Starting YOLO x FluxQ Model Training Pipeline...")

    # 1. Load splits
    df_train = pd.read_csv(os.path.join(data_dir, "train.csv"))
    df_val = pd.read_csv(os.path.join(data_dir, "val.csv"))
    df_test = pd.read_csv(os.path.join(data_dir, "test.csv"))

    feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    X_train_raw = df_train[feature_cols]
    X_val_raw = df_val[feature_cols]
    X_test_raw = df_test[feature_cols]

    y_train_cls = df_train["target_sla_breached"].values
    y_val_cls = df_val["target_sla_breached"].values
    y_test_cls = df_test["target_sla_breached"].values

    y_train_reg = df_train["target_actual_delay_minutes"].values
    y_val_reg = df_val["target_actual_delay_minutes"].values
    y_test_reg = df_test["target_actual_delay_minutes"].values

    print(f"  Data splits: Train={len(X_train_raw)}, Val={len(X_val_raw)}, Test={len(X_test_raw)}")

    # 2. Fit Preprocessor exclusively on X_train
    print("  Fitting preprocessor on training partition...")
    preprocessor = build_preprocessor()
    X_train = preprocessor.fit_transform(X_train_raw)
    X_val = preprocessor.transform(X_val_raw)
    X_test = preprocessor.transform(X_test_raw)
    print(f"  Transformed feature dimension: {X_train.shape[1]} features.")

    # -------------------------------------------------------------
    # 3. Model A/B: SLA Breach Classification
    # -------------------------------------------------------------
    print("\n--- Training SLA Breach Classifiers ---")
    cls_candidates = {
        "Dummy (Most Frequent)": DummyClassifier(strategy="most_frequent"),
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced"),
        "LightGBM Classifier": LGBMClassifier(n_estimators=150, learning_rate=0.05, class_weight="balanced", random_state=42, verbose=-1),
    }

    cls_results = {}
    best_cls_name = None
    best_cls_model = None
    best_val_roc = -1.0

    for name, model in cls_candidates.items():
        model.fit(X_train, y_train_cls)
        y_val_pred = model.predict(X_val)
        y_val_prob = model.predict_proba(X_val)[:, 1] if hasattr(model, "predict_proba") else y_val_pred

        roc = roc_auc_score(y_val_cls, y_val_prob) if len(np.unique(y_val_prob)) > 1 else 0.5
        brier = brier_score_loss(y_val_cls, y_val_prob)
        f1 = f1_score(y_val_cls, y_val_pred, zero_division=0)
        rec = recall_score(y_val_cls, y_val_pred, zero_division=0)
        prec = precision_score(y_val_cls, y_val_pred, zero_division=0)

        cls_results[name] = {
            "val_roc_auc": round(float(roc), 4),
            "val_brier_score": round(float(brier), 4),
            "val_f1": round(float(f1), 4),
            "val_recall": round(float(rec), 4),
            "val_precision": round(float(prec), 4),
        }
        print(f"  [{name}] ROC-AUC: {roc:.4f} | Brier: {brier:.4f} | F1: {f1:.4f} | Rec: {rec:.4f} | Prec: {prec:.4f}")

        if roc > best_val_roc:
            best_val_roc = roc
            best_cls_name = name
            best_cls_model = model

    print(f"  => Best Raw Classifier: {best_cls_name} (ROC-AUC: {best_val_roc:.4f})")

    # 4. Calibrate probabilities using modern cross-validated Isotonic Calibration
    print("  Applying Isotonic Probability Calibration...")
    calibrated_clf = CalibratedClassifierCV(estimator=best_cls_model, method="isotonic", cv=3)
    calibrated_clf.fit(X_train, y_train_cls)

    # Evaluate Calibrated Classifier on Held-Out Test Set
    y_test_pred = calibrated_clf.predict(X_test)
    y_test_prob = calibrated_clf.predict_proba(X_test)[:, 1]
    test_roc = roc_auc_score(y_test_cls, y_test_prob)
    test_brier = brier_score_loss(y_test_cls, y_test_prob)
    test_f1 = f1_score(y_test_cls, y_test_pred)
    test_rec = recall_score(y_test_cls, y_test_pred)
    test_prec = precision_score(y_test_cls, y_test_pred)

    print(f"  [Calibrated {best_cls_name} on TEST SET]")
    print(f"    Test ROC-AUC:    {test_roc:.4f}")
    print(f"    Test Brier Score: {test_brier:.4f} (lower is better calibrated)")
    print(f"    Test F1 Score:   {test_f1:.4f}")
    print(f"    Test Recall:     {test_rec:.4f}")
    print(f"    Test Precision:  {test_prec:.4f}")

    # -------------------------------------------------------------
    # 5. Model C: Delay Regression (ETA Prediction)
    # -------------------------------------------------------------
    print("\n--- Training Delay Regressors (Minutes) ---")
    reg_candidates = {
        "Dummy (Mean)": DummyRegressor(strategy="mean"),
        "Ridge Regression": Ridge(alpha=1.0),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, random_state=42),
    }

    reg_results = {}
    best_reg_name = None
    best_reg_model = None
    best_val_mae = float("inf")

    for name, model in reg_candidates.items():
        model.fit(X_train, y_train_reg)
        y_val_pred = model.predict(X_val)
        mae = mean_absolute_error(y_val_reg, y_val_pred)
        rmse = root_mean_squared_error(y_val_reg, y_val_pred)

        reg_results[name] = {
            "val_mae": round(float(mae), 2),
            "val_rmse": round(float(rmse), 2),
        }
        print(f"  [{name}] Val MAE: {mae:.2f} mins | Val RMSE: {rmse:.2f} mins")

        if mae < best_val_mae:
            best_val_mae = mae
            best_reg_name = name
            best_reg_model = model

    print(f"  => Best Regressor: {best_reg_name} (MAE: {best_val_mae:.2f} mins)")

    # Evaluate best regressor on Held-Out Test Set
    y_test_pred_reg = best_reg_model.predict(X_test)
    test_mae = mean_absolute_error(y_test_reg, y_test_pred_reg)
    test_rmse = root_mean_squared_error(y_test_reg, y_test_pred_reg)
    print(f"  [Best Regressor on TEST SET] Test MAE: {test_mae:.2f} mins | Test RMSE: {test_rmse:.2f} mins")

    # -------------------------------------------------------------
    # 6. Save Model Artifacts
    # -------------------------------------------------------------
    preproc_path = os.path.join(models_dir, "preprocessor.joblib")
    clf_path = os.path.join(models_dir, "sla_classifier_calibrated.joblib")
    reg_path = os.path.join(models_dir, "eta_regressor.joblib")
    raw_clf_path = os.path.join(models_dir, "raw_best_tree_clf.joblib")

    joblib.dump(preprocessor, preproc_path)
    joblib.dump(calibrated_clf, clf_path)
    joblib.dump(best_reg_model, reg_path)
    joblib.dump(best_cls_model, raw_clf_path)

    training_metadata = {
        "timestamp": datetime.now().isoformat(),
        "training_duration_seconds": round(time.time() - start_time, 2),
        "selected_classifier": best_cls_name,
        "selected_regressor": best_reg_name,
        "classifier_validation_benchmarks": cls_results,
        "regressor_validation_benchmarks": reg_results,
        "test_evaluation": {
            "classification": {
                "test_roc_auc": round(float(test_roc), 4),
                "test_brier_score": round(float(test_brier), 4),
                "test_f1": round(float(test_f1), 4),
                "test_recall": round(float(test_rec), 4),
                "test_precision": round(float(test_prec), 4),
            },
            "regression": {
                "test_mae_minutes": round(float(test_mae), 2),
                "test_rmse_minutes": round(float(test_rmse), 2),
            },
        },
        "artifacts": {
            "preprocessor": preproc_path,
            "calibrated_classifier": clf_path,
            "eta_regressor": reg_path,
            "raw_tree_classifier": raw_clf_path,
        },
    }

    summary_path = os.path.join(models_dir, "training_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(training_metadata, f, indent=2)

    print(f"\n[ML Training] Pipeline Complete. Artifacts saved to {models_dir} in {time.time() - start_time:.2f}s.")
    return training_metadata

if __name__ == "__main__":
    from datetime import datetime
    train_all_models()
