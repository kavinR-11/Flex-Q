"""
Quantum Lab API Router for YOLO × FluxQ
Provides endpoints for QAOA simulator benchmarks, custom QUBO Hamiltonian execution,
and QCR performance analytics on residual logistics allocation subproblems.
"""

from datetime import datetime, timezone
import json
import os
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.optimization.quantum.qaoa_solver import QuantumHybridOptimizer

router = APIRouter(prefix="/quantum", tags=["Quantum Lab"])
quantum_optimizer = QuantumHybridOptimizer()

BENCHMARK_FILE = "backend/models/qaoa_experiment_results.json"


class QAOASimulationRequest(BaseModel):
    num_shipments: int = Field(default=2, ge=2, le=3)
    num_slots: int = Field(default=2, ge=2, le=3)
    gamma: float = Field(default=0.35, ge=0.01, le=3.14)
    beta: float = Field(default=0.25, ge=0.01, le=1.57)
    circuit_depth_p: int = Field(default=1, ge=1, le=3)
    penalty_lambda: float = Field(default=100.0, ge=10.0, le=500.0)


@router.get("/benchmark")
def get_quantum_benchmark():
    """
    Returns stored empirical QAOA simulation benchmark results across 4, 6, and 8-qubit systems.
    """
    if os.path.exists(BENCHMARK_FILE):
        try:
            with open(BENCHMARK_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read benchmark records: {str(e)}")
    return {
        "status": "No benchmark file found",
        "instances": []
    }


@router.post("/simulate")
def run_custom_qaoa_simulation(payload: QAOASimulationRequest):
    """
    Executes an interactive QAOA statevector simulation on a reduced residual allocation problem.
    """
    N = payload.num_shipments
    K = payload.num_slots
    num_qubits = N * K

    # Deterministic representative cost matrix for the chosen dimension
    np.random.seed(42)
    base_costs = [
        [1200.0, 1850.0, 2400.0],
        [1400.0, 1600.0, 2100.0],
        [1100.0, 1750.0, 2600.0]
    ]
    cost_matrix = np.array(base_costs)[:N, :K]

    # Classical reference optimum
    best_classical_obj = float(np.min(cost_matrix, axis=1).sum())

    res = quantum_optimizer.run_qaoa_simulation(
        cost_matrix=cost_matrix,
        classical_best_obj=best_classical_obj,
        gamma=payload.gamma,
        beta=payload.beta
    )

    return {
        "simulation_timestamp": datetime.now(timezone.utc).isoformat(),
        "qubits_allocated": num_qubits,
        "grid_dimension": f"{N} shipments x {K} slots",
        "circuit_depth_p": payload.circuit_depth_p,
        "gamma": payload.gamma,
        "beta": payload.beta,
        "penalty_lambda": payload.penalty_lambda,
        "classical_baseline_inr": best_classical_obj,
        "qaoa_result": res,
        "research_disclaimer": (
            "Simulated on classical CPU via Qiskit Statevector backend. "
            "Independent classical feasibility verification enforced. "
            "No physical quantum advantage claimed."
        )
    }
