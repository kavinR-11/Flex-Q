/**
 * Typed API Client for YOLO x FluxQ
 */

import {
  Shipment,
  DisruptionEvent,
  ExplanationResponse,
  OptimizationResponse,
  AuditLogEntry,
  SystemHealth,
  CorridorSummary,
  NetworkOverview,
  AssistantChatResponse,
  QAOASimulationResult,
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchShipments(params?: {
  status?: string;
  min_risk?: number;
  search?: string;
  limit?: number;
}): Promise<Shipment[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.min_risk) query.append('min_risk', params.min_risk.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/shipments?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch shipments');
  return res.json();
}

export async function fetchShipmentDetail(id: string): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/shipments/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch shipment ${id}`);
  return res.json();
}

export async function fetchShipmentExplanation(id: string): Promise<ExplanationResponse> {
  const res = await fetch(`${API_BASE}/shipments/${id}/explanation`);
  if (!res.ok) throw new Error(`Failed to fetch explanation for ${id}`);
  return res.json();
}

export async function fetchEvents(): Promise<DisruptionEvent[]> {
  const res = await fetch(`${API_BASE}/events?limit=50`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function submitDisruptionEvent(eventData: {
  event_type: string;
  severity: number;
  location_name: string;
  latitude: number;
  longitude: number;
  impact_radius_km: number;
  affected_mode: string;
  estimated_delay_minutes: number;
}): Promise<{ event_id: string; affected_shipments_count: number; affected_shipment_ids: string[] }> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error('Failed to submit event');
  return res.json();
}

export async function optimizeRecovery(
  shipmentId: string,
  weights?: { cost_weight: number; delay_weight: number; sla_penalty_weight: number },
  maxBudget: number = 15000.0
): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE}/recovery/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shipment_ids: [shipmentId],
      weights: weights || { cost_weight: 0.3, delay_weight: 0.4, sla_penalty_weight: 0.3, emissions_weight: 0.0 },
      max_budget_inr: maxBudget,
      enable_quantum_experiment: true,
    }),
  });
  if (!res.ok) throw new Error('Failed to optimize recovery');
  return res.json();
}

export async function approvePlan(
  recoveryId: string,
  planId: string,
  operatorId: string = 'OP-LOGISTICS-LEAD',
  notes?: string
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/recovery/${recoveryId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, operator_id: operatorId, notes }),
  });
  if (!res.ok) throw new Error('Failed to approve plan');
  return res.json();
}

export async function rejectPlan(
  recoveryId: string,
  planId: string,
  operatorId: string = 'OP-LOGISTICS-LEAD',
  notes?: string
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/recovery/${recoveryId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, operator_id: operatorId, notes }),
  });
  if (!res.ok) throw new Error('Failed to reject plan');
  return res.json();
}

export async function fetchAuditLogs(shipmentId?: string): Promise<AuditLogEntry[]> {
  const url = shipmentId ? `${API_BASE}/audit/${shipmentId}` : `${API_BASE}/audit?limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function clearAuditLogs(): Promise<{ status: string; deleted_entries: number }> {
  const res = await fetch(`${API_BASE}/audit`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear audit logs');
  return res.json();
}


export async function fetchBenchmark(): Promise<any> {
  const res = await fetch(`${API_BASE}/optimization/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch benchmark');
  return res.json();
}

export async function fetchNetworkOverview(): Promise<NetworkOverview> {
  const res = await fetch(`${API_BASE}/network/overview`);
  if (!res.ok) throw new Error('Failed to fetch network overview');
  return res.json();
}

export async function fetchCorridors(params?: {
  mode?: string;
  overloaded_only?: boolean;
}): Promise<CorridorSummary[]> {
  const query = new URLSearchParams();
  if (params?.mode && params.mode !== 'ALL') query.append('mode', params.mode);
  if (params?.overloaded_only) query.append('overloaded_only', 'true');

  const res = await fetch(`${API_BASE}/network/corridors?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch network corridors');
  return res.json();
}

export async function askFluxQChat(payload: {
  message: string;
  copilot_type?: string;
  context_shipment_id?: string;
  context_corridor_id?: string;
  context_simulation_id?: string;
}): Promise<AssistantChatResponse> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to communicate with Ask FluxQ assistant');
  return res.json();
}

export async function fetchQuantumBenchmark(): Promise<any> {
  const res = await fetch(`${API_BASE}/quantum/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch quantum benchmark');
  return res.json();
}

export async function runQuantumSimulation(payload: {
  circuit_depth_p?: number;
  optimizer?: string;
  mixer?: string;
  shots?: number;
  noise_model?: string;
  penalty_lambda_1?: number;
  penalty_lambda_2?: number;
  penalty_lambda_3?: number;
  num_shipments?: number;
  num_slots?: number;
  gamma?: number;
  beta?: number;
  penalty_lambda?: number;
}): Promise<QAOASimulationResult> {
  const res = await fetch(`${API_BASE}/quantum/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to execute QAOA simulation');
  return res.json();
}
