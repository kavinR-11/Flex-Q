/**
 * Core Data Models & API Contracts for YOLO x FluxQ
 */

export interface Shipment {
  shipment_id: string;
  order_id?: string;
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  current_lat: number;
  current_lon: number;
  transport_mode: 'ROAD' | 'AIR' | 'MARITIME' | 'RAIL';
  carrier_id: string;
  route_id: string;
  planned_departure: string;
  promised_delivery: string;
  current_eta: string;
  sla_hours: number;
  sla_buffer_minutes: number;
  cargo_type: string;
  cargo_priority: number;
  cargo_value_inr: number;
  weight_kg: number;
  current_status: 'in_transit' | 'delayed' | 'critical' | 'delivered' | 'rerouted';
  remaining_distance_km: number;
  remaining_time_minutes: number;
  risk_score: number;
  sla_breach_probability: number;
  delay_probability: number;
  predicted_delay_minutes: number;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Critical';
  flagged_for_review: boolean;
  is_synthetic: boolean;
  updated_at?: string;
}

export interface DisruptionEvent {
  event_id: string;
  event_type: 'SEVERE_WEATHER' | 'TRAFFIC_CONGESTION' | 'PORT_CONGESTION' | 'FLIGHT_DELAY' | 'HAZARD_EARTHQUAKE' | 'ROAD_CLOSURE';
  severity: number;
  location_name: string;
  latitude: number;
  longitude: number;
  impact_radius_km: number;
  affected_mode: string;
  estimated_delay_minutes: number;
  start_time: string;
  expected_end: string;
  source: string;
  is_simulated: boolean;
}

export interface ShapFactor {
  feature: string;
  shap_impact: number;
  direction: 'INCREASING_RISK' | 'REDUCING_RISK';
}

export interface ExplanationResponse {
  shipment_id: string;
  risk_score: number;
  top_risk_drivers: ShapFactor[];
  disclaimer: string;
}

export interface RecoveryPlanOption {
  recovery_id: string;
  plan_id: string;
  strategy_name: string;
  action: string;
  alternate_route_name?: string;
  alternate_carrier_id?: string;
  predicted_eta: string;
  additional_cost_inr: number;
  expected_delay_minutes: number;
  sla_outcome: string;
  feasible: boolean;
}

export interface QuantumBenchmarkReport {
  executed: boolean;
  quantum_contribution_ratio_pct: number;
  classical_objective: number;
  quantum_objective: number;
  classical_runtime_ms: number;
  quantum_runtime_ms: number;
  feasible: boolean;
  backend: string;
  notes: string;
}

export interface OptimizationResponse {
  shipment_id: string;
  solver_status: string;
  runtime_ms: number;
  objective_value: number;
  plans: RecoveryPlanOption[];
  recommended_plan_id: string;
  quantum_benchmark?: QuantumBenchmarkReport;
}

export interface AuditLogEntry {
  audit_id: string;
  shipment_id: string;
  event_type: string;
  previous_state?: Record<string, unknown>;
  new_state?: Record<string, unknown>;
  trigger_source: string;
  operator_id?: string;
  justification?: string;
  timestamp: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  timestamp: string;
  services: {
    database: string;
    ml_models: {
      sla_classifier: string;
      eta_regressor: string;
    };
    classical_solver: string;
    quantum_module: string;
  };
}
