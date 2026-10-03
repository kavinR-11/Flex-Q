import React from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Truck, 
  MapPin, 
  RotateCcw, 
  Zap, 
  History,
  Activity
} from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: SystemHealth | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, health }) => {
  const navItems = [
    { id: 'overview', label: 'Control Tower', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipment Risk', icon: Truck },
    { id: 'map', label: 'Route Map', icon: MapPin },
    { id: 'recovery', label: 'Recovery Center', icon: RotateCcw },
    { id: 'disruption', label: 'Disruption Lab', icon: Zap },
    { id: 'audit', label: 'Decision Audit', icon: History },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                YOLO × FluxQ
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Predictive Risk Intelligence & Hybrid Recovery
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Health status badge */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              {health?.status === 'healthy' ? 'System Live' : 'Connecting...'}
            </span>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-500 font-mono">
              ENGINE: OR-TOOLS + QAOA
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              India Corridor Network
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
