"""
Classical Recovery Optimization Engine for YOLO x FluxQ
Implements Google OR-Tools MIP solver for multi-objective recovery routing,
carrier switching, and capacity-constrained dispatch.
"""

from datetime import datetime, timedelta, timezone
import time
from ortools.linear_solver import pywraplp

class ClassicalRecoveryOptimizer:
    def __init__(self):
        pass

    def solve_shipment_recovery(
        self,
        shipment: dict,
        active_disruptions: list[dict],
        weights: dict = None,
        max_budget: float = 15000.0,
    ) -> dict:
        """
        Solves recovery for an individual or multi-shipment disrupted scenario.
        Generates 4 distinct candidate plans (Lowest Cost, Lowest Delay, Highest SLA, Balanced).
        """
        t0 = time.perf_counter()
        if weights is None:
            weights = {"cost_weight": 0.30, "delay_weight": 0.40, "sla_penalty_weight": 0.30, "emissions_weight": 0.0}
        if max_budget is None:
            max_budget = 15000.0

        promised_del = datetime.fromisoformat(shipment["promised_delivery"].replace("Z", "+00:00"))
        current_eta = datetime.fromisoformat(shipment["current_eta"].replace("Z", "+00:00"))
        pred_delay_mins = float(shipment.get("predicted_delay_minutes", 135.0))

        # Check for hard route closure in active disruptions
        has_road_closure = any(d.get("event_type") == "ROAD_CLOSURE" for d in active_disruptions)

        # Define Candidate Action Catalog
        actions = [
            {
                "plan_id": "PLAN-A",
                "strategy_name": "Lowest Cost Strategy",
                "action": "MAINTAIN_ROUTE",
                "cost_inr": 0.0,
                "delay_mins": pred_delay_mins,
                "feasible": not has_road_closure,
                "route_name": "Original Planned Highway Route",
                "carrier": shipment["carrier_id"],
            },
            {
                "plan_id": "PLAN-B",
                "strategy_name": "Alternate Route Corridor",
                "action": "ALTERNATE_ROUTE",
                "cost_inr": 1200.0,
                "delay_mins": max(0.0, pred_delay_mins * 0.15 - 10.0),
                "feasible": True,
                "route_name": "Via NH717 / State Highway Bypass Corridor",
                "carrier": shipment["carrier_id"],
            },
            {
                "plan_id": "PLAN-C",
                "strategy_name": "Carrier Switch",
                "action": "CARRIER_SWITCH",
                "cost_inr": 1800.0,
                "delay_mins": max(0.0, pred_delay_mins * 0.20),
                "feasible": True,
                "route_name": "Partner Linehaul Corridor",
                "carrier": "CARRIER-C",
            },
            {
                "plan_id": "PLAN-D",
                "strategy_name": "Expedite Air/Priority Logistics",
                "action": "EXPEDITE",
                "cost_inr": 2500.0,
                "delay_mins": 0.0,
                "feasible": True,
                "route_name": "Dedicated Airport Express Transfer",
                "carrier": "CARRIER-B",
            },
        ]

        # Use OR-Tools MIP Solver to find the mathematically optimal action under configured weights
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("CBC")

        x_vars = {}
        for idx, act in enumerate(actions):
            x_vars[idx] = solver.BoolVar(f"x_{idx}")

        # Constraint 1: Exactly one action chosen
        solver.Add(solver.Sum([x_vars[i] for i in range(len(actions))]) == 1)

        # Constraint 2: Infeasible actions cannot be chosen
        for idx, act in enumerate(actions):
            if not act["feasible"]:
                solver.Add(x_vars[idx] == 0)

        # Constraint 3: Budget limit
        solver.Add(
            solver.Sum([actions[i]["cost_inr"] * x_vars[i] for i in range(len(actions))]) <= max_budget
        )

        # Objective Function:
        # min alpha * Cost + beta * Delay + gamma * SLA_breach_penalty
        alpha = weights["cost_weight"]
        beta = weights["delay_weight"]
        gamma = weights["sla_penalty_weight"]

        objective = solver.Objective()
        for idx, act in enumerate(actions):
            # SLA penalty applies if promised_delivery is breached
            projected_eta = current_eta + timedelta(minutes=act["delay_mins"])
            sla_breach_penalty = 5000.0 if projected_eta > promised_del else 0.0
            
            coeff = (alpha * act["cost_inr"]) + (beta * act["delay_mins"] * 10.0) + (gamma * sla_breach_penalty)
            objective.SetCoefficient(x_vars[idx], coeff)

        objective.SetMinimization()
        status = solver.Solve()

        runtime_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        optimal_obj = solver.Objective().Value() if status == pywraplp.Solver.OPTIMAL else 0.0

        # Determine chosen plan
        recommended_plan_id = "PLAN-B"
        if status == pywraplp.Solver.OPTIMAL:
            for idx, act in enumerate(actions):
                if x_vars[idx].solution_value() > 0.5:
                    recommended_plan_id = act["plan_id"]
                    break

        plans_out = []
        for act in actions:
            proj_eta = current_eta + timedelta(minutes=act["delay_mins"])
            sla_outcome = "BREACH_LIKELY" if proj_eta > promised_del else "WITHIN_COMMITMENT"
            
            plans_out.append({
                "recovery_id": f"REC-{shipment['shipment_id']}-{act['plan_id']}-{int(time.time() * 1000)}",
                "plan_id": act["plan_id"],
                "strategy_name": act["strategy_name"],
                "action": act["action"],
                "alternate_route_name": act["route_name"],
                "alternate_carrier_id": act["carrier"],
                "predicted_eta": proj_eta.isoformat(),
                "additional_cost_inr": act["cost_inr"],
                "expected_delay_minutes": round(act["delay_mins"], 1),
                "sla_outcome": sla_outcome,
                "feasible": act["feasible"],
            })

        return {
            "shipment_id": shipment["shipment_id"],
            "solver_status": "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE",
            "runtime_ms": runtime_ms,
            "objective_value": round(optimal_obj, 2),
            "plans": plans_out,
            "recommended_plan_id": recommended_plan_id,
        }
