"""
Pydantic Schemas for Optimization & Recovery Recommendations
"""

from datetime import datetime
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field


class RecoveryWeights(BaseModel):
    cost_weight: float = 0.30
    delay_weight: float = 0.40
    sla_penalty_weight: float = 0.30
    emissions_weight: float = 0.0

class RecoveryOptimizationRequest(BaseModel):
    shipment_ids: list[str]
    weights: Optional[RecoveryWeights] = Field(default_factory=RecoveryWeights)
    max_budget_inr: float = 15000.0
    enable_quantum_experiment: bool = True

class RecoveryPlanOption(BaseModel):
    recovery_id: str
    plan_id: str
    strategy_name: str
    action: str
    alternate_route_name: Optional[str] = None
    alternate_carrier_id: Optional[str] = None
    predicted_eta: datetime
    additional_cost_inr: float
    expected_delay_minutes: float
    sla_outcome: str
    feasible: bool

class QuantumBenchmarkReport(BaseModel):
    executed: bool
    quantum_contribution_ratio_pct: float
    classical_objective: float
    quantum_objective: float
    classical_runtime_ms: float
    quantum_runtime_ms: float
    feasible: bool
    backend: str
    notes: str

class OptimizationResponse(BaseModel):
    shipment_id: str
    solver_status: str
    runtime_ms: float
    objective_value: float
    plans: list[RecoveryPlanOption]
    recommended_plan_id: str
    quantum_benchmark: Optional[QuantumBenchmarkReport] = None
    triage_breakdown: Optional[dict[str, Any]] = None


class ApprovalRequest(BaseModel):
    plan_id: str
    operator_id: str
    notes: Optional[str] = None

class ApprovalResponse(BaseModel):
    recovery_id: str
    status: str
    applied_plan_id: str
    audit_id: str
    message: str
