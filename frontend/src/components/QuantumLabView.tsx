import React, { useState, useEffect } from 'react';
import { runQuantumSimulation, fetchQuantumBenchmark } from '../services/api';
import { QAOASimulationResult, QuantumBitstringCandidate } from '../types';

export const QuantumLabView: React.FC = () => {
  const [subTab, setSubTab] = useState<'formulation' | 'circuit' | 'benchmarks' | 'tuning'>('formulation');
  const [circuitDepth, setCircuitDepth] = useState<number>(3);
  const [optimizer, setOptimizer] = useState<string>('COBYLA (MaxIter: 200)');
  const [mixer, setMixer] = useState<string>('Standard X-Mixer (∑ σ_i^x)');
  const [lambda1, setLambda1] = useState<number>(50.0);
  const [lambda2, setLambda2] = useState<number>(35.0);
  const [lambda3, setLambda3] = useState<number>(80.0);

  const [simResult, setSimResult] = useState<QAOASimulationResult | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [btnText, setBtnText] = useState<string>('Execute Quantum Simulation Run');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default baseline bitstrings matching Stitch design
  const defaultBitstrings: QuantumBitstringCandidate[] = [
    {
      bitstring: '|0110101101...⟩',
      label: 'GROUND STATE',
      energy: -14.602,
      probability_pct: 38.4,
      shots: 1573,
      color: '#4f1896',
      is_ground_state: true,
    },
    {
      bitstring: '|0110110010...⟩',
      label: 'Candidate 2',
      energy: -14.110,
      probability_pct: 24.1,
      shots: 987,
      color: '#00539f',
    },
    {
      bitstring: '|0111001101...⟩',
      label: 'Candidate 3',
      energy: -13.840,
      probability_pct: 17.6,
      shots: 721,
      color: '#005eb5',
    },
    {
      bitstring: '|0100101101...⟩',
      label: 'Candidate 4',
      energy: -12.915,
      probability_pct: 11.2,
      shots: 459,
      color: '#559cff',
    },
    {
      bitstring: '|0010101101...⟩',
      label: 'Capacity Violation',
      energy: -8.420,
      probability_pct: 5.2,
      shots: 213,
      color: '#ba1a1a',
      is_violation: true,
    },
  ];

  const activeBitstrings = simResult?.top_bitstrings && simResult.top_bitstrings.length === 5
    ? simResult.top_bitstrings
    : defaultBitstrings;

  const currentEnergy = simResult?.state_energy ?? -14.602;
  const currentGap = simResult?.optimality_gap_pct ?? 1.8;
  const currentLatency = simResult?.solve_latency_ms ?? 1840;
  const currentFeasibility = simResult?.feasibility_rate_pct ?? 98.4;
  const currentQuantumScore = simResult?.quantum_score ?? '86.8 / 100';
  const currentEntropy = simResult?.sampling_entropy ?? 1.48;
  const currentResidual = simResult?.residual_error_pct ?? 1.6;

  const handleRunSimulation = async () => {
    setSimulating(true);
    setErrorMsg(null);
    setNotice(null);
    setBtnText('Calculating Aer Statevector (4096 shots)...');

    const stepTimer = setTimeout(() => {
      setBtnText('Synthesizing Eigenvalues...');
    }, 700);

    try {
      const res = await runQuantumSimulation({
        circuit_depth_p: circuitDepth,
        optimizer,
        mixer,
        shots: 4096,
        noise_model: 'Ideal (Noise-Free)',
        penalty_lambda_1: lambda1,
        penalty_lambda_2: lambda2,
        penalty_lambda_3: lambda3,
      });

      setSimResult(res);
      setNotice(`QAOA Simulation Completed: Ground State Energy E = ${res.state_energy ?? -14.6} | Gap = ${res.optimality_gap_pct ?? 1.8}%`);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      console.error('QAOA Simulation execution failed:', err);
      setErrorMsg(err.message || 'Quantum simulation execution failed. Check backend connection.');
    } finally {
      clearTimeout(stepTimer);
      setSimulating(false);
      setBtnText('Execute Quantum Simulation Run');
    }
  };

  const handleResetBaseline = () => {
    setCircuitDepth(3);
    setOptimizer('COBYLA (MaxIter: 200)');
    setMixer('Standard X-Mixer (∑ σ_i^x)');
    setLambda1(50.0);
    setLambda2(35.0);
    setLambda3(80.0);
    setSimResult(null);
    setNotice('Simulation reset to Live Baseline statevector.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="flex flex-col w-full pb-12 font-sans text-[#101c29]">
      {/* Toast Notice */}
      {notice && (
        <div className="mb-3 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-3 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Experimental Research Banner (Exact Stitch Style) */}
      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#6737af] via-[#4f1896] to-[#00539f] p-4 text-white shadow-sm mb-3">
        <div className="flex items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ecdcff] text-[#280057] shadow-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                science
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-[#ecdcff] text-[#280057] px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold">
                  RESEARCH PROTOTYPE
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#d7bcff]">
                  SIMULATED VIA QISKIT AER / STATEVECTOR
                </span>
              </div>
              <p className="text-[13px] text-white font-medium mt-0.5">
                Demonstration QAOA formulation for combinatorial multi-corridor rerouting under severe network congestion.{' '}
                <span className="text-[#ecdcff] opacity-90">Not for live autonomous fleet dispatch.</span>
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-white text-[11px] tracking-wide font-mono">
              <span className="h-2 w-2 rounded-full bg-[#d6e3ff] animate-pulse"></span>
              STATEVECTOR v0.26.1
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Sub-tabs Navigation */}
      <div className="flex items-center justify-between mb-3 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setSubTab('formulation')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'formulation'
                ? 'bg-[#4f1896] text-white shadow-sm'
                : 'text-[#424751] hover:text-[#101c29] hover:bg-[#e4efff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">functions</span>
            <span>Quantum Formulation</span>
          </button>
          <button
            onClick={() => setSubTab('circuit')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'circuit'
                ? 'bg-[#4f1896] text-white shadow-sm'
                : 'text-[#424751] hover:text-[#101c29] hover:bg-[#e4efff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>QAOA Circuit Topology</span>
          </button>
          <button
            onClick={() => setSubTab('benchmarks')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'benchmarks'
                ? 'bg-[#4f1896] text-white shadow-sm'
                : 'text-[#424751] hover:text-[#101c29] hover:bg-[#e4efff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
            <span>Classical vs Quantum Benchmarks</span>
          </button>
          <button
            onClick={() => setSubTab('tuning')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'tuning'
                ? 'bg-[#4f1896] text-white shadow-sm'
                : 'text-[#424751] hover:text-[#101c29] hover:bg-[#e4efff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Hamiltonian Tuning</span>
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-2 pr-2 text-[#424751] text-[11px]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#4f1896]">memory</span>
            QPU Co-Processor Emulation
          </span>
          <span className="text-[#c2c6d3]">•</span>
          <span className="font-mono text-[#003c76] font-bold">Aer:CPU_34Q</span>
        </div>
      </div>

      {/* Key Parameter Scorecards (6 Bento Tiles) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        {/* Card 1 */}
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4f1896]"></div>
          <div className="flex items-center justify-between text-[#424751] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Simulator Backend</span>
            <span className="material-symbols-outlined text-[16px] text-[#4f1896]">developer_board</span>
          </div>
          <div>
            <div className="text-sm text-[#101c29] font-bold tracking-tight">Aer Statevector</div>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#003c76] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005eb5]"></span>
              34 Qubits Alloc.
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4f1896]"></div>
          <div className="flex items-center justify-between text-[#424751] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Problem Math</span>
            <span className="material-symbols-outlined text-[16px] text-[#4f1896]">polyline</span>
          </div>
          <div>
            <div className="text-sm text-[#101c29] font-bold tracking-tight">QUBO</div>
            <div className="text-[11px] text-[#424751]">Quadratic Unconstrained</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#003c76]"></div>
          <div className="flex items-center justify-between text-[#424751] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Graph Dimension</span>
            <span className="material-symbols-outlined text-[16px] text-[#003c76]">grain</span>
          </div>
          <div>
            <div className="text-sm text-[#101c29] font-bold tracking-tight">18N / 42E</div>
            <div className="text-[11px] text-[#424751]">84 Binary Decision Vars</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4f1896]"></div>
          <div className="flex items-center justify-between text-[#424751] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Circuit Depth (p)</span>
            <span className="material-symbols-outlined text-[16px] text-[#4f1896]">layers</span>
          </div>
          <div>
            <div className="text-sm text-[#101c29] font-bold tracking-tight">p = {circuitDepth} Layers</div>
            <div className="text-[11px] text-[#4f1896] font-medium">Parametric Ansatz</div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#003c76]"></div>
          <div className="flex items-center justify-between text-[#424751] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Classical Pre-solve</span>
            <span className="material-symbols-outlined text-[16px] text-[#003c76]">speed</span>
          </div>
          <div>
            <div className="text-sm text-[#101c29] font-bold tracking-tight">120 ms</div>
            <div className="text-[11px] text-[#424751]">OR-Tools CP-SAT (Obj: 88.4)</div>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#005eb5]"></div>
          <div className="flex items-center justify-between text-[#424751] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">State Energy ⟨ψ|H|ψ⟩</span>
            <span className="material-symbols-outlined text-[16px] text-[#005eb5]">insights</span>
          </div>
          <div>
            <div className="text-sm text-[#005eb5] font-bold tracking-tight">{currentEnergy.toFixed(3)}</div>
            <div className="text-[10px] text-[#003267] bg-[#dde9fb] rounded px-1 inline-block mt-0.5 font-bold">
              Gap: {currentGap}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Subtab Views */}
      {subTab === 'formulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column (5 cols = ~42-45%) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* QUBO Problem Formulation & Ising Hamiltonian Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-3 bg-[#eef4ff] border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4f1896] text-[20px]">calculate</span>
                  <h2 className="text-sm font-bold text-[#101c29]">QUBO &amp; Ising Hamiltonian Formulation</h2>
                </div>
                <span className="font-mono text-[#424751] bg-[#e4efff] px-2 py-0.5 rounded text-[11px] font-medium">
                  H_cost + Σ λ_i C_i
                </span>
              </div>
              <div className="p-3 flex flex-col gap-3">
                {/* Mathematical Expression Visual Banner */}
                <div className="bg-[#eef4ff]/70 rounded-lg p-3 font-mono text-[#101c29] text-[12px] overflow-x-auto border border-slate-200/60">
                  <div className="text-[#424751] text-[10px] uppercase mb-1 font-sans font-bold">
                    Objective Energy Hamiltonian:
                  </div>
                  <div className="text-[#4f1896] font-bold tracking-wide">
                    H_cost = ∑ W_ij · x_i x_j + ∑ P_i · (1 - ∑ x_ik)²
                  </div>
                  <div className="text-[11px] text-[#424751] mt-1.5 font-sans">
                    where x_i ∈ {'{0, 1}'}, mapped to Pauli-Z spin operators σ_i^z ∈ {'{+1, -1}'}
                  </div>
                </div>

                {/* Multi-Commodity Penalty Matrix */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#424751] uppercase tracking-wider font-bold">
                      Constraint Penalties Weight Matrix
                    </span>
                    <span className="text-[10px] text-[#4f1896] font-medium">Normalized Unitless</span>
                  </div>

                  {/* Collision Penalty */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9ff] border border-slate-100 hover:bg-[#eef4ff] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                      <div>
                        <div className="text-xs font-semibold text-[#101c29]">Route Collision Penalty</div>
                        <div className="text-[11px] text-[#424751]">Node co-occupancy exclusion</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#101c29]">λ₁ = {lambda1.toFixed(1)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d7e4f5] text-[#424751] font-semibold">Hard</span>
                    </div>
                  </div>

                  {/* SLA Slack Penalty */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9ff] border border-slate-100 hover:bg-[#eef4ff] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#005eb5]"></span>
                      <div>
                        <div className="text-xs font-semibold text-[#101c29]">SLA Deadline Slack Penalty</div>
                        <div className="text-[11px] text-[#424751]">Cumulative corridor delay variance</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#101c29]">λ₂ = {lambda2.toFixed(1)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d7e4f5] text-[#424751] font-semibold">Soft</span>
                    </div>
                  </div>

                  {/* Vehicle Capacity Bounds */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9ff] border border-slate-100 hover:bg-[#eef4ff] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#4f1896]"></span>
                      <div>
                        <div className="text-xs font-semibold text-[#101c29]">Vehicle Capacity Bounds</div>
                        <div className="text-[11px] text-[#424751]">Over-saturation threshold per lane</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#101c29]">λ₃ = {lambda3.toFixed(1)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d7e4f5] text-[#424751] font-semibold">Strict</span>
                    </div>
                  </div>
                </div>

                {/* Variable Mapping Summary Card */}
                <div className="p-2.5 rounded-lg bg-[#eef4ff] border border-slate-200/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[#424751] text-[10px] uppercase font-bold">
                    <span>Decision Variable Topology</span>
                    <span className="text-[#003c76]">Mumbai-Pune-Bengaluru Corridors</span>
                  </div>
                  <p className="text-xs text-[#101c29] leading-relaxed">
                    <strong className="font-semibold">84 active binary state variables</strong> allocate freight convoys across 6 primary gateway hubs (JNPT, Kalamboli, Talegaon, Shivajinagar, Hosur, Peenya). 36 ancillary highway interchanges modeled via directed flow graph.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e4efff] text-[#424751] font-mono">q_0...q_83 mapped</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e4efff] text-[#424751] font-mono">Rank 4 Tensor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Parameter Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-3 bg-[#eef4ff] border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003c76] text-[20px]">tune</span>
                  <h2 className="text-sm font-bold text-[#101c29]">QAOA Parameter &amp; Optimizer Tuning</h2>
                </div>
                <span className="text-[10px] text-[#424751] uppercase font-bold">Ansatz Setup</span>
              </div>
              <div className="p-3 flex flex-col gap-3">
                {/* Slider: Circuit Layers (p) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#101c29]" htmlFor="layerSlider">
                      Ansatz Depth / Alternating Layers (p)
                    </label>
                    <span className="text-sm text-[#4f1896] font-bold" id="sliderVal">
                      p = {circuitDepth}
                    </span>
                  </div>
                  <input
                    id="layerSlider"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={circuitDepth}
                    onChange={(e) => setCircuitDepth(Number(e.target.value))}
                    className="w-full h-2 bg-[#d7e4f5] rounded-lg appearance-none cursor-pointer accent-[#4f1896]"
                  />
                  <div className="flex justify-between text-[10px] text-[#424751]">
                    <span>p=1 (Fast/Shallow)</span>
                    <span>p=2</span>
                    <span className="text-[#4f1896] font-bold">p=3 (Recommended)</span>
                    <span>p=4</span>
                    <span>p=5 (Deep Noise Bound)</span>
                  </div>
                </div>

                {/* Grid: Optimizer + Mixer Dropdowns */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#424751] uppercase font-bold">Classical Optimizer</label>
                    <select
                      value={optimizer}
                      onChange={(e) => setOptimizer(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-[#e4efff] text-[#101c29] text-xs font-medium border border-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#003c76] cursor-pointer"
                    >
                      <option>COBYLA (MaxIter: 200)</option>
                      <option>SPSA (Noise Resilient)</option>
                      <option>NELDER-MEAD</option>
                      <option>ADAM (Gradient)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#424751] uppercase font-bold">Mixer Hamiltonian</label>
                    <select
                      value={mixer}
                      onChange={(e) => setMixer(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-[#e4efff] text-[#101c29] text-xs font-medium border border-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#003c76] cursor-pointer"
                    >
                      <option>Standard X-Mixer (∑ σ_i^x)</option>
                      <option>XY-Mixer (Parity Preserving)</option>
                      <option>Custom Subspace Constrained</option>
                    </select>
                  </div>
                </div>

                {/* Shot Count & Backend Select */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#424751] uppercase font-bold">Sampling Shots</label>
                    <div className="flex items-center justify-between px-3 h-8 bg-[#e4efff] rounded-lg font-mono text-xs text-[#101c29] border border-slate-200">
                      <span>4,096 shots</span>
                      <span className="text-[#424751] text-[11px]">2¹²</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#424751] uppercase font-bold">Noise Model</label>
                    <div className="flex items-center justify-between px-3 h-8 bg-[#e4efff] rounded-lg font-mono text-xs text-[#101c29] border border-slate-200">
                      <span>Ideal (Noise-Free)</span>
                      <span className="w-2 h-2 rounded-full bg-[#005eb5]"></span>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    id="runSimBtn"
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    className="w-full sm:flex-1 h-9 px-4 rounded-lg bg-[#4f1896] hover:bg-[#6737af] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] disabled:opacity-75"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {simulating ? 'hourglass_top' : 'play_arrow'}
                    </span>
                    <span id="runBtnText">{btnText}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBaseline}
                    disabled={simulating}
                    className="w-full sm:w-auto h-9 px-3.5 rounded-lg bg-[#e4efff] hover:bg-[#dde9fb] text-[#101c29] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>Reset Baseline</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols = ~55-58%) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Classical vs Hybrid QAOA Benchmark Matrix & Convergence */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-3 bg-[#eef4ff] border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#005eb5] text-[20px]">table_chart</span>
                  <h2 className="text-sm font-bold text-[#101c29]">
                    Comparative Benchmark Matrix: Classical vs Hybrid QAOA
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#d5e3ff] text-[#001b3c] font-bold">
                  18-Node Corridor Test
                </span>
              </div>

              {/* Benchmark Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eef4ff]/70 text-[#424751] text-[10px] uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3 font-bold">Optimization Metric</th>
                      <th className="py-2.5 px-3 font-bold text-[#003c76]">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#003c76]"></span>
                          Classical OR-Tools CP-SAT
                        </div>
                      </th>
                      <th className="py-2.5 px-3 font-bold text-[#4f1896]">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4f1896]"></span>
                          Hybrid QAOA (Simulated)
                        </div>
                      </th>
                      <th className="py-2.5 px-3 font-bold text-[#424751]">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#727782]"></span>
                          NISQ Hardware Est. (IBM Eagle 127Q)
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[#101c29] divide-y divide-slate-100">
                    {/* Row 1 */}
                    <tr className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101c29]">Solve Latency</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#003c76]">120 ms</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4f1896]">{currentLatency.toLocaleString()} ms</td>
                      <td className="py-2.5 px-3 font-mono text-[#424751]">~45 ms (Projected)</td>
                    </tr>
                    {/* Row 2 */}
                    <tr className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101c29]">Objective Score</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#101c29]">
                        88.4 / 100 <span className="text-[10px] text-[#003c76] font-sans font-normal">(Exact)</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#101c29]">{currentQuantumScore}</td>
                      <td className="py-2.5 px-3 font-mono text-[#424751]">Est. 87.2 / 100</td>
                    </tr>
                    {/* Row 3 */}
                    <tr className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101c29]">Optimality Gap</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e4efff] text-[#424751] font-mono font-bold text-[11px]">
                          0.0% (Provable)
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ecdcff] text-[#280057] font-mono font-bold text-[11px]">
                          {currentGap}% Gap
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#424751]">~1.4% Gap</td>
                    </tr>
                    {/* Row 4 */}
                    <tr className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101c29]">Feasibility Rate</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">100% Valid</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#101c29]">{currentFeasibility}% (Feasible states)</td>
                      <td className="py-2.5 px-3 font-mono text-[#424751]">~96.5%</td>
                    </tr>
                    {/* Row 5 */}
                    <tr className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101c29]">Scalability Limit</td>
                      <td className="py-2.5 px-3 text-[#424751]">N=450 nodes (combinatorial explosion)</td>
                      <td className="py-2.5 px-3 text-[#4f1896] font-medium">Poly-depth circuit scaling</td>
                      <td className="py-2.5 px-3 text-[#424751]">Scalable (&gt;1k nodes)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* State Energy Probability Histogram */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-3 bg-[#eef4ff] border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4f1896] text-[20px]">bar_chart</span>
                  <h2 className="text-sm font-bold text-[#101c29]">
                    Sampled Quantum Bitstring Probability Distribution
                  </h2>
                </div>
                <span className="font-mono text-[#424751] text-[11px] bg-[#e4efff] px-2 py-0.5 rounded">
                  4,096 Shots Sampled
                </span>
              </div>
              <div className="p-3 flex flex-col gap-3">
                <p className="text-xs text-[#424751]">
                  Top 5 measured ground-state candidate bitstrings corresponding to minimum Hamiltonian energy eigenvalues. Ground state{' '}
                  <code className="font-mono text-[#4f1896] font-bold">|011010...⟩</code> achieves global minimum cost function.
                </p>

                {/* Top 5 Bitstrings Distribution Chart */}
                <div className="flex flex-col gap-2.5">
                  {activeBitstrings.map((candidate, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              candidate.is_ground_state ? 'text-[#4f1896]' : 'text-[#101c29]'
                            }`}
                          >
                            {candidate.bitstring}
                          </span>
                          {candidate.is_ground_state && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ecdcff] text-[#280057] font-bold">
                              GROUND STATE
                            </span>
                          )}
                          {candidate.is_violation && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffdad6] text-[#93000a] font-bold">
                              Capacity Violation
                            </span>
                          )}
                          {!candidate.is_ground_state && !candidate.is_violation && (
                            <span className="text-[9px] text-[#424751] font-medium">{candidate.label}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-[#424751] text-[11px]">E: {candidate.energy.toFixed(3)}</span>
                          <span className="font-bold text-[#101c29]">
                            P = {candidate.probability_pct.toFixed(1)}% ({candidate.shots.toLocaleString()})
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#dde9fb] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(100, Math.max(4, candidate.probability_pct))}%`,
                            backgroundColor: candidate.color || '#4f1896',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Convergence Insight Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-[#424751]">
                    <span className="material-symbols-outlined text-[16px] text-[#4f1896]">check_circle</span>
                    <span>
                      Sampling Entropy: <strong className="text-[#101c29] font-mono">S = {currentEntropy} nats</strong>{' '}
                      (High Confidence Concentration)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#003c76] font-bold">Residual Error: {currentResidual}%</span>
                </div>
              </div>
            </div>

            {/* Technical Boundary & Research Notes Callout */}
            <div className="bg-[#eef4ff] rounded-xl p-3 shadow-sm border border-slate-200/80 flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#4f1896] text-white">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs font-bold text-[#101c29]">
                  Technical Boundary &amp; Theoretical Supremacy Horizon
                </div>
                <p className="text-xs text-[#424751] leading-relaxed">
                  <strong>Boundary Notice:</strong> Current quantum simulation utilizes classical CPU statevector mathematics. NISQ quantum supremacy in supply chain routing requires physical fault-tolerant gate depths (&gt;100 qubits) for large-scale multi-depot routing problems. Real hardware deployment scheduled under Phase IV Pilot with AWS Braket / IBM Quantum Systems.
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#424751]">
                  <span>Author: Dr. A. Varma (Quantum Algorithms Lab)</span>
                  <span>•</span>
                  <span>Ref: QAOA-LOGIS-2024-C3</span>
                  <span>•</span>
                  <a
                    href="#manifest"
                    onClick={(e) => {
                      e.preventDefault();
                      setNotice('QASM 3.0 manifest copied to clipboard (Simulated).');
                      setTimeout(() => setNotice(null), 3000);
                    }}
                    className="text-[#4f1896] hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <span>View QASM 3.0 Manifest</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: QAOA Circuit Topology */}
      {subTab === 'circuit' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#101c29]">QAOA Parameterized Quantum Circuit Topology</h2>
              <p className="text-xs text-[#424751] mt-0.5">
                p = {circuitDepth} Layer Alternating Problem Unitary U(C, γ) and Mixer Unitary U(M, β) over 4 allocated qubits.
              </p>
            </div>
            <span className="font-mono text-xs bg-[#e4efff] text-[#003c76] px-2.5 py-1 rounded font-bold">
              Qiskit QuantumCircuit(4)
            </span>
          </div>

          {/* Interactive Gate Diagram */}
          <div className="overflow-x-auto p-4 bg-[#f8f9ff] rounded-lg border border-slate-200 font-mono text-xs">
            <div className="space-y-4 min-w-[650px]">
              {[0, 1, 2, 3].map((qubit) => (
                <div key={qubit} className="flex items-center gap-2">
                  <span className="w-12 text-[#101c29] font-bold">q_{qubit}:</span>
                  <div className="flex-1 flex items-center gap-1.5 border-b border-slate-300 relative py-1">
                    {/* Hadamard Initial */}
                    <div className="h-7 px-2.5 rounded bg-[#ecdcff] border border-[#d7bcff] text-[#280057] font-bold flex items-center justify-center text-[11px] shadow-sm">
                      H
                    </div>

                    {/* Alternating Layers */}
                    {Array.from({ length: circuitDepth }).map((_, layerIdx) => (
                      <React.Fragment key={layerIdx}>
                        {/* Cost Unitary */}
                        <div className="h-7 px-2 rounded bg-[#dde9fb] border border-[#c2c6d3] text-[#003c76] font-bold flex items-center justify-center text-[10px] shadow-sm">
                          Rz(2γ_{layerIdx+1})
                        </div>
                        {qubit < 3 && (
                          <div className="h-7 px-1.5 rounded bg-[#e4efff] border border-slate-300 text-[#005eb5] font-bold flex items-center justify-center text-[10px]">
                            CX
                          </div>
                        )}
                        {/* Mixer Unitary */}
                        <div className="h-7 px-2 rounded bg-[#d6e3ff] border border-[#a8c8ff] text-[#001b3c] font-bold flex items-center justify-center text-[10px] shadow-sm">
                          Rx(2β_{layerIdx+1})
                        </div>
                        {layerIdx < circuitDepth - 1 && (
                          <div className="w-2 border-t-2 border-dotted border-slate-400"></div>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Measurement Barrier */}
                    <div className="ml-auto h-7 px-2 rounded bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                      M
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#eef4ff] border border-slate-200">
              <span className="text-[10px] text-[#424751] uppercase font-bold">Gate Count</span>
              <div className="text-base font-bold text-[#101c29] mt-0.5">{4 + circuitDepth * 14} Gates</div>
              <div className="text-[#424751] text-[11px]">Hadamard + Rz + CNOT + Rx</div>
            </div>
            <div className="p-3 rounded-lg bg-[#eef4ff] border border-slate-200">
              <span className="text-[10px] text-[#424751] uppercase font-bold">Circuit Depth</span>
              <div className="text-base font-bold text-[#4f1896] mt-0.5">{1 + circuitDepth * 4} Gate Layers</div>
              <div className="text-[#424751] text-[11px]">Executable within NISQ T₂ time</div>
            </div>
            <div className="p-3 rounded-lg bg-[#eef4ff] border border-slate-200">
              <span className="text-[10px] text-[#424751] uppercase font-bold">Statevector Complexity</span>
              <div className="text-base font-bold text-[#005eb5] mt-0.5">2⁴ = 16 Amplitudes</div>
              <div className="text-[#424751] text-[11px]">Dense Matrix Multiplication</div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Classical vs Quantum Benchmarks */}
      {subTab === 'benchmarks' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#101c29]">Empirical Scaling Benchmarks: CP-SAT vs QAOA</h2>
              <p className="text-xs text-[#424751] mt-0.5">
                Comparative time and solution quality across increasing graph sizes N ∈ [4, 18, 45, 120, 450].
              </p>
            </div>
            <span className="font-mono text-xs bg-[#e4efff] text-[#003c76] px-2.5 py-1 rounded font-bold">
              Benchmark Suite v2.4
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#eef4ff] text-[#424751] uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">Graph Nodes (N)</th>
                  <th className="py-2.5 px-3 font-bold">Binary Variables</th>
                  <th className="py-2.5 px-3 font-bold text-[#003c76]">OR-Tools CP-SAT Runtime</th>
                  <th className="py-2.5 px-3 font-bold text-[#4f1896]">QAOA Statevector Runtime</th>
                  <th className="py-2.5 px-3 font-bold">Optimality Gap</th>
                  <th className="py-2.5 px-3 font-bold">Hardware Feasibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-[#f8f9ff]">
                  <td className="py-2.5 px-3 font-bold font-sans">N = 4 (Residual)</td>
                  <td className="py-2.5 px-3 text-[#424751]">4 Qubits</td>
                  <td className="py-2.5 px-3 font-bold text-[#003c76]">8 ms</td>
                  <td className="py-2.5 px-3 font-bold text-[#4f1896]">12 ms</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-bold">0.0%</td>
                  <td className="py-2.5 px-3 font-sans text-emerald-700">Immediate</td>
                </tr>
                <tr className="hover:bg-[#f8f9ff]">
                  <td className="py-2.5 px-3 font-bold font-sans">N = 18 (Corridor Test)</td>
                  <td className="py-2.5 px-3 text-[#424751]">84 Variables</td>
                  <td className="py-2.5 px-3 font-bold text-[#003c76]">120 ms</td>
                  <td className="py-2.5 px-3 font-bold text-[#4f1896]">{currentLatency} ms</td>
                  <td className="py-2.5 px-3 text-[#4f1896] font-bold">{currentGap}%</td>
                  <td className="py-2.5 px-3 font-sans text-[#003c76]">Simulated (Aer)</td>
                </tr>
                <tr className="hover:bg-[#f8f9ff]">
                  <td className="py-2.5 px-3 font-bold font-sans">N = 45 (Regional Gateway)</td>
                  <td className="py-2.5 px-3 text-[#424751]">210 Variables</td>
                  <td className="py-2.5 px-3 font-bold text-[#003c76]">840 ms</td>
                  <td className="py-2.5 px-3 font-bold text-[#4f1896]">6,420 ms</td>
                  <td className="py-2.5 px-3 text-[#4f1896] font-bold">2.4%</td>
                  <td className="py-2.5 px-3 font-sans text-[#003c76]">Simulated (Aer)</td>
                </tr>
                <tr className="hover:bg-[#f8f9ff]">
                  <td className="py-2.5 px-3 font-bold font-sans">N = 120 (Multi-Depot)</td>
                  <td className="py-2.5 px-3 text-[#424751]">560 Variables</td>
                  <td className="py-2.5 px-3 font-bold text-[#003c76]">14,200 ms</td>
                  <td className="py-2.5 px-3 font-bold text-[#4f1896]">~1,200 ms (Projected)</td>
                  <td className="py-2.5 px-3 text-[#4f1896] font-bold">1.2%</td>
                  <td className="py-2.5 px-3 font-sans text-[#727782]">Requires QPU (127Q)</td>
                </tr>
                <tr className="hover:bg-[#f8f9ff]">
                  <td className="py-2.5 px-3 font-bold font-sans">N = 450 (National Network)</td>
                  <td className="py-2.5 px-3 text-[#424751]">2,100 Variables</td>
                  <td className="py-2.5 px-3 font-bold text-red-600">&gt; 120,000 ms (Timeout)</td>
                  <td className="py-2.5 px-3 font-bold text-[#4f1896]">~420 ms (Projected)</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-bold">~0.8%</td>
                  <td className="py-2.5 px-3 font-sans text-purple-700 font-bold">Supremacy Horizon</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Hamiltonian Tuning */}
      {subTab === 'tuning' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#101c29]">Ising Hamiltonian Penalty Matrix Tuner</h2>
              <p className="text-xs text-[#424751] mt-0.5">
                Calibrate constraint multipliers λ₁, λ₂, λ₃ to govern Lagrangian relaxation during quantum state preparation.
              </p>
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="px-3.5 py-1.5 rounded-lg bg-[#4f1896] hover:bg-[#6737af] text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>Re-simulate Hamiltonian</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#101c29]">Route Collision Penalty (λ₁)</span>
                <span className="font-mono text-sm font-bold text-[#ba1a1a]">{lambda1.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={lambda1}
                onChange={(e) => setLambda1(Number(e.target.value))}
                className="w-full accent-[#ba1a1a]"
              />
              <span className="text-[11px] text-[#424751]">Enforces node exclusion between simultaneous convoys.</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#101c29]">SLA Slack Penalty (λ₂)</span>
                <span className="font-mono text-sm font-bold text-[#005eb5]">{lambda2.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={lambda2}
                onChange={(e) => setLambda2(Number(e.target.value))}
                className="w-full accent-[#005eb5]"
              />
              <span className="text-[11px] text-[#424751]">Penalizes variance against customer delivery timeframes.</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-slate-200 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#101c29]">Vehicle Capacity Bounds (λ₃)</span>
                <span className="font-mono text-sm font-bold text-[#4f1896]">{lambda3.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={lambda3}
                onChange={(e) => setLambda3(Number(e.target.value))}
                className="w-full accent-[#4f1896]"
              />
              <span className="text-[11px] text-[#424751]">Prevents highway lane over-saturation and dwell build-up.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
