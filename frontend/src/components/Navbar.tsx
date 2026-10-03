import React from 'react';
import { SystemHealth } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: SystemHealth | null;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onRefreshData,
}) => {
  const tabs = [
    { id: 'control-tower', label: 'Control Tower', icon: 'dashboard' },
    { id: 'shipment-risk', label: 'Shipment Risk', icon: 'table_chart' },
    { id: 'route-network', label: 'Route Network', icon: 'hub' },
    { id: 'disruption-lab', label: 'Disruption Lab', icon: 'science', badge: 'SIM' },
    { id: 'constraint-compiler', label: 'Constraint Compiler', icon: 'auto_fix_high', badge: 'CORE' },
    { id: 'recovery-center', label: 'Recovery Center', icon: 'alt_route' },
    { id: 'decision-audit', label: 'Decision Audit', icon: 'shield' },
    { id: 'quantum-lab', label: 'Quantum Lab', icon: 'grain', badge: 'EXP' },
    { id: 'ask-fluxq', label: 'Ask FluxQ', icon: 'auto_awesome', ai: true },
    { id: 'settings-and-system', label: 'Settings & System', icon: 'tune' },
  ];

  return (
    <>
      {/* Fixed Top Dual-Header (Height: 46px + 36px = 82px) */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col font-sans">
        {/* Top 46px Brand & Primary Navigation Strip */}
        <div className="h-[46px] w-full bg-[#003c76] px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center h-full">
            {/* Logo */}
            <div className="flex items-center gap-1.5 mr-6 cursor-pointer" onClick={() => setActiveTab('control-tower')}>
              <div className="h-6 px-1.5 rounded bg-white flex items-center justify-center shadow-xs">
                <span className="text-[10px] text-[#003c76] font-bold tracking-wider">YOLO</span>
              </div>
              <span className="text-xs text-white/70 font-medium">×</span>
              <span className="text-base text-white tracking-tight font-bold">FluxQ</span>
            </div>

            {/* Horizontal Nav Tabs */}
            <nav className="flex items-end h-full gap-1 pt-1 overflow-x-auto">
              {tabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`h-[38px] px-3.5 rounded-t-lg flex items-center gap-1.5 text-xs whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[#f8f9ff] text-[#003c76] font-bold shadow-xs'
                        : 'text-blue-100 hover:bg-[#00539f]/70 font-medium'
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.badge && (
                      <span className="px-1 py-0.2 rounded bg-purple-600 text-white text-[9px] font-bold">
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00539f]/50 border border-blue-400/20 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {health?.status === 'healthy' ? 'LIVE TELEMETRY' : 'CONNECTING...'}
              </span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-blue-400/30">
              <div className="w-7 h-7 rounded-full bg-blue-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                VS
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] text-white leading-tight font-bold">Vikram S.</span>
                <span className="text-[9px] text-blue-200 leading-none">Lead Controller</span>
              </div>
            </div>
          </div>
        </div>

        {/* 36px Scope & Quick Action Filter Bar */}
        <div className="h-9 w-full bg-white px-4 flex items-center justify-between border-b border-slate-200 shadow-xs text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Scope:</span>
            <div className="h-6 px-2 rounded bg-blue-50 border border-blue-100 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Scenario</span>
              <span className="text-[11px] text-[#003c76] font-bold">Live Baseline</span>
            </div>
            <div className="h-6 px-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Corridor</span>
              <span className="text-[11px] text-slate-800 font-semibold">Mumbai-BLR-MAA</span>
            </div>
            <div className="h-6 px-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Carrier</span>
              <span className="text-[11px] text-slate-800 font-semibold">All (4 Multimodal)</span>
            </div>
            <div className="h-6 px-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Mode</span>
              <span className="text-[11px] text-slate-800 font-semibold">Multimodal Spine</span>
            </div>
            <div className="h-6 px-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Window</span>
              <span className="text-[11px] text-slate-800 font-semibold">Next 72h</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="h-6 px-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Connected Production Telematics</span>
            </div>
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="h-6 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                title="Refresh live data"
              >
                <span className="material-symbols-outlined text-[14px]">sync</span>
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 52px Fixed Left Rail Navigation */}
      <aside className="fixed left-0 top-[82px] bottom-0 w-[52px] bg-[#003c76] flex flex-col items-center py-2.5 z-40 shadow-md">
        <nav className="flex-1 flex flex-col items-center gap-1 w-full px-1 overflow-y-auto">
          {tabs.slice(0, 7).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                title={t.label}
                className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-blue-200 hover:bg-[#00539f] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                {t.badge && (
                  <span className="absolute top-1 right-0.5 px-0.5 rounded-[2px] bg-purple-600 text-white text-[7px] leading-tight font-bold">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="w-7 my-1 border-t border-blue-400/40 flex justify-center">
            <span className="text-[7px] text-blue-200 uppercase tracking-widest pt-0.5">EXP</span>
          </div>

          {/* Quantum Lab */}
          <button
            onClick={() => setActiveTab('quantum-lab')}
            title="Quantum Lab (Experimental)"
            className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'quantum-lab'
                ? 'bg-purple-800 text-white font-bold shadow-sm'
                : 'text-purple-200 hover:bg-[#00539f] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">grain</span>
            <span className="absolute top-1 right-0.5 px-0.5 rounded-[2px] bg-purple-500 text-white text-[7px] leading-tight font-bold">
              EXP
            </span>
          </button>

          <div className="w-7 my-1 border-t border-blue-400/40"></div>

          {/* Ask FluxQ */}
          <button
            onClick={() => setActiveTab('ask-fluxq')}
            title="Ask FluxQ AI Assistant"
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'ask-fluxq'
                ? 'bg-purple-900 text-white font-bold shadow-sm'
                : 'bg-purple-800/80 text-purple-100 hover:bg-purple-700'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </button>
        </nav>

        {/* Bottom Settings Button */}
        <div className="flex flex-col items-center gap-1 w-full px-1 pt-1 border-t border-blue-400/30">
          <button
            onClick={() => setActiveTab('settings-and-system')}
            title="Settings & System"
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'settings-and-system'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-blue-200 hover:bg-[#00539f] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </aside>
    </>
  );
};
