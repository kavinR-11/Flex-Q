import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  RotateCcw, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { Shipment, OptimizationResponse } from '../types';
import { optimizeRecovery, approvePlan, rejectPlan } from '../services/api';

interface RecoveryCenterViewProps {
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onShipmentUpdated: () => void;
}

export const RecoveryCenterView: React.FC<RecoveryCenterViewProps> = ({
  shipments,
  selectedShipmentId,
  onShipmentUpdated,
}) => {
  const atRiskList = shipments.filter((s) => s.risk_score >= 6);
  const initialTargetId = selectedShipmentId || (atRiskList[0]?.shipment_id ?? 'SH-2048');

  const [activeShipmentId, setActiveShipmentId] = useState<string>(initialTargetId);
  const [weights, setWeights] = useState({ cost_weight: 0.3, delay_weight: 0.4, sla_penalty_weight: 0.3 });
  const [maxBudget, setMaxBudget] = useState<number>(15000);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PLAN-B');
  const [operatorId, setOperatorId] = useState<string>('OP-CHENNAI-01');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const activeShipment = shipments.find((s) => s.shipment_id === activeShipmentId);

  const handleRunOptimization = async (shipmentId: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await optimizeRecovery(shipmentId, weights, maxBudget);
      setOptimizationResult(res);
      setSelectedPlanId(res.recommended_plan_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeShipmentId) {
      handleRunOptimization(activeShipmentId);
    }
  }, [activeShipmentId]);

  const handleApprove = async () => {
    if (!optimizationResult) return;
    const plan = optimizationResult.plans.find((p) => p.plan_id === selectedPlanId);
    if (!plan) return;

    try {
      await approvePlan(plan.recovery_id, plan.plan_id, operatorId, operatorNotes || `Authorized plan ${plan.strategy_name}`);
      setActionMessage(`Plan ${plan.strategy_name} successfully APPROVED. Shipment state updated.`);
      onShipmentUpdated();
      // Re-run optimization to reflect updated state
      handleRunOptimization(activeShipmentId);
    } catch (err) {
      console.error(err);
      setActionMessage('Failed to authorize plan.');
    }
  };

  const handleReject = async () => {
    if (!optimizationResult) return;
    const plan = optimizationResult.plans.find((p) => p.plan_id === selectedPlanId);
    if (!plan) return;

    try {
      await rejectPlan(plan.recovery_id, plan.plan_id, operatorId, operatorNotes || 'Operator rejected automated recommendation.');
      setActionMessage(`Plan ${plan.strategy_name} REJECTED. Shipment escalated to manual control.`);
      onShipmentUpdated();
    } catch (err) {
      console.error(err);
      setActionMessage('Failed to reject plan.');
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Banner (Pure White Theme) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                CLASSICAL SOLVER: GOOGLE OR-TOOLS
              </span>
              <span className="text-xs text-[#424751] font-mono">
                MIP SCIP / CBC Solvers
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c29] mt-1">
              Autonomous Recovery Recommendation &amp; Approval Center
            </h1>
            <p className="text-xs text-[#424751] mt-0.5">
              Multi-criteria combinatorial optimization for routing alternatives, carrier capacity, and SLA protection.
            </p>
          </div>

          {/* Shipment Selector */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#424751] font-mono font-semibold">Target Shipment:</span>
            <select
              value={activeShipmentId}
              onChange={(e) => setActiveShipmentId(e.target.value)}
              className="py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs font-mono font-bold text-[#003c76] focus:outline-none focus:border-[#003c76]"
            >
              {shipments.map((s) => (
                <option key={s.shipment_id} value={s.shipment_id}>
                  {s.shipment_id} ({s.origin}→{s.destination}) [Risk {s.risk_score}/10]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionMessage}</span>
        </div>
      )}

      {/* Target Shipment Context Snapshot */}
      {activeShipment && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <span className="text-[#424751] block text-[10px] uppercase font-bold">Consignment</span>
            <span className="font-mono font-bold text-[#003c76] text-sm">{activeShipment.shipment_id}</span>
            <span className="text-[#424751] block mt-0.5">{activeShipment.origin} → {activeShipment.destination}</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <span className="text-[#424751] block text-[10px] uppercase font-bold">Current Carrier</span>
            <span className="font-mono font-semibold text-[#101c29] text-sm">{activeShipment.carrier_id}</span>
            <span className="text-amber-700 block mt-0.5 font-mono font-bold capitalize">{activeShipment.current_status}</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <span className="text-[#424751] block text-[10px] uppercase font-bold">SLA Buffer Remaining</span>
            <span className={`font-mono font-bold text-sm ${activeShipment.sla_buffer_minutes < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {activeShipment.sla_buffer_minutes} mins
            </span>
            <span className="text-[#424751] block mt-0.5">Deadline: {new Date(activeShipment.promised_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <span className="text-[#424751] block text-[10px] uppercase font-bold">Predicted Risk Score</span>
            <span className={`font-mono font-bold text-sm ${activeShipment.risk_score >= 8 ? 'text-red-600' : 'text-amber-700'}`}>
              {activeShipment.risk_score}/10 ({activeShipment.risk_category})
            </span>
            <span className="text-[#424751] block mt-0.5">Breach Prob: {Math.round(activeShipment.sla_breach_probability * 100)}%</span>
          </div>
        </div>
      )}

      {/* Multi-Objective Weights & Solver Control */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#003c76]" />
            <span className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Objective Trade-off Parameters &amp; Budget Constraints
            </span>
          </div>
          <button
            onClick={() => handleRunOptimization(activeShipmentId)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white text-xs font-bold flex items-center gap-1.5 transition self-end shadow-sm disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Solving...' : 'Re-solve MIP'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="flex justify-between text-[#424751] mb-1">
              <span className="font-semibold">Cost Weight (α):</span>
              <span className="font-mono text-[#003c76] font-bold">{weights.cost_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.cost_weight}
              onChange={(e) => setWeights({ ...weights, cost_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#003c76]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#424751] mb-1">
              <span className="font-semibold">Delay Weight (β):</span>
              <span className="font-mono text-[#003c76] font-bold">{weights.delay_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.delay_weight}
              onChange={(e) => setWeights({ ...weights, delay_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#003c76]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#424751] mb-1">
              <span className="font-semibold">SLA Penalty Weight (γ):</span>
              <span className="font-mono text-[#003c76] font-bold">{weights.sla_penalty_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.sla_penalty_weight}
              onChange={(e) => setWeights({ ...weights, sla_penalty_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#003c76]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#424751] mb-1">
              <span className="font-semibold">Budget Cap (₹ INR):</span>
              <span className="font-mono text-emerald-700 font-bold">₹{maxBudget.toLocaleString()}</span>
            </div>
            <input
              type="number"
              min="1000"
              max="50000"
              step="500"
              value={maxBudget}
              onChange={(e) => setMaxBudget(parseInt(e.target.value) || 15000)}
              className="w-full py-1 px-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs font-mono text-[#101c29] focus:outline-none focus:border-[#003c76]"
            />
          </div>
        </div>
      </div>

      {/* Candidate Recovery Plans (OR-Tools Results) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Generated Recovery Alternatives (OR-Tools MIP)
            </h2>
            <p className="text-[11px] text-[#424751]">
              Evaluated under strict road availability and carrier capacity constraints.
            </p>
          </div>
          {optimizationResult && (
            <div className="text-right text-xs font-mono text-[#424751]">
              Solver Runtime: <span className="text-[#003c76] font-bold">{optimizationResult.runtime_ms} ms</span> | Status: <span className="text-emerald-700 font-bold">{optimizationResult.solver_status}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {optimizationResult?.plans.map((plan) => {
            const isSelected = plan.plan_id === selectedPlanId;
            const isRecommended = plan.plan_id === optimizationResult.recommended_plan_id;
            const isBreach = plan.sla_outcome === 'BREACH_LIKELY';

            return (
              <div
                key={plan.plan_id}
                onClick={() => setSelectedPlanId(plan.plan_id)}
                className={`bg-white rounded-xl p-4 cursor-pointer transition relative flex flex-col justify-between border shadow-sm ${
                  isSelected
                    ? 'border-2 border-[#003c76] bg-[#eef4ff]/50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#003c76] text-white font-bold text-[9px] uppercase font-mono shadow-sm">
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#424751]">{plan.plan_id}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isBreach ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {plan.sla_outcome.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#101c29] mt-1.5">{plan.strategy_name}</h3>
                  <p className="text-[11px] text-[#424751] mt-0.5 line-clamp-1">{plan.alternate_route_name}</p>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#424751]">Action:</span>
                      <span className="font-mono font-semibold text-[#101c29]">{plan.action}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#424751]">Additional Cost:</span>
                      <span className="font-mono font-bold text-emerald-700">₹{plan.additional_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#424751]">Projected Delay:</span>
                      <span className={`font-mono font-bold ${plan.expected_delay_minutes > 30 ? 'text-red-600' : 'text-[#101c29]'}`}>
                        +{plan.expected_delay_minutes} mins
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#424751]">Projected Arrival:</span>
                      <span className="font-mono text-[#101c29]">
                        {new Date(plan.predicted_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold ${plan.feasible ? 'text-emerald-700' : 'text-red-600'}`}>
                    {plan.feasible ? '✓ Feasible' : '✗ Route Infeasible'}
                  </span>
                  <input
                    type="radio"
                    name="selected_plan"
                    checked={isSelected}
                    onChange={() => setSelectedPlanId(plan.plan_id)}
                    className="accent-[#003c76] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator Authorization Console & Quantum Benchmark Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Human Operator Approval Gate */}
        <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200 shadow-sm border-l-4 border-l-[#003c76]">
          <div>
            <span className="text-[10px] font-mono text-[#003c76] uppercase tracking-wider block font-bold">
              Human-in-the-Loop Decision Authority
            </span>
            <h3 className="text-sm font-bold text-[#101c29] mt-0.5">
              Operator Approval Console
            </h3>
            <p className="text-xs text-[#424751] mt-0.5">
              Consequential operational changes require authorized sign-off. Approving commits to immutable audit trail.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#424751] block mb-1 font-semibold">Operator ID:</label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs font-mono text-[#101c29] focus:outline-none focus:border-[#003c76]"
              />
            </div>

            <div>
              <label className="text-[#424751] block mb-1 font-semibold">Approval Justification / Operational Notes:</label>
              <textarea
                rows={2}
                value={operatorNotes}
                placeholder="e.g. Authorize alternate route via NH717 to circumvent Sriperumbudur flash flood bottleneck."
                onChange={(e) => setOperatorNotes(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] placeholder-[#727782] focus:outline-none focus:border-[#003c76]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleApprove}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Authorize &amp; Replan ({selectedPlanId})
            </button>
            <button
              onClick={handleReject}
              className="py-2 px-3.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <XCircle className="w-4 h-4" />
              Reject &amp; Escalate
            </button>
          </div>
        </div>

        {/* Quantum-Hybrid QAOA Experiment Benchmark */}
        <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200 shadow-sm border-l-4 border-l-[#4f1896]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#4f1896] uppercase tracking-wider block flex items-center gap-1 font-bold">
                <Cpu className="w-3.5 h-3.5 text-[#4f1896]" />
                Priority 2 Experimental Module
              </span>
              <h3 className="text-sm font-bold text-[#101c29] mt-0.5">
                Quantum-Hybrid QAOA Experimentation
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ecdcff] border border-[#d7bcff] text-[#280057] font-bold">
              Qiskit 2.5 Simulator
            </span>
          </div>

          <p className="text-xs text-[#424751]">
            Formulates a reduced residual carrier slot bottleneck as QUBO, maps to an Ising Hamiltonian, and simulates QAOA against classical OR-Tools baseline.
          </p>

          {optimizationResult?.quantum_benchmark ? (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200">
                  <span className="text-[#424751] block text-[10px] uppercase font-bold">Classical MIP Objective</span>
                  <span className="font-mono font-bold text-[#101c29] text-sm">
                    {optimizationResult.quantum_benchmark.classical_objective.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#727782] block mt-0.5">Runtime: {optimizationResult.quantum_benchmark.classical_runtime_ms} ms</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200">
                  <span className="text-[#424751] block text-[10px] uppercase font-bold">QAOA Simulator Objective</span>
                  <span className="font-mono font-bold text-[#4f1896] text-sm">
                    {optimizationResult.quantum_benchmark.quantum_objective.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#727782] block mt-0.5">Runtime: {optimizationResult.quantum_benchmark.quantum_runtime_ms} ms</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#eef4ff] border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[#101c29] font-bold block text-[11px]">Quantum Contribution Ratio (QCR):</span>
                  <span className="text-[10px] text-[#424751]">Formula: (J_classical - J_hybrid) / J_classical × 100%</span>
                </div>
                <span className="font-mono font-extrabold text-sm text-[#003c76]">
                  {optimizationResult.quantum_benchmark.quantum_contribution_ratio_pct.toFixed(2)}%
                </span>
              </div>

              <p className="text-[10px] text-[#424751] italic">
                {optimizationResult.quantum_benchmark.notes}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#f8f9ff] border border-slate-200 text-center text-xs text-[#727782]">
              Quantum benchmark unavailable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
