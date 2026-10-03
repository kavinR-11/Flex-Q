import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  RotateCcw, 
  Zap, 
  ArrowUpDown, 
  Package, 
  Clock, 
  Truck 
} from 'lucide-react';
import { Shipment, ExplanationResponse } from '../types';
import { fetchShipmentExplanation } from '../services/api';

interface ShipmentsViewProps {
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onSelectShipment: (id: string | null) => void;
  onNavigateToRecovery: (id: string) => void;
}

type SortField = 'shipment_id' | 'corridor' | 'mode' | 'promised' | 'eta' | 'buffer' | 'risk' | 'status';
type SortDirection = 'asc' | 'desc';

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  onNavigateToRecovery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterMinRisk, setFilterMinRisk] = useState<number>(0);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Explanation state
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  const selectedShipment = shipments.find((s) => s.shipment_id === selectedShipmentId);

  // Fetch TreeSHAP when a shipment is selected
  useEffect(() => {
    if (selectedShipmentId) {
      setLoadingExpl(true);
      fetchShipmentExplanation(selectedShipmentId)
        .then((data) => setExplanation(data))
        .catch((err) => {
          console.error('Error fetching SHAP explanation:', err);
          setExplanation(null);
        })
        .finally(() => setLoadingExpl(false));
    } else {
      setExplanation(null);
    }
  }, [selectedShipmentId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMode, filterMinRisk]);

  // Fleet summary stats
  const stats = useMemo(() => {
    const total = shipments.length;
    const critical = shipments.filter((s) => s.risk_score >= 8 || s.current_status === 'critical').length;
    const delayed = shipments.filter((s) => s.risk_score === 7 || s.current_status === 'delayed').length;
    const normal = total - critical - delayed;
    const road = shipments.filter((s) => s.transport_mode === 'ROAD').length;
    const air = shipments.filter((s) => s.transport_mode === 'AIR').length;
    const railMaritime = shipments.filter((s) => s.transport_mode === 'RAIL' || s.transport_mode === 'MARITIME').length;
    return { total, critical, delayed, normal, road, air, railMaritime };
  }, [shipments]);

  // Filtered & Sorted Shipments
  const processedShipments = useMemo(() => {
    const filtered = shipments.filter((s) => {
      const matchSearch =
        s.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.carrier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cargo_type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'all' || s.current_status === filterStatus;
      const matchMode = filterMode === 'all' || s.transport_mode === filterMode;
      const matchRisk = filterMinRisk === 0 || s.risk_score >= filterMinRisk;

      return matchSearch && matchStatus && matchMode && matchRisk;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'shipment_id':
          comparison = a.shipment_id.localeCompare(b.shipment_id);
          break;
        case 'corridor':
          comparison = `${a.origin}-${a.destination}`.localeCompare(`${b.origin}-${b.destination}`);
          break;
        case 'mode':
          comparison = a.transport_mode.localeCompare(b.transport_mode);
          break;
        case 'promised':
          comparison = new Date(a.promised_delivery).getTime() - new Date(b.promised_delivery).getTime();
          break;
        case 'eta':
          comparison = new Date(a.current_eta).getTime() - new Date(b.current_eta).getTime();
          break;
        case 'buffer':
          comparison = (a.sla_buffer_minutes || 0) - (b.sla_buffer_minutes || 0);
          break;
        case 'risk':
          comparison = a.risk_score - b.risk_score;
          break;
        case 'status':
          comparison = a.current_status.localeCompare(b.current_status);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [shipments, searchTerm, filterStatus, filterMode, filterMinRisk, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(processedShipments.length / pageSize) || 1;
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedShipments.slice(start, start + pageSize);
  }, [processedShipments, currentPage, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMode('all');
    setFilterMinRisk(0);
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || filterMode !== 'all' || filterMinRisk !== 0;

  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Fleet Telematics Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-[#003c76]">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Tracked</span>
            <div className="text-base font-bold font-mono text-[#003c76]">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Critical (≥8)</span>
            <div className="text-base font-bold font-mono text-red-600">{stats.critical}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Delayed (7)</span>
            <div className="text-base font-bold font-mono text-amber-600">{stats.delayed}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">On Schedule</span>
            <div className="text-base font-bold font-mono text-emerald-600">{stats.normal}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <span className="text-xs font-mono font-bold">🛣️</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Road</span>
            <div className="text-base font-bold font-mono text-slate-700">{stats.road}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <span className="text-xs font-mono font-bold">✈️</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Air Cargo</span>
            <div className="text-base font-bold font-mono text-slate-700">{stats.air}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <span className="text-xs font-mono font-bold">🚆</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Rail / Maritime</span>
            <div className="text-base font-bold font-mono text-slate-700">{stats.railMaritime}</div>
          </div>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#424751] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ID, Corridor, Carrier, Cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] placeholder-[#727782] focus:outline-none focus:border-[#003c76] transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* Mode Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Mode:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="py-1.5 px-2 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] font-medium focus:outline-none focus:border-[#003c76]"
            >
              <option value="all">All Modes</option>
              <option value="ROAD">Road</option>
              <option value="AIR">Air Cargo</option>
              <option value="MARITIME">Maritime</option>
              <option value="RAIL">Electric Rail</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#424751]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-2 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] font-medium focus:outline-none focus:border-[#003c76]"
            >
              <option value="all">All Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="critical">Critical</option>
              <option value="rerouted">Rerouted</option>
            </select>
          </div>

          {/* Min Risk Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Risk:</span>
            <select
              value={filterMinRisk}
              onChange={(e) => setFilterMinRisk(Number(e.target.value))}
              className="py-1.5 px-2 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] font-medium focus:outline-none focus:border-[#003c76]"
            >
              <option value="0">All Risks</option>
              <option value="4">≥ 4 (Moderate+)</option>
              <option value="7">≥ 7 (High+)</option>
              <option value="9">≥ 9 (Critical)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-semibold transition"
            >
              Reset
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <span className="text-xs font-mono text-[#424751] font-semibold">
            {processedShipments.length} consignments
          </span>
        </div>
      </div>

      {/* Main Table + Intelligence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${selectedShipment ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all`}>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#eef4ff] text-[#424751] font-mono uppercase text-[10px] font-bold select-none">
                  <th
                    onClick={() => toggleSort('shipment_id')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Shipment ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('corridor')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Corridor</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('mode')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Carrier / Mode</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('promised')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Promised SLA</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('eta')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Dynamic ETA</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('buffer')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Buffer</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('risk')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Risk Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('status')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedShipments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                      No consignments match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedShipments.map((sh) => {
                    const isSelected = sh.shipment_id === selectedShipmentId;
                    const isCritical = sh.risk_score >= 8;
                    const isModerate = sh.risk_score >= 4 && sh.risk_score < 8;
                    const roundedBuffer = Math.round(sh.sla_buffer_minutes || 0);

                    return (
                      <tr
                        key={sh.shipment_id}
                        onClick={() => onSelectShipment(sh.shipment_id)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#eef4ff] border-l-4 border-l-[#003c76]'
                            : 'hover:bg-[#f8f9ff]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold font-mono text-[#003c76]">
                          {sh.shipment_id}
                          {sh.shipment_id === 'SH-2048' && (
                            <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-[#d5e3ff] text-[#001b3c] font-bold rounded">
                              DEMO REF
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#101c29] font-medium">
                          {sh.origin} → {sh.destination}
                        </td>
                        <td className="py-2.5 px-3 text-[#424751]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium">{sh.carrier_id}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#e4efff] text-[#003c76] font-semibold">
                              {sh.transport_mode}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#424751]">
                          {new Date(sh.promised_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#101c29] font-bold">
                          {new Date(sh.current_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={roundedBuffer < 0 ? 'text-red-600 font-bold' : 'text-slate-700'}>
                            {roundedBuffer > 0 ? `+${roundedBuffer}m` : `${roundedBuffer}m`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : isModerate
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {sh.risk_score}/10
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                            sh.current_status === 'critical' ? 'bg-red-100 text-red-800' :
                            sh.current_status === 'delayed' ? 'bg-amber-100 text-amber-800' :
                            sh.current_status === 'rerouted' ? 'bg-purple-100 text-purple-800' :
                            'bg-[#e4efff] text-[#003c76]'
                          }`}>
                            {sh.current_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToRecovery(sh.shipment_id);
                              }}
                              title="Evaluate in Recovery Center"
                              className="p-1 rounded bg-[#003c76]/10 hover:bg-[#003c76] text-[#003c76] hover:text-white transition"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-[#727782] inline" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-0.5 px-1.5 rounded bg-white border border-slate-300 font-medium text-xs focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-400 ml-2">
                Showing {processedShipments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, processedShipments.length)} of {processedShipments.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-semibold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Shipment Intelligence Drawer */}
        {selectedShipment && (
          <div className="bg-white rounded-xl p-4 space-y-4 border border-slate-200 shadow-sm border-l-4 border-l-[#003c76]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#101c29] font-mono">{selectedShipment.shipment_id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    selectedShipment.risk_score >= 8 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Risk {selectedShipment.risk_score}/10 ({selectedShipment.risk_category})
                  </span>
                </div>
                <p className="text-[11px] text-[#424751] mt-0.5">
                  {selectedShipment.origin} → {selectedShipment.destination}
                </p>
              </div>
              <button
                onClick={() => onSelectShipment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#424751] hover:text-[#101c29]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prediction Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-[#f8f9ff] border border-slate-200">
                <span className="text-[#424751] block text-[10px] uppercase font-bold">SLA Breach Prob</span>
                <span className="text-xl font-bold font-mono text-red-600">
                  {Math.round(selectedShipment.sla_breach_probability * 100)}%
                </span>
                <span className="block text-[10px] text-[#727782] mt-0.5">Calibrated Isotonic</span>
              </div>
              <div className="p-3 rounded-lg bg-[#f8f9ff] border border-slate-200">
                <span className="text-[#424751] block text-[10px] uppercase font-bold">Predicted Delay</span>
                <span className="text-xl font-bold font-mono text-amber-600">
                  +{Math.round(selectedShipment.predicted_delay_minutes || 0)}m
                </span>
                <span className="block text-[10px] text-[#727782] mt-0.5">RandomForest regressor</span>
              </div>
            </div>

            {/* Cargo & Financial Context */}
            <div className="p-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">Cargo Value:</span>
                <span className="font-bold text-[#003c76] font-mono">
                  ₹{Math.round(selectedShipment.cargo_value_inr || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">Consignment Weight:</span>
                <span className="font-mono">{Math.round(selectedShipment.weight_kg || 0).toLocaleString('en-IN')} kg</span>
              </div>
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">Cargo Type:</span>
                <span className="font-semibold text-right max-w-[170px] truncate">{selectedShipment.cargo_type}</span>
              </div>
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">Priority Tier:</span>
                <span className="font-mono text-[#003c76] font-bold">Tier {selectedShipment.cargo_priority}</span>
              </div>
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">Remaining Distance:</span>
                <span className="font-mono">{selectedShipment.remaining_distance_km} km</span>
              </div>
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">SLA Buffer:</span>
                <span className={`font-mono font-bold ${
                  selectedShipment.sla_buffer_minutes < 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {selectedShipment.sla_buffer_minutes > 0 ? `+${Math.round(selectedShipment.sla_buffer_minutes)}m` : `${Math.round(selectedShipment.sla_buffer_minutes)}m`}
                </span>
              </div>
            </div>

            {/* Explainable AI (TreeSHAP Waterfall) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#003c76]" />
                  SHAP Risk Drivers
                </h3>
                <span className="text-[10px] font-mono text-[#727782]">TreeSHAP Engine</span>
              </div>

              {loadingExpl ? (
                <div className="p-4 text-center text-xs text-[#727782] animate-pulse">
                  Computing Shapley values...
                </div>
              ) : explanation?.top_risk_drivers ? (
                <div className="space-y-1.5">
                  {explanation.top_risk_drivers.map((factor, idx) => {
                    const isIncrease = factor.direction === 'INCREASING_RISK';
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {isIncrease ? (
                            <TrendingUp className="w-4 h-4 text-red-600 shrink-0" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="text-[#101c29] font-mono text-[11px] line-clamp-1">
                            {factor.feature.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-[11px] ${
                          isIncrease ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {isIncrease ? `+${factor.shap_impact}` : `${factor.shap_impact}`}
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-[#727782] italic mt-1 leading-snug">
                    {explanation.disclaimer}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#727782]">No explanation available.</p>
              )}
            </div>

            {/* Direct Recovery CTA */}
            <button
              onClick={() => onNavigateToRecovery(selectedShipment.shipment_id)}
              className="w-full py-2.5 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              ⚡ Launch Hybrid Optimizer (OR-Tools + Qiskit)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
