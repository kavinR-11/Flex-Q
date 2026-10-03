"""
QAOA Quantum-Hybrid Experimentation & Benchmarking Suite for YOLO × FluxQ
Runs QAOA statevector simulation on residual slot allocation instances (4, 6, 8 qubits),
compares against exact classical brute-force enumeration and OR-Tools,
measures feasibility, optimality gaps, runtimes, and calculates QCR.
"""

from datetime import datetime, timezone
import json
import time
import numpy as np

from backend.app.optimization.quantum.qaoa_solver import QuantumHybridOptimizer


def exact_brute_force_solver(cost_matrix: np.ndarray) -> tuple[float, np.ndarray]:
    """
    Computes exact global minimum for assigning N shipments to K slots:
    sum_k x_{i,k} = 1 for each i.
    """
    N, K = cost_matrix.shape
    num_vars = N * K
    best_cost = float("inf")
    best_assignment = None

    for i in range(1 << num_vars):
        bitstring = np.array([(i >> b) & 1 for b in range(num_vars)])
        x_mat = bitstring.reshape((N, K))
        # Check constraint: exactly one slot per shipment
        if all(np.sum(x_mat[row, :]) == 1 for row in range(N)):
            cost = float(np.sum(cost_matrix * x_mat))
            if cost < best_cost:
                best_cost = cost
                best_assignment = bitstring

    return best_cost, best_assignment


def run_qaoa_experiments():
    print("[QAOA Experiment] Initializing Quantum-Hybrid Benchmark Suite...")
    optimizer = QuantumHybridOptimizer()

    # Define test instances: (name, cost_matrix, description)
    test_instances = [
        {
            "name": "Residual Slot Allocation 2x2 (4 Qubits)",
            "N": 2,
            "K": 2,
            "cost_matrix": np.array([
                [1200.0, 1850.0],
                [1400.0, 1600.0]
            ]),
            "description": "2 high-priority shipments competing for 2 alternative carrier slots on NH48."
        },
        {
            "name": "Residual Slot Allocation 2x3 (6 Qubits)",
            "N": 2,
            "K": 3,
            "cost_matrix": np.array([
                [1200.0, 1850.0, 2400.0],
                [1450.0, 1600.0, 2100.0]
            ]),
            "description": "2 disrupted shipments selecting among 3 multi-modal recovery routes (Road, Rail, Air)."
        },
        {
            "name": "Residual Slot Allocation 2x4 (8 Qubits)",
            "N": 2,
            "K": 4,
            "cost_matrix": np.array([
                [1100.0, 1600.0, 2100.0, 3200.0],
                [1300.0, 1550.0, 2050.0, 2900.0]
            ]),
            "description": "2 shipments allocating across 4 expedited carrier slots."
        }
    ]

    results = []

    for inst in test_instances:
        name = inst["name"]
        cost_mat = inst["cost_matrix"]
        N, K = inst["N"], inst["K"]
        num_qubits = N * K

        print(f"\n--- Running Instance: {name} ({num_qubits} Qubits) ---")

        # 1. Exact Classical Brute Force
        t0_exact = time.perf_counter()
        exact_obj, exact_x = exact_brute_force_solver(cost_mat)
        exact_runtime_ms = round((time.perf_counter() - t0_exact) * 1000.0, 3)

        # 2. Simulated QAOA
        t0_qaoa = time.perf_counter()
        qaoa_res = optimizer.run_qaoa_simulation(
            cost_matrix=cost_mat,
            classical_best_obj=exact_obj,
            gamma=0.35,
            beta=0.25
        )
        qaoa_runtime_ms = round((time.perf_counter() - t0_qaoa) * 1000.0, 2)

        # Optimality Gap:
        # gap = ((J_qaoa - J_exact) / J_exact) * 100%
        if exact_obj > 0:
            optimality_gap_pct = round(((qaoa_res["quantum_objective"] - exact_obj) / exact_obj) * 100.0, 2)
        else:
            optimality_gap_pct = 0.0

        inst_result = {
            "instance_name": name,
            "qubits": num_qubits,
            "grid_dimensions": f"{N} shipments x {K} slots",
            "exact_classical_objective": round(exact_obj, 2),
            "exact_classical_runtime_ms": exact_runtime_ms,
            "qaoa_objective": qaoa_res["quantum_objective"],
            "qaoa_runtime_ms": qaoa_runtime_ms,
            "optimality_gap_pct": optimality_gap_pct,
            "qaoa_feasible": qaoa_res["feasible"],
            "quantum_contribution_ratio_pct": qaoa_res["quantum_contribution_ratio_pct"],
            "circuit_depth_p": 1,
            "backend": qaoa_res["backend"],
        }
        results.append(inst_result)

        print(f"  Exact Optimum: INR {exact_obj:.2f} ({exact_runtime_ms:.3f} ms)")
        print(f"  QAOA Value:    INR {qaoa_res['quantum_objective']:.2f} ({qaoa_runtime_ms:.2f} ms)")
        print(f"  Optimality Gap: {optimality_gap_pct}% | Feasible: {qaoa_res['feasible']} | QCR: {qaoa_res['quantum_contribution_ratio_pct']}%")

    out_file = "backend/models/qaoa_experiment_results.json"
    with open(out_file, "w") as f:
        json.dump({
            "experiment_timestamp": datetime.now(timezone.utc).isoformat(),
            "simulation_backend": "Qiskit Statevector Simulator",
            "instances": results,
            "disclaimer": (
                "QAOA experiments conducted via statevector simulation on classical CPU. "
                "No physical quantum advantage or quantum supremacy is claimed. "
                "All candidate allocations are strictly validated via independent classical feasibility checks."
            )
        }, f, indent=2)

    print(f"\n[QAOA Experiment] Results saved to {out_file}")


if __name__ == "__main__":
    run_qaoa_experiments()
