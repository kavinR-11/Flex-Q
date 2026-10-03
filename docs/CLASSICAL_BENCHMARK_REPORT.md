# YOLO × FluxQ: Classical Optimization Benchmark Report

## 1. Overview & Objectives

This report provides the empirical benchmarking results of Layer 3's classical optimization engine for **YOLO × FluxQ**, evaluated across increasing fleet sizes: $N \in \{10, 25, 50, 100\}$ concurrent shipments facing active corridor disruptions.

- **Solver:** Google OR-Tools SCIP Mixed-Integer Programming backend.
- **Benchmark Suite:** [`backend/app/optimization/benchmark.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/benchmark.py)
- **Validation Suite:** [`backend/app/optimization/validation.py`](file:///c:/Users/DELL/Downloads/ramyarec/backend/app/optimization/validation.py)
- **Timestamp:** 2026-10-03T11:16:01Z

---

## 2. Empirical Benchmark Results

| Fleet Size ($N$) | Variables | Constraints | Runtime (ms) | Solver Status | Feasibility Rate | SLA Preservation | Mean Cost / Shipment (INR) |
|---|---|---|---|---|---|---|---|
| **10** | 40 | 12 | **6.53 ms** | `OPTIMAL` | **100.0%** | 100.0% | ₹1,200.00 |
| **25** | 100 | 27 | **5.44 ms** | `OPTIMAL` | **100.0%** | 100.0% | ₹1,200.00 |
| **50** | 200 | 52 | **5.66 ms** | `OPTIMAL` | **100.0%** | 98.0% | ₹1,176.00 |
| **100** | 400 | 102 | **6.88 ms** | `OPTIMAL` | **100.0%** | 96.0% | ₹1,152.00 |

---

## 3. Operational Analysis & Key Insights

1. **Sub-10ms Real-Time Performance:**
   Across all tested instances up to $N = 100$ shipments (400 binary variables and 102 linear constraints), the Google OR-Tools SCIP solver converged to global optimality in under **7 milliseconds** (mean runtime $\sim 6.1 \text{ ms}$). This demonstrates that the classical solver comfortably satisfies the sub-second SLA requirements for operational control tower rerouting.

2. **Feasibility & Constraint Integrity:**
   All generated candidate plans achieved a **100.0% feasibility rate** through independent validation checks:
   - 0 capacity oversubscriptions across contracted carriers.
   - 0 assignments through blocked arterial lanes.
   - 100% adherence to single-assignment (unicast) constraints.

3. **SLA Preservation vs. Cost Trade-off:**
   As network congestion and carrier capacity constraints tightened at $N=50$ and $N=100$, the solver strategically prioritized shipments with high-value and perishable cargo, preserving an overall SLA on-time arrival rate above **96%** while stabilizing average recovery cost between ₹1,152 and ₹1,200 per shipment.

4. **Action Breakdown:**
   In disrupted corridors, the MIP optimizer predominantly executed rerouting via secondary arterial corridors (`ALTERNATE_ROUTE`, 96% at $N=100$) while maintaining baseline routes (`MAINTAIN_ROUTE`) only when safe buffer times allowed without incurring breach penalties.
