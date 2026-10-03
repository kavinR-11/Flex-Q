"""
Detailed Model Validation & Benchmarking Script for YOLO x FluxQ
Evaluates held-out test set performance, subgroup metrics, latency profiles,
calibration reliability, and confusion matrices.
"""

import json
import os
import time
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    median_absolute_error,
    precision_score,
    recall_score,
    roc_auc_score,
    root_mean_squared_error,
)

from backend.app.ml.inference import RiskPredictor

def evaluate_models(test_csv_path: str = "data/training/test.csv") -> dict:
    print("[ML Validation] Starting Held-Out Evaluation on Test Split...")
    df_test = pd.read_csv(test_csv_path)
    predictor = RiskPredictor()

    y_true_cls = df_test["target_sla_breached"].values
    y_true_reg = df_test["target_actual_delay_minutes"].values

    latencies_ms = []
    y_pred_probs = []
    y_pred_cls = []
    y_pred_reg = []
    risk_scores = []

    # Run inference row-by-row to measure real-world operational latency
    for _, row in df_test.iterrows():
        sh_feat = row.to_dict()
        t0 = time.perf_counter()
        pred = predictor.predict_shipment(sh_feat)
        t_elapsed = (time.perf_counter() - t0) * 1000.0  # ms
        latencies_ms.append(t_elapsed)

        y_pred_probs.append(pred["p_sla_breach"])
        y_pred_cls.append(1 if pred["p_sla_breach"] >= 0.50 else 0)
        y_pred_reg.append(pred["predicted_delay_minutes"])
        risk_scores.append(pred["risk_score"])

    y_pred_probs = np.array(y_pred_probs)
    y_pred_cls = np.array(y_pred_cls)
    y_pred_reg = np.array(y_pred_reg)

    # 1. Classification Metrics
    roc_auc = roc_auc_score(y_true_cls, y_pred_probs)
    pr_auc = average_precision_score(y_true_cls, y_pred_probs)
    brier = brier_score_loss(y_true_cls, y_pred_probs)
    f1 = f1_score(y_true_cls, y_pred_cls)
    precision = precision_score(y_true_cls, y_pred_cls)
    recall = recall_score(y_true_cls, y_pred_cls)
    acc = accuracy_score(y_true_cls, y_pred_cls)
    cm = confusion_matrix(y_true_cls, y_pred_cls).tolist()  # [[TN, FP], [FN, TP]]

    # 2. Regression Metrics
    mae = mean_absolute_error(y_true_reg, y_pred_reg)
    rmse = root_mean_squared_error(y_true_reg, y_pred_reg)
    med_ae = median_absolute_error(y_true_reg, y_pred_reg)

    # 3. Latency Metrics
    lat_p50 = np.percentile(latencies_ms, 50)
    lat_p95 = np.percentile(latencies_ms, 95)
    lat_p99 = np.percentile(latencies_ms, 99)

    # 4. Subgroup Performance across Modes
    subgroup_metrics = {}
    for mode in df_test["transport_mode"].unique():
        idx = df_test["transport_mode"] == mode
        if np.sum(idx) > 0:
            m_true_cls = y_true_cls[idx]
            m_prob_cls = y_pred_probs[idx]
            m_true_reg = y_true_reg[idx]
            m_pred_reg = y_pred_reg[idx]

            subgroup_metrics[mode] = {
                "sample_count": int(np.sum(idx)),
                "breach_prevalence": round(float(np.mean(m_true_cls)), 3),
                "roc_auc": round(float(roc_auc_score(m_true_cls, m_prob_cls)), 4) if len(np.unique(m_true_cls)) > 1 else 1.0,
                "regression_mae_minutes": round(float(mean_absolute_error(m_true_reg, m_pred_reg)), 2),
            }

    report = {
        "evaluation_dataset": test_csv_path,
        "total_test_samples": len(df_test),
        "classification_performance": {
            "roc_auc": round(float(roc_auc), 4),
            "pr_auc": round(float(pr_auc), 4),
            "brier_score": round(float(brier), 4),
            "accuracy": round(float(acc), 4),
            "f1_score": round(float(f1), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1],
            },
        },
        "regression_performance": {
            "mean_absolute_error_minutes": round(float(mae), 2),
            "root_mean_squared_error_minutes": round(float(rmse), 2),
            "median_absolute_error_minutes": round(float(med_ae), 2),
        },
        "inference_latency_ms": {
            "p50": round(float(lat_p50), 2),
            "p95": round(float(lat_p95), 2),
            "p99": round(float(lat_p99), 2),
            "mean": round(float(np.mean(latencies_ms)), 2),
        },
        "subgroup_analysis_by_mode": subgroup_metrics,
    }

    print("\n=== Validation Results Summary ===")
    print(f"  Test ROC-AUC:    {roc_auc:.4f}")
    print(f"  Test PR-AUC:     {pr_auc:.4f}")
    print(f"  Test Brier:      {brier:.4f}")
    print(f"  Test Precision:  {precision:.4f} | Recall: {recall:.4f} | F1: {f1:.4f}")
    print(f"  Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print(f"  Regression MAE:  {mae:.2f} mins | RMSE: {rmse:.2f} mins | MedAE: {med_ae:.2f} mins")
    print(f"  Inference Latency: p50={lat_p50:.2f}ms, p95={lat_p95:.2f}ms")

    out_json = "backend/models/model_metrics.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"[ML Validation] Report saved to {out_json}")
    return report

if __name__ == "__main__":
    evaluate_models()
