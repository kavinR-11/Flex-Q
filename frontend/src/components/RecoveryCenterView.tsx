import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  RotateCcw, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Info,
  Check,
  Split,
  Sparkles
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
      setSelectedPlanId(res.recommended_plan_id || 'PLAN-B');
    } catch (err) {
      console.error('Optimization error:', err);
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
      await approvePlan(
        plan.recovery_id, 
        plan.plan_id, 
        operatorId, 
        operatorNotes || `Dispatcher authorized ${plan.strategy_name} via ${plan.action} for ${activeShipmentId}.`
      );
      setActionMessage(`Plan ${plan.plan_id} (${plan.strategy_name}) successfully AUTHORIZED by ${operatorId}. Consignment state updated to REROUTED and recorded to Immutable Audit Trail.`);
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
      await rejectPlan(
        plan.recovery_id, 
        plan.plan_id, 
        operatorId, 
        operatorNotes || 'Operator rejected automated recommendation. Escalating to supervisor.'
      );
      setActionMessage(`Plan ${plan.plan_id} REJECTED by ${operatorId}. Shipment escalated to manual control.`);
      onShipmentUpdated();
    } catch (err) {
      console.error(err);
      setActionMessage('Failed to reject plan.');
    }
  };

  // Selected Plan Object for Console preview
  const activePlanObj = optimizationResult?.plans.find((p) => p.plan_id === selectedPlanId);

  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Banner (Pure White Theme) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                HYBRID OPTIMIZATION ENGINE
              </span>
              <span className="text-xs text-[#424751] font-mono">
                Google OR-Tools MIP + Qiskit QAOA Core
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c29] mt-1">
              Autonomous Recovery Recommendation &amp; Approval Center
            </h1>
            <p className="text-xs text-[#424751] mt-0.5">
              Multi-criteria combinatorial optimization evaluating multimodal routes, carrier capacity bounds, and SLA breach exposure.
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
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">✕</button>
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

      {/* 87% / 13% Hybrid Consensus Triage Split Banner */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-[#003c76]" />
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Hybrid Consensus Triage Breakdown (86.7% Classical / 13.3% Quantum)
            </h2>
          </div>
          <span className="text-[11px] text-[#424751] font-mono">
            Total Fleet Variables: <strong className="text-[#101c29]">60</strong>
          </span>
        </div>

        {/* Visual Segmented Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-2.5 shadow-inner">
          <div 
            style={{ width: '86.7%' }} 
            className="h-full bg-[#003c76] flex items-center justify-center text-[9px] font-bold text-white tracking-wide"
            title="86.7% Frozen Classically via Google OR-Tools"
          >
            OR-TOOLS CLASSICAL CONSENSUS (86.7%)
          </div>
          <div 
            style={{ width: '13.3%' }} 
            className="h-full bg-[#4f1896] flex items-center justify-center text-[9px] font-bold text-white tracking-wide animate-pulse"
            title="13.3% Dispatched to Qiskit QAOA Simulator"
          >
            QAOA (13.3%)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-[#eef4ff] border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#003c76]">Classical Consensus Tier (86.7%)</span>
              <span className="px-1.5 py-0.5 rounded bg-[#d6e4ff] text-[#002b5c] font-mono font-bold text-[10px]">52 / 60 Frozen</span>
            </div>
            <p className="text-[11px] text-[#424751] mt-1">
              Google OR-Tools CP-SAT rapidly resolves 52 uncontested routing variables with 100% mathematical certainty in &lt;6ms.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#f9f3ff] border border-[#d7bcff]/60">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#4f1896]">Quantum Variational Core (13.3%)</span>
              <span className="px-1.5 py-0.5 rounded bg-[#ecdcff] text-[#280057] font-mono font-bold text-[10px]">8 Contested Slots</span>
            </div>
            <p className="text-[11px] text-[#424751] mt-1">
              Dispatched as QUBO Ising Hamiltonian to Qiskit Aer Statevector (8 qubits, depth p=3) to explore alternative Pareto trade-offs.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Objective Weights & Solver Control */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#003c76]" />
            <div>
              <span className="text-xs font-bold text-[#101c29] uppercase tracking-wider block">
                Objective Trade-off Parameters &amp; Budget Constraints
              </span>
              <span className="text-[11px] text-[#424751]">
                Adjusting weights dynamically alters which recovery plan is selected as optimal.
              </span>
            </div>
          </div>
          <button
            onClick={() => handleRunOptimization(activeShipmentId)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white text-xs font-bold flex items-center gap-1.5 transition self-end shadow-sm disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Re-solving MIP...' : 'Re-solve MIP'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200">
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
            <span className="text-[10px] text-[#727782] block mt-1">High α favors Lowest-Cost / Rail plans</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200">
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
            <span className="text-[10px] text-[#727782] block mt-1">High β minimizes transit delay minutes</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200">
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
            <span className="text-[10px] text-[#727782] block mt-1">High γ guarantees zero-breach (Air Expedite)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200">
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
              className="w-full py-1 px-2 rounded bg-white border border-slate-200 text-xs font-mono text-[#101c29] focus:outline-none focus:border-[#003c76]"
            />
            <span className="text-[10px] text-[#727782] block mt-1">Options over budget become infeasible</span>
          </div>
        </div>
      </div>

      {/* Candidate Recovery Plans (OR-Tools Results - 5 Multimodal Plans) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Generated Multimodal Recovery Alternatives (OR-Tools MIP)
            </h2>
            <p className="text-[11px] text-[#424751]">
              Click any card below to select your desired plan, then authorize it in the console.
            </p>
          </div>
          {optimizationResult && (
            <div className="text-right text-xs font-mono text-[#424751]">
              Solver Runtime: <span className="text-[#003c76] font-bold">{optimizationResult.runtime_ms} ms</span> | Status: <span className="text-emerald-700 font-bold">{optimizationResult.solver_status}</span>
            </div>
          )}
        </div>

        {/* 5-Column Responsive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {optimizationResult?.plans.map((plan) => {
            const isSelected = plan.plan_id === selectedPlanId;
            const isRecommended = plan.plan_id === optimizationResult.recommended_plan_id;
            const isWithinSla = plan.sla_outcome === 'WITHIN_COMMITMENT';

            return (
              <div
                key={plan.plan_id}
                onClick={() => setSelectedPlanId(plan.plan_id)}
                className={`bg-white rounded-xl p-3.5 cursor-pointer transition relative flex flex-col justify-between border shadow-sm ${
                  isSelected
                    ? 'border-2 border-[#003c76] ring-2 ring-[#003c76]/20 bg-[#f4f8ff]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#003c76] text-white font-bold text-[9px] uppercase font-mono shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#424751]">{plan.plan_id}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isWithinSla 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isWithinSla ? '✓ WITHIN SLA' : 'BREACH LIKELY'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#101c29] mt-1.5 leading-snug">{plan.strategy_name}</h3>
                  <p className="text-[10px] text-[#424751] mt-0.5 line-clamp-1">{plan.alternate_route_name}</p>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-[#424751] text-[11px]">Action:</span>
                      <span className="font-mono font-semibold text-[#101c29] text-[11px]">{plan.action}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-[#424751] text-[11px]">Cost:</span>
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">
                        ₹{(plan.additional_cost_inr ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-[#424751] text-[11px]">Delay:</span>
                      <span className={`font-mono font-bold text-[11px] ${plan.expected_delay_minutes > 15 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        +{plan.expected_delay_minutes} mins
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#424751] text-[11px]">Arrival:</span>
                      <span className="font-mono text-[#101c29] text-[11px]">
                        {new Date(plan.predicted_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-semibold ${plan.feasible ? 'text-emerald-700' : 'text-red-600'}`}>
                      {plan.feasible ? '✓ Feasible' : '✗ Infeasible'}
                    </span>
                    <span className="text-[#727782]">{plan.alternate_carrier_id || 'Carrier A'}</span>
                  </div>

                  {/* Explicit Action Button on Each Card */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(plan.plan_id);
                    }}
                    className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#003c76] text-white shadow-sm'
                        : 'bg-[#eef4ff] text-[#003c76] hover:bg-[#dbe9ff]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Selected for Sign-off
                      </>
                    ) : (
                      'Select This Plan'
                    )}
                  </button>
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
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#003c76] uppercase tracking-wider block font-bold">
                Human-in-the-Loop Decision Authority
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                Sign-off Mandatory
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#101c29] mt-0.5">
              Operator Approval Console
            </h3>
            <p className="text-xs text-[#424751] mt-0.5">
              Enterprise policy requires authorized dispatcher sign-off before committing carrier budgets or rerouting active vehicles.
            </p>
          </div>

          {/* Active Selection Details Preview */}
          {activePlanObj && (
            <div className="p-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101c29]">Selected Plan: <strong className="text-[#003c76] font-mono">{activePlanObj.plan_id}</strong> ({activePlanObj.strategy_name})</span>
                <span className="font-mono text-emerald-700 font-bold">Cost: ₹{activePlanObj.additional_cost_inr.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#424751]">
                Route: <span className="font-semibold text-[#101c29]">{activePlanObj.alternate_route_name}</span> | Delay: <span className="font-semibold text-[#101c29]">+{activePlanObj.expected_delay_minutes} mins</span>
              </p>
            </div>
          )}

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#424751] block mb-1 font-semibold">Operator ID / Dispatcher Call-sign:</label>
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
                placeholder="e.g. Authorizing alternate multimodal relay to protect life-saving SLA commitment."
                onChange={(e) => setOperatorNotes(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] placeholder-[#727782] focus:outline-none focus:border-[#003c76]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm &amp; Authorize Plan ({selectedPlanId})
            </button>
            <button
              onClick={handleReject}
              className="py-2.5 px-3.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition"
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
              Qiskit 2.2.3 Simulator (8 Qubits)
            </span>
          </div>

          <p className="text-xs text-[#424751]">
            Isolates the contested 13.3% residual carrier slot bottleneck as a QUBO Ising Hamiltonian, simulated via Qiskit Aer Statevector against classical OR-Tools baseline.
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
                <div className="p-2.5 rounded-lg bg-[#f9f3ff] border border-[#d7bcff]/60">
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
                  {optimizationResult.quantum_benchmark.quantum_contribution_ratio_pct > 0 ? '+' : ''}
                  {optimizationResult.quantum_benchmark.quantum_contribution_ratio_pct.toFixed(2)}%
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200 text-[11px] text-[#424751] flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#003c76] shrink-0 mt-0.5" />
                <span>
                  <strong>Scientific Notice:</strong> Simulated on classical CPU via Qiskit Aer Statevector ansatz (p=3). The {optimizationResult.quantum_benchmark.quantum_contribution_ratio_pct.toFixed(1)}% QCR reflects quantum superposition exploration over contested residual carrier slots.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#f8f9ff] border border-slate-200 text-center text-xs text-[#727782]">
              Quantum benchmark evaluating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
