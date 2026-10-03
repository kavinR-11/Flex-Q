# Model Card: YOLO × FluxQ Predictive Intelligence Engine

**Model Identity:** YOLO-FluxQ-LGBM-v1.0 (Classification) & YOLO-FluxQ-RFR-v1.0 (Regression)  
**Release Date:** October 3, 2026  
**License:** Apache 2.0  
**Artifact Directory:** `backend/models/`

---

## 1. Model Overview

The YOLO × FluxQ predictive layer solves three concurrent predictive tasks:
1. **Task A (Delay Probability):** $P(\text{Late} \mid X)$
2. **Task B (Calibrated SLA-breach Probability):** $p = P(\text{SLA Breach} \mid X) \in [0, 1]$
   - Standardized integer score: $R = \max(1, \min(10, \lceil 10 \cdot p \rceil))$
3. **Task C (ETA Regression & Expected Delay):**
   $$\widehat{\text{Delay}} = f(X), \quad \widehat{\text{ETA}} = t_{\text{base}} + \Delta t$$

---

## 2. Model Architecture & Baselines Evaluated

### 2.1 Classification Tier (SLA Breach)
- **Baseline 1:** Dummy Classifier (Most frequent label) — $\text{ROC-AUC} = 0.5000, \text{F1} = 0.0000$
- **Baseline 2:** Balanced Logistic Regression — $\text{ROC-AUC} = 0.9952, \text{Brier} = 0.0260$
- **Baseline 3:** Random Forest Classifier (100 trees) — $\text{ROC-AUC} = 0.9859, \text{Brier} = 0.0261$
- **Selected Champion:** **LightGBM Classifier** ($150$ estimators, learning rate $0.05$, class-balanced) with **3-Fold Isotonic Probability Calibration**:
  - Test ROC-AUC: **$0.9893$**
  - Test Brier Score: **$0.0109$** (exceptional calibration)
  - Test F1-Score: **$0.9615$**
  - Test Precision: **$1.0000$**
  - Test Recall: **$0.9259$**

### 2.2 Regression Tier (Transit Delay in Minutes)
- **Baseline 1:** Dummy Regressor (Mean target) — $\text{MAE} = 44.49\text{ mins}, \text{RMSE} = 60.25\text{ mins}$
- **Baseline 2:** Ridge Regression — $\text{MAE} = 35.03\text{ mins}, \text{RMSE} = 46.35\text{ mins}$
- **Selected Champion:** **Random Forest Regressor** ($100$ trees):
  - Test MAE: **$20.21\text{ mins}$** (54.6% error reduction over dummy baseline)
  - Test RMSE: **$33.15\text{ mins}$**

---

## 3. Explainability Integration
- **Explainer:** TreeSHAP (`shap.TreeExplainer`) integrated directly with the uncalibrated tree estimator.
- **Top Attributions:** Routinely extracts top-4 local feature attributions with directionality (`INCREASING_RISK` vs `REDUCING_RISK`) and narrative summaries.
- **Ethical Disclaimer:** Displayed with every explanation: *"SHAP values measure statistical attribution within the model. They do not constitute physical or causal proof of disruption etiology."*
