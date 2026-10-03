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

  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Banner with Closed Loop Status (Pure White Theme) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-[#003c76]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#e4efff] text-[#003c76] border border-[#a9c9ff] font-bold">
                CLOSED-LOOP ACTIVE
              </span>
              <span className="text-xs text-[#424751]">
                Sense → Predict → Explain → Optimize → Recommend → Replan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c29] mt-1">
              Logistics Network Operations Control Tower
            </h1>
            <p className="text-xs text-[#424751] mt-0.5">
              Corridor telemetry across Chennai, Bengaluru, Mumbai, and Hyderabad trade corridors.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('disruption')}
              className="px-3.5 py-2 rounded-lg bg-[#f8f9ff] hover:bg-[#eef4ff] text-[#101c29] text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-sm transition"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Simulate Disruption
            </button>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="px-4 py-2 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <RotateCcwIcon className="w-4 h-4" />
              Recovery Center
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Pure White Theme Bento Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold">
            <span>Total Active Fleet</span>
            <div className="p-2 rounded-lg bg-[#eef4ff] border border-slate-200 text-[#003c76]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#101c29]">{total}</span>
            <span className="text-xs text-[#424751] font-mono">consignments</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> 100% route verified
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold">
            <span>High Risk Shipments</span>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{highRisk}</span>
            <span className="text-xs text-[#424751] font-mono">score ≥ 7/10</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
            <Flame className="w-3.5 h-3.5" /> {critical} critical (score ≥ 8)
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold">
            <span>Predicted SLA Breaches</span>
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600">{predictedBreaches}</span>
            <span className="text-xs text-[#424751] font-mono">at risk</span>
          </div>
          <div className="mt-2 text-[11px] text-red-700 flex items-center gap-1 font-semibold">
            Intervention recommended
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold">
            <span>Network Reliability</span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{onTimeRate}%</span>
            <span className="text-xs text-[#424751] font-mono">SLA on-track</span>
          </div>
          <div className="mt-2 text-[11px] text-[#424751] font-mono">
            Calibrated LightGBM model
          </div>
        </div>
      </div>

      {/* Analytics Grid: Charts & Live Disruption Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
                Fleet Risk Score Distribution (1 - 10)
              </h2>
              <p className="text-[11px] text-[#424751]">
                Formula: R = max(1, min(10, ceil(10 · p_sla)))
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('shipments')}
              className="text-xs text-[#003c76] hover:text-[#005eb5] font-semibold flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskGroups} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#727782" fontSize={11} tickLine={false} />
                <YAxis stroke="#727782" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#101c29',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)'
                  }}
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
        <div className="space-y-4">
          {/* Active Disruptions Snippet */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
                  Live Disruption Signals
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#eef4ff] text-[#003c76] font-bold">
                {events.length} Active
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.event_id}
                  className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#101c29] line-clamp-1">
                      {evt.location_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-red-100 text-red-800 border border-red-200">
                      Sev {evt.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#424751]">
                    <span>{evt.event_type.replace('_', ' ')}</span>
                    <span className="text-amber-700 font-mono font-bold">+{evt.estimated_delay_minutes}m delay</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('disruption')}
              className="w-full mt-3 py-2 rounded-lg bg-[#eef4ff] hover:bg-[#dde9fb] text-[#003c76] text-xs font-bold transition border border-slate-200"
            >
              Open Disruption Lab
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Geospatial Corridor Map (MapLibre GL Vector Engine) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#003c76] text-[20px]">public</span>
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Live Multi-Modal Corridor Telematics &amp; Chokepoints (MapLibre GL)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#003c76] font-semibold">OpenFreeMap Liberty Vector Engine</span>
        </div>
        <NetworkMapLibre
          shipments={shipments}
          events={events}
          height="380px"
          onSelectShipment={onSelectShipment}
        />
      </div>

      {/* High-Risk Shipments Priority Table */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Priority Consignments Requiring Operational Review
            </h2>
            <p className="text-[11px] text-[#424751]">
              Shipments with SLA breach risk score ≥ 7 flagged for classical recovery optimization.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('recovery')}
            className="text-xs text-[#003c76] hover:text-[#005eb5] font-semibold flex items-center gap-1 transition"
          >
            Open Recovery Center <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef4ff] border-b border-slate-200 text-[#424751] font-mono uppercase text-[10px] font-bold">
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
            <tbody className="divide-y divide-slate-100">
              {shipments
                .filter((s) => s.risk_score >= 7)
                .slice(0, 5)
                .map((sh) => (
                  <tr key={sh.shipment_id} className="hover:bg-[#f8f9ff] transition">
                    <td className="py-2.5 px-3 font-bold font-mono text-[#003c76]">
                      {sh.shipment_id}
                    </td>
                    <td className="py-2.5 px-3 text-[#101c29] font-medium">
                      {sh.origin} → {sh.destination}
                    </td>
                    <td className="py-2.5 px-3 text-[#424751]">{sh.carrier_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#e4efff] text-[#003c76] font-semibold">
                        {sh.transport_mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={sh.sla_buffer_minutes < 0 ? 'text-red-600 font-bold' : 'text-amber-700'}>
                        {sh.sla_buffer_minutes}m
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#101c29] font-semibold">
                      {Math.round(sh.sla_breach_probability * 100)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        sh.risk_score >= 9 ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {sh.risk_score}/10 {sh.risk_category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectShipment(sh.shipment_id)}
                        className="px-2.5 py-1 rounded bg-[#eef4ff] hover:bg-[#dde9fb] text-[#003c76] border border-slate-200 text-xs font-semibold transition"
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
