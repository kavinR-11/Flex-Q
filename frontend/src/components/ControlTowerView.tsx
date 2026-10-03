import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  Flame, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Shipment, DisruptionEvent } from '../types';
import { NetworkMapLibre } from './NetworkMapLibre';

interface ControlTowerViewProps {
  shipments: Shipment[];
  events: DisruptionEvent[];
  onSelectShipment: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ControlTowerView: React.FC<ControlTowerViewProps> = ({
  shipments,
  events,
  onSelectShipment,
  onNavigateTab,
}) => {
  const total = shipments.length;
  const critical = shipments.filter((s) => s.risk_score >= 8).length;
  const highRisk = shipments.filter((s) => s.risk_score >= 7).length;
  const predictedBreaches = shipments.filter((s) => s.sla_breach_probability >= 0.50).length;
  const onTimeRate = total > 0 ? Math.round(((total - predictedBreaches) / total) * 100) : 92;

  // Chart data: Risk Distribution
  const riskGroups = [
    { name: 'Low (1-3)', count: shipments.filter((s) => s.risk_score <= 3).length, color: '#10b981' },
    { name: 'Moderate (4-6)', count: shipments.filter((s) => s.risk_score >= 4 && s.risk_score <= 6).length, color: '#f59e0b' },
    { name: 'High (7-8)', count: shipments.filter((s) => s.risk_score >= 7 && s.risk_score <= 8).length, color: '#f97316' },
    { name: 'Critical (9-10)', count: shipments.filter((s) => s.risk_score >= 9).length, color: '#ef4444' },
  ];

  // Mode Distribution
  const modeData = [
    { name: 'Road Highway', value: shipments.filter((s) => s.transport_mode === 'ROAD').length, color: '#38bdf8' },
    { name: 'Priority Air', value: shipments.filter((s) => s.transport_mode === 'AIR').length, color: '#a855f7' },
    { name: 'Maritime Dwell', value: shipments.filter((s) => s.transport_mode === 'MARITIME').length, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Closed Loop Status */}
      <div className="glass-panel rounded-2xl p-5 border-l-4 border-cyan-500 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                CLOSED-LOOP ACTIVE
              </span>
              <span className="text-xs text-slate-400">
                Sense → Predict → Explain → Optimize → Recommend → Replan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Logistics Network Operations Control Tower
            </h1>
            <p className="text-sm text-slate-400">
              Corridor telemetry across Chennai, Bengaluru, Mumbai, and Hyderabad trade corridors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('disruption')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Simulate Disruption
            </button>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition"
            >
              <RotateCcwIcon className="w-4 h-4" />
              Recovery Center
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Active Fleet</span>
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{total}</span>
            <span className="text-xs text-slate-400 font-mono">consignments</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> 100% route verified
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all border-amber-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>High Risk Shipments</span>
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{highRisk}</span>
            <span className="text-xs text-slate-400 font-mono">score ≥ 7/10</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1 font-mono">
            <Flame className="w-3.5 h-3.5" /> {critical} critical (score ≥ 8)
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all border-rose-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Predicted SLA Breaches</span>
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">{predictedBreaches}</span>
            <span className="text-xs text-slate-400 font-mono">at risk</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1 font-mono">
            Intervention recommended
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all border-emerald-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Network Reliability</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{onTimeRate}%</span>
            <span className="text-xs text-slate-400 font-mono">SLA on-track</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Calibrated LightGBM model
          </div>
        </div>
      </div>

      {/* Analytics Grid: Charts & Live Disruption Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Fleet Risk Score Distribution (1 - 10)
              </h2>
              <p className="text-xs text-slate-400">
                Formula: R = max(1, min(10, ceil(10 · p_sla)))
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('shipments')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskGroups} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskGroups.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal Mix & Active Events Feed */}
        <div className="space-y-6">
          {/* Active Disruptions Snippet */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Disruption Signals
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {events.length} Active
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.event_id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {evt.location_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-rose-950/80 border border-rose-800 text-rose-400">
                      Sev {evt.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="text-slate-400">{evt.event_type.replace('_', ' ')}</span>
                    <span className="text-amber-400 font-mono">+{evt.estimated_delay_minutes}m delay</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('disruption')}
              className="w-full mt-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Open Disruption Lab
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Geospatial Corridor Map (MapLibre GL Vector Engine) */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[20px]">public</span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Multi-Modal Corridor Telematics & Chokepoints (MapLibre GL)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">OpenFreeMap Liberty Vector Engine</span>
        </div>
        <NetworkMapLibre
          shipments={shipments}
          events={events}
          height="380px"
          onSelectShipment={onSelectShipment}
        />
      </div>

      {/* High-Risk Shipments Priority Table */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Priority Consignments Requiring Operational Review
            </h2>
            <p className="text-xs text-slate-400">
              Shipments with SLA breach risk score ≥ 7 flagged for classical recovery optimization.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('recovery')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
          >
            Open Recovery Center <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-2.5 px-3">Shipment ID</th>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Carrier</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">SLA Buffer</th>
                <th className="py-2.5 px-3">Breach Prob</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {shipments
                .filter((s) => s.risk_score >= 7)
                .slice(0, 5)
                .map((sh) => (
                  <tr key={sh.shipment_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold font-mono text-cyan-400">
                      {sh.shipment_id}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {sh.origin} → {sh.destination}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{sh.carrier_id}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {sh.transport_mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={sh.sla_buffer_minutes < 0 ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        {sh.sla_buffer_minutes}m
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200 font-semibold">
                      {Math.round(sh.sla_breach_probability * 100)}%
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                        sh.risk_score >= 9 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {sh.risk_score}/10 {sh.risk_category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectShipment(sh.shipment_id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
