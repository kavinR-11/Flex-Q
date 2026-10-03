# YOLO × FluxQ: Known Limitations & Engineering Boundaries

## 1. Introduction

In adherence to the core project mandate of **technical honesty**, this document delineates the known boundaries, data assumptions, and computational constraints of **YOLO × FluxQ**.

---

## 2. Machine Learning & Predictive Modeling Limitations

1. **Synthetic Ground Truth Labels:**
   Due to the unavailability of publicly accessible, proprietary telematics outcome datasets with true real-world delivery delay records for the India freight network, historical shipment timelines and delay outcomes were generated using a physics-calibrated synthetic logistics model. Consequently, reported test set metrics (Test ROC-AUC: 0.9885, F1: 0.9615, Test MAE: 20.21 minutes) represent performance on the synthetic data distribution and **must not be claimed as measured real-world accuracy on actual carrier fleets**.

2. **Statistical vs. Causal Attribution:**
   SHAP values computed by `TreeExplainer` represent local feature attributions within the trained gradient-boosted decision trees. They quantify how strongly the presence of a feature altered the model's log-odds output relative to the expected baseline value. They **do not prove physical causation** (e.g. high precipitation does not mechanically guarantee a vehicle breakdown).

3. **Geographic Scope (MVP Boundary):**
   The primary operational domain is calibrated for the India Domestic Freight Network, specifically the Chennai–Bengaluru arterial logistics corridor. Global freight extrapolations (e.g. transatlantic maritime routes) require regional lane calibration and localized port dwell models.

---

## 3. Combinatorial & Classical Optimization Limitations

1. **Discretized Route Alternatives:**
   The Google OR-Tools MIP solver currently selects among discrete predefined alternative corridors (e.g., NH48 Main, Chittoor Bypass, Kanchipuram Regional Arterial) and contracted carriers. Continuous dynamic GPS waypoint micro-rerouting (turn-by-turn re-routing around temporary street construction) is not currently implemented.

2. **Deterministic Time-Window Assumptions:**
   Transit durations across alternate routes are modeled with deterministic expected buffer values based on real-time disruption severity. Stochastic travel-time distributions under non-stationary weather conditions are approximated via safety buffer penalties.

---

## 4. Quantum-Hybrid (QAOA) Simulation Limitations

1. **Classical Simulation Execution:**
   All QAOA experiments are executed via classical CPU simulation using Qiskit's `Statevector` backend. **No physical quantum processor (QPU) was utilized.**

2. **Variational Depth & Unoptimized Angles:**
   At circuit depth $p=1$ with fixed heuristic variational parameters ($\gamma=0.35, \beta=0.25$), raw sampled bitstrings frequently violate hard unicast equality constraints. The platform relies on independent classical validation to intercept invalid bitstrings and safely execute classical fallback ($\text{QCR} = 0.0\%$).

3. **No Quantum Advantage Claimed:**
   Small combinatorial allocation instances ($N \le 8$ qubits) are solved exponentially faster by exact classical brute-force enumeration ($< 0.8\text{ ms}$) and Google OR-Tools than through quantum circuit simulation ($> 1.0\text{ ms}$).

---

## 5. Security & Deployment Scope

1. **Local Authentication Boundaries:**
   The demonstration environment uses mock dispatcher IDs (`DISPATCHER-LEAD-07`, `OP-TEST`) without OAuth2/OIDC SSO integration. Production deployments require integration with enterprise identity providers (Okta, Azure AD).
