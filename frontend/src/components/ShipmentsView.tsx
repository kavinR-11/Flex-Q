import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  ShieldAlert, 
  RotateCcw 
} from 'lucide-react';
import { Shipment, ExplanationResponse } from '../types';
import { fetchShipmentExplanation } from '../services/api';

interface ShipmentsViewProps {
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onSelectShipment: (id: string | null) => void;
  onNavigateToRecovery: (id: string) => void;
}

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  onNavigateToRecovery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMinRisk, setFilterMinRisk] = useState<number>(0);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  const selectedShipment = shipments.find((s) => s.shipment_id === selectedShipmentId);

  useEffect(() => {
    if (selectedShipmentId) {
      setLoadingExpl(true);
      fetchShipmentExplanation(selectedShipmentId)
        .then((data) => setExplanation(data))
        .catch((err) => {
          console.error(err);
          setExplanation(null);
        })
        .finally(() => setLoadingExpl(false));
    } else {
      setExplanation(null);
    }
  }, [selectedShipmentId]);

  const filtered = shipments.filter((s) => {
    const matchSearch =
      s.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carrier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cargo_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'all' || s.current_status === filterStatus;
    const matchRisk = filterMinRisk === 0 || s.risk_score >= filterMinRisk;

    return matchSearch && matchStatus && matchRisk;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Shipment ID, Order, Corridor, Carrier, Cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="critical">Critical</option>
              <option value="rerouted">Rerouted</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Min Risk:</span>
            <select
              value={filterMinRisk}
              onChange={(e) => setFilterMinRisk(Number(e.target.value))}
              className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="0">All Risks</option>
              <option value="4">≥ 4 (Moderate+)</option>
              <option value="7">≥ 7 (High+)</option>
              <option value="9">≥ 9 (Critical)</option>
            </select>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Showing {filtered.length} of {shipments.length}
          </span>
        </div>
      </div>

      {/* Main Table + Intelligence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${selectedShipment ? 'lg:col-span-2' : 'lg:col-span-3'} glass-panel rounded-2xl overflow-hidden transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Shipment ID</th>
                  <th className="py-3 px-3">Corridor</th>
                  <th className="py-3 px-3">Carrier / Mode</th>
                  <th className="py-3 px-3">Promised SLA</th>
                  <th className="py-3 px-3">Dynamic ETA</th>
                  <th className="py-3 px-3">Buffer</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filtered.map((sh) => {
                  const isSelected = sh.shipment_id === selectedShipmentId;
                  const isCritical = sh.risk_score >= 8;
                  const isModerate = sh.risk_score >= 4 && sh.risk_score < 8;

                  return (
                    <tr
                      key={sh.shipment_id}
                      onClick={() => onSelectShipment(sh.shipment_id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-950/40 border-l-4 border-cyan-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold font-mono text-cyan-400">
                        {sh.shipment_id}
                        {sh.shipment_id === 'SH-2048' && (
                          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-cyan-900/60 text-cyan-200 border border-cyan-700 rounded">
                            DEMO REF
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-medium">
                        {sh.origin} → {sh.destination}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{sh.carrier_id}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            {sh.transport_mode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {new Date(sh.promised_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200 font-semibold">
                        {new Date(sh.current_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={sh.sla_buffer_minutes < 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {sh.sla_buffer_minutes > 0 ? `+${sh.sla_buffer_minutes}m` : `${sh.sla_buffer_minutes}m`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isModerate
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {sh.risk_score}/10
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium ${
                          sh.current_status === 'critical' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                          sh.current_status === 'delayed' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                          sh.current_status === 'rerouted' ? 'bg-purple-950/80 text-purple-300 border border-purple-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {sh.current_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-500 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Shipment Intelligence Drawer */}
        {selectedShipment && (
          <div className="glass-panel rounded-2xl p-5 space-y-5 border-l-2 border-cyan-500/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white font-mono">{selectedShipment.shipment_id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                    selectedShipment.risk_score >= 8 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    Risk {selectedShipment.risk_score}/10 ({selectedShipment.risk_category})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedShipment.origin} → {selectedShipment.destination} ({selectedShipment.route_id})
                </p>
              </div>
              <button
                onClick={() => onSelectShipment(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prediction Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">SLA Breach Probability</span>
                <span className="text-xl font-bold font-mono text-rose-400">
                  {Math.round(selectedShipment.sla_breach_probability * 100)}%
                </span>
                <span className="block text-[10px] text-slate-500 mt-1">Calibrated Isotonic</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Predicted Delay</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  +{selectedShipment.predicted_delay_minutes}m
                </span>
                <span className="block text-[10px] text-slate-500 mt-1">RandomForest regressor</span>
              </div>
            </div>

            {/* Cargo & Transit State */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Cargo Type:</span>
                <span className="font-medium">{selectedShipment.cargo_type}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Priority Tier:</span>
                <span className="font-mono text-cyan-400">Tier {selectedShipment.cargo_priority}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Remaining Distance:</span>
                <span className="font-mono">{selectedShipment.remaining_distance_km} km</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Promised Deadline:</span>
                <span className="font-mono text-slate-200">
                  {new Date(selectedShipment.promised_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Explainable AI (SHAP Waterfall) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  SHAP Risk Drivers
                </h3>
                <span className="text-[10px] font-mono text-slate-500">TreeSHAP Engine</span>
              </div>

              {loadingExpl ? (
                <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
                  Computing Shapley values...
                </div>
              ) : explanation?.top_risk_drivers ? (
                <div className="space-y-2">
                  {explanation.top_risk_drivers.map((factor, idx) => {
                    const isIncrease = factor.direction === 'INCREASING_RISK';
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {isIncrease ? (
                            <TrendingUp className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <span className="text-slate-300 font-mono text-[11px] line-clamp-1">
                            {factor.feature.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-[11px] ${
                          isIncrease ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {isIncrease ? `+${factor.shap_impact}` : `${factor.shap_impact}`}
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    {explanation.disclaimer}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No explanation available.</p>
              )}
            </div>

            {/* Direct Recovery CTA */}
            <button
              onClick={() => onNavigateToRecovery(selectedShipment.shipment_id)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Launch Recovery Optimizer (OR-Tools)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
