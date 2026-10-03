# YOLO × FluxQ: Mathematical Formulation of Classical Recovery Optimization

## 1. Executive Summary & Problem Scope

Layer 3 of the **YOLO × FluxQ** architecture serves as the operational recovery engine, implemented via **Google OR-Tools Mixed-Integer Programming (MIP)** using the SCIP solver backend. When Layer 2 detects that a shipment's Early Warning Indicator (EWI) is triggered ($p_{\text{breach}} > 0.60$ or $R \ge 7$), or when network disruptions (floods, highway blockages, port congestions) invalidate the current transit schedule, the classical recovery engine determines the optimal operational rerouting or mode/carrier reallocation plan.

The recovery engine explicitly models the multi-objective trade-off between:
1. Delay minimization and SLA breach penalty avoidance.
2. Recovery action costs (tolls, expedited surcharges, premium carrier fees).
3. Fleet capacity and lane throughput limits.
4. Operational disruption avoidance (minimizing needless route churn).

---

## 2. Sets and Indices

Let:
- $S = \{1, 2, \dots, N\}$ be the set of active or disrupted shipments under evaluation.
- $O_s = \{1, 2, \dots, K_s\}$ be the set of available discrete recovery options for shipment $s \in S$.
- $C = \{1, 2, \dots, M\}$ be the set of contracted carriers available in the network.
- $L = \{1, 2, \dots, E\}$ be the set of network lane segments / arterial corridors.

---

## 3. Decision Variables

For each shipment $s \in S$ and each operational recovery option $k \in O_s$:
$$x_{s, k} \in \{0, 1\}$$
where $x_{s, k} = 1$ if recovery option $k$ is selected for shipment $s$, and $0$ otherwise.

Continuous auxiliary slack variables:
- $d_s \ge 0$: Expected delay duration (in minutes) under the chosen recovery plan.
- $\delta_s \in \{0, 1\}$: Binary SLA breach indicator ($\delta_s = 1$ if ETA exceeds committed SLA deadline).

---

## 4. Parameters and Constants

For each shipment $s \in S$ and option $k \in O_s$:
- $c_{s, k} \ge 0$: Direct financial operational cost of executing option $k$ (e.g., fuel, toll delta, carrier rate in INR).
- $t_{s, k} \ge 0$: Estimated transit duration (in minutes) under option $k$, accounting for real-time weather and traffic exposure.
- $T_{s}^{\text{SLA}}$: Committed SLA delivery deadline timestamp.
- $T_{s}^{\text{dep}}$: Departure / current observation timestamp.
- $B_s = T_s^{\text{SLA}} - T_s^{\text{dep}}$: Total SLA buffer duration (in minutes).
- $v_s \ge 0$: High-value / priority cargo weighting factor ($v_s \in [1.0, 3.0]$).
- $\text{cap}_{m}$: Maximum concurrent shipment allocation capacity for carrier $m \in C$.
- $A_{s, k, m} \in \{0, 1\}$: Indicator equal to $1$ if option $k$ for shipment $s$ assigns carrier $m$.
- $F_{s, k, l} \in \{0, 1\}$: Indicator equal to $1$ if option $k$ traverses lane $l \in L$.
- $D_l \in \{0, 1\}$: Real-time lane disruption status ($D_l = 1$ if lane is closed/impassable).

---

## 5. Multi-Objective Function

The optimization objective minimizes the total system cost $J_{\text{system}}$, structured as a weighted sum of economic and customer service penalties:

$$\min_{x} J_{\text{system}} = \sum_{s \in S} \sum_{k \in O_s} x_{s, k} \cdot \left[ w_{\text{cost}} \cdot c_{s, k} + w_{\text{delay}} \cdot \max(0, t_{s, k} - B_s) + w_{\text{breach}} \cdot v_s \cdot \mathbb{I}(t_{s, k} > B_s) + w_{\text{churn}} \cdot \Delta_{s, k} \right]$$

### Standard Parameter Weights:
- $w_{\text{cost}} = 1.0$: Direct financial recovery cost in INR.
- $w_{\text{delay}} = 5.0$: Cost per minute of delay beyond scheduled buffer.
- $w_{\text{breach}} = 5000.0$: Heavy penalty per SLA breach, scaled by cargo priority $v_s$.
- $w_{\text{churn}} = 250.0$: Penalty for switching carrier or route when unnecessary ($\Delta_{s, k} = 0$ if option $k$ preserves current baseline route, $1$ otherwise).

---

## 6. Constraints

### 6.1 Exact Assignment Constraint (Unicast)
Every shipment $s \in S$ must receive exactly one recovery option:
$$\sum_{k \in O_s} x_{s, k} = 1, \quad \forall s \in S$$

### 6.2 Hard Disruption Avoidance
No shipment may be routed through an impassable or blocked lane segment:
$$x_{s, k} \cdot F_{s, k, l} \le 1 - D_l, \quad \forall s \in S, \; \forall k \in O_s, \; \forall l \in L$$

### 6.3 Carrier Capacity Bounds
Total shipments assigned to carrier $m$ across all recovery decisions must not exceed carrier fleet capacity:
$$\sum_{s \in S} \sum_{k \in O_s} A_{s, k, m} \cdot x_{s, k} \le \text{cap}_m, \quad \forall m \in C$$

### 6.4 Non-Negativity and Integrality
$$x_{s, k} \in \{0, 1\}, \quad \forall s \in S, \; \forall k \in O_s$$

---

## 7. Classical Solver Implementation Details

1. **Solver Backend:** Google OR-Tools `pywraplp.Solver.CreateSolver('SCIP')`.
2. **Deterministic Feasibility Checks:** Before and after solve, [`backend/app/optimization/validation.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/validation.py) executes independent validation:
   - Verify every shipment is assigned exactly once.
   - Verify carrier capacity is not violated.
   - Verify blocked lanes are completely avoided.
3. **Fallback Mechanism:** If a severe disruption renders all options infeasible (e.g., all outbound arterial routes blocked), the system falls back to an emergency holding/consolidation plan with an escalated `ESCALATE_HOLD` status and triggers an immediate high-priority alert for human dispatcher review.
