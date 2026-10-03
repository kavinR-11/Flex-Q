import React, { useState } from 'react';
import { 
  Zap, 
  CloudRain, 
  Construction, 
  Anchor, 
  Plane, 
  Activity, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Waves,
  MapPin,
  Trash2
} from 'lucide-react';
import { DisruptionEvent } from '../types';
import { submitDisruptionEvent, clearSimulatedDisruptions } from '../services/api';

interface DisruptionLabViewProps {
  events: DisruptionEvent[];
  onDisruptionInjected: () => void;
  onNavigateToRecovery: (shipmentId: string) => void;
}

interface AffectedDetail {
  shipment_id: string;
  origin: string;
  destination: string;
  cargo_type: string;
  cargo_priority: number;
  new_risk_score: number;
  predicted_delay_minutes: number;
  sla_breach_probability: number;
}

export const DisruptionLabView: React.FC<DisruptionLabViewProps> = ({
  events,
  onDisruptionInjected,
  onNavigateToRecovery,
}) => {
  const [eventType, setEventType] = useState('TRAFFIC_CONGESTION');
  const [severity, setSeverity] = useState(8.5);
  const [locationName, setLocationName] = useState('NH48 Sriperumbudur Toll Corridor');
  const [latitude, setLatitude] = useState(12.9675);
  const [longitude, setLongitude] = useState(79.9431);
  const [impactRadius, setImpactRadius] = useState(35.0);
  const [affectedMode, setAffectedMode] = useState('ROAD');
  const [delayMinutes, setDelayMinutes] = useState(120);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [injectionResult, setInjectionResult] = useState<{
    event_id: string;
    affected_shipments_count: number;
    affected_shipment_ids: string[];
    affected_shipments?: AffectedDetail[];
  } | null>(null);

  // 6 Nationwide Indian Logistics Presets
  const presets = [
    {
      title: 'Khandala Ghat Landslide Chokepoint',
      desc: 'Severe boulder blockage on NH-48 West Expressway constricting Mumbai-Pune-BLR flow to 15% (+240m delay)',
      icon: Construction,
      color: 'red',
      data: {
        event_type: 'ROAD_CLOSURE',
        severity: 9.8,
        location_name: 'NH48 Khandala Ghat Mountain Pass',
        latitude: 18.7500,
        longitude: 73.4000,
        impact_radius_km: 45.0,
        affected_mode: 'ROAD',
        estimated_delay_minutes: 240,
      },
    },
    {
      title: 'NH48 Sriperumbudur Severe Monsoon Congestion',
      desc: 'Heavy traffic and waterlogging on Chennai-BLR arterial tech manufacturing lane (+120m delay)',
      icon: CloudRain,
      color: 'amber',
      data: {
        event_type: 'TRAFFIC_CONGESTION',
        severity: 8.5,
        location_name: 'NH48 Sriperumbudur Toll Corridor',
        latitude: 12.9675,
        longitude: 79.9431,
        impact_radius_km: 35.0,
        affected_mode: 'ROAD',
        estimated_delay_minutes: 120,
      },
    },
    {
      title: 'Walajapet Bridge Structural Closure',
      desc: 'Complete highway bridge structural closure forcing detour via northern bypass (+210m delay)',
      icon: Construction,
      color: 'rose',
      data: {
        event_type: 'ROAD_CLOSURE',
        severity: 9.5,
        location_name: 'NH48 Walajapet Arterial Bridge',
        latitude: 12.9250,
        longitude: 79.3800,
        impact_radius_km: 25.0,
        affected_mode: 'ROAD',
        estimated_delay_minutes: 210,
      },
    },
    {
      title: 'Delhi-Jaipur DMIC Highway Flash Flooding',
      desc: 'Monsoon flash flooding along Western Dedicated Highway near Rewari-Jaipur nexus (+180m delay)',
      icon: Waves,
      color: 'blue',
      data: {
        event_type: 'SEVERE_WEATHER',
        severity: 8.2,
        location_name: 'DMIC NH-48 Rewari-Jaipur Belt',
        latitude: 27.4500,
        longitude: 76.2000,
        impact_radius_km: 50.0,
        affected_mode: 'ROAD',
        estimated_delay_minutes: 180,
      },
    },
    {
      title: 'Chennai Port Container Gate Surge',
      desc: 'Berth waiting times and container dwell delay at CCTL deepwater maritime terminal (+300m delay)',
      icon: Anchor,
      color: 'cyan',
      data: {
        event_type: 'PORT_CONGESTION',
        severity: 7.8,
        location_name: 'Chennai Port Container Terminal (CCTL)',
        latitude: 13.0850,
        longitude: 80.2980,
        impact_radius_km: 25.0,
        affected_mode: 'MARITIME',
        estimated_delay_minutes: 300,
      },
    },
    {
      title: 'Bengaluru Cargo Flight ATFM Air Delay',
      desc: 'Air Traffic Flow Management slot ground stop at BLR Kempegowda Airport (+90m delay)',
      icon: Plane,
      color: 'purple',
      data: {
        event_type: 'FLIGHT_DELAY',
        severity: 7.2,
        location_name: 'BLR Kempegowda Air Cargo Complex',
        latitude: 13.1986,
        longitude: 77.7066,
        impact_radius_km: 30.0,
        affected_mode: 'AIR',
        estimated_delay_minutes: 90,
      },
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setEventType(p.data.event_type);
    setSeverity(p.data.severity);
    setLocationName(p.data.location_name);
    setLatitude(p.data.latitude);
    setLongitude(p.data.longitude);
    setImpactRadius(p.data.impact_radius_km);
    setAffectedMode(p.data.affected_mode);
    setDelayMinutes(p.data.estimated_delay_minutes);
  };

  const handleQuickInject = async (p: typeof presets[0]) => {
    handleApplyPreset(p);
    setLoading(true);
    try {
      const res = await submitDisruptionEvent({
        event_type: p.data.event_type,
        severity: p.data.severity,
        location_name: p.data.location_name,
        latitude: p.data.latitude,
        longitude: p.data.longitude,
        impact_radius_km: p.data.impact_radius_km,
        affected_mode: p.data.affected_mode,
        estimated_delay_minutes: p.data.estimated_delay_minutes,
      });

      setInjectionResult({
        event_id: res.event_id,
        affected_shipments_count: res.affected_shipments_count,
        affected_shipment_ids: res.affected_shipment_ids || [],
        affected_shipments: res.affected_shipments,
      });

      onDisruptionInjected();
    } catch (err) {
      console.error('Failed to quick inject disruption:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInject = async () => {
    setLoading(true);
    try {
      const res = await submitDisruptionEvent({
        event_type: eventType,
        severity,
        location_name: locationName,
        latitude,
        longitude,
        impact_radius_km: impactRadius,
        affected_mode: affectedMode,
        estimated_delay_minutes: delayMinutes,
      });

      setInjectionResult({
        event_id: res.event_id,
        affected_shipments_count: res.affected_shipments_count,
        affected_shipment_ids: res.affected_shipment_ids || [],
        affected_shipments: res.affected_shipments,
      });

      onDisruptionInjected();
    } catch (err) {
      console.error('Failed to inject disruption:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSimulated = async () => {
    setClearing(true);
    try {
      await clearSimulatedDisruptions();
      setInjectionResult(null);
      onDisruptionInjected();
    } catch (err) {
      console.error('Failed to clear simulated events:', err);
    } finally {
      setClearing(false);
    }
  };

  const setCoordinates = (lat: number, lon: number, name: string) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationName(name);
  };

  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-[#4f1896] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#ecdcff] text-[#280057] font-bold">
              CLOSED-LOOP STRESS TEST
            </span>
            <span className="text-xs text-[#424751] font-mono">
              Spatial-Temporal Dynamic Ripple Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c29] mt-1">
            Disruption Simulation Lab
          </h1>
          <p className="text-xs text-[#424751] mt-0.5">
            Inject real-time weather, landslides, and infrastructure closures to stress-test predictive risk recomputation and quantum-classical recovery.
          </p>
        </div>

        <button
          onClick={handleClearSimulated}
          disabled={clearing}
          className="self-start md:self-auto px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${clearing ? 'animate-spin' : ''}`} />
          <span>{clearing ? 'Resetting...' : 'Reset Simulated Events'}</span>
        </button>
      </div>

      {/* Preset Quick Injections */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
            Curated Operational Disruption Scenarios (India Nationwide)
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">1-Click Stress Test</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-[#003c76] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-[#eef4ff] border border-slate-200 text-[#003c76]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.data.affected_mode}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Sev {p.data.severity}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-[#101c29] mt-2.5">{p.title}</h3>
                  <p className="text-[11px] text-[#424751] mt-1 line-clamp-2 leading-relaxed">{p.desc}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition"
                  >
                    Load Parameters
                  </button>
                  <button
                    onClick={() => handleQuickInject(p)}
                    disabled={loading}
                    className="text-[11px] bg-[#003c76] hover:bg-[#00539f] text-white font-bold px-2.5 py-1 rounded shadow-xs flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Quick Inject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Injection Form & Ripple Results Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Custom Event Builder */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Event Configuration Console
            </h3>
            <span className="text-[10px] font-mono text-[#727782]">Live Ingestion Pipeline</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#424751] block mb-1 font-semibold">Disruption Event Type:</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] focus:outline-none focus:border-[#003c76]"
              >
                <option value="TRAFFIC_CONGESTION">TRAFFIC_CONGESTION (Toll Queue / Highway Surge)</option>
                <option value="ROAD_CLOSURE">ROAD_CLOSURE (Landslide / Bridge Infeasibility)</option>
                <option value="SEVERE_WEATHER">SEVERE_WEATHER (Monsoon / Flash Flood / Cyclone)</option>
                <option value="PORT_CONGESTION">PORT_CONGESTION (Gate Queue / Berth Dwell)</option>
                <option value="FLIGHT_DELAY">FLIGHT_DELAY (ATFM Slot / Ground Stop)</option>
                <option value="HAZARD_EARTHQUAKE">HAZARD_EARTHQUAKE (Seismic Telematics)</option>
              </select>
            </div>

            <div>
              <label className="text-[#424751] block mb-1 font-semibold">Corridor Location Name:</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] focus:outline-none focus:border-[#003c76]"
              />
            </div>

            {/* Quick Location Shortcuts */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Corridor Epicenter Shortcuts:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setCoordinates(18.7500, 73.4000, 'NH48 Khandala Ghat Chokepoint')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                >
                  📍 Mumbai-Pune Khandala
                </button>
                <button
                  type="button"
                  onClick={() => setCoordinates(12.9675, 79.9431, 'NH48 Sriperumbudur Toll Corridor')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                >
                  📍 Chennai-BLR Sriperumbudur
                </button>
                <button
                  type="button"
                  onClick={() => setCoordinates(27.4500, 76.2000, 'DMIC NH-48 Rewari-Jaipur Belt')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                >
                  📍 Delhi-Jaipur DMIC
                </button>
                <button
                  type="button"
                  onClick={() => setCoordinates(14.6800, 77.6000, 'NH44 Anantapur Highway Toll')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                >
                  📍 Hyd-BLR Anantapur
                </button>
                <button
                  type="button"
                  onClick={() => setCoordinates(13.0850, 80.2980, 'Chennai Port Maritime Gateway')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                >
                  📍 Chennai Port
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#424751] block mb-1 font-semibold">Epicenter Latitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full py-1 px-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 font-mono text-xs text-[#101c29] focus:outline-none focus:border-[#003c76]"
                />
              </div>
              <div>
                <label className="text-[#424751] block mb-1 font-semibold">Epicenter Longitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full py-1 px-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 font-mono text-xs text-[#101c29] focus:outline-none focus:border-[#003c76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[#424751] mb-1">
                  <span className="font-semibold">Severity Magnitude (0-10):</span>
                  <span className="font-mono text-red-600 font-bold">{severity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={severity}
                  onChange={(e) => setSeverity(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-[#424751] mb-1">
                  <span className="font-semibold">Impact Radius (km):</span>
                  <span className="font-mono text-[#003c76] font-bold">{impactRadius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={impactRadius}
                  onChange={(e) => setImpactRadius(parseFloat(e.target.value))}
                  className="w-full accent-[#003c76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#424751] block mb-1 font-semibold">Affected Transport Mode:</label>
                <select
                  value={affectedMode}
                  onChange={(e) => setAffectedMode(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs text-[#101c29] focus:outline-none focus:border-[#003c76]"
                >
                  <option value="ROAD">ROAD</option>
                  <option value="AIR">AIR</option>
                  <option value="MARITIME">MARITIME</option>
                  <option value="ALL">ALL MODES</option>
                </select>
              </div>
              <div>
                <label className="text-[#424751] block mb-1 font-semibold">Delay Impact (Minutes):</label>
                <input
                  type="number"
                  min="10"
                  max="720"
                  step="10"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 60)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#f8f9ff] border border-slate-200 font-mono text-xs text-amber-700 font-bold focus:outline-none focus:border-[#003c76]"
                />
              </div>
            </div>

            <button
              onClick={handleInject}
              disabled={loading}
              className="w-full mt-3 py-2.5 rounded-lg bg-[#003c76] hover:bg-[#00539f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Propagating Disruption...' : '⚡ Inject Disruption Event & Recompute Risks'}
            </button>
          </div>
        </div>

        {/* Dynamic Ripple Impact Feedback */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-xs font-bold text-[#101c29] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#003c76]" />
                Dynamic Ripple Impact &amp; Replanning
              </h3>
              <span className="text-[10px] font-mono text-[#727782]">Autonomous EWI</span>
            </div>

            {injectionResult ? (
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    DISRUPTION REGISTERED: {injectionResult.event_id}
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Spatial-temporal join matched <span className="font-bold text-[#003c76]">{injectionResult.affected_shipments_count}</span> active consignments within the {impactRadius}km corridor buffer. All risk scores and ETAs have been recomputed.
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#424751] uppercase tracking-wider mb-2">
                    Impacted Consignments Flagged for Recovery:
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {injectionResult.affected_shipments && injectionResult.affected_shipments.length > 0 ? (
                      injectionResult.affected_shipments.map((sh) => (
                        <div
                          key={sh.shipment_id}
                          className="p-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#003c76]">{sh.shipment_id}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                                {sh.cargo_priority === 1 ? '❤️ P1 Medical' : sh.cargo_priority === 2 ? '⚡ P2 Electronics' : 'P3 Industrial'}
                              </span>
                              <span className="font-mono font-bold text-red-600 text-[11px]">
                                Risk {sh.new_risk_score}/10
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 block mt-0.5">
                              {sh.origin} → {sh.destination} ({sh.cargo_type})
                            </span>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-xs font-mono font-bold text-amber-700">
                              +{Math.round(sh.predicted_delay_minutes)}m delay
                            </span>
                            <button
                              onClick={() => onNavigateToRecovery(sh.shipment_id)}
                              className="px-2 py-0.5 rounded bg-[#003c76] hover:bg-[#00539f] text-white text-[10px] font-bold shadow-xs transition"
                            >
                              ⚡ Recover
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      injectionResult.affected_shipment_ids.map((id) => (
                        <div
                          key={id}
                          className="p-2 rounded-lg bg-[#f8f9ff] border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-mono font-bold text-[#003c76]">{id}</span>
                          <button
                            onClick={() => onNavigateToRecovery(id)}
                            className="px-2.5 py-1 rounded bg-[#003c76] hover:bg-[#00539f] text-white text-[11px] font-semibold transition"
                          >
                            Trigger Recovery
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center text-xs text-[#727782] space-y-2 py-8">
                <AlertTriangle className="w-8 h-8 text-[#727782] mx-auto opacity-60" />
                <p className="font-semibold text-[#101c29]">No disruption injected yet in this session.</p>
                <p className="text-[11px] text-[#424751] max-w-sm mx-auto">
                  Select a preset scenario above or configure a custom event in the console to observe real-time risk updates across the logistics network.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#eef4ff] border border-slate-200 text-[11px] text-[#424751] leading-relaxed">
            <strong className="text-[#101c29]">Closed-Loop Dynamic Replanning:</strong> Injected events automatically evaluate affected route segments and trigger the Early Warning Indicator (EWI) to recalculate ETA, SLA breach risk, and quantum-classical recovery plans.
          </div>
        </div>
      </div>

      {/* Active Network Disruptions Registry */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Live Network Disruption Registry ({events.length} Active Events)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">ERA5 Real-Time &amp; Simulated Nodes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                <th className="py-2 px-3">Event ID</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Location</th>
                <th className="py-2 px-3">Mode</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Impact Radius</th>
                <th className="py-2 px-3">Estimated Delay</th>
                <th className="py-2 px-3">Source</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    No active disruptions on the network.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.event_id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold text-[#003c76]">{evt.event_id}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                        {evt.event_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{evt.location_name}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{evt.affected_mode}</td>
                    <td className="py-2 px-3 font-mono font-bold text-red-600">{evt.severity}/10</td>
                    <td className="py-2 px-3 font-mono">{evt.impact_radius_km} km</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-700">+{evt.estimated_delay_minutes} min</td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[140px]">{evt.source}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
