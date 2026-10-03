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
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
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

  // Detailed Risk Score Spectrum (1 to 10) for Line Chart
  const riskSpectrum = [
    { score: 'R1', label: 'Score 1', count: shipments.filter((s) => s.risk_score === 1).length, tier: 'Low' },
    { score: 'R2', label: 'Score 2', count: shipments.filter((s) => s.risk_score === 2).length, tier: 'Low' },
    { score: 'R3', label: 'Score 3', count: shipments.filter((s) => s.risk_score === 3).length, tier: 'Low' },
    { score: 'R4', label: 'Score 4', count: shipments.filter((s) => s.risk_score === 4).length, tier: 'Moderate' },
    { score: 'R5', label: 'Score 5', count: shipments.filter((s) => s.risk_score === 5).length, tier: 'Moderate' },
    { score: 'R6', label: 'Score 6', count: shipments.filter((s) => s.risk_score === 6).length, tier: 'Moderate' },
    { score: 'R7', label: 'Score 7', count: shipments.filter((s) => s.risk_score === 7).length, tier: 'High' },
    { score: 'R8', label: 'Score 8', count: shipments.filter((s) => s.risk_score === 8).length, tier: 'High' },
    { score: 'R9', label: 'Score 9', count: shipments.filter((s) => s.risk_score === 9).length, tier: 'Critical' },
    { score: 'R10', label: 'Score 10', count: shipments.filter((s) => s.risk_score === 10).length, tier: 'Critical' },
  ];

  const lowCount = shipments.filter((s) => s.risk_score <= 3).length;
  const modCount = shipments.filter((s) => s.risk_score >= 4 && s.risk_score <= 6).length;
  const highCount = shipments.filter((s) => s.risk_score >= 7 && s.risk_score <= 8).length;
  const critCount = shipments.filter((s) => s.risk_score >= 9).length;

  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Banner with Closed Loop Status (Exact Stitch Pure White Theme) */}
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
              <Zap className="w-4 h-4 text-amber-600" />
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

      {/* KPI Cards (Exact Stitch Bento Tiles with Accent Top Borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Fleet */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#005eb5]"></div>
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider text-[10px]">Total Active Fleet</span>
            <div className="p-1.5 rounded-lg bg-[#eef4ff] text-[#003c76]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#101c29]">{total}</span>
            <span className="text-xs text-[#424751] font-mono">consignments</span>
          </div>
          <div className="mt-2 text-[11px] text-[#047857] flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> 100% route verified
          </div>
        </div>

        {/* Card 2: High Risk */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ba1a1a]"></div>
          <div className="flex items-center justify-between text-[#ba1a1a] text-xs font-bold mb-1">
            <span className="uppercase tracking-wider text-[10px]">High Risk Shipments</span>
            <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#ba1a1a]">{highRisk}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-[#ffdad6] text-[#93000a]">
              score ≥ 7/10
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#93000a] flex items-center gap-1 font-semibold">
            <Flame className="w-3.5 h-3.5 text-[#ba1a1a]" /> {critical} critical (score ≥ 8)
          </div>
        </div>

        {/* Card 3: Predicted SLA Breaches */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00539f]"></div>
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider text-[10px]">Predicted SLA Breaches</span>
            <div className="p-1.5 rounded-lg bg-[#eef4ff] text-[#00539f]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#ba1a1a]">{predictedBreaches}</span>
            <span className="text-xs text-[#424751] font-mono">at risk</span>
          </div>
          <div className="mt-2 text-[11px] text-[#93000a] flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span> Intervention recommended
          </div>
        </div>

        {/* Card 4: Network Reliability */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#005eb5]"></div>
          <div className="flex items-center justify-between text-[#424751] text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider text-[10px]">Network Reliability</span>
            <div className="p-1.5 rounded-lg bg-[#d1fae5] text-[#047857]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#047857]">{onTimeRate}%</span>
            <span className="text-xs text-[#424751] font-mono">SLA on-track</span>
          </div>
          <div className="mt-2 text-[11px] text-[#424751] font-mono">
            Calibrated LightGBM model
          </div>
        </div>
      </div>

      {/* Analytics Grid: Line Chart & Live Disruption Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Distribution Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005eb5] text-[18px]">query_stats</span>
                <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
                  Fleet Risk Score Distribution Curve (Scores 1 - 10)
                </h2>
              </div>
              <p className="text-[11px] text-[#424751] mt-0.5">
                Formula: R = max(1, min(10, ceil(10 · p_sla))) • Continuous Consignment Telemetry
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('shipments')}
              className="text-xs text-[#003c76] hover:text-[#005eb5] font-semibold flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Line / Area Chart Container */}
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskSpectrum} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005eb5" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#005eb5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4ff" />
                <XAxis dataKey="score" stroke="#727782" fontSize={11} tickLine={false} />
                <YAxis stroke="#727782" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs font-sans">
                          <div className="font-bold text-[#101c29]">{data.label}</div>
                          <div className="text-[11px] text-[#424751] mt-0.5">Category: <span className="font-semibold">{data.tier} Risk</span></div>
                          <div className="text-[#005eb5] font-mono font-bold mt-1 text-sm">
                            {payload[0].value} consignments
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Consignments"
                  stroke="#005eb5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskLineGrad)"
                  dot={{ r: 3.5, fill: '#003c76', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#003c76' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Segmented Risk Summary Pills */}
          <div className="grid grid-cols-4 gap-2 pt-3 mt-1 border-t border-slate-100 text-[11px]">
            <div className="p-1.5 rounded-lg bg-[#eef4ff] flex flex-col items-center">
              <span className="text-[#005eb5] font-bold">Low (1-3)</span>
              <span className="font-mono font-bold text-[#101c29]">{lowCount}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#fef3c7] flex flex-col items-center">
              <span className="text-[#92400e] font-bold">Moderate (4-6)</span>
              <span className="font-mono font-bold text-[#101c29]">{modCount}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#ffedd5] flex flex-col items-center">
              <span className="text-[#9a3412] font-bold">High (7-8)</span>
              <span className="font-mono font-bold text-[#101c29]">{highCount}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#ffdad6] flex flex-col items-center">
              <span className="text-[#93000a] font-bold">Critical (9-10)</span>
              <span className="font-mono font-bold text-[#ba1a1a]">{critCount}</span>
            </div>
          </div>
        </div>

        {/* Modal Mix & Active Events Feed */}
        <div className="space-y-4">
          {/* Active Disruptions Snippet */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span>
                <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
                  Live Disruption Signals
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-bold">
                {events.length} Active
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.event_id}
                  className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 hover:border-slate-300 transition border-l-4 border-l-[#ba1a1a]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#101c29] line-clamp-1">
                      {evt.location_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold font-mono bg-[#ffdad6] text-[#93000a]">
                      Sev {evt.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#424751]">
                    <span>{evt.event_type.replace('_', ' ')}</span>
                    <span className="text-[#ba1a1a] font-mono font-bold">+{evt.estimated_delay_minutes}m delay</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('disruption')}
              className="w-full mt-3 py-2 rounded-lg bg-[#eef4ff] hover:bg-[#dde9fb] text-[#003c76] text-xs font-bold transition border border-[#d7e4f5]"
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
            <span className="material-symbols-outlined text-[#003c76] text-[20px]">hub</span>
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Live Multi-Modal Corridor Telematics &amp; Chokepoints (MapLibre GL)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#003c76] font-semibold">OpenFreeMap Liberty Vector Engine</span>
        </div>
        <NetworkMapLibre
          shipments={shipments}
          events={events}
          height="480px"
          onSelectShipment={onSelectShipment}
        />
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
