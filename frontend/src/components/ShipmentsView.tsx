import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  TrendingUp, 
  TrendingDown, 
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
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Filter Bar (Pure White Theme) */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#424751] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Shipment ID, Corridor, Carrier, Cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] placeholder-[#727782] focus:outline-none focus:border-[#003c76] transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#424751]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] font-medium focus:outline-none focus:border-[#003c76]"
            >
              <option value="all">All Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="critical">Critical</option>
              <option value="rerouted">Rerouted</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#424751] font-medium">Min Risk:</span>
            <select
              value={filterMinRisk}
              onChange={(e) => setFilterMinRisk(Number(e.target.value))}
              className="py-1.5 px-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] font-medium focus:outline-none focus:border-[#003c76]"
            >
              <option value="0">All Risks</option>
              <option value="4">≥ 4 (Moderate+)</option>
              <option value="7">≥ 7 (High+)</option>
              <option value="9">≥ 9 (Critical)</option>
            </select>
          </div>

          <span className="text-xs font-mono text-[#424751] font-semibold">
            Showing {filtered.length} of {shipments.length}
          </span>
        </div>
      </div>

      {/* Main Table + Intelligence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${selectedShipment ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#eef4ff] text-[#424751] font-mono uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Shipment ID</th>
                  <th className="py-2.5 px-3">Corridor</th>
                  <th className="py-2.5 px-3">Carrier / Mode</th>
                  <th className="py-2.5 px-3">Promised SLA</th>
                  <th className="py-2.5 px-3">Dynamic ETA</th>
                  <th className="py-2.5 px-3">Buffer</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                          <span>{sh.carrier_id}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#e4efff] text-[#003c76] font-semibold">
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
                        <span className={sh.sla_buffer_minutes < 0 ? 'text-red-600 font-bold' : 'text-slate-700'}>
                          {sh.sla_buffer_minutes > 0 ? `+${sh.sla_buffer_minutes}m` : `${sh.sla_buffer_minutes}m`}
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
                        <ChevronRight className="w-4 h-4 text-[#727782] inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Shipment Intelligence Drawer (Pure White Theme) */}
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
                  {selectedShipment.origin} → {selectedShipment.destination} ({selectedShipment.route_id})
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
                  +{selectedShipment.predicted_delay_minutes}m
                </span>
                <span className="block text-[10px] text-[#727782] mt-0.5">RandomForest regressor</span>
              </div>
            </div>

            {/* Cargo & Transit State */}
            <div className="p-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-[#101c29]">
                <span className="text-[#424751]">Cargo Type:</span>
                <span className="font-semibold">{selectedShipment.cargo_type}</span>
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
                <span className="text-[#424751]">Promised Deadline:</span>
                <span className="font-mono text-[#101c29]">
                  {new Date(selectedShipment.promised_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Explainable AI (SHAP Waterfall) */}
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
                            {factor.feature.replace('_', ' ')}
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
                  <p className="text-[10px] text-[#727782] italic mt-1">
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
              <RotateCcw className="w-4 h-4" />
              Launch Recovery Optimizer (OR-Tools)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
