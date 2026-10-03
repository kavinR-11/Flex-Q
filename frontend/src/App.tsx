import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ControlTowerView } from './components/ControlTowerView';
import { ShipmentsView } from './components/ShipmentsView';
import { RouteMapView } from './components/RouteMapView';
import { RecoveryCenterView } from './components/RecoveryCenterView';
import { DisruptionLabView } from './components/DisruptionLabView';
import { CompilerView } from './components/CompilerView';
import { AuditTrailView } from './components/AuditTrailView';
import { QuantumLabView } from './components/QuantumLabView';
import { AskFluxQView } from './components/AskFluxQView';
import { SettingsSystemView } from './components/SettingsSystemView';
import { Shipment, DisruptionEvent, SystemHealth } from './types';
import { fetchHealth, fetchShipments, fetchEvents } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('control-tower');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>('SH-2048');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [events, setEvents] = useState<DisruptionEvent[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadData = async () => {
    try {
      const [h, s, e] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchShipments({ limit: 300 }).catch(() => []),
        fetchEvents().catch(() => []),
      ]);
      setHealth(h);
      setShipments(s);
      setEvents(e);
    } catch (err) {
      console.error('Error reloading telematic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
    const timer = setInterval(reloadData, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectShipment = (id: string | null) => {
    setSelectedShipmentId(id);
    if ((activeTab === 'control-tower' || activeTab === 'overview') && id) {
      setActiveTab('shipment-risk');
    }
  };

  const handleNavigateToRecovery = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setActiveTab('recovery-center');
  };

  const handleNavigateToRisk = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setActiveTab('shipment-risk');
  };

  // Safe tab resolver mapping legacy names to Stitch tab ids
  const resolvedTab = (() => {
    if (activeTab === 'overview') return 'control-tower';
    if (activeTab === 'shipments') return 'shipment-risk';
    if (activeTab === 'map') return 'route-network';
    if (activeTab === 'recovery') return 'recovery-center';
    if (activeTab === 'disruption') return 'disruption-lab';
    if (activeTab === 'compiler') return 'constraint-compiler';
    if (activeTab === 'audit') return 'decision-audit';
    return activeTab;
  })();

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-800 flex flex-col font-sans">
      <Navbar
        activeTab={resolvedTab}
        setActiveTab={setActiveTab}
        health={health}
        onRefreshData={reloadData}
      />

      {/* Main Workspace Offset by 52px Left Rail and 82px Top Bar */}
      <div className="pl-[52px] pt-[82px] flex-1 flex flex-col">
        <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 py-4">
          {loading && shipments.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-blue-950 font-bold">
                  Synchronizing YOLO × FluxQ Multi-Modal Telemetry...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Screen 1: Control Tower */}
              {resolvedTab === 'control-tower' && (
                <ControlTowerView
                  shipments={shipments}
                  events={events}
                  onSelectShipment={handleSelectShipment}
                  onNavigateTab={(tab) => {
                    if (tab === 'shipments') setActiveTab('shipment-risk');
                    else if (tab === 'recovery') setActiveTab('recovery-center');
                    else if (tab === 'disruption') setActiveTab('disruption-lab');
                    else setActiveTab(tab);
                  }}
                />
              )}

              {/* Screen 2: Shipment Risk */}
              {resolvedTab === 'shipment-risk' && (
                <ShipmentsView
                  shipments={shipments}
                  selectedShipmentId={selectedShipmentId}
                  onSelectShipment={handleSelectShipment}
                  onNavigateToRecovery={handleNavigateToRecovery}
                  onShipmentUpdated={reloadData}
                />
              )}

              {/* Screen 3: Route Network / Corridors Planning */}
              {resolvedTab === 'route-network' && (
                <RouteMapView
                  shipments={shipments}
                  events={events}
                  selectedShipmentId={selectedShipmentId}
                  onSelectShipment={handleSelectShipment}
                  onNavigateToRecovery={handleNavigateToRecovery}
                  onNavigateToRisk={handleNavigateToRisk}
                />
              )}

              {/* Screen 4: Disruption Lab */}
              {resolvedTab === 'disruption-lab' && (
                <DisruptionLabView
                  events={events}
                  onDisruptionInjected={reloadData}
                  onNavigateToRecovery={handleNavigateToRecovery}
                />
              )}

              {/* Screen 4.5: Disruption-to-Constraint Compiler & Dynamic Prioritization */}
              {resolvedTab === 'constraint-compiler' && (
                <CompilerView
                  shipments={shipments}
                  selectedShipmentId={selectedShipmentId}
                  onSelectShipment={handleSelectShipment}
                  onNavigateToRecovery={handleNavigateToRecovery}
                  onShipmentPrioritized={reloadData}
                />
              )}

              {/* Screen 5: Recovery Center */}
              {resolvedTab === 'recovery-center' && (
                <RecoveryCenterView
                  shipments={shipments}
                  selectedShipmentId={selectedShipmentId}
                  onSelectShipment={setSelectedShipmentId}
                  onNavigateTab={(tab) => {
                    if (tab === 'audit' || tab === 'decision-audit') setActiveTab('decision-audit');
                    else setActiveTab(tab);
                  }}
                  onShipmentUpdated={reloadData}
                />
              )}

              {/* Screen 6: Decision Audit */}
              {resolvedTab === 'decision-audit' && (
                <AuditTrailView selectedShipmentId={selectedShipmentId} />
              )}

              {/* Screen 7: Quantum Lab (Experimental) */}
              {resolvedTab === 'quantum-lab' && <QuantumLabView />}

              {/* Screen 8: Ask FluxQ (Conversational Intelligence) */}
              {resolvedTab === 'ask-fluxq' && (
                <AskFluxQView
                  onNavigateTab={setActiveTab}
                  onSelectShipment={handleSelectShipment}
                />
              )}

              {/* Screen 9: Settings & System */}
              {resolvedTab === 'settings-and-system' && (
                <SettingsSystemView health={health} onRefreshHealth={reloadData} />
              )}
            </>
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-xs text-slate-500 font-mono mt-auto">
          <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              <strong>YOLO × FluxQ</strong> — Predictive Shipment Risk Intelligence & Hybrid Recovery Platform
            </span>
            <div className="flex items-center gap-3">
              <span>Theme 4: Logistics & Supply Chain</span>
              <span>•</span>
              <span className="text-blue-900 font-bold">Google OR-Tools MIP & Qiskit QAOA</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
