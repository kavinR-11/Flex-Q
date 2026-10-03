"""
Independent Classical Feasibility & Constraint Validator for YOLO x FluxQ
Verifies candidate solutions against hard physical and operational constraints.
"""

from datetime import datetime

def validate_plan_feasibility(
    shipment: dict,
    chosen_action: dict,
    active_disruptions: list[dict],
    max_budget: float = 15000.0,
    carrier_capacity_remaining: int = 10
) -> dict:
    """
    Validates a proposed recovery plan against:
      1. Road closure hard constraints
      2. Budget limits
      3. Carrier capacity
      4. Arrival time calculation consistency
    """
    violations = []
    warnings = []

    # 1. Road Closure check
    has_road_closure = any(d.get("event_type") == "ROAD_CLOSURE" for d in active_disruptions)
    if has_road_closure and chosen_action.get("action") == "MAINTAIN_ROUTE":
        violations.append("Violation: Cannot MAINTAIN_ROUTE when route segment has an active ROAD_CLOSURE.")

    # 2. Budget check
    cost = float(chosen_action.get("additional_cost_inr", chosen_action.get("cost_inr", 0.0)))
    if cost > max_budget:
        violations.append(f"Violation: Additional cost INR {cost} exceeds max configured budget INR {max_budget}.")

    # 3. Capacity check
    if carrier_capacity_remaining <= 0 and chosen_action.get("action") in ("CARRIER_SWITCH", "EXPEDITE", "EXPEDITE_AIR", "RAIL_INTERMODAL"):
        violations.append("Violation: Insufficient alternate carrier capacity available on requested lane.")


    # 4. SLA check
    promised_del = datetime.fromisoformat(shipment["promised_delivery"].replace("Z", "+00:00"))
    pred_eta = datetime.fromisoformat(chosen_action["predicted_eta"].replace("Z", "+00:00"))
    is_breached = pred_eta > promised_del
    if is_breached:
        warnings.append("Warning: Plan projected arrival exceeds customer promised SLA deadline.")

    is_feasible = len(violations) == 0

    return {
        "is_feasible": is_feasible,
        "violations": violations,
        "warnings": warnings,
        "checked_at": datetime.now().isoformat()
    }


def validate_recovery_plan(
    plan: dict,
    shipment_info: dict,
    carrier_capacities: dict = None,
    blocked_lanes: list = None
) -> dict:
    """
    Adapter function validating an individual recovery plan option against physical constraints.
    """
    active_disruptions = [{"event_type": "ROAD_CLOSURE"}] if blocked_lanes and len(blocked_lanes) > 0 else []
    cap = 10
    if carrier_capacities and plan.get("alternate_carrier_id"):
        cap = carrier_capacities.get(plan["alternate_carrier_id"], 10)
    return validate_plan_feasibility(
        shipment=shipment_info,
        chosen_action=plan,
        active_disruptions=active_disruptions,
        carrier_capacity_remaining=cap
    )

