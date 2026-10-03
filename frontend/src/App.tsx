import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ControlTowerView } from './components/ControlTowerView';
import { ShipmentsView } from './components/ShipmentsView';
import { RouteMapView } from './components/RouteMapView';
import { RecoveryCenterView } from './components/RecoveryCenterView';
import { DisruptionLabView } from './components/DisruptionLabView';
import { AuditTrailView } from './components/AuditTrailView';
import { Shipment, DisruptionEvent, SystemHealth } from './types';
import { fetchHealth, fetchShipments, fetchEvents } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>('SH-2048');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [events, setEvents] = useState<DisruptionEvent[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadData = async () => {
    try {
      const [h, s, e] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchShipments({ limit: 100 }).catch(() => []),
        fetchEvents().catch(() => []),
      ]);
      setHealth(h);
      setShipments(s);
      setEvents(e);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
    // Periodic telemetry poll every 10s
    const timer = setInterval(reloadData, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectShipment = (id: string | null) => {
    setSelectedShipmentId(id);
    if (activeTab === 'overview' && id) {
      setActiveTab('shipments');
    }
  };

  const handleNavigateToRecovery = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setActiveTab('recovery');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} health={health} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && shipments.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-cyan-400">Loading YOLO × FluxQ Telematics...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <ControlTowerView
                  shipments={shipments}
                  events={events}
                  onSelectShipment={handleSelectShipment}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'shipments' && (
                <ShipmentsView
                  shipments={shipments}
                  selectedShipmentId={selectedShipmentId}
                  onSelectShipment={handleSelectShipment}
                  onNavigateToRecovery={handleNavigateToRecovery}
                />
              )}

              {activeTab === 'map' && (
                <RouteMapView
                  shipments={shipments}
                  events={events}
                  selectedShipmentId={selectedShipmentId}
                  onSelectShipment={handleSelectShipment}
                />
              )}

              {activeTab === 'recovery' && (
                <RecoveryCenterView
                  shipments={shipments}
                  selectedShipmentId={selectedShipmentId}
                  onShipmentUpdated={reloadData}
                />
              )}

              {activeTab === 'disruption' && (
                <DisruptionLabView
                  events={events}
                  onDisruptionInjected={reloadData}
                  onNavigateToRecovery={handleNavigateToRecovery}
                />
              )}

              {activeTab === 'audit' && (
                <AuditTrailView selectedShipmentId={selectedShipmentId} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>YOLO × FluxQ — Predictive Risk Intelligence & Hybrid Recovery Platform</span>
          <span>Theme 4: Logistics & Supply Chain | PS 1: Shipment Delivery Risk Score</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
