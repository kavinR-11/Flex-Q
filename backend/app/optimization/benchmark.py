"""
Classical Optimization Benchmarking Suite for YOLO x FluxQ
Benchmarks Google OR-Tools across fleet instances (N = 10, 25, 50, 100)
under multi-objective recovery and capacity constraints.
"""

from datetime import datetime, timedelta, timezone
import json
import os
import time
import numpy as np
from ortools.linear_solver import pywraplp

from backend.app.optimization.validation import validate_plan_feasibility

def run_fleet_benchmark(seed: int = 42) -> dict:
    rng = np.random.default_rng(seed)
    instances = [10, 25, 50, 100]
    benchmark_results = []
    
    print("[Optimization Benchmark] Starting Google OR-Tools Benchmark Suite...")
    
    for N in instances:
        t0 = time.perf_counter()
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("CBC")

        # Create N simulated disrupted shipments
        # Actions per shipment: 0=MAINTAIN, 1=ALT_ROUTE, 2=CARRIER_SWITCH, 3=EXPEDITE
        action_names = ["MAINTAIN_ROUTE", "ALTERNATE_ROUTE", "CARRIER_SWITCH", "EXPEDITE"]
        costs = [0.0, 1200.0, 1800.0, 2500.0]
        base_delays = rng.uniform(40.0, 180.0, N)
        delay_multipliers = [1.0, 0.15, 0.20, 0.0]
        demands = rng.uniform(200.0, 1500.0, N) # kg

        # Capacity limits
        carrier_switch_cap = float(N * 450.0) # total capacity available for partner carrier
        expedite_cap = float(N * 250.0)       # air capacity available

        # Decision variables x[i, a] in {0, 1}
        x = {}
        for i in range(N):
            for a in range(4):
                x[i, a] = solver.BoolVar(f"x_{i}_{a}")

        # Constraint 1: exactly one action per shipment
        for i in range(N):
            solver.Add(solver.Sum([x[i, a] for a in range(4)]) == 1)

        # Constraint 2: carrier switch capacity
        solver.Add(
            solver.Sum([demands[i] * x[i, 2] for i in range(N)]) <= carrier_switch_cap
        )

        # Constraint 3: expedite air capacity
        solver.Add(
            solver.Sum([demands[i] * x[i, 3] for i in range(N)]) <= expedite_cap
        )

        # Multi-objective coefficients
        # min 0.3 * Cost + 0.4 * Delay_penalty + 0.3 * SLA_penalty
        objective = solver.Objective()
        for i in range(N):
            for a in range(4):
                cost_val = costs[a]
                delay_val = base_delays[i] * delay_multipliers[a]
                sla_penalty = 4000.0 if delay_val > 45.0 else 0.0
                coeff = 0.30 * cost_val + 0.40 * (delay_val * 8.0) + 0.30 * sla_penalty
                objective.SetCoefficient(x[i, a], coeff)

        objective.SetMinimization()
        status = solver.Solve()
        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        # Evaluate Solution
        is_optimal = (status == pywraplp.Solver.OPTIMAL)
        obj_val = round(solver.Objective().Value(), 2) if is_optimal else -1.0

        # Action breakdown
        action_counts = {name: 0 for name in action_names}
        total_rec_cost = 0.0
        sla_saved_count = 0

        for i in range(N):
            for a in range(4):
                if x[i, a].solution_value() > 0.5:
                    action_counts[action_names[a]] += 1
                    total_rec_cost += costs[a]
                    if a > 0: # intervention applied
                        sla_saved_count += 1

        feasibility_rate = 100.0 if is_optimal else 0.0
        sla_preservation_pct = round((sla_saved_count / N) * 100.0, 1)

        res = {
            "fleet_size": N,
            "variables_count": N * 4,
            "constraints_count": N + 2,
            "runtime_ms": elapsed_ms,
            "solver_status": "OPTIMAL" if is_optimal else "FEASIBLE",
            "objective_value": obj_val,
            "feasibility_rate_pct": feasibility_rate,
            "sla_preservation_pct": sla_preservation_pct,
            "total_recovery_cost_inr": round(total_rec_cost, 2),
            "mean_cost_per_shipment_inr": round(total_rec_cost / N, 2),
            "action_breakdown": action_counts
        }
        benchmark_results.append(res)
        print(f"  [Fleet N={N:3d}] Runtime: {elapsed_ms:6.2f} ms | Status: {res['solver_status']} | Obj: {obj_val:8.2f} | Feasibility: {feasibility_rate}%")

    report_payload = {
        "benchmark_timestamp": datetime.now(timezone.utc).isoformat(),
        "solver": "Google OR-Tools SCIP MIP",
        "instances": benchmark_results
    }

    out_file = "backend/models/classical_benchmark_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report_payload, f, indent=2)

    print(f"[Optimization Benchmark] Complete. Saved results to {out_file}")
    return report_payload

if __name__ == "__main__":
    run_fleet_benchmark()
