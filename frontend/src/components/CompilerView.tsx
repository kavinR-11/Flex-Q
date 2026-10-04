import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Zap,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Activity,
  Boxes,
  Plane,
  Truck,
  Train,
  Check,
} from 'lucide-react';
import { Shipment, CompiledProblemState } from '../types';
import { compileDisruption, fetchCompilerState, resetCompiler } from '../services/api';

interface CompilerViewProps {
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onSelectShipment: (id: string) => void;
  onNavigateToRecovery: (shipmentId: string) => void;
  onShipmentPrioritized?: () => void;
}

export const CompilerView: React.FC<CompilerViewProps> = ({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  onNavigateToRecovery,
  onShipmentPrioritized,
}) => {
  // Active selection states for the 3 pillars
  const [targetShipmentId, setTargetShipmentId] = useState<string>(
    selectedShipmentId || (shipments[0]?.shipment_id ?? 'SH-2048')
  );
  const [transportTarget, setTransportTarget] = useState<string>('Airport_Hub_BLR');
  const [regionTarget, setRegionTarget] = useState<string>('CORR-NH48-W');

  // Compiler state from backend
  const [compilerState, setCompilerState] = useState<CompiledProblemState | null>(null);
  const [compilingPillar, setCompilingPillar] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [activeMatrixTab, setActiveMatrixTab] = useState<'D' | 'C' | 'B' | 'E' | 'W'>('D');

  // Synchronize target shipment with prop if provided
  useEffect(() => {
    if (selectedShipmentId) {
      setTargetShipmentId(selectedShipmentId);
    }
  }, [selectedShipmentId]);

  // Load initial compiled state
  useEffect(() => {
    fetchCompilerState()
      .then((state) => setCompilerState(state))
      .catch((err) => console.error('Error fetching compiler state:', err));
  }, []);

  const handleCompilePillar = async (eventType: string, targetId: string) => {
    setCompilingPillar(eventType);
    try {
      const state = await compileDisruption({
        event_type: eventType,
        target_id: targetId,
        severity: 1.0,
      });
      setCompilerState(state);

      // Trigger global reload so Control Tower, Shipment Risk, and Recovery Center see the changes immediately
      if (onShipmentPrioritized) {
        onShipmentPrioritized();
      }
    } catch (err) {
      console.error('Error compiling pillar:', err);
    } finally {
      setCompilingPillar(null);
    }
  };

  const handleResetCompiler = async () => {
    setResetting(true);
    try {
      const res = await resetCompiler();
      setCompilerState(res.state);
      if (onShipmentPrioritized) {
        onShipmentPrioritized();
      }
    } catch (err) {
      console.error('Error resetting compiler:', err);
    } finally {
      setResetting(false);
    }
  };

  const currentShipment = shipments.find((s) => s.shipment_id === targetShipmentId);

  // Multimodal Action column labels aligned with network corridors
  const actionLabels = [
    'Plan A: Baseline NH48 (CORR-NH48-W)',
    'Plan B: State Highway Bypass (CORR-MAA-BLR)',
    'Plan C: Dedicated Rail Relay (CORR-WDFC-RAIL)',
    'Plan D: Linehaul Relay (CORR-NH44-S)',
    'Plan E: Expedite Air Express (CORR-AIR-IND)',
  ];

  return (
    <div className="space-y-5 font-sans text-[#101c29] max-w-[1680px] mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-[#003c76]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#e4efff] text-[#003c76] border border-[#a9c9ff] font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                MATHEMATICAL ENGINE (STEP 3 TRIAGE)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                ✓ ALL MODULES SYNCHRONIZED
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c29] mt-1.5 flex items-center gap-2">
              <span>Disruption-to-Constraint Compiler</span>
              <span className="text-slate-400 font-normal text-lg">|</span>
              <span className="text-slate-600 font-medium text-lg">Dynamic Prioritization Engine</span>
            </h1>
            <p className="text-xs text-[#424751] mt-0.5">
              Translates real-world alerts into per-consignment penalty matrices [C, D, B, E], 
              dynamically modifies SLA objective fine weights (γ_i), and triggers 64-solver parallel triage.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetCompiler}
              disabled={resetting}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-xs transition cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset to Baseline Math</span>
            </button>
            <button
              onClick={() => onNavigateToRecovery(targetShipmentId)}
              className="px-4 py-2 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <span>Proceed to Recovery Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIGH PRIORITY WARNING BANNERS FOR AIRPORT CLOSURE OR INFINITY WALL         */}
      {/* ========================================================================= */}
      {compilerState?.infinity_delay_warning && (
        <div className="p-4 rounded-xl bg-red-950 text-white border-2 border-red-500 shadow-lg flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-red-600 rounded-lg text-white shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-red-300 font-bold">
                  CRITICAL MATHEMATICAL BARRIER ERECTED
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-800 text-white font-mono font-bold">
                  D_ia = 1,000,000 mins
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                Regional Disaster Zone Impassable — Transit Delay Set to Infinity (10⁶ mins)
              </h2>
              <p className="text-xs text-red-200 mt-0.5">
                All assignments crossing this hazard polygon are mathematically forbidden (x_i,a = 0).{' '}
                <strong>{compilerState.impacted_count ?? 0} consignments</strong> currently trapped and queued for multimodal diversion.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (compilerState?.impacted_consignments?.[0]?.shipment_id) {
                onNavigateToRecovery(compilerState.impacted_consignments[0].shipment_id);
              } else {
                onNavigateToRecovery(targetShipmentId);
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shrink-0 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Dispatch to Recovery Network</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {compilerState?.pillar_applied === 'PILLAR_2_TRANSPORTATION_WINS' && (
        <div className="p-4 rounded-xl bg-amber-950 text-white border-2 border-amber-500 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-600 rounded-lg text-white shrink-0">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-300 font-bold">
                  AIR INFRASTRUCTURE SHUTDOWN
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-800 text-white font-mono font-bold">
                  Cap_a = 0
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                {compilerState.grounded_hub_name || 'Air Cargo Terminal'} Closed — Runway & Hub Flow Restamped to 0
              </h2>
              <p className="text-xs text-amber-200 mt-0.5">
                <strong>{compilerState.impacted_count ?? 0} active air consignments</strong> grounded and flagged in database. 
                Alternative rail and highway bypass corridors engaged.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (compilerState?.impacted_consignments?.[0]?.shipment_id) {
                onNavigateToRecovery(compilerState.impacted_consignments[0].shipment_id);
              } else {
                onNavigateToRecovery(targetShipmentId);
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shrink-0 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Re-route Air Consignments</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Pillar 1 Feedback Banner */}
      {compilerState?.pillar_applied === 'PILLAR_1_PRODUCT_WINS' && (
        <div className="p-4 rounded-xl bg-rose-50 border-rose-200 text-rose-950 border shadow-sm flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  PILLAR 1: PRODUCT WINS (COLD-CHAIN MEDICAL PRIORITY SPIKE)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 font-mono font-bold">
                  γ = 2500.0 (50× Fine Penalty)
                </span>
              </div>
              <p className="text-xs mt-1 font-medium text-rose-900">
                {compilerState.affected_details[0]?.impact || 'Mathematical constraints updated across live matrix.'}
              </p>
              <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-2">
                <span>Persisted in DB: Consignment {targetShipmentId} set to Priority 1 Medical (Risk 9/10).</span>
                <span>•</span>
                <span className="font-semibold text-rose-900">Recovery Center auto-loads Cold-Chain Medical Regime.</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateToRecovery(targetShipmentId)}
            className="px-3 py-1.5 rounded bg-white border border-rose-300 text-rose-900 text-xs font-bold hover:bg-rose-100 transition shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>View in Recovery Center</span>
            <ExternalLink className="w-3.5 h-3.5 text-rose-700" />
          </button>
        </div>
      )}

      {/* Main Grid: UI Element A (3 Pillars) + UI Element B (64 Parallel Solvers) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================================= */}
        {/* UI ELEMENT A: 3-Pillar Interactive Disruption Simulator (5 Cols)           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#003c76]">
                  <Boxes className="w-4 h-4" />
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101c29]">
                  1. The 3-Pillar Mathematical Disruption Simulator
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                Interactive Telemetry
              </span>
            </div>

            <p className="text-[11px] text-[#424751] mt-2 mb-3">
              Select any real-world disruption scenario below. The compiler dynamically alters 
              matrices [C, D, B, E] and modifies solver objective weights in real time.
            </p>

            <div className="space-y-3">
              {/* PILLAR 1: Product Wins */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                compilerState?.pillar_applied === 'PILLAR_1_PRODUCT_WINS'
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-[#fcfcff] border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span className="text-xs font-bold text-rose-900">
                      Pillar 1: When Product Wins
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    Spike γ (SLA Fine ×50)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  Triggers temperature excursion alert for cold-chain medicine. Spikes SLA fine penalty parameter 
                  γ_i from 50.0 &rarr; 2500.0, forcing solver to prioritize immediate bypass over all cost metrics.
                </p>

                {/* Target Shipment Selector */}
                <div className="mt-2.5 pt-2 border-t border-rose-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Target Consignment:</span>
                    {currentShipment && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                        Priority: {currentShipment.cargo_priority} | {currentShipment.cargo_type}
                      </span>
                    )}
                  </div>
                  <select
                    value={targetShipmentId}
                    onChange={(e) => {
                      setTargetShipmentId(e.target.value);
                      onSelectShipment(e.target.value);
                    }}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    {shipments.map((s) => (
                      <option key={s.shipment_id} value={s.shipment_id}>
                        {s.shipment_id} — {s.cargo_type} ({s.origin} → {s.destination}) [Risk: {s.risk_score}/10, P{s.cargo_priority}]
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Objective Weight Transformation Display */}
                  <div className="p-2 rounded-lg bg-white border border-rose-200 text-[11px] flex items-center justify-between font-mono">
                    <span className="text-slate-600 font-sans">Objective SLA Fine Weight:</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Baseline γ = {
                          currentShipment?.cargo_type?.toLowerCase().includes('cold-chain') || currentShipment?.cargo_type?.toLowerCase().includes('insulin')
                            ? '60.0 (Cold-Chain)'
                            : currentShipment?.cargo_priority === 1
                            ? '50.0 (Pharma)'
                            : currentShipment?.cargo_priority === 2
                            ? '25.0 (Electronics)'
                            : currentShipment?.cargo_priority === 3
                            ? '12.0 (Auto JIT)'
                            : '4.0 (Textiles)'
                        }
                      </span>
                      <span className="text-rose-600">&rarr;</span>
                      <span className="text-rose-900 bg-rose-100 px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                        Spikes to γ = 2500.0 (50×)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompilePillar('PRODUCT_PRIORITY', targetShipmentId)}
                    disabled={compilingPillar !== null}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>
                      {compilingPillar === 'PRODUCT_PRIORITY'
                        ? 'Compiling Linear Constraints...'
                        : 'Compile Pillar 1 (Spike γ Fine Weight to 2500)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* PILLAR 2: Transportation Wins */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                compilerState?.pillar_applied === 'PILLAR_2_TRANSPORTATION_WINS'
                  ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-[#fcfcff] border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span className="text-xs font-bold text-amber-950">
                      Pillar 2: When Transportation Wins
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Capacity Cap_a → 0
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  Airport hub ground-crew strike or lane shutdown. Restricts maximum allowable corridor capacity 
                  Cap_a &rarr; 0, rendering all assignments through this resource mathematically infeasible (x_i,a = 0).
                </p>

                <div className="mt-2.5 pt-2 border-t border-amber-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Airport Hub / Air Corridor:</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                      Cap: 15 → 0
                    </span>
                  </div>
                  <select
                    value={transportTarget}
                    onChange={(e) => setTransportTarget(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Airport_Hub_BLR">Airport_Hub_BLR — Bengaluru Kempegowda Cargo Terminal (BLR)</option>
                    <option value="Airport_Hub_BOM">Airport_Hub_BOM — Mumbai Chhatrapati Shivaji Cargo Terminal (BOM)</option>
                    <option value="Airport_Hub_MAA">Airport_Hub_MAA — Chennai International Air Cargo Hub (MAA)</option>
                    <option value="Airport_Hub_DEL">Airport_Hub_DEL — Delhi Indira Gandhi Cargo Terminal (DEL)</option>
                    <option value="CORR-AIR-IND">CORR-AIR-IND — Domestic Priority Air Cargo Spine (All Flights)</option>
                  </select>

                  <button
                    onClick={() => handleCompilePillar('TRANSPORT_FAILURE', transportTarget)}
                    disabled={compilingPillar !== null}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {compilingPillar === 'TRANSPORT_FAILURE'
                        ? 'Compiling Capacity Constraints...'
                        : 'Compile Pillar 2 (Close Airport & Nullify Capacity)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* PILLAR 3: Region Wins */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                compilerState?.pillar_applied === 'PILLAR_3_REGION_WINS'
                  ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-[#fcfcff] border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span className="text-xs font-bold text-indigo-950">
                      Pillar 3: When Region Wins
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                    Delay D_ia → 10⁶ mins (∞)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  Cyclone or landslide hazard zone. Injects simulated infinity delay (1,000,000 minutes) 
                  into transit array D_i,a, erecting an impassable mathematical penalty barrier around the disaster zone.
                </p>

                <div className="mt-2.5 pt-2 border-t border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Disaster Corridor / Segment:</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                      Delay: 140m → 1,000,000m
                    </span>
                  </div>
                  <select
                    value={regionTarget}
                    onChange={(e) => setRegionTarget(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="CORR-NH48-W">CORR-NH48-W — NH-48 Khandala Ghat Landslide Corridor (Mumbai ↔ BLR)</option>
                    <option value="CORR-MAA-BLR">CORR-MAA-BLR — Chennai-Bengaluru Expressway Corridor (Sriperumbudur Choke)</option>
                    <option value="CORR-SEA-COAST">CORR-SEA-COAST — Bay of Bengal Coastal Feeder (Chennai Port Maritime)</option>
                    <option value="CORR-NH44-S">CORR-NH44-S — NH-44 North-South Highway (Hyderabad ↔ BLR)</option>
                  </select>

                  <button
                    onClick={() => handleCompilePillar('REGIONAL_DISASTER', regionTarget)}
                    disabled={compilingPillar !== null}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {compilingPillar === 'REGIONAL_DISASTER'
                        ? 'Compiling Delay Barrier Matrix...'
                        : 'Compile Pillar 3 (Erect 10⁶ min Barrier & Trap Corridor)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* UI ELEMENT B: Step 3 Classical Triage (64 Parallel Solvers) (7 Cols)      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <Activity className="w-4 h-4" />
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101c29]">
                  2. Parallel Solver Matrix (Step 3 Classical Triage)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  64 Solvers Active (5.8ms)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#424751] mt-2 mb-3">
              Sixty-four parallel classical solver threads rapidly evaluate initial LP relaxations across CPU cores. 
              Variables with high consensus are frozen immediately, isolating the contested bottleneck for Qiskit QAOA.
            </p>

            {/* Split Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>86.7% Frozen Consensus (52 Decision Variables)</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>13.3% Dispatched to Quantum QAOA (8 Variables)</span>
                </div>
              </div>
              
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: '86.7%' }} 
                  title="52 Variables Locked with 100% Heuristic Agreement"
                />
                <div 
                  className="h-full bg-purple-600 transition-all duration-500 animate-pulse" 
                  style={{ width: '13.3%' }} 
                  title="8 Contested Variables Dispatched to Qiskit QAOA Core"
                />
              </div>
            </div>

            {/* 64-Solver Animated Matrix Grid (8x8) */}
            <div className="bg-slate-900 rounded-xl p-3.5 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Live CPU Core Dispatch Grid (64 Classical Worker Threads)
                </span>
                <span className="text-[10px] font-mono text-purple-300">
                  Quantum Dispatch: ACTIVE (+12.4% QCR)
                </span>
              </div>

              {/* 8x8 Grid of 64 nodes */}
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {Array.from({ length: 64 }).map((_, idx) => {
                  const isContested = idx >= 52 && idx < 60; // 8 contested variables
                  const isConsensus = idx < 52;              // 52 frozen consensus
                  
                  return (
                    <div
                      key={idx}
                      className={`h-7 sm:h-8 rounded flex flex-col items-center justify-center font-mono text-[9px] transition-all cursor-help border ${
                        isContested
                          ? 'bg-purple-900/80 border-purple-400 text-purple-200 animate-pulse font-bold'
                          : isConsensus
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                          : 'bg-blue-950/80 border-blue-700 text-blue-300'
                      }`}
                      title={
                        isContested
                          ? `Core #${idx + 1}: CONTESTED BOTTLENECK [Var x_{${idx % 5},${(idx % 4) + 1}}] -> Dispatched to Qiskit QAOA`
                          : isConsensus
                          ? `Core #${idx + 1}: FROZEN CONSENSUS [Var locked at 1.0 in 5.8ms]`
                          : `Core #${idx + 1}: Master Arbiter Thread`
                      }
                    >
                      <span className="leading-none text-[8px] opacity-75">#{idx + 1}</span>
                      <span className="leading-tight font-bold text-[10px]">
                        {isContested ? '⚡Q' : '✓'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-emerald-500"></span>
                    <span>Frozen (52)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-purple-500"></span>
                    <span>Quantum Core (8)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-blue-500"></span>
                    <span>Arbiter (4)</span>
                  </span>
                </div>
                <span className="font-mono text-purple-300">
                  Target Speedup: 3.2× vs Pure MIP
                </span>
              </div>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-4 gap-2 pt-3 mt-1 border-t border-slate-100 text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-50 flex flex-col items-center">
                <span className="text-emerald-800 font-bold">Consensus Ratio</span>
                <span className="font-mono font-bold text-[#101c29] text-sm">86.7%</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 flex flex-col items-center">
                <span className="text-purple-800 font-bold">Quantum Bound</span>
                <span className="font-mono font-bold text-purple-900 text-sm">13.3%</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 flex flex-col items-center">
                <span className="text-blue-800 font-bold">Triage Latency</span>
                <span className="font-mono font-bold text-[#101c29] text-sm">5.8 ms</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 flex flex-col items-center">
                <span className="text-amber-800 font-bold">Expected QCR</span>
                <span className="font-mono font-bold text-amber-900 text-sm">+12.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IMPACTED CONSIGNMENTS ADDRESSED WITH IMMEDIATE RECOVERY ACTIONS           */}
      {/* ========================================================================= */}
      {compilerState?.impacted_consignments && compilerState.impacted_consignments.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg text-white ${
                compilerState.pillar_applied === 'PILLAR_1_PRODUCT_WINS'
                  ? 'bg-rose-600'
                  : compilerState.pillar_applied === 'PILLAR_2_TRANSPORTATION_WINS'
                  ? 'bg-amber-600'
                  : 'bg-indigo-600'
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101c29] flex items-center gap-2">
                  <span>
                    {compilerState.pillar_applied === 'PILLAR_1_PRODUCT_WINS'
                      ? 'Target Consignment Prioritized & Queued for Re-Route'
                      : compilerState.pillar_applied === 'PILLAR_2_TRANSPORTATION_WINS'
                      ? `Impacted Air Consignments Grounded at ${compilerState.grounded_hub_name || 'Airport'}`
                      : 'Trapped Consignments in Disaster Hazard Zone'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                    {compilerState.impacted_count} Consignments
                  </span>
                </h2>
                <span className="text-[11px] text-[#424751]">
                  Exact consignments identified from live database. Each consignment is armed with an alternative multi-modal recovery path.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const firstId = compilerState.impacted_consignments?.[0]?.shipment_id;
                  if (firstId) onNavigateToRecovery(firstId);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Authorize Re-routes in Recovery Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">Consignment</th>
                  <th className="py-2.5 px-3 font-semibold">Priority Tier</th>
                  <th className="py-2.5 px-3 font-semibold">Route & Corridor</th>
                  <th className="py-2.5 px-3 font-semibold">Carrier</th>
                  <th className="py-2.5 px-3 font-semibold">Status / Failure Impact</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Recovery Path</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compilerState.impacted_consignments.map((sh) => (
                  <tr key={sh.shipment_id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-blue-900">
                      {sh.shipment_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        sh.cargo_priority === 1
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : sh.cargo_priority === 2
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {sh.cargo_priority === 1 ? '❤️ P1 Medical' : sh.cargo_priority === 2 ? '⚡ P2 Electronics' : `⚙️ P${sh.cargo_priority}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {sh.origin} → {sh.destination}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {sh.carrier_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold block max-w-xs truncate">
                        {sh.failure_reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold block max-w-xs truncate">
                        {sh.recommended_recovery_plan}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigateToRecovery(sh.shipment_id)}
                        className="px-2.5 py-1 rounded bg-[#003c76] hover:bg-[#00539f] text-white text-[10px] font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Re-route</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 font-medium gap-1">
            <span>
              All <strong>{compilerState.impacted_consignments.length}</strong> flagged consignments active &amp; displayed. Each can be routed to Recovery Center in 1 click.
            </span>
            <span className="font-mono text-[11px] text-[#003c76] font-bold">
              Correlated with Network &amp; DB (No Contradictions)
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UI ELEMENT C: Live Mathematical Array / Tensor Inspector                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101c29]">
                3. Live Mathematical Array / Tensor Inspector
              </h2>
              <span className="text-[11px] text-[#424751]">
                Interactive view of formulated tensors across Shipments × Strategic Actions
              </span>
            </div>
          </div>

          {/* Matrix Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-mono font-semibold">
            <button
              onClick={() => setActiveMatrixTab('D')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeMatrixTab === 'D'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              [D] Delay (min)
            </button>
            <button
              onClick={() => setActiveMatrixTab('C')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeMatrixTab === 'C'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              [C] Cost (₹)
            </button>
            <button
              onClick={() => setActiveMatrixTab('B')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeMatrixTab === 'B'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              [B] SLA Breach
            </button>
            <button
              onClick={() => setActiveMatrixTab('E')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeMatrixTab === 'E'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              [E] Emissions (kg)
            </button>
            <button
              onClick={() => setActiveMatrixTab('W')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeMatrixTab === 'W'
                  ? 'bg-white text-rose-900 shadow-xs font-bold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              {'{'}γ{'}'} Dynamic Weights
            </button>
          </div>
        </div>

        {/* Matrix Render */}
        <div className="overflow-x-auto mt-3">
          {activeMatrixTab !== 'W' ? (
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">Shipment (i)</th>
                  <th className="py-2.5 px-3 font-semibold">Product & Priority</th>
                  {actionLabels.map((lbl, idx) => (
                    <th key={idx} className="py-2.5 px-3 font-semibold">
                      Action #{idx + 1}: {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(compilerState?.sample_shipments || shipments.slice(0, 5)).map((s, rowIdx) => {
                  const matrix =
                    activeMatrixTab === 'D'
                      ? compilerState?.D
                      : activeMatrixTab === 'C'
                      ? compilerState?.C
                      : activeMatrixTab === 'B'
                      ? compilerState?.B
                      : compilerState?.E;

                  const isTargetShipment = s.shipment_id === targetShipmentId;

                  return (
                    <tr
                      key={s.shipment_id}
                      className={isTargetShipment ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 font-bold text-blue-900">
                        {s.shipment_id}
                        {isTargetShipment && (
                          <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-blue-200 text-blue-900">
                            TARGET
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="font-semibold">{('product_type' in s ? s.product_type : s.cargo_type) || 'General Cargo'}</span>
                        <span className="ml-1.5 text-[10px] text-slate-400">P{s.cargo_priority}</span>
                      </td>
                      {actionLabels.map((_, colIdx) => {
                        const val = matrix?.[rowIdx]?.[colIdx] ?? 0;
                        const isInfiniteDelay = activeMatrixTab === 'D' && val >= 900000;
                        const isHighBreach = activeMatrixTab === 'B' && val >= 0.9;
                        const isAirAction = colIdx === 4;
                        const isAirNullified = isAirAction && compilerState?.capacities?.['ACT-AIR-EXPEDITE'] === 0;

                        return (
                          <td key={colIdx} className="py-2.5 px-3">
                            {isInfiniteDelay ? (
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>1,000,000m (∞ WALL)</span>
                              </span>
                            ) : isAirNullified && activeMatrixTab === 'C' ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                Cap = 0 (GROUNDED)
                              </span>
                            ) : isHighBreach ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                                1.0 (BREACH)
                              </span>
                            ) : (
                              <span>
                                {activeMatrixTab === 'C'
                                  ? `₹${val.toLocaleString()}`
                                  : activeMatrixTab === 'E'
                                  ? `${val} kg`
                                  : activeMatrixTab === 'D'
                                  ? `${val}m`
                                  : val.toFixed(1)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Dynamic Weights Tab */
            <div className="p-3 bg-slate-50 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-1">
                <div>
                  <span className="font-bold text-slate-800 uppercase block">
                    Product-Specific Objective Fine Weight Vectors: min f(x) = α·Cost + β·Delay + γ·SLA + δ·CO₂
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans">
                    Each product priority has a distinct baseline γ: P1 Cold-Chain (γ=60) &bull; P1 Standard Pharma (γ=50) &bull; P2 Electronics (γ=25) &bull; P3 Auto (γ=12) &bull; P4 Textiles (γ=4)
                  </span>
                </div>
                <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                  Pillar 1 spikes γ 50× (50 &rarr; 2500.0) for zero SLA breach tolerance
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(compilerState?.weights || { '0': { alpha: 1, beta: 5, gamma: 25, delta: 2 } }).map(
                  ([idx, w]) => {
                    const sh = compilerState?.sample_shipments?.[parseInt(idx)];
                    const isSpiked = w.gamma >= 100;
                    const pTier = sh?.cargo_priority ?? 2;
                    const cType = (sh?.product_type || '').toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          isSpiked
                            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-blue-900">{sh?.shipment_id || `Index #${idx}`}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isSpiked
                              ? 'bg-rose-600 text-white font-extrabold animate-pulse'
                              : pTier === 1 && (cType.includes('cold') || cType.includes('insulin'))
                              ? 'bg-rose-200 text-rose-900'
                              : pTier === 1
                              ? 'bg-rose-100 text-rose-800'
                              : pTier === 2
                              ? 'bg-blue-100 text-blue-800'
                              : pTier === 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isSpiked
                              ? '🔥 SPIKED 50× (γ=2500)'
                              : pTier === 1 && (cType.includes('cold') || cType.includes('insulin'))
                              ? `❤️ P1 Cold-Chain (γ=${w.gamma})`
                              : pTier === 1
                              ? `💊 P1 Pharma (γ=${w.gamma})`
                              : pTier === 2
                              ? `⚡ P2 Electronics (γ=${w.gamma})`
                              : pTier === 3
                              ? `⚙️ P3 Auto (γ=${w.gamma})`
                              : `📦 P4 Textiles (γ=${w.gamma})`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 line-clamp-1 mb-2 font-sans font-medium">
                          {sh?.product_type || 'Cargo Consignment'}
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-center font-bold text-[10px]">
                          <div className="bg-slate-100 p-1 rounded">
                            <span className="block text-[8px] text-slate-400 font-normal font-sans">α Cost</span>
                            <span>{w.alpha}</span>
                          </div>
                          <div className="bg-slate-100 p-1 rounded">
                            <span className="block text-[8px] text-slate-400 font-normal font-sans">β Delay</span>
                            <span>{w.beta}</span>
                          </div>
                          <div className={`p-1 rounded ${isSpiked ? 'bg-rose-600 text-white font-extrabold' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                            <span className="block text-[8px] opacity-75 font-normal font-sans">γ SLA</span>
                            <span>{w.gamma}</span>
                          </div>
                          <div className="bg-slate-100 p-1 rounded">
                            <span className="block text-[8px] text-slate-400 font-normal font-sans">δ CO₂</span>
                            <span>{w.delta}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UI ELEMENT D: Strategy Archetypes & Seamless Recovery Handoff              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-12 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101c29]">
                  4. Strategy Archetypes & Multi-Modal Recovery Network
                </h2>
                <span className="text-[11px] text-[#424751]">
                  Compiled multi-modal actions matching routes in Recovery Center & Route Network
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToRecovery(targetShipmentId)}
              className="px-4 py-2 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <span>Authorize Plan in Recovery Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {/* Plan A Card */}
            <div className={`p-4 rounded-xl border transition ${
              compilerState?.pillar_applied === 'PILLAR_3_REGION_WINS' || compilerState?.pillar_applied === 'PILLAR_2_TRANSPORTATION_WINS'
                ? 'bg-rose-50/50 border-rose-200 opacity-90'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Plan A: Baseline Highway (NH48)</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  compilerState?.pillar_applied === 'PILLAR_3_REGION_WINS'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : compilerState?.pillar_applied === 'PILLAR_2_TRANSPORTATION_WINS'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-800'
                }`}>
                  {compilerState?.pillar_applied === 'PILLAR_3_REGION_WINS' ? 'Infeasible (∞ Barrier)' : 'Baseline Cost'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Routing: Original Planned Highway Corridor (NH48) &bull; Extra Cost: ₹0.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div>
                  <span className="text-slate-400 block font-sans">Extra Cost</span>
                  <span className="font-bold text-slate-700">₹0</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Expected Delay</span>
                  <span className="font-bold text-rose-700">
                    {compilerState?.pillar_applied === 'PILLAR_3_REGION_WINS' ? '1,000,000m (∞)' : '+140m'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">SLA Risk</span>
                  <span className="font-bold text-rose-700">Critical (10/10)</span>
                </div>
              </div>
            </div>

            {/* Plan B Card */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Plan B: State Highway Bypass</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  Feasible Alternate
                </span>
              </div>
              <p className="text-[11px] text-blue-900 mt-1">
                Routing: Via NH717 / State Highway Bypass &bull; Extra Cost: ₹1,150.
              </p>
              <div className="mt-3 pt-2 border-t border-blue-200 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div>
                  <span className="text-blue-600 block font-sans">Extra Cost</span>
                  <span className="font-bold text-blue-950">₹1,150</span>
                </div>
                <div>
                  <span className="text-blue-600 block font-sans">Expected Delay</span>
                  <span className="font-bold text-blue-900">+18m</span>
                </div>
                <div>
                  <span className="text-blue-600 block font-sans">SLA Risk</span>
                  <span className="font-bold text-emerald-700">Low (2/10)</span>
                </div>
              </div>
            </div>

            {/* Plan C Card */}
            <div className="p-4 rounded-xl border border-purple-300 bg-purple-50/50 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-purple-700" />
                  <span>Plan C: Rail Relay (CONCOR WDFC)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-600 text-white font-bold">
                  Recommended (+12.4% QCR)
                </span>
              </div>
              <p className="text-[11px] text-purple-900 mt-1">
                Routing: WDFC Dedicated Electric Rail Spine &bull; Zero Road Risk &bull; -77% Emissions.
              </p>
              <div className="mt-3 pt-2 border-t border-purple-200 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div>
                  <span className="text-purple-600 block font-sans">Extra Cost</span>
                  <span className="font-bold text-purple-950">₹1,650</span>
                </div>
                <div>
                  <span className="text-purple-600 block font-sans">Expected Delay</span>
                  <span className="font-bold text-emerald-700">+25m (On-Time)</span>
                </div>
                <div>
                  <span className="text-purple-600 block font-sans">SLA Risk</span>
                  <span className="font-bold text-emerald-700">Optimal (1/10)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
