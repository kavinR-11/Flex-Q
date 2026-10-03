import React, { useEffect, useRef } from 'react';
import { Map as MapLibreMap, setWorkerUrl, NavigationControl, Marker, Popup } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DisruptionEvent, Shipment } from '../types';

// Vite worker setup requested by MapLibre & OpenFreeMap
setWorkerUrl(workerUrl);

interface NetworkMapLibreProps {
  shipments?: Shipment[];
  events?: DisruptionEvent[];
  height?: string;
  selectedShipmentId?: string | null;
  onSelectShipment?: (id: string) => void;
  interactive?: boolean;
}

export const NetworkMapLibre: React.FC<NetworkMapLibreProps> = ({
  shipments = [],
  events = [],
  height = '420px',
  selectedShipmentId,
  onSelectShipment,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre GL map with OpenFreeMap Liberty style
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [76.5, 15.6], // Longitude, Latitude for Southern-Western India logistics spine
      zoom: 5.8,
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
      // 1. NH-48 Expressway Corridor (Mumbai -> Pune -> Belagavi -> Bengaluru)
      map.addSource('nh48-corridor', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: 'CORR-NH48-W (Mumbai-BLR Expressway)',
            status: 'OVERLOADED_BOTTLENECK',
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [72.95, 18.95], // JNPT
              [73.40, 18.75], // Khandala Ghat
              [73.85, 18.52], // Pune
              [74.20, 16.70], // Kolhapur
              [74.50, 15.85], // Belagavi
              [75.12, 15.36], // Hubballi
              [75.92, 14.46], // Davanagere
              [76.92, 13.34], // Tumakuru
              [77.59, 12.97], // Bengaluru
            ],
          },
        },
      });

      map.addLayer({
        id: 'nh48-line',
        type: 'line',
        source: 'nh48-corridor',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#d32f2f',
          'line-width': 4.5,
          'line-dasharray': [2, 2],
        },
      });

      // 2. WDFC Dedicated Electric Rail Spine (Bypass: JNPT -> Solapur -> Guntakal -> BLR)
      map.addSource('wdfc-rail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: 'CORR-WDFC-RAIL (Dedicated Freight Spine)',
            status: 'OPTIMAL_BYPASS',
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [73.12, 18.99], // Panvel Rail Yard
              [74.00, 18.40], // Daund Jn
              [75.90, 17.65], // Solapur
              [76.85, 16.50], // Raichur
              [77.37, 15.15], // Guntakal Interchange
              [77.60, 13.90], // Hindupur
              [77.59, 12.97], // Bengaluru ICD
            ],
          },
        },
      });

      map.addLayer({
        id: 'wdfc-line',
        type: 'line',
        source: 'wdfc-rail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00897b',
          'line-width': 4,
        },
      });

      // 3. NH-44 North-South Highway Spine (Hyderabad -> Anantapur -> BLR)
      map.addSource('nh44-corridor', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: 'CORR-NH44-S (Hyderabad-BLR Spine)',
            status: 'MODERATE_FLOW',
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [78.48, 17.38], // Hyderabad
              [78.03, 15.82], // Kurnool
              [77.60, 14.68], // Anantapur
              [77.59, 12.97], // Bengaluru
            ],
          },
        },
      });

      map.addLayer({
        id: 'nh44-line',
        type: 'line',
        source: 'nh44-corridor',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#005eb5',
          'line-width': 3.5,
        },
      });

      // 4. Chennai-Bengaluru Industrial Corridor (NH-48 East)
      map.addSource('maa-blr-corridor', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: 'CORR-MAA-BLR (Chennai-BLR Corridor)',
            status: 'ACTIVE_TRANSIT',
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [80.27, 13.08], // Chennai Port
              [79.94, 12.97], // Sriperumbudur
              [79.13, 12.92], // Vellore
              [78.21, 12.52], // Krishnagiri
              [77.82, 12.74], // Hosur
              [77.59, 12.97], // Bengaluru
            ],
          },
        },
      });

      map.addLayer({
        id: 'maa-blr-line',
        type: 'line',
        source: 'maa-blr-corridor',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#5e2ca5',
          'line-width': 3.5,
        },
      });

      // Add Hub Markers with custom styled HTML elements
      const hubs = [
        {
          id: 'BOM_JNPT',
          name: 'Mumbai JNPT Port Hub',
          coords: [72.95, 18.95] as [number, number],
          type: 'PORT / MARITIME',
          desc: 'Primary Western container terminal. Berth dwell: 18.2h.',
          color: '#003c76',
        },
        {
          id: 'KHANDALA_CHOKE',
          name: 'Khandala Ghat Landslide Chokepoint',
          coords: [73.40, 18.75] as [number, number],
          type: 'CRITICAL BOTTLENECK',
          desc: 'Severe landslide debris clearance. Flow capacity reduced to 15%.',
          color: '#d32f2f',
          pulse: true,
        },
        {
          id: 'PUNE_HUB',
          name: 'Pune Industrial Logistics Hub',
          coords: [73.85, 18.52] as [number, number],
          type: 'ROAD / JIT',
          desc: 'Auto-cluster consignment hub. 42 consignments active.',
          color: '#005eb5',
        },
        {
          id: 'BLR_ICD',
          name: 'Bengaluru ICD Whitefield',
          coords: [77.59, 12.97] as [number, number],
          type: 'INLAND CONTAINER DEPOT',
          desc: 'Primary Southern high-value fulfillment destination.',
          color: '#00897b',
        },
        {
          id: 'MAA_PORT',
          name: 'Chennai Port Maritime Terminal',
          coords: [80.27, 13.08] as [number, number],
          type: 'PORT / MARITIME',
          desc: 'East Coast deep-water container terminal.',
          color: '#003c76',
        },
        {
          id: 'HYD_HUB',
          name: 'Hyderabad Freight Spine',
          coords: [78.48, 17.38] as [number, number],
          type: 'MULTIMODAL HUB',
          desc: 'Central pharma & aerospace dispatch center.',
          color: '#5e2ca5',
        },
      ];

      hubs.forEach((hub) => {
        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker';
        el.style.width = hub.pulse ? '22px' : '18px';
        el.style.height = hub.pulse ? '22px' : '18px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = hub.color;
        el.style.border = '2.5px solid white';
        el.style.boxShadow = hub.pulse
          ? '0 0 0 4px rgba(211, 47, 47, 0.4), 0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 6px rgba(0,0,0,0.25)';
        el.style.cursor = 'pointer';

        const popupHtml = `
          <div style="font-family: 'Roboto Flex', sans-serif; font-size: 12px; color: #101c29; padding: 4px;">
            <div style="font-size: 10px; font-weight: 800; color: ${hub.color}; text-transform: uppercase;">
              ${hub.type}
            </div>
            <div style="font-weight: 700; font-size: 13px; margin-top: 2px;">
              ${hub.name}
            </div>
            <p style="margin: 4px 0 0 0; color: #424751; line-height: 1.35;">
              ${hub.desc}
            </p>
          </div>
        `;

        const popup = new Popup({ offset: 12, closeButton: false }).setHTML(popupHtml);

        const marker = new Marker({ element: el })
          .setLngLat(hub.coords)
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [interactive]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div
        ref={mapContainerRef}
        id="maplibre-container"
        style={{ height, width: '100%' }}
      />
      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-xs font-sans text-slate-700 pointer-events-auto flex items-center gap-4 flex-wrap">
        <span className="font-bold text-[10px] uppercase text-slate-400">MapLibre Vector Engine:</span>
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <span className="w-3.5 h-1 bg-red-600 inline-block rounded-xs"></span>
          <span>NH-48 Choke (Late)</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <span className="w-3.5 h-1 bg-emerald-600 inline-block rounded-xs"></span>
          <span>WDFC Rail (Bypass)</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <span className="w-3.5 h-1 bg-blue-600 inline-block rounded-xs"></span>
          <span>NH-44 North-South</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <span className="w-3.5 h-1 bg-purple-700 inline-block rounded-xs"></span>
          <span>Chennai-BLR Corridor</span>
        </div>
      </div>
    </div>
  );
};
