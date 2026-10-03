import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, setWorkerUrl, NavigationControl, Marker, Popup, LngLatBounds } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DisruptionEvent, Shipment } from '../types';

// Vite worker setup for MapLibre & OpenFreeMap
setWorkerUrl(workerUrl);

interface NetworkMapLibreProps {
  shipments?: Shipment[];
  events?: DisruptionEvent[];
  height?: string;
  selectedShipmentId?: string | null;
  onSelectShipment?: (id: string) => void;
  interactive?: boolean;
}

interface CorridorConfig {
  id: string;
  name: string;
  color: string;
  dash?: [number, number];
  width: number;
  coordinates: [number, number][];
  bounds: [[number, number], [number, number]];
}

// 7 Major Indian Logistics Corridors spanning nationwide
const CORRIDORS: CorridorConfig[] = [
  {
    id: 'corr-del-bom',
    name: 'Delhi-Mumbai DMIC Expressway & WDFC Rail',
    color: '#d97706', // Amber-600
    width: 4,
    coordinates: [
      [77.20, 28.61], // Delhi NCR
      [76.85, 27.95], // Rewari
      [75.78, 26.91], // Jaipur
      [74.63, 26.44], // Ajmer
      [73.71, 24.58], // Udaipur
      [72.57, 23.02], // Ahmedabad
      [73.18, 22.30], // Vadodara
      [72.83, 21.17], // Surat
      [72.91, 20.37], // Vapi
      [72.95, 18.95], // Mumbai JNPT
    ],
    bounds: [[72.0, 18.5], [77.5, 29.0]],
  },
  {
    id: 'corr-nh48-w',
    name: 'NH-48 West Expressway (Mumbai-Pune-BLR)',
    color: '#dc2626', // Red-600
    dash: [2, 2],
    width: 4.5,
    coordinates: [
      [72.95, 18.95], // Mumbai JNPT
      [73.40, 18.75], // Khandala Ghat
      [73.85, 18.52], // Pune
      [74.20, 16.70], // Kolhapur
      [74.50, 15.85], // Belagavi
      [75.12, 15.36], // Hubballi
      [75.92, 14.46], // Davanagere
      [76.92, 13.34], // Tumakuru
      [77.59, 12.97], // Bengaluru
    ],
    bounds: [[72.5, 12.5], [78.0, 19.5]],
  },
  {
    id: 'corr-wdfc-rail',
    name: 'WDFC Dedicated Electric Rail (Bypass)',
    color: '#059669', // Emerald-600
    width: 4,
    coordinates: [
      [73.12, 18.99], // Panvel Yard
      [74.00, 18.40], // Daund Jn
      [75.90, 17.65], // Solapur
      [76.85, 16.50], // Raichur
      [77.37, 15.15], // Guntakal Interchange
      [77.60, 13.90], // Hindupur
      [77.59, 12.97], // Bengaluru ICD
    ],
    bounds: [[72.8, 12.7], [78.0, 19.2]],
  },
  {
    id: 'corr-nh44-s',
    name: 'NH-44 North-South (Hyderabad-BLR Spine)',
    color: '#2563eb', // Blue-600
    width: 3.5,
    coordinates: [
      [78.48, 17.38], // Hyderabad
      [78.03, 15.82], // Kurnool
      [77.60, 14.68], // Anantapur
      [77.72, 13.43], // Chikballapur
      [77.59, 12.97], // Bengaluru
    ],
    bounds: [[77.2, 12.6], [78.8, 17.8]],
  },
  {
    id: 'corr-maa-blr',
    name: 'Chennai-BLR Corridor (NH-48 East)',
    color: '#7c3aed', // Purple-600
    width: 3.5,
    coordinates: [
      [80.27, 13.08], // Chennai Port
      [79.94, 12.97], // Sriperumbudur
      [79.13, 12.92], // Vellore
      [78.21, 12.52], // Krishnagiri
      [77.82, 12.74], // Hosur
      [77.59, 12.97], // Bengaluru
    ],
    bounds: [[77.3, 12.3], [80.5, 13.4]],
  },
  {
    id: 'corr-maa-hyd',
    name: 'Chennai-Hyderabad Corridor (NH-16 / NH-65)',
    color: '#0284c7', // Sky-600
    width: 3.5,
    coordinates: [
      [80.27, 13.08], // Chennai Port
      [79.98, 14.44], // Nellore
      [80.05, 15.50], // Ongole
      [80.64, 16.50], // Vijayawada
      [79.62, 17.14], // Suryapet
      [78.48, 17.38], // Hyderabad Hub
    ],
    bounds: [[78.2, 12.8], [80.8, 17.6]],
  },
  {
    id: 'corr-maa-cjb',
    name: 'Chennai-Salem-Coimbatore Auto Corridor (NH-544)',
    color: '#db2777', // Pink-600
    width: 3.5,
    coordinates: [
      [80.27, 13.08], // Chennai
      [79.70, 12.83], // Kanchipuram
      [78.14, 11.66], // Salem
      [77.72, 11.34], // Erode
      [76.95, 11.01], // Coimbatore
    ],
    bounds: [[76.6, 10.8], [80.5, 13.3]],
  },
  {
    id: 'corr-air-del-bom',
    name: 'DEL-BOM Priority Air Freight Lane',
    color: '#ea580c', // Orange-600
    dash: [4, 3],
    width: 2.5,
    coordinates: [
      [77.20, 28.61], // Delhi IGI
      [75.10, 23.80], // High altitude midpoint
      [72.95, 18.95], // Mumbai BOM
    ],
    bounds: [[72.0, 18.5], [77.5, 29.0]],
  },
];

// Strategic Hubs across India
const HUBS = [
  {
    id: 'DEL_ICD',
    name: 'Delhi NCR ICD Tughlakabad / IGI Cargo',
    coords: [77.20, 28.61] as [number, number],
    type: 'NATIONAL CAPITAL INLAND PORT',
    desc: 'Northern rail-freight gateway & international air cargo hub.',
    color: '#003c76',
  },
  {
    id: 'AMD_HUB',
    name: 'Ahmedabad Multimodal Gateway',
    coords: [72.57, 23.02] as [number, number],
    type: 'WESTERN LOGISTICS NEXUS',
    desc: 'Western manufacturing & chemicals junction to Mundra/Kandla.',
    color: '#005eb5',
  },
  {
    id: 'BOM_JNPT',
    name: 'Mumbai JNPT Port & Logistics Hub',
    coords: [72.95, 18.95] as [number, number],
    type: 'MARITIME CONTAINER PORT',
    desc: 'Primary Western container terminal. Berth dwell: 18.2h.',
    color: '#003c76',
  },
  {
    id: 'KHANDALA_CHOKE',
    name: 'Khandala Ghat Landslide Chokepoint',
    coords: [73.40, 18.75] as [number, number],
    type: 'CRITICAL BOTTLENECK',
    desc: 'Active landslide debris clearance. Flow capacity reduced to 15%.',
    color: '#d32f2f',
    pulse: true,
  },
  {
    id: 'PUNE_HUB',
    name: 'Pune Industrial Logistics Hub',
    coords: [73.85, 18.52] as [number, number],
    type: 'AUTO & INDUSTRIAL HUB',
    desc: 'Automotive tier-1 dispatch center. Connected to NH-48.',
    color: '#005eb5',
  },
  {
    id: 'HYD_HUB',
    name: 'Hyderabad Shamshabad Multimodal Cargo',
    coords: [78.48, 17.38] as [number, number],
    type: 'AEROSPACE & PHARMA HUB',
    desc: 'Pharma cold-chain & aerospace air freight interchange.',
    color: '#5e2ca5',
  },
  {
    id: 'BLR_ICD',
    name: 'Bengaluru ICD Whitefield & KIA Cargo',
    coords: [77.59, 12.97] as [number, number],
    type: 'INLAND CONTAINER DEPOT',
    desc: 'Primary Southern high-value fulfillment destination.',
    color: '#00897b',
  },
  {
    id: 'MAA_PORT',
    name: 'Chennai Port Maritime Terminal',
    coords: [80.27, 13.08] as [number, number],
    type: 'DEEPWATER MARITIME PORT',
    desc: 'East Coast international container gateway.',
    color: '#003c76',
  },
  {
    id: 'CJB_HUB',
    name: 'Coimbatore Precision Logistics Node',
    coords: [76.95, 11.01] as [number, number],
    type: 'MANUFACTURING & AUTO CLUSTER',
    desc: 'Precision engineering & industrial spares dispatch center.',
    color: '#db2777',
  },
  {
    id: 'VJA_HUB',
    name: 'Vijayawada Eastern Freight Interchange',
    coords: [80.64, 16.50] as [number, number],
    type: 'EASTERN TRANSIT JUNCTION',
    desc: 'Rail-highway interchange connecting South to Eastern corridors.',
    color: '#0284c7',
  },
];

export const NetworkMapLibre: React.FC<NetworkMapLibreProps> = ({
  shipments = [],
  events = [],
  height = '480px',
  selectedShipmentId,
  onSelectShipment,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const hubMarkersRef = useRef<Marker[]>([]);
  const shipmentMarkersRef = useRef<Marker[]>([]);
  const eventMarkersRef = useRef<Marker[]>([]);

  // Filtering state
  const [filterCriticalOnly, setFilterCriticalOnly] = useState<boolean>(false);
  const [activeCorridorId, setActiveCorridorId] = useState<string>('all');

  // Initialize MapLibre GL map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates for nationwide India freight view
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [78.6, 20.2], // Center of India
      zoom: 4.8,
      interactive: interactive,
      attributionControl: {
        compact: true,
      },
    });

    if (interactive) {
      map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    }

    mapInstanceRef.current = map;

    map.on('load', () => {
      // Add all 7 nationwide logistics corridors as GeoJSON sources & layers
      CORRIDORS.forEach((corr) => {
        map.addSource(corr.id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              name: corr.name,
            },
            geometry: {
              type: 'LineString',
              coordinates: corr.coordinates,
            },
          },
        });

        map.addLayer({
          id: `${corr.id}-line`,
          type: 'line',
          source: corr.id,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': corr.color,
            'line-width': corr.width,
            ...(corr.dash ? { 'line-dasharray': corr.dash } : {}),
          },
        });
      });

      // Add Hub Markers with rich tooltip popups
      HUBS.forEach((hub) => {
        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker';
        el.style.width = hub.pulse ? '22px' : '16px';
        el.style.height = hub.pulse ? '22px' : '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = hub.color;
        el.style.border = '2.5px solid white';
        el.style.boxShadow = hub.pulse
          ? '0 0 0 5px rgba(211, 47, 47, 0.45), 0 2px 8px rgba(0,0,0,0.35)'
          : '0 2px 6px rgba(0,0,0,0.25)';
        el.style.cursor = 'pointer';

        const popupHtml = `
          <div style="font-family: 'Roboto Flex', sans-serif; font-size: 12px; color: #101c29; padding: 4px; min-width: 170px;">
            <div style="font-size: 10px; font-weight: 800; color: ${hub.color}; text-transform: uppercase; letter-spacing: 0.5px;">
              ${hub.type}
            </div>
            <div style="font-weight: 700; font-size: 13px; margin-top: 3px; color: #003c76;">
              ${hub.name}
            </div>
            <p style="margin: 4px 0 0 0; color: #424751; line-height: 1.35; font-size: 11px;">
              ${hub.desc}
            </p>
          </div>
        `;

        const popup = new Popup({ offset: 12, closeButton: false }).setHTML(popupHtml);

        const marker = new Marker({ element: el })
          .setLngLat(hub.coords)
          .setPopup(popup)
          .addTo(map);

        hubMarkersRef.current.push(marker);
      });
    });

    return () => {
      hubMarkersRef.current.forEach((m) => m.remove());
      hubMarkersRef.current = [];
      shipmentMarkersRef.current.forEach((m) => m.remove());
      shipmentMarkersRef.current = [];
      eventMarkersRef.current.forEach((m) => m.remove());
      eventMarkersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [interactive]);

  // Dynamic Shipment & Disruption Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous dynamic markers
    shipmentMarkersRef.current.forEach((m) => m.remove());
    shipmentMarkersRef.current = [];
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];

    // Filter shipments to plot
    let displayedShipments = shipments;
    if (filterCriticalOnly) {
      displayedShipments = shipments.filter(
        (s) => (s.risk_score >= 7) || s.current_status === 'critical' || s.current_status === 'delayed'
      );
    } else {
      // Prioritize critical/delayed + sample others so the map remains responsive
      const highPriority = shipments.filter((s) => s.risk_score >= 7);
      const others = shipments.filter((s) => s.risk_score < 7).slice(0, 35);
      displayedShipments = [...highPriority, ...others];
    }

    // Render Shipment Markers
    displayedShipments.forEach((s) => {
      const lat = s.current_lat || s.origin_lat;
      const lon = s.current_lon || s.origin_lon;
      if (!lat || !lon) return;

      const isSelected = s.shipment_id === selectedShipmentId;
      const isCritical = s.risk_score >= 8 || s.current_status === 'critical';
      const isDelayed = s.risk_score === 7 || s.current_status === 'delayed';

      const pinColor = isCritical ? '#dc2626' : isDelayed ? '#d97706' : s.risk_score >= 4 ? '#2563eb' : '#059669';
      const size = isSelected ? 24 : isCritical ? 20 : 16;

      const el = document.createElement('div');
      el.className = 'shipment-map-marker';
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = '50%';
      el.style.backgroundColor = pinColor;
      el.style.border = isSelected ? '3px solid #facc15' : '2px solid #ffffff';
      el.style.boxShadow = isCritical || isSelected
        ? `0 0 0 4px ${pinColor}44, 0 3px 8px rgba(0,0,0,0.4)`
        : '0 2px 6px rgba(0,0,0,0.25)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '9px';
      el.style.fontWeight = 'bold';
      el.innerText = isCritical ? '!' : s.transport_mode ? s.transport_mode[0] : '•';

      const delayMin = Math.round(s.predicted_delay_minutes || 0);
      const delayBadge = delayMin > 0 ? `+${delayMin}m delay` : 'On Schedule';
      const delayColor = delayMin > 60 ? '#dc2626' : delayMin > 0 ? '#d97706' : '#059669';

      const popupHtml = `
        <div style="font-family: 'Roboto Flex', sans-serif; font-size: 12px; color: #101c29; padding: 6px; min-width: 190px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 13px; color: #003c76;">${s.shipment_id}</span>
            <span style="background: ${pinColor}15; color: ${pinColor}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid ${pinColor}40;">
              Risk ${s.risk_score}/10
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            <strong>${s.origin}</strong> → <strong>${s.destination}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; color: #64748b;">
            <span>Mode: <strong>${s.transport_mode}</strong></span>
            <span>Carrier: <strong>${s.carrier_id}</strong></span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${delayColor}; margin-bottom: 8px;">
            ETA Status: ${delayBadge}
          </div>
          <button id="btn-eval-${s.shipment_id}" style="width: 100%; padding: 5px 8px; background: #003c76; color: white; border: none; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">
            ⚡ Evaluate in Recovery Center
          </button>
        </div>
      `;

      const popup = new Popup({ offset: 14 }).setHTML(popupHtml);

      popup.on('open', () => {
        const btn = document.getElementById(`btn-eval-${s.shipment_id}`);
        if (btn && onSelectShipment) {
          btn.onclick = () => {
            onSelectShipment(s.shipment_id);
          };
        }
      });

      const marker = new Marker({ element: el })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);

      shipmentMarkersRef.current.push(marker);
    });

    // Render Disruption Event Markers
    events.forEach((evt) => {
      if (!evt.latitude || !evt.longitude) return;

      const el = document.createElement('div');
      el.className = 'event-hazard-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#f59e0b';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.4), 0 2px 6px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '12px';
      el.style.cursor = 'pointer';
      el.innerText = '⚠️';

      const popupHtml = `
        <div style="font-family: 'Roboto Flex', sans-serif; font-size: 12px; color: #101c29; padding: 4px; min-width: 180px;">
          <div style="font-size: 10px; font-weight: 800; color: #d97706; text-transform: uppercase;">
            ${evt.event_type.replace(/_/g, ' ')}
          </div>
          <div style="font-weight: 700; font-size: 12px; margin-top: 2px;">
            ${evt.location_name}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            Severity: <strong>${evt.severity}/5</strong> | Impact: <strong>${evt.impact_radius_km} km</strong>
          </div>
          <div style="font-size: 11px; color: #dc2626; font-weight: 600; margin-top: 2px;">
            Est. Delay: +${evt.estimated_delay_minutes} min (${evt.affected_mode})
          </div>
        </div>
      `;

      const popup = new Popup({ offset: 14, closeButton: false }).setHTML(popupHtml);

      const marker = new Marker({ element: el })
        .setLngLat([evt.longitude, evt.latitude])
        .setPopup(popup)
        .addTo(map);

      eventMarkersRef.current.push(marker);
    });
  }, [shipments, events, filterCriticalOnly, selectedShipmentId, onSelectShipment]);

  // Handle corridor focus
  const focusCorridor = (corrId: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setActiveCorridorId(corrId);

    if (corrId === 'all') {
      map.flyTo({
        center: [78.6, 20.2],
        zoom: 4.8,
        essential: true,
      });
      return;
    }

    const corr = CORRIDORS.find((c) => c.id === corrId);
    if (corr) {
      map.fitBounds(new LngLatBounds(corr.bounds[0], corr.bounds[1]), {
        padding: 50,
        maxZoom: 7.5,
        essential: true,
      });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Top Interactive Corridor Selector Bar */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1.5 flex-wrap max-w-[calc(100%-60px)]">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Corridors:</span>
        <button
          onClick={() => focusCorridor('all')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'all'
              ? 'bg-[#003c76] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🇮🇳 All India
        </button>
        <button
          onClick={() => focusCorridor('corr-del-bom')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'corr-del-bom'
              ? 'bg-[#d97706] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Delhi-Mumbai DMIC
        </button>
        <button
          onClick={() => focusCorridor('corr-nh48-w')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'corr-nh48-w'
              ? 'bg-[#dc2626] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Mumbai-BLR NH-48
        </button>
        <button
          onClick={() => focusCorridor('corr-maa-blr')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'corr-maa-blr'
              ? 'bg-[#7c3aed] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chennai-BLR
        </button>
        <button
          onClick={() => focusCorridor('corr-nh44-s')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'corr-nh44-s'
              ? 'bg-[#2563eb] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Hyd-BLR NH-44
        </button>
        <button
          onClick={() => focusCorridor('corr-maa-hyd')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'corr-maa-hyd'
              ? 'bg-[#0284c7] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chennai-Hyd
        </button>
        <button
          onClick={() => focusCorridor('corr-maa-cjb')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
            activeCorridorId === 'corr-maa-cjb'
              ? 'bg-[#db2777] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chennai-Coimbatore
        </button>

        {/* Filter Critical Only Pill */}
        <div className="h-3.5 w-px bg-slate-300 mx-1"></div>
        <button
          onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors flex items-center gap-1 ${
            filterCriticalOnly
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-pulse"></span>
          <span>Critical Only (Risk ≥ 7)</span>
        </button>
      </div>

      {/* Main Map Canvas */}
      <div
        ref={mapContainerRef}
        id="maplibre-container"
        style={{ height, width: '100%' }}
      />

      {/* Rich Multi-Corridor & Telematics Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-xs font-sans text-slate-700 pointer-events-auto flex items-center gap-3.5 flex-wrap max-w-[calc(100%-24px)]">
        <span className="font-bold text-[10px] uppercase text-slate-400">Freight Corridors:</span>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#d97706] inline-block rounded-xs"></span>
          <span>Delhi-Mumbai (DMIC)</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#dc2626] inline-block rounded-xs border-b border-dashed border-white"></span>
          <span>NH-48 West (Late)</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#059669] inline-block rounded-xs"></span>
          <span>WDFC Rail (Bypass)</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#2563eb] inline-block rounded-xs"></span>
          <span>NH-44 Hyd-BLR</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#7c3aed] inline-block rounded-xs"></span>
          <span>Chennai-BLR</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#0284c7] inline-block rounded-xs"></span>
          <span>Chennai-Hyd</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-1 bg-[#db2777] inline-block rounded-xs"></span>
          <span>Chennai-Coimbatore</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <span className="w-3 h-0.5 bg-[#ea580c] inline-block rounded-xs border-b border-dashed border-slate-700"></span>
          <span>Air Cargo Arc</span>
        </div>

        <div className="h-3.5 w-px bg-slate-300"></div>
        <span className="font-bold text-[10px] uppercase text-slate-400">Pins:</span>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span>Critical (≥8)</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Delayed (7)</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <span>In-Transit</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-amber-500 text-[11px]">⚠️</span>
          <span>Incident Hazard</span>
        </div>
      </div>
    </div>
  );
};
