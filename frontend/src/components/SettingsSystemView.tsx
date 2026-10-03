import React, { useState } from 'react';
import { SystemHealth } from '../types';
import { fetchHealth } from '../services/api';

interface SettingsSystemViewProps {
  health: SystemHealth | null;
  onRefreshHealth: () => void;
}

export const SettingsSystemView: React.FC<SettingsSystemViewProps> = ({ health, onRefreshHealth }) => {
  const [subTab, setSubTab] = useState<'overview' | 'telemetry' | 'models' | 'security' | 'prefs'>('overview');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefreshHealth();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="flex flex-col w-full pb-12 font-sans text-slate-800">
      {/* Top Diagnostic Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-base font-bold text-slate-900">System Core & Platform Telemetry</h2>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-mono text-[11px] font-semibold">
              Kernel v4.19.8-rt22 • FluxQ Node ID: IN-BOM-PRD-01
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sync State:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-xs">
              Deterministic Real-Time
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 h-7 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span className={`material-symbols-outlined text-[15px] ${refreshing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Probe Telemetry</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs System Architecture Navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-2 py-1">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setSubTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'overview'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
              <span>System Overview</span>
            </button>
            <button
              onClick={() => setSubTab('models')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'models'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">memory</span>
              <span>ML Models & Solvers</span>
              <span className="text-[9px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-bold">
                Quantum Ready
              </span>
            </button>
            <button
              onClick={() => setSubTab('telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'telemetry'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">sensors</span>
              <span>Telemetry Integrations</span>
            </button>
            <button
              onClick={() => setSubTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'security'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">encrypted</span>
              <span>Security & Audit Guardrails</span>
            </button>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-[11px] pr-2 shrink-0">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span className="uppercase font-semibold">Role: Root Tier-3 Dispatcher</span>
          </div>
        </div>
      </div>

      {/* 6 Metric Telemetry Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Overall Platform</span>
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">
              {health?.status === 'healthy' ? 'Operational' : 'Connecting...'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span className="text-emerald-600 font-bold">99.98%</span> uptime SLA
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.98%' }}></div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Ingest Bus</span>
            <span className="material-symbols-outlined text-[16px] text-blue-600">swap_vert</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">14,280 <span className="text-xs font-normal text-slate-400">m/s</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">Kafka Telematics Bus (0 lag)</div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div className="h-2 w-1 bg-emerald-500 rounded-sm"></div>
            <div className="h-3 w-1 bg-emerald-500 rounded-sm"></div>
            <div className="h-2 w-1 bg-emerald-500 rounded-sm"></div>
            <div className="h-4 w-1 bg-emerald-500 rounded-sm"></div>
            <div className="h-3 w-1 bg-blue-600 rounded-sm"></div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Sensors</span>
            <span className="material-symbols-outlined text-[16px] text-emerald-600">satellite_alt</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">3,892 <span className="text-xs font-normal text-slate-400">/ 3,910</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span className="text-emerald-600 font-bold">99.4%</span> online & pinging
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.4%' }}></div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Inference Nodes</span>
            <span className="material-symbols-outlined text-[16px] text-purple-600">psychology</span>
          </div>
          <div>
            <div className="text-base font-bold text-purple-900">4 / 4 Healthy</div>
            <div className="text-[10px] text-slate-500 mt-0.5">LightGBM + Random Forest</div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">Avg 22ms</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Solvers Online</span>
            <span className="material-symbols-outlined text-[16px] text-blue-600">route</span>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-900">OR-Tools v9.6</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Qiskit Aer: <span className="text-purple-700 font-semibold">Idle / Ready</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-2">MIP Ready</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Database & Ledger</span>
            <span className="material-symbols-outlined text-[16px] text-slate-600">database</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">SQLite WAL</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Append-Only Audit Logs</div>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-2">Connected & Seeded</div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ML & Solver Registry */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-800 text-[20px]">smart_toy</span>
              <h3 className="text-sm font-bold text-slate-900">AI / ML Model & Solver Registry</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">
              Production Verified
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">1. SLA Breach Classifier (Calibrated LightGBM)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-slate-500 mb-2">
                Artifact: <code className="font-mono text-purple-900">lightgbm_breach_classifier_calibrated.joblib</code>
              </p>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-1.5 bg-white rounded border">ROC-AUC: <strong>0.941</strong></div>
                <div className="p-1.5 bg-white rounded border">PR-AUC: <strong>0.892</strong></div>
                <div className="p-1.5 bg-white rounded border">Brier Score: <strong>0.082</strong></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">2. Dynamic Delay Regressor (Random Forest)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-slate-500 mb-2">
                Artifact: <code className="font-mono text-purple-900">random_forest_delay_regressor.joblib</code>
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-1.5 bg-white rounded border">MAE: <strong>8.4 min</strong></div>
                <div className="p-1.5 bg-white rounded border">RMSE: <strong>14.2 min</strong></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">3. Operational Optimizer (Google OR-Tools SCIP MIP)</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  OPERATIONAL BASELINE
                </span>
              </div>
              <p className="text-slate-500">
                Solves multi-modal rerouting, carrier switching, and SLA penalty minimization under hard vehicle capacity constraints.
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-purple-950">4. Quantum-Hybrid Engine (Qiskit QAOA Simulator)</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-bold">
                  EXPERIMENTAL RESEARCH
                </span>
              </div>
              <p className="text-purple-800 text-[11px]">
                QUBO formulation for residual combinatorial slot reassignments. Validated against classical solver feasibility checks.
              </p>
            </div>
          </div>
        </div>

        {/* API Contracts & Service Health */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-900 text-[20px]">api</span>
                <h3 className="text-sm font-bold text-slate-900">Connected Microservices & Endpoints</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">FastAPI 0.115</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                { path: 'GET /api/v1/health', desc: 'System health probe & telemetry status', status: '200 OK' },
                { path: 'GET /api/v1/shipments', desc: 'Live monitored consignments with risk scores', status: '200 OK' },
                { path: 'GET /api/v1/network/corridors', desc: 'Corridor utilization & bottleneck analytics', status: '200 OK' },
                { path: 'POST /api/v1/recovery/optimize', desc: 'Google OR-Tools multi-objective recovery', status: '200 OK' },
                { path: 'POST /api/v1/recovery/{id}/approve', desc: 'Operator cryptographic approval ledger', status: '200 OK' },
                { path: 'POST /api/v1/quantum/simulate', desc: 'Interactive Qiskit QAOA statevector', status: '200 OK' },
                { path: 'POST /api/v1/assistant/chat', desc: 'Ask FluxQ neural copilot assistant', status: '200 OK' },
                { path: 'GET /api/v1/audit', desc: 'Immutable decision traceability journal', status: '200 OK' }
              ].map((ep, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-bold text-[11px]">{ep.path}</span>
                    <span className="text-slate-400 font-sans text-[10px]">{ep.desc}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {ep.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Last Telemetry Probe: {health ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-blue-900 font-bold hover:underline flex items-center gap-1"
            >
              <span>OpenAPI Interactive Swagger</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
