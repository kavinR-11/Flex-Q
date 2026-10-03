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
  AlertTriangle 
} from 'lucide-react';
import { DisruptionEvent } from '../types';
import { submitDisruptionEvent } from '../services/api';

interface DisruptionLabViewProps {
  events: DisruptionEvent[];
  onDisruptionInjected: () => void;
  onNavigateToRecovery: (shipmentId: string) => void;
}

export const DisruptionLabView: React.FC<DisruptionLabViewProps> = ({
  events,
  onDisruptionInjected,
  onNavigateToRecovery,
}) => {
  const [eventType, setEventType] = useState('TRAFFIC_CONGESTION');
  const [severity, setSeverity] = useState(8.5);
  const [locationName, setLocationName] = useState('NH48 Sriperumbudur Corridor');
  const [latitude, setLatitude] = useState(12.9675);
  const [longitude, setLongitude] = useState(79.9431);
  const [impactRadius, setImpactRadius] = useState(35.0);
  const [affectedMode, setAffectedMode] = useState('ROAD');
  const [delayMinutes, setDelayMinutes] = useState(120);
  const [loading, setLoading] = useState(false);
  const [injectionResult, setInjectionResult] = useState<{
    event_id: string;
    affected_shipments_count: number;
    affected_shipment_ids: string[];
  } | null>(null);

  const presets = [
    {
      title: 'NH48 Sriperumbudur Severe Congestion',
      desc: 'Heavy traffic and monsoon puddling on Chennai-BLR arterial lane (+120m delay)',
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
      title: 'Walajapet Bridge Structural Maintenance Closure',
      desc: 'Complete highway closure forcing rerouting via northern bypass (+210m delay)',
      icon: Construction,
      color: 'rose',
      data: {
        event_type: 'ROAD_CLOSURE',
        severity: 9.8,
        location_name: 'NH48 Walajapet Arterial Bridge',
        latitude: 12.9250,
        longitude: 79.3800,
        impact_radius_km: 25.0,
        affected_mode: 'ROAD',
        estimated_delay_minutes: 210,
      },
    },
    {
      title: 'Chennai Port Container Gate Surge',
      desc: 'Berth waiting times and container dwell delay at CCTL (+300m delay)',
      icon: Anchor,
      color: 'cyan',
      data: {
        event_type: 'PORT_CONGESTION',
        severity: 7.8,
        location_name: 'Chennai Port Container Terminal (CCTL)',
        latitude: 13.0850,
        longitude: 80.2980,
        impact_radius_km: 20.0,
        affected_mode: 'MARITIME',
        estimated_delay_minutes: 300,
      },
    },
    {
      title: 'Bengaluru Cargo Flight ATFM Air Delay',
      desc: 'Air Traffic Flow Management slot ground stop at BLR Kempegowda (+90m delay)',
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

  const handleInject = async () => {
    setLoading(true);
    setInjectionResult(null);
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
      setInjectionResult(res);
      onDisruptionInjected();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
            SIMULATION SANDBOX
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Spatial-Temporal Dynamic Ripple Engine
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
          Disruption Simulation Lab
        </h1>
        <p className="text-sm text-slate-400">
          Inject real-time weather, traffic bottlenecks, and infrastructure closures to stress-test predictive risk recomputation and dynamic recovery.
        </p>
      </div>

      {/* Preset Quick Injections */}
      <div>
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Curated Operational Disruption Scenarios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="glass-panel rounded-2xl p-4 cursor-pointer hover:border-slate-600 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      Sev {p.data.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 text-[11px] text-cyan-400 font-medium flex items-center justify-between">
                  <span>Load Preset</span>
                  <span>+{p.data.estimated_delay_minutes}m</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Injection Form & Ripple Results Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Event Builder */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Event Configuration Console
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live Ingestion Pipeline</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Disruption Event Type:</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="TRAFFIC_CONGESTION">TRAFFIC_CONGESTION</option>
                <option value="ROAD_CLOSURE">ROAD_CLOSURE (Hard Infeasibility)</option>
                <option value="SEVERE_WEATHER">SEVERE_WEATHER (Monsoon / Cyclone)</option>
                <option value="PORT_CONGESTION">PORT_CONGESTION (Gate / Berth)</option>
                <option value="FLIGHT_DELAY">FLIGHT_DELAY (ATFM / Ground Stop)</option>
                <option value="HAZARD_EARTHQUAKE">HAZARD_EARTHQUAKE (Seismic Telematics)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Corridor Location Name:</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Epicenter Latitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Epicenter Longitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Severity Magnitude (0-10):</span>
                  <span className="font-mono text-rose-400 font-bold">{severity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={severity}
                  onChange={(e) => setSeverity(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Impact Radius (km):</span>
                  <span className="font-mono text-cyan-400 font-bold">{impactRadius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={impactRadius}
                  onChange={(e) => setImpactRadius(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Affected Mode:</label>
                <select
                  value={affectedMode}
                  onChange={(e) => setAffectedMode(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ROAD">ROAD</option>
                  <option value="AIR">AIR</option>
                  <option value="MARITIME">MARITIME</option>
                  <option value="ALL">ALL MODES</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Delay Impact (Minutes):</label>
                <input
                  type="number"
                  min="10"
                  max="720"
                  step="10"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 60)}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-amber-400 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleInject}
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition"
            >
              <Send className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Propagating Disruption...' : 'Inject Disruption Event & Recompute Risks'}
            </button>
          </div>
        </div>

        {/* Dynamic Ripple Impact Feedback */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Dynamic Ripple Impact & Replanning
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Autonomous EWI</span>
            </div>

            {injectionResult ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    EVENT REGISTERED: {injectionResult.event_id}
                  </div>
                  <p className="text-xs text-slate-300">
                    Spatial-temporal join matched <span className="font-bold text-cyan-400">{injectionResult.affected_shipments_count}</span> active consignments within the {impactRadius}km corridor buffer.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Impacted Shipments (Risk Scores Recomputed)
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {injectionResult.affected_shipment_ids.map((id) => (
                      <div
                        key={id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono font-bold text-cyan-400">{id}</span>
                        <button
                          onClick={() => onNavigateToRecovery(id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition"
                        >
                          Trigger Recovery
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No disruption injected yet in this session.</p>
                <p className="text-[11px] text-slate-400">
                  Select a preset scenario or configure a custom event above to observe real-time risk updates across the logistics network.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400">
            <b>Replanning Principle:</b> Injected events automatically evaluate affected route segments and trigger the Early Warning Indicator (EWI) to recalculate ETA, SLA breach risk, and OR-Tools recovery plans.
          </div>
        </div>
      </div>
    </div>
  );
};
