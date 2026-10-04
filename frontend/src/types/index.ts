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
  emissions_kg?: number;
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

export interface TriageBreakdown {
  total_fleet_variables: number;
  classical_frozen_count: number;
  classical_percentage: number;
  quantum_residual_count: number;
  quantum_percentage: number;
  classical_consensus_status: string;
  quantum_dispatch_status: string;
  qubits_allocated: number;
  circuit_depth_p: number;
  optimizer: string;
}

export interface OptimizationResponse {
  shipment_id: string;
  solver_status: string;
  runtime_ms: number;
  objective_value: number;
  plans: RecoveryPlanOption[];
  recommended_plan_id: string;
  quantum_benchmark?: QuantumBenchmarkReport;
  triage_breakdown?: TriageBreakdown;
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

export interface LinkedShipmentBrief {
  shipment_id: string;
  tag: string;
  description: string;
  predicted_delay_str: string;
  risk_exposure_str: string;
  risk_level: string;
}

export interface CorridorSummary {
  corridor_id: string;
  origin_hub: string;
  linehaul_route: string;
  destination: string;
  mode: string;
  carrier_name: string;
  planned_vol_pkgs_hr: number;
  avail_cap_pkgs_hr: number;
  utilization_pct: number;
  predicted_delay_str: string;
  sla_penalty_lakhs: number;
  p_sla_risk_pct: number;
  bottleneck_name: string;
  bottleneck_desc: string;
  status: string;
  is_overloaded: boolean;
  affected_shipments: LinkedShipmentBrief[];
}

export interface NetworkOverview {
  active_shipments: number;
  active_shipments_delta_pct: string;
  active_corridors_count: number;
  active_hubs_count: number;
  available_capacity_pkgs_hr: number;
  avg_utilization_pct: number;
  constrained_corridors_count: number;
  shipments_at_risk: number;
  critical_risk_count: number;
  sla_penalty_exposure_lakhs: number;
  active_disruptions: number;
}

export interface ActionSuggestion {
  label: string;
  target_tab: string;
  action_payload?: Record<string, unknown>;
}

export interface AssistantChatResponse {
  response_id: string;
  timestamp: string;
  copilot_type: string;
  answer_markdown: string;
  grounded_entities: string[];
  suggested_followups: string[];
  suggested_actions: ActionSuggestion[];
}

export interface QuantumBitstringCandidate {
  bitstring: string;
  label: string;
  energy: number;
  probability_pct: number;
  shots: number;
  color: string;
  is_ground_state?: boolean;
  is_violation?: boolean;
}

export interface QAOASimulationResult {
  simulation_timestamp: string;
  qubits_allocated: number;
  grid_dimension: string;
  circuit_depth_p: number;
  optimizer?: string;
  mixer?: string;
  shots?: number;
  noise_model?: string;
  gamma?: number;
  beta?: number;
  penalty_lambda?: number;
  penalty_lambda_1?: number;
  penalty_lambda_2?: number;
  penalty_lambda_3?: number;
  classical_baseline_inr?: number;
  solve_latency_ms?: number;
  classical_latency_ms?: number;
  classical_score?: string;
  quantum_score?: string;
  optimality_gap_pct?: number;
  feasibility_rate_pct?: number;
  state_energy?: number;
  sampling_entropy?: number;
  residual_error_pct?: number;
  top_bitstrings?: QuantumBitstringCandidate[];
  qaoa_result?: any;
  research_disclaimer: string;
}

export interface AffectedDetail {
  shipment_id?: string;
  action_id?: string;
  region?: string;
  parameter: string;
  baseline_value: number;
  compiled_value: number;
  impact: string;
}

export interface TriageBreakdown {
  num_solvers: number;
  total_variables: number;
  frozen_variables: number;
  frozen_pct: number;
  contested_variables: number;
  contested_pct: number;
  quantum_dispatched: boolean;
  classical_runtime_ms: number;
  quantum_qcr_pct: number;
}

export interface StrategyArchetype {
  name: string;
  routing: string;
  cost_inr: number;
  delay_mins: number;
  sla_risk: string;
  qcr_pct: number;
  status: string;
}

export interface ImpactedConsignmentBrief {
  shipment_id: string;
  origin: string;
  destination: string;
  cargo_type: string;
  cargo_priority: number;
  carrier_id: string;
  current_status: string;
  risk_score: number;
  sla_buffer_minutes: number;
  predicted_delay_minutes: number;
  failure_reason: string;
  recovery_status: string;
  recommended_recovery_plan: string;
}

export interface CompiledProblemState {
  timestamp: string;
  pillar_applied: string | null;
  event_type: string;
  target_id: string;
  severity: number;
  affected_details: AffectedDetail[];
  impacted_consignments?: ImpactedConsignmentBrief[];
  impacted_count?: number;
  infinity_delay_warning?: boolean;
  grounded_hub_name?: string | null;
  C: number[][];
  D: number[][];
  B: number[][];
  E: number[][];
  sample_shipments: Array<{
    shipment_id: string;
    product_type: string;
    cargo_priority: number;
    current_buffer_mins: number;
    origin: string;
    destination: string;
    current_status: string;
  }>;
  weights: Record<string, { alpha: number; beta: number; gamma: number; delta: number }>;
  capacities: Record<string, number>;
  triage_breakdown: TriageBreakdown;
  strategy_archetypes: StrategyArchetype[];
}


