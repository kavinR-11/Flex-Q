# Gate 07 Report: ML Model Training & Probability Calibration

**Stage:** STAGE 07 — ML TRAINING  
**Date:** October 3, 2026  
**Status:** **PASS**

---

## 1. Objective and Scope
The objective of Stage 07 is to implement reproducible machine learning training pipelines comparing multiple baseline and candidate algorithms for SLA breach classification and ETA delay regression, calibrate breach probabilities using Isotonic regression, package SHAP explainability, and save serialized model artifacts.

---

## 2. Files Created or Modified
- Created: [`backend/app/ml/__init__.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ml/__init__.py)
- Created: [`backend/app/ml/preprocessor.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ml/preprocessor.py)
- Created: [`backend/scripts/train_models.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/scripts/train_models.py)
- Created: [`backend/app/ml/inference.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ml/inference.py)
- Created model artifacts:
  - `backend/models/preprocessor.joblib`
  - `backend/models/sla_classifier_calibrated.joblib`
  - `backend/models/eta_regressor.joblib`
  - `backend/models/raw_best_tree_clf.joblib`
  - `backend/models/training_summary.json`
- Created: [`docs/MODEL_CARD.md`](file:///c:/Users/DELL/Downloads/ramyarec/docs/MODEL_CARD.md)
- Created: [`docs/gates/GATE_07_ML_TRAINING.md`](file:///c:/Users/DELL/Downloads/ramyarec/docs/gates/GATE_07_ML_TRAINING.md)

---

## 3. Commands Actually Executed
1. `python -m backend.scripts.train_models` (exited with code 0 in 1.98s)
2. `python -c "from backend.app.ml.inference import RiskPredictor; ..."` (exited with code 0)

---

## 4. Tests Actually Executed
- Baseline model comparison: evaluated Dummy, Logistic Regression, Random Forest, and LightGBM models.
- Calibration validation: verified Brier score improved to $0.0109$ after Isotonic calibration.
- Regression error reduction: verified Random Forest Regressor achieves test MAE of $20.21$ minutes vs Dummy baseline MAE of $44.49$ minutes.
- Live inference smoke test: verified single-instance prediction and SHAP explanation return valid structures with zero errors.

---

## 5. Acceptance Status for Each Criterion

| Criterion | Status | Evidence |
|---|---|---|
| Baselines trained and compared | **PASS** | Evaluated Dummy, Logistic Regression, Random Forest, LightGBM |
| Candidate models trained | **PASS** | LightGBM classifier & Random Forest regressor trained |
| Probability calibration applied | **PASS** | Isotonic cross-validated calibration verified |
| Model artifacts versioned & saved | **PASS** | Serialized into `backend/models/` |
| Explainability engine integrated | **PASS** | TreeSHAP integration verified in [`backend/app/ml/inference.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/ml/inference.py) |
| Model card published | **PASS** | Published in [`docs/MODEL_CARD.md`](file:///c:/Users/DELL/Downloads/ramyarec/docs/MODEL_CARD.md) |

---

## 6. Next-Stage Prerequisites
- Move to **STAGE 08: ML VALIDATION AND MODEL QUALITY**:
  - Run detailed evaluation script against the test split (`backend/scripts/evaluate_models.py`).
  - Calculate confusion matrices, PR-AUC, subgroup performance, and latency metrics.
  - Create:
    - `docs/ML_EVALUATION_REPORT.md`
    - `docs/gates/GATE_08_ML_VALIDATION.md`

---

## 7. Overall Gate Status
**PASS**. Stage 07 is successfully completed.
