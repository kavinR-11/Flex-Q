import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shipment, DisruptionEvent, CorridorSummary, NetworkOverview } from '../types';
import { fetchCorridors, fetchNetworkOverview } from '../services/api';

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
  });

  const [corridors, setCorridors] = useState<CorridorSummary[]>([]);
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMapOverlay, setShowMapOverlay] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

  // Leaflet Map Synchronization
  useEffect(() => {
    if (!showMapOverlay || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [16.5, 76.5],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // 1. NH-48 Corridor (Mumbai -> Pune -> BLR)
    const nh48Coords: [number, number][] = [
      [18.95, 72.95], // JNPT
      [18.75, 73.40], // Khandala Ghat
      [18.52, 73.85], // Pune
      [15.85, 74.50], // Belagavi
      [15.36, 75.12], // Hubballi
      [12.97, 77.59], // Bengaluru
    ];
    L.polyline(nh48Coords, {
      color: '#d32f2f',
      weight: 4,
      dashArray: '6, 6',
      opacity: 0.85,
    }).addTo(map).bindPopup('<b>CORR-NH48-W (CRITICAL OVERLOAD)</b><br/>Khandala Ghat Landslide Chokepoint');

    // 2. WDFC Dedicated Rail Spine (Bypass)
    const wdfcCoords: [number, number][] = [
      [18.99, 73.12], // Panvel Rail Yard
      [17.65, 75.90], // Solapur Electric Spine
      [15.35, 76.50], // Guntakal Rail Interchange
      [12.97, 77.59], // Bengaluru ICD
    ];
    L.polyline(wdfcCoords, {
      color: '#00897b',
      weight: 4,
      opacity: 0.9,
    }).addTo(map).bindPopup('<b>CORR-WDFC-RAIL (OPTIMAL BYPASS)</b><br/>Dedicated Electrified Double-Stack Freight Corridor');

    // 3. Disruption circles
    events.forEach((evt) => {
      const circle = L.circle([evt.latitude, evt.longitude], {
        color: '#d32f2f',
        fillColor: '#d32f2f',
        fillOpacity: 0.25,
        radius: evt.impact_radius_km * 1000,
        weight: 1.5,
      }).addTo(map);

      circle.bindPopup(`<b>${evt.event_type}</b><br/>${evt.location_name}<br/>Severity: ${evt.severity}/10`);
    });
  }, [showMapOverlay, events]);

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
                  Network Planning & Constraint Analysis
                </h1>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
                  SUPPLY CHAIN CAPACITY & BOTTLENECK ENGINE
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
              <span>Time-Phased Capacity & Overload</span>
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
              <span>Corridor Constraints & Bottlenecks</span>
              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                3 Critical
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
              if (onNavigateToRecovery) onNavigateToRecovery('SH-2113');
            }}
            className="h-7 px-3 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">balance</span>
            <span>Re-balance Capacity</span>
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
            <span className="text-xl font-bold text-slate-900">{overview?.active_shipments || 1428}</span>
            <span className="text-xs text-blue-600 font-bold">{overview?.active_shipments_delta_pct || '+4.2%'}</span>
          </div>
          <span className="text-[10px] text-slate-400">vs. Live baseline plan</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Corridors</span>
            <span className="material-symbols-outlined text-blue-900 text-[16px]">hub</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-blue-900">12 Hubs</span>
            <span className="text-xs text-slate-500 font-semibold">42 Spines</span>
          </div>
          <span className="text-[10px] text-slate-400">Western-Southern sector</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Available Cap</span>
            <span className="material-symbols-outlined text-emerald-600 text-[16px]">speed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">
              {overview?.available_capacity_pkgs_hr.toLocaleString() || '14,850'}
            </span>
            <span className="text-xs text-slate-500 font-semibold">pkgs/hr</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">+1,200 MT rail open</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Utilization</span>
            <span className="material-symbols-outlined text-blue-900 text-[16px]">pie_chart</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">{overview?.avg_utilization_pct || 84.6}%</span>
            <span className="text-[11px] text-slate-500 font-semibold">Target &lt;85%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${overview?.avg_utilization_pct || 84.6}%` }}></div>
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-[10px] uppercase font-bold tracking-wider">Constrained Corridors</span>
            <span className="material-symbols-outlined text-red-600 text-[16px]">warning</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-red-700">3 Overloaded</span>
          </div>
          <span className="text-[10px] text-red-600 font-semibold">NH-48, JNPT Berth, BLR Air</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] uppercase font-bold tracking-wider">Shipments at Risk</span>
            <span className="material-symbols-outlined text-purple-700 text-[16px]">report_problem</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-purple-900">{overview?.shipments_at_risk || 38}</span>
            <span className="text-xs text-red-600 font-bold">{overview?.critical_risk_count || 9} Critical</span>
          </div>
          <span className="text-[10px] text-purple-800 font-semibold">₹{overview?.sla_penalty_exposure_lakhs || 26.7}L SLA exposure</span>
        </div>
      </div>

      {/* 3. Main Kinaxis Maestro-Style Planning Grid */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-3">
        {/* Worksheet Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-900 text-[18px]">view_list</span>
              <h2 className="text-sm font-bold text-slate-900">
                Corridor Planning & Operational Constraints Worksheet
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
                  Corridor & Route Attributes
                </th>
                <th className="px-3 py-1 border-r border-slate-200" colSpan={3}>
                  Capacity & Loading
                </th>
                <th className="px-3 py-1 border-r border-slate-200" colSpan={3}>
                  Risk & Exposure
                </th>
                <th className="px-3 py-1" colSpan={3}>
                  Operational Constraints & Actions
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
                          <span className="text-slate-500 text-[11px]">{c.carrier_name}</span>
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
                          <span className="text-slate-400 text-[10px]">{c.bottleneck_desc}</span>
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
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (onNavigateToRecovery) onNavigateToRecovery('SH-2113');
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
                                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[9px] font-bold">
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

      {/* 4. Spatial Route Network Map Overlay (Synchronized) */}
      {showMapOverlay && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-900 text-[20px]">map</span>
              <h3 className="text-sm font-bold text-slate-900">Synchronized Spatial Route Topology & Bottlenecks</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-red-600 font-bold">
                <span className="w-3 h-1 bg-red-600 inline-block"></span> NH-48 Landslide (Choke)
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-3 h-1 bg-emerald-600 inline-block"></span> WDFC Rail Bypass (Clear)
              </span>
            </div>
          </div>
          <div ref={mapContainerRef} className="h-72 w-full rounded-lg overflow-hidden border border-slate-200"></div>
        </div>
      )}
    </div>
  );
};
