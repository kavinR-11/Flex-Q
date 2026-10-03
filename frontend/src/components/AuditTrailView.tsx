import React, { useState, useEffect } from 'react';
import { 
  History, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  User, 
  Clock, 
  FileText 
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { fetchAuditLogs } from '../services/api';

interface AuditTrailViewProps {
  selectedShipmentId: string | null;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ selectedShipmentId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterShipment, setFilterShipment] = useState<string>(selectedShipmentId || '');
  const [loading, setLoading] = useState(false);

  const loadLogs = (shId?: string) => {
    setLoading(true);
    fetchAuditLogs(shId && shId.trim().length > 0 ? shId.trim() : undefined)
      .then((data) => setLogs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs(filterShipment);
  }, [filterShipment]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AUDITABLE & TRACEABLE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Immutable Decision History
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Decision Audit & Replanning History
            </h1>
            <p className="text-sm text-slate-400">
              End-to-end cryptographic and chronological tracking of all disruption events, risk state updates, and human approvals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by Shipment ID..."
              value={filterShipment}
              onChange={(e) => setFilterShipment(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
            {filterShipment && (
              <button
                onClick={() => setFilterShipment('')}
                className="text-xs text-slate-400 hover:text-white px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Chronological Audit Ledger ({logs.length} entries)
            </h2>
          </div>
          <button
            onClick={() => loadLogs(filterShipment)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            Refresh Ledger
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit log entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const isApproval = log.event_type.includes('APPROVED');
              const isDisruption = log.event_type.includes('DISRUPTION');

              return (
                <div
                  key={log.audit_id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${
                        isApproval ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        isDisruption ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {isApproval ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-mono font-bold text-white">{log.event_type}</span>
                      <span className="font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-[10px]">
                        {log.shipment_id}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {log.justification && (
                    <p className="text-slate-300 italic pl-8">
                      "{log.justification}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pl-8 pt-1">
                    <span>Audit ID: <span className="font-mono text-slate-300">{log.audit_id}</span></span>
                    <span>Trigger: <span className="font-mono text-slate-300">{log.trigger_source}</span></span>
                    {log.operator_id && (
                      <span className="flex items-center gap-1 text-emerald-400 font-mono">
                        <User className="w-3 h-3" /> {log.operator_id}
                      </span>
                    )}
                  </div>

                  {(log.previous_state || log.new_state) && (
                    <div className="ml-8 mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                      {log.previous_state && (
                        <div>
                          <span className="text-slate-500 block mb-1">Previous State:</span>
                          <pre className="text-rose-300 overflow-x-auto">{JSON.stringify(log.previous_state, null, 1)}</pre>
                        </div>
                      )}
                      {log.new_state && (
                        <div>
                          <span className="text-slate-500 block mb-1">New State:</span>
                          <pre className="text-emerald-300 overflow-x-auto">{JSON.stringify(log.new_state, null, 1)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
