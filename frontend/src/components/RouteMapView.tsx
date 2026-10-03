import React, { useState, useEffect } from 'react';
import { Shipment, DisruptionEvent, CorridorSummary, NetworkOverview } from '../types';
import { fetchCorridors, fetchNetworkOverview } from '../services/api';
import { NetworkMapLibre } from './NetworkMapLibre';

interface RouteMapViewProps {
  shipments: Shipment[];
  events: DisruptionEvent[];
  selectedShipmentId: string | null;
  onSelectShipment: (id: string) => void;
  onNavigateToRecovery?: (shipmentId: string) => void;
  onNavigateToRisk?: (shipmentId: string) => void;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  shipments,
  events,
  selectedShipmentId,
  onSelectShipment,
  onNavigateToRecovery,
  onNavigateToRisk,
}) => {
  const [subTab, setSubTab] = useState<string>('worksheet');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [overloadedOnly, setOverloadedOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCorridors, setExpandedCorridors] = useState<Record<string, boolean>>({
    'CORR-NH48-W': true,
    'CORR-MAA-BLR': true,
  });

  const [corridors, setCorridors] = useState<CorridorSummary[]>([]);
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [, setLoading] = useState<boolean>(true);
  const [showMapOverlay, setShowMapOverlay] = useState<boolean>(true);

  // Time-phased horizon
  const [timeHorizon, setTimeHorizon] = useState<string>('24h');

  useEffect(() => {
    Promise.all([
      fetchNetworkOverview().catch(() => null),
      fetchCorridors({ mode: modeFilter, overloaded_only: overloadedOnly }).catch(() => []),
    ]).then(([ov, corr]) => {
      if (ov) setOverview(ov);
      setCorridors(corr);
      setLoading(false);
    });
  }, [modeFilter, overloadedOnly]);

  const toggleExpand = (corridorId: string) => {
    setExpandedCorridors((prev) => ({
      ...prev,
      [corridorId]: !prev[corridorId],
    }));
  };

  const filteredCorridors = corridors.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.corridor_id.toLowerCase().includes(term) ||
      c.linehaul_route.toLowerCase().includes(term) ||
      c.origin_hub.toLowerCase().includes(term) ||
      c.destination.toLowerCase().includes(term) ||
      c.bottleneck_name.toLowerCase().includes(term)
    );
  });

  // Count constrained corridors
  const constrainedCount = corridors.filter((c) => c.is_overloaded || c.utilization_pct > 100).length;

  return (
    <div className="flex flex-col w-full pb-10 font-sans text-slate-800">
      {/* 1. Sub-Navigation / Module Tabs */}
      <div className="w-full bg-white px-4 py-2.5 flex flex-wrap items-center justify-between shadow-sm mb-3 rounded-xl border border-slate-200 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-900 text-[22px]">account_tree</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Network Planning & Corridor Topology
                </h1>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
                  MULTI-MODAL SUPPLY CHAIN INFRASTRUCTURE
                </span>
              </div>
            </div>
          </div>
          <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block"></div>

          {/* Tab Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSubTab('worksheet')}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                subTab === 'worksheet'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              <span>Network Planning Worksheet</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>
            <button
              onClick={() => setSubTab('time_phased')}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                subTab === 'time_phased'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
              <span>Time-Phased Capacity &amp; Overload</span>
            </button>
            <button
              onClick={() => setSubTab('bottlenecks')}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                subTab === 'bottlenecks'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>Corridor Constraints &amp; Bottlenecks</span>
              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                {constrainedCount} Constrained
              </span>
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowMapOverlay(!showMapOverlay)}
            className="h-7 px-3 rounded bg-purple-800 hover:bg-purple-900 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">map</span>
            <span>{showMapOverlay ? 'Hide Spatial Map' : 'View Spatial Map'}</span>
          </button>
          <button
            onClick={() => {
              const targetSh = corridors.find((c) => c.is_overloaded)?.affected_shipments[0]?.shipment_id || 'SH-2048';
              if (onNavigateToRecovery) onNavigateToRecovery(targetSh);
            }}
            className="h-7 px-3 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">balance</span>
            <span>⚡ Re-balance Capacity</span>
          </button>
        </div>
      </div>

      {/* 2. Compact KPI Summary Bar (6 Tiles) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Shipments</span>
            <span className="material-symbols-outlined text-blue-900 text-[16px]">inventory_2</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">{overview?.active_shipments || 249}</span>
            <span className="text-xs text-blue-600 font-bold">{overview?.active_shipments_delta_pct || '+5.4%'}</span>
          </div>
          <span className="text-[10px] text-slate-400">Total Live Tracked Fleet</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Corridors</span>
            <span className="material-symbols-outlined text-blue-900 text-[16px]">hub</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-blue-900">{corridors.length} Corridors</span>
            <span className="text-xs text-slate-500 font-semibold">10 Hubs</span>
          </div>
          <span className="text-[10px] text-slate-400">All India Multi-Modal</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Available Cap</span>
            <span className="material-symbols-outlined text-emerald-600 text-[16px]">speed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">
              {overview?.available_capacity_pkgs_hr.toLocaleString() || '16,400'}
            </span>
            <span className="text-xs text-slate-500 font-semibold">pkgs/hr</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">+1,800 WDFC Rail open</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Utilization</span>
            <span className="material-symbols-outlined text-blue-900 text-[16px]">pie_chart</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">{overview?.avg_utilization_pct || 86.2}%</span>
            <span className="text-[11px] text-slate-500 font-semibold">Target &lt;85%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${overview?.avg_utilization_pct || 86.2}%` }}></div>
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-[10px] uppercase font-bold tracking-wider">Constrained Corridors</span>
            <span className="material-symbols-outlined text-red-600 text-[16px]">warning</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-red-700">{constrainedCount} Overloaded</span>
          </div>
          <span className="text-[10px] text-red-600 font-semibold">NH-48 West, Chennai-BLR, DMIC</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] uppercase font-bold tracking-wider">Shipments at Risk</span>
            <span className="material-symbols-outlined text-purple-700 text-[16px]">report_problem</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-purple-900">{overview?.shipments_at_risk || 38}</span>
            <span className="text-xs text-red-600 font-bold">{overview?.critical_risk_count || 12} Critical</span>
          </div>
          <span className="text-[10px] text-purple-800 font-semibold">₹{overview?.sla_penalty_exposure_lakhs || 26.7}L SLA penalty risk</span>
        </div>
      </div>

      {/* 3. Conditional Sub-Tabs View */}

      {/* SUB-TAB 1: Master Corridor Planning Worksheet */}
      {subTab === 'worksheet' && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-3">
          {/* Worksheet Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-900 text-[18px]">view_list</span>
                <h2 className="text-sm font-bold text-slate-900">
                  Corridor Planning &amp; Operational Constraints Worksheet
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                {filteredCorridors.length} Corridors Active
              </span>

              {/* Quick Filter Chips */}
              <div className="flex items-center gap-1 ml-2">
                {['ALL', 'Road', 'Rail', 'Air'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModeFilter(m)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      modeFilter === m ? 'bg-blue-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {m === 'ALL' ? 'All Modes' : m}
                  </button>
                ))}
                <button
                  onClick={() => setOverloadedOnly(!overloadedOnly)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    overloadedOnly
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  Overloaded Only
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-slate-400 absolute left-2 text-[15px]">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter corridor, route, or hub..."
                  className="h-7 pl-7 pr-2 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-48 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Dense Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                {/* Grouped Header Tier */}
                <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <th className="px-2 py-1 text-center w-8 border-r border-slate-200">#</th>
                  <th className="px-3 py-1 border-r border-slate-200" colSpan={5}>
                    Corridor &amp; Route Attributes
                  </th>
                  <th className="px-3 py-1 border-r border-slate-200" colSpan={3}>
                    Capacity &amp; Loading
                  </th>
                  <th className="px-3 py-1 border-r border-slate-200" colSpan={3}>
                    Risk &amp; Exposure
                  </th>
                  <th className="px-3 py-1" colSpan={3}>
                    Operational Constraints &amp; Actions
                  </th>
                </tr>
                {/* Column Header Tier */}
                <tr className="bg-slate-50 text-slate-800 text-[11px] font-bold uppercase border-b border-slate-200">
                  <th className="px-2 py-2 text-center">Exp</th>
                  <th className="px-2.5 py-2">Corridor ID</th>
                  <th className="px-2.5 py-2">Origin Hub</th>
                  <th className="px-2.5 py-2">Linehaul Route</th>
                  <th className="px-2.5 py-2">Destination</th>
                  <th className="px-2.5 py-2">Mode / Carrier</th>
                  <th className="px-2.5 py-2">Planned Vol</th>
                  <th className="px-2.5 py-2">Avail Cap</th>
                  <th className="px-2.5 py-2">Utilization %</th>
                  <th className="px-2.5 py-2">Predicted Delay</th>
                  <th className="px-2.5 py-2">SLA Penalty</th>
                  <th className="px-2.5 py-2">P_SLA Risk</th>
                  <th className="px-2.5 py-2">Active Bottleneck</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCorridors.map((c) => {
                  const isExpanded = !!expandedCorridors[c.corridor_id];
                  const firstAffectedId = c.affected_shipments[0]?.shipment_id || 'SH-2048';

                  return (
                    <React.Fragment key={c.corridor_id}>
                      <tr
                        className={`transition-colors ${
                          c.is_overloaded ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-2 py-2.5 text-center">
                          {c.affected_shipments.length > 0 && (
                            <button
                              onClick={() => toggleExpand(c.corridor_id)}
                              className="w-5 h-5 rounded hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                              title="Toggle consignments"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isExpanded ? 'expand_more' : 'chevron_right'}
                              </span>
                            </button>
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 font-mono font-bold flex items-center gap-1.5">
                          {c.is_overloaded && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>}
                          <span className={c.is_overloaded ? 'text-red-700 font-bold' : 'text-blue-900 font-bold'}>
                            {c.corridor_id}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 font-semibold text-slate-900">{c.origin_hub}</td>
                        <td className={`px-2.5 py-2.5 font-medium ${c.is_overloaded ? 'text-red-700 font-bold' : 'text-slate-700'}`}>
                          {c.linehaul_route}
                        </td>
                        <td className="px-2.5 py-2.5 font-medium text-slate-700">{c.destination}</td>
                        <td className="px-2.5 py-2.5">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                              {c.mode}
                            </span>
                            <span className="text-slate-500 text-[11px] truncate max-w-[120px]">{c.carrier_name}</span>
                          </div>
                        </td>
                        <td className={`px-2.5 py-2.5 font-mono font-bold ${c.is_overloaded ? 'text-red-700' : 'text-slate-800'}`}>
                          {c.planned_vol_pkgs_hr.toLocaleString()} pkgs/h
                        </td>
                        <td className="px-2.5 py-2.5 font-mono text-slate-500">
                          {c.avail_cap_pkgs_hr.toLocaleString()} cap
                        </td>
                        <td className="px-2.5 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className={c.is_overloaded ? 'text-red-700' : 'text-slate-700'}>
                                {c.utilization_pct}%
                              </span>
                              {c.is_overloaded && (
                                <span className="px-1 rounded bg-red-600 text-white text-[9px] font-bold">
                                  OVERLOAD
                                </span>
                              )}
                            </div>
                            <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.is_overloaded ? 'bg-red-600' : 'bg-blue-600'}`}
                                style={{ width: `${Math.min(100, c.utilization_pct)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-2.5 py-2.5 font-mono font-bold ${c.is_overloaded ? 'text-red-700' : 'text-emerald-700'}`}>
                          {c.predicted_delay_str}
                        </td>
                        <td className={`px-2.5 py-2.5 font-mono font-bold ${c.sla_penalty_lakhs > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                          ₹{c.sla_penalty_lakhs} Lakhs
                        </td>
                        <td className="px-2.5 py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                              c.p_sla_risk_pct > 50
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {c.p_sla_risk_pct}% Breach
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5">
                          <div className="flex flex-col">
                            <span className={`font-bold text-[11px] ${c.is_overloaded ? 'text-red-700' : 'text-slate-700'}`}>
                              {c.bottleneck_name}
                            </span>
                            <span className="text-slate-400 text-[10px] truncate max-w-[160px]">{c.bottleneck_desc}</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.is_overloaded
                                ? 'bg-red-600 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                onSelectShipment(firstAffectedId);
                                if (onNavigateToRecovery) onNavigateToRecovery(firstAffectedId);
                              }}
                              className="h-6 px-2.5 rounded bg-purple-800 hover:bg-purple-900 text-white font-bold text-[10px] shadow-sm transition-all"
                            >
                              Mitigate in Recovery
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Consignments Row */}
                      {isExpanded && c.affected_shipments.length > 0 && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td className="px-2 py-2 text-center bg-slate-100"></td>
                          <td className="px-3 py-3" colSpan={14}>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-red-600 text-[16px]">
                                    emergency
                                  </span>
                                  <span className="text-xs font-bold text-slate-900 uppercase">
                                    High-Value Consignments at Direct Risk on {c.corridor_id}:
                                  </span>
                                </div>
                                <span className="text-[11px] text-purple-800 font-semibold">
                                  Recommended Action: Shift volume to WDFC Dedicated Rail Spine
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-1">
                                {c.affected_shipments.map((sh, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-slate-50 p-2.5 rounded-lg flex items-center justify-between border border-slate-200"
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-xs text-blue-900 font-bold">
                                          {sh.shipment_id}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                          {sh.tag}
                                        </span>
                                      </div>
                                      <span className="text-xs text-slate-700 block mt-0.5">{sh.description}</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                      <span className="font-mono text-xs font-bold text-red-600">
                                        {sh.predicted_delay_str}
                                      </span>
                                      <button
                                        onClick={() => {
                                          onSelectShipment(sh.shipment_id);
                                          if (onNavigateToRisk) onNavigateToRisk(sh.shipment_id);
                                        }}
                                        className="text-[10px] text-blue-800 font-bold hover:underline"
                                      >
                                        Inspect Risk →
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Time-Phased Capacity & Overload Profile */}
      {subTab === 'time_phased' && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-3 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-900 text-[18px]">calendar_view_week</span>
                Time-Phased Throughput &amp; Overload Windows
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic load projection across 4-hour operating windows to prevent chokepoint queuing.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Horizon:</span>
              {['12h', '24h', '48h'].map((h) => (
                <button
                  key={h}
                  onClick={() => setTimeHorizon(h)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    timeHorizon === h ? 'bg-blue-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {corridors.map((c) => {
              const baseUtil = c.utilization_pct;
              // Generate time windows
              const windows = [
                { label: '08:00 - 12:00', util: Math.round(baseUtil * 0.9) },
                { label: '12:00 - 16:00', util: Math.round(baseUtil * 1.15) }, // Peak
                { label: '16:00 - 20:00', util: Math.round(baseUtil * 1.05) },
                { label: '20:00 - 00:00', util: Math.round(baseUtil * 0.8) },
                { label: '00:00 - 04:00', util: Math.round(baseUtil * 0.45) },
                { label: '04:00 - 08:00', util: Math.round(baseUtil * 0.7) },
              ];

              return (
                <div key={c.corridor_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-900">{c.corridor_id}</span>
                      <span className="text-xs font-semibold text-slate-800">{c.linehaul_route}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] font-bold text-slate-700">
                        {c.mode}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold">
                      <span className={c.is_overloaded ? 'text-red-600' : 'text-slate-600'}>
                        Peak Load: {Math.max(...windows.map((w) => w.util))}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {windows.map((w, idx) => {
                      const isOver = w.util > 100;
                      const isWarning = w.util > 85 && w.util <= 100;
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-center transition ${
                            isOver
                              ? 'bg-red-50 border-red-300'
                              : isWarning
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 font-medium block">{w.label}</span>
                          <span className={`text-sm font-bold font-mono ${
                            isOver ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {w.util}%
                          </span>
                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${isOver ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, w.util)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Corridor Constraints & Bottlenecks Diagnostics */}
      {subTab === 'bottlenecks' && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-3 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
                Physical Bottlenecks &amp; Constrained Corridor Registry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active disruption events, landslides, toll plazas, and maritime berth dwell impacting delivery SLAs.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded font-bold text-xs">
              {constrainedCount} Active Bottlenecks Requiring Action
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {corridors.filter((c) => c.bottleneck_name && c.bottleneck_name !== 'Normal Coastal Flow').map((c) => (
              <div
                key={c.corridor_id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  c.is_overloaded
                    ? 'bg-rose-50/50 border-rose-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-blue-900">{c.corridor_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.is_overloaded ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>{c.is_overloaded ? '🚨' : '⚠️'}</span>
                    <span>{c.bottleneck_name}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">{c.bottleneck_desc}</p>

                  <div className="space-y-1.5 text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200/80 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Linehaul Route:</span>
                      <span className="font-semibold text-slate-800">{c.linehaul_route}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Utilization:</span>
                      <span className={`font-mono font-bold ${c.is_overloaded ? 'text-red-600' : 'text-slate-800'}`}>
                        {c.utilization_pct}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Delay:</span>
                      <span className="font-mono font-bold text-red-600">{c.predicted_delay_str}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SLA Penalty Exposure:</span>
                      <span className="font-mono font-bold text-purple-900">₹{c.sla_penalty_lakhs} Lakhs</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const targetId = c.affected_shipments[0]?.shipment_id || 'SH-2048';
                    onSelectShipment(targetId);
                    if (onNavigateToRecovery) onNavigateToRecovery(targetId);
                  }}
                  className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition ${
                    c.is_overloaded
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-900 hover:bg-blue-800 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">alt_route</span>
                  <span>⚡ Solve via Modal Shift (Recovery)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Spatial Route Network Map Overlay (Synchronized via MapLibre GL JS) */}
      {showMapOverlay && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-900 text-[20px]">map</span>
              <h3 className="text-sm font-bold text-slate-900">
                Synchronized Spatial Route Topology &amp; Bottlenecks (MapLibre GL Vector Engine)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">OpenFreeMap Liberty Vector Tiles</span>
            </div>
          </div>
          <NetworkMapLibre
            shipments={shipments}
            events={events}
            height="460px"
            selectedShipmentId={selectedShipmentId}
            onSelectShipment={onSelectShipment}
          />
        </div>
      )}
    </div>
  );
};
