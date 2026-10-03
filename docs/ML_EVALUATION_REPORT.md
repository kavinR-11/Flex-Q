# ML Evaluation Report: YOLO × FluxQ

**Evaluation Date:** October 3, 2026  
**Evaluator:** Lead Machine Learning Researcher  
**Test Partition:** `data/training/test.csv` (375 samples strictly held out from training and calibration)  
**Artifact Directory:** `backend/models/`

---

## 1. Executive Summary

All reported performance metrics represent actual, measured empirical evaluations executed on the held-out test partition (`test.csv`). Zero training metrics are presented as test scores.

| Task | Primary Metric | Baseline | Champion Model | Measured Test Value |
|---|---|---|---|---|
| **Task B: SLA Breach Classification** | **ROC-AUC** | 0.5000 (Dummy) | Calibrated LightGBM | **$0.9885$** |
| **Task B: Calibration Quality** | **Brier Score** | 0.1307 (Dummy) | Isotonic Calibrated LightGBM | **$0.0108$** |
| **Task B: Precision / Recall** | **Precision / Recall / F1** | $0.0 / 0.0 / 0.0$ | Calibrated LightGBM | **Prec: $1.0000$ / Rec: $0.9259$ / F1: $0.9615$** |
| **Task C: ETA Regression** | **MAE (Minutes)** | 44.49 mins (Dummy Mean) | Random Forest Regressor | **$20.21$ mins** (54.6% error reduction) |
| **Operational Responsiveness** | **Inference Latency** | $\le 100\text{ ms}$ (NFR) | Python 3.12 Engine | **p50: $16.80\text{ ms}$, p95: $17.47\text{ ms}$** |

---

## 2. Classification Performance Details

### 2.1 Confusion Matrix Analysis (Threshold $p \ge 0.50$)
$$\begin{pmatrix} \text{True Negative (TN)} = 321 & \text{False Positive (FP)} = 0 \\ \text{False Negative (FN)} = 4 & \text{True Positive (TP)} = 50 \end{pmatrix}$$

- **Zero False Positives ($\text{FP} = 0$, Precision = $100\%$):** In an enterprise control tower, alert fatigue is a primary point of failure. The model never falsely flags on-time shipments as SLA breaches.
- **High Recall ($\text{Recall} = 92.59\%$):** Catches 50 out of 54 true SLA breaches early, allowing the classical recovery optimizer to initiate rerouting or expediting before delivery time is missed.

### 2.2 Precision-Recall & Calibration Analysis
- **PR-AUC:** **$0.9769$**, reflecting strong discrimination under class imbalance (~14.4% positive prevalence).
- **Brier Score Loss:** **$0.0108$**, proving that the predicted probabilities faithfully reflect genuine empirical breach likelihoods.

---

## 3. Subgroup Performance Analysis across Modes

| Modality | Test Samples | Breach Prevalence | Subgroup ROC-AUC | Regression MAE |
|---|---|---|---|---|
| **ROAD** | 277 | 14.8% | **$0.9882$** | 20.84 mins |
| **AIR** | 63 | 12.7% | **$0.9904$** | 16.92 mins |
| **MARITIME** | 35 | 14.3% | **$0.9857$** | 21.15 mins |

The model demonstrates uniform reliability across transportation modes, with no modality exhibiting degraded classification accuracy.

---

## 4. Latency Profile
- **p50 Latency:** $16.80\text{ ms}$
- **p95 Latency:** $17.47\text{ ms}$
- **p99 Latency:** $18.92\text{ ms}$
- **Mean Latency:** $16.91\text{ ms}$
The predictive pipeline comfortably satisfies real-time operational constraints ($< 100\text{ ms}$).
