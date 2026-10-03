import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Shipment, OptimizationResponse, RecoveryPlanOption } from '../types';
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
      const res = await approvePlan(plan.recovery_id, plan.plan_id, operatorId, operatorNotes || `Authorized plan ${plan.strategy_name}`);
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CLASSICAL SOLVER: GOOGLE OR-TOOLS
              </span>
              <span className="text-xs text-slate-400 font-mono">
                MIP SCIP / CBC Solvers
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Autonomous Recovery Recommendation & Approval Center
            </h1>
            <p className="text-sm text-slate-400">
              Multi-criteria combinatorial optimization for routing alternatives, carrier capacity, and SLA protection.
            </p>
          </div>

          {/* Shipment Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Target Shipment:</span>
            <select
              value={activeShipmentId}
              onChange={(e) => setActiveShipmentId(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
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
        <div className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Target Shipment Context Snapshot */}
      {activeShipment && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="glass-panel rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Consignment</span>
            <span className="font-mono font-bold text-white text-sm">{activeShipment.shipment_id}</span>
            <span className="text-slate-400 block mt-0.5">{activeShipment.origin} → {activeShipment.destination}</span>
          </div>
          <div className="glass-panel rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Current Status / Carrier</span>
            <span className="font-mono font-semibold text-cyan-300 text-sm">{activeShipment.carrier_id}</span>
            <span className="text-amber-400 block mt-0.5 font-mono capitalize">{activeShipment.current_status}</span>
          </div>
          <div className="glass-panel rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">SLA Buffer Remaining</span>
            <span className={`font-mono font-bold text-sm ${activeShipment.sla_buffer_minutes < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {activeShipment.sla_buffer_minutes} mins
            </span>
            <span className="text-slate-400 block mt-0.5">Deadline: {new Date(activeShipment.promised_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="glass-panel rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Predicted Risk Score</span>
            <span className={`font-mono font-bold text-sm ${activeShipment.risk_score >= 8 ? 'text-rose-400' : 'text-amber-400'}`}>
              {activeShipment.risk_score}/10 ({activeShipment.risk_category})
            </span>
            <span className="text-slate-400 block mt-0.5">Breach Prob: {Math.round(activeShipment.sla_breach_probability * 100)}%</span>
          </div>
        </div>
      )}

      {/* Multi-Objective Weights & Solver Control */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Objective Trade-off Parameters & Budget Constraints
            </span>
          </div>
          <button
            onClick={() => handleRunOptimization(activeShipmentId)}
            disabled={loading}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition self-end"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Solving...' : 'Re-solve MIP'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Cost Weight (α):</span>
              <span className="font-mono text-cyan-400">{weights.cost_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.cost_weight}
              onChange={(e) => setWeights({ ...weights, cost_weight: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Delay Weight (β):</span>
              <span className="font-mono text-cyan-400">{weights.delay_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.delay_weight}
              onChange={(e) => setWeights({ ...weights, delay_weight: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>SLA Penalty Weight (γ):</span>
              <span className="font-mono text-cyan-400">{weights.sla_penalty_weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.sla_penalty_weight}
              onChange={(e) => setWeights({ ...weights, sla_penalty_weight: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Budget Cap (₹ INR):</span>
              <span className="font-mono text-emerald-400">₹{maxBudget.toLocaleString()}</span>
            </div>
            <input
              type="number"
              min="1000"
              max="50000"
              step="500"
              value={maxBudget}
              onChange={(e) => setMaxBudget(parseInt(e.target.value) || 15000)}
              className="w-full py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Candidate Recovery Plans (OR-Tools Results) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Generated Recovery Alternatives (OR-Tools MIP)
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated under strict road availability and carrier capacity constraints.
            </p>
          </div>
          {optimizationResult && (
            <div className="text-right text-xs font-mono text-slate-400">
              Solver Runtime: <span className="text-cyan-300 font-bold">{optimizationResult.runtime_ms} ms</span> | Status: <span className="text-emerald-400 font-bold">{optimizationResult.solver_status}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {optimizationResult?.plans.map((plan) => {
            const isSelected = plan.plan_id === selectedPlanId;
            const isRecommended = plan.plan_id === optimizationResult.recommended_plan_id;
            const isBreach = plan.sla_outcome === 'BREACH_LIKELY';

            return (
              <div
                key={plan.plan_id}
                onClick={() => setSelectedPlanId(plan.plan_id)}
                className={`glass-panel rounded-2xl p-4 cursor-pointer transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-2 border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'hover:border-slate-600'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-[10px] uppercase font-mono shadow-sm">
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{plan.plan_id}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      isBreach ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {plan.sla_outcome.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1">{plan.strategy_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{plan.alternate_route_name}</p>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Action:</span>
                      <span className="font-mono font-semibold text-slate-200">{plan.action}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Additional Cost:</span>
                      <span className="font-mono font-bold text-emerald-400">₹{plan.additional_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Projected Delay:</span>
                      <span className={`font-mono font-bold ${plan.expected_delay_minutes > 30 ? 'text-rose-400' : 'text-slate-200'}`}>
                        +{plan.expected_delay_minutes} mins
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Projected Arrival:</span>
                      <span className="font-mono text-slate-200">
                        {new Date(plan.predicted_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className={`text-[10px] font-mono ${plan.feasible ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {plan.feasible ? '✓ Feasible' : '✗ Route Infeasible'}
                  </span>
                  <input
                    type="radio"
                    name="selected_plan"
                    checked={isSelected}
                    onChange={() => setSelectedPlanId(plan.plan_id)}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator Authorization Console & Quantum Benchmark Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Human Operator Approval Gate */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 border-l-4 border-cyan-500">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
              Human-in-the-Loop Decision Authority
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Operator Approval Console
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Consequential operational changes require authorized sign-off. Approving commits to immutable audit trail.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Operator ID:</label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Approval Justification / Operational Notes:</label>
              <textarea
                rows={2}
                value={operatorNotes}
                placeholder="e.g. Authorize alternate route via NH717 to circumvent Sriperumbudur flash flood bottleneck."
                onChange={(e) => setOperatorNotes(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Authorize & Replan ({selectedPlanId})
            </button>
            <button
              onClick={handleReject}
              className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <XCircle className="w-4 h-4" />
              Reject & Escalate
            </button>
          </div>
        </div>

        {/* Quantum-Hybrid QAOA Experiment Benchmark */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 border-l-4 border-sky-500 bg-gradient-to-r from-slate-900 to-sky-950/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider block flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Priority 2 Experimental Module
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Quantum-Hybrid QAOA Experimentation
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 border border-sky-800 text-sky-300">
              Qiskit 2.5 Simulator
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Formulates a reduced residual carrier slot bottleneck as QUBO, maps to an Ising Hamiltonian, and simulates QAOA against classical OR-Tools baseline.
          </p>

          {optimizationResult?.quantum_benchmark ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Classical MIP Objective</span>
                  <span className="font-mono font-bold text-white text-base">
                    {optimizationResult.quantum_benchmark.classical_objective.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Runtime: {optimizationResult.quantum_benchmark.classical_runtime_ms} ms</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">QAOA Simulator Objective</span>
                  <span className="font-mono font-bold text-sky-400 text-base">
                    {optimizationResult.quantum_benchmark.quantum_objective.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Runtime: {optimizationResult.quantum_benchmark.quantum_runtime_ms} ms</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-semibold block">Quantum Contribution Ratio (QCR):</span>
                  <span className="text-[10px] text-slate-500">Formula: (J_classical - J_hybrid) / J_classical × 100%</span>
                </div>
                <span className="font-mono font-extrabold text-sm text-sky-300">
                  {optimizationResult.quantum_benchmark.quantum_contribution_ratio_pct.toFixed(2)}%
                </span>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                {optimizationResult.quantum_benchmark.notes}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 text-center text-xs text-slate-500">
              Quantum benchmark unavailable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
