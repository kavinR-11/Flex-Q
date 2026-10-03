import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shipment, DisruptionEvent } from '../types';

interface RouteMapViewProps {
  shipments: Shipment[];
  events: DisruptionEvent[];
  selectedShipmentId: string | null;
  onSelectShipment: (id: string) => void;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  shipments,
  events,
  selectedShipmentId,
  onSelectShipment,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered between Chennai and Bengaluru
      const map = L.map(mapContainerRef.current, {
        center: [13.00, 79.50],
        zoom: 7,
        zoomControl: true,
      });

      // Dark theme CartoDB basemap tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing dynamic layers except tilelayer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // 1. Draw Primary Highway Corridor Polylines
    // NH48 Corridor (Chennai -> Bengaluru)
    const nh48Coords: [number, number][] = [
      [13.0827, 80.2707], // Chennai Port
      [12.9675, 79.9431], // Sriperumbudur
      [12.9250, 79.3800], // Walajapet
      [12.9165, 79.1325], // Vellore
      [12.6825, 78.6186], // Vaniyambadi
      [12.5186, 78.2137], // Krishnagiri
      [12.7409, 77.8253], // Hosur
      [12.9716, 77.5946], // Bengaluru
    ];
    L.polyline(nh48Coords, {
      color: '#06b6d4',
      weight: 3.5,
      opacity: 0.8,
      dashArray: '5, 5',
    }).addTo(map).bindPopup('<b>Corridor NH48</b><br/>Chennai ↔ Bengaluru Linehaul');

    // Alternate NH717 Bypass Corridor (Green)
    const alternateCoords: [number, number][] = [
      [12.9675, 79.9431], // Sriperumbudur
      [13.0800, 79.5500], // Arakkonam Bypass
      [13.1400, 78.9000], // Chittoor Bypass
      [12.9716, 77.5946], // Bengaluru
    ];
    L.polyline(alternateCoords, {
      color: '#10b981',
      weight: 3,
      opacity: 0.7,
    }).addTo(map).bindPopup('<b>Alternate Route B</b><br/>NH717 Northern Bypass (Recovery Corridor)');

    // 2. Plot Active Disruption Impact Circles
    events.forEach((evt) => {
      const isRoad = evt.affected_mode === 'ROAD';
      const circleColor = evt.severity >= 8.0 ? '#ef4444' : '#f59e0b';
      
      const circle = L.circle([evt.latitude, evt.longitude], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.25,
        radius: evt.impact_radius_km * 1000,
        weight: 1.5,
      }).addTo(map);

      circle.bindPopup(`
        <div style="font-size: 12px; line-height: 1.4;">
          <b style="color: ${circleColor};">${evt.event_type}</b><br/>
          <b>Location:</b> ${evt.location_name}<br/>
          <b>Severity:</b> ${evt.severity}/10<br/>
          <b>Est. Delay:</b> +${evt.estimated_delay_minutes} mins<br/>
          <b>Impact Radius:</b> ${evt.impact_radius_km} km
        </div>
      `);
    });

    // 3. Plot Shipments
    shipments.slice(0, 40).forEach((sh) => {
      const isSelected = sh.shipment_id === selectedShipmentId;
      const isCritical = sh.risk_score >= 8;
      const isModerate = sh.risk_score >= 4 && sh.risk_score < 8;
      const markerColor = isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-shipment-marker',
        html: `
          <div style="
            width: ${isSelected ? '24px' : '16px'};
            height: ${isSelected ? '24px' : '16px'};
            background-color: ${markerColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px ${markerColor};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: bold;
            color: black;
          ">
            ${isSelected ? '★' : ''}
          </div>
        `,
        iconSize: [isSelected ? 24 : 16, isSelected ? 24 : 16],
      });

      const marker = L.marker([sh.current_lat, sh.current_lon], { icon: customIcon }).addTo(map);

      marker.on('click', () => onSelectShipment(sh.shipment_id));

      marker.bindPopup(`
        <div style="font-size: 12px; line-height: 1.4;">
          <b style="color: #38bdf8;">${sh.shipment_id}</b> (${sh.carrier_id})<br/>
          <b>Route:</b> ${sh.origin} → ${sh.destination}<br/>
          <b>Risk Score:</b> <span style="color: ${markerColor}; font-weight: bold;">${sh.risk_score}/10 (${sh.risk_category})</span><br/>
          <b>SLA Breach Prob:</b> ${Math.round(sh.sla_breach_probability * 100)}%<br/>
          <b>Buffer:</b> ${sh.sla_buffer_minutes}m
        </div>
      `);
    });
  }, [shipments, events, selectedShipmentId, onSelectShipment]);

  return (
    <div className="space-y-4">
      {/* Map Header Legend */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Interactive Geospatial Network Telematics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time highway corridors, active disruption impact zones, and tracked consignment telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-cyan-400"></span>
            <span className="text-slate-300">NH48 Arterial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400"></span>
            <span className="text-slate-300">Alternate Route B</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/40 border border-rose-500"></span>
            <span className="text-slate-300">Severe Disruption</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">On-Track</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 h-[600px] relative">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
