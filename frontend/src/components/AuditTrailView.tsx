import React, { useState, useEffect } from 'react';
import { 
  History, 
  CheckCircle, 
  User, 
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { fetchAuditLogs, clearAuditLogs } from '../services/api';

interface AuditTrailViewProps {
  selectedShipmentId: string | null;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ selectedShipmentId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  // Default to empty string to show ALL system logs chronologically
  const [filterShipment, setFilterShipment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadLogs = (shId?: string) => {
    setLoading(true);
    fetchAuditLogs(shId && shId.trim().length > 0 ? shId.trim() : undefined)
      .then((data) => setLogs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all audit logs to start a fresh demo session?')) return;
    setClearing(true);
    try {
      await clearAuditLogs();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadLogs(filterShipment);
  }, [filterShipment]);

  const formatTimestamp = (rawTs: string) => {
    try {
      const dt = new Date(rawTs);
      if (isNaN(dt.getTime())) return rawTs;
      const datePart = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${datePart} at ${timePart}`;
    } catch {
      return rawTs;
    }
  };


  return (
    <div className="space-y-4 font-sans text-[#101c29]">
      {/* Top Banner (Pure White Theme) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-[#003c76]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#e4efff] text-[#003c76] border border-[#a9c9ff] font-bold">
                AUDITABLE &amp; TRACEABLE
              </span>
              <span className="text-xs text-[#424751] font-mono">
                Immutable Decision History
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c29] mt-1">
              Decision Audit &amp; Replanning History
            </h1>
            <p className="text-xs text-[#424751] mt-0.5">
              End-to-end cryptographic and chronological tracking of all disruption events, risk state updates, and human approvals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterShipment('')}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold font-mono transition ${
                  filterShipment === ''
                    ? 'bg-[#003c76] text-white shadow-sm'
                    : 'bg-[#f8f9ff] text-[#424751] border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Events
              </button>
              {selectedShipmentId && (
                <button
                  type="button"
                  onClick={() => setFilterShipment(selectedShipmentId)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold font-mono transition ${
                    filterShipment === selectedShipmentId
                      ? 'bg-[#003c76] text-white shadow-sm'
                      : 'bg-[#f8f9ff] text-[#424751] border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Focus: {selectedShipmentId}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Filter by Shipment ID..."
                value={filterShipment}
                onChange={(e) => setFilterShipment(e.target.value)}
                className="py-1 px-2.5 rounded-lg bg-[#f8f9ff] border border-slate-200 text-xs font-mono text-[#101c29] focus:outline-none focus:border-[#003c76] w-44"
              />
              {filterShipment && (
                <button
                  onClick={() => setFilterShipment('')}
                  className="text-xs text-[#424751] hover:text-[#101c29] px-2 font-medium"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#003c76]" />
            <h2 className="text-xs font-bold text-[#101c29] uppercase tracking-wider">
              Chronological Audit Ledger ({logs.length} entries)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={clearing || logs.length === 0}
              className="text-xs text-red-600 hover:text-red-800 font-semibold transition flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearing ? 'Clearing...' : 'Clear Ledger'}
            </button>
            <button
              onClick={() => loadLogs(filterShipment)}
              disabled={loading}
              className="text-xs text-[#003c76] hover:text-[#005eb5] font-semibold transition flex items-center gap-1 px-2.5 py-1 rounded bg-[#e4efff] border border-[#a9c9ff]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#727782] animate-pulse">
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#727782] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#f8f9ff] border border-slate-200 flex items-center justify-center mx-auto text-[#003c76]">
              <History className="w-5 h-5" />
            </div>
            <p className="font-semibold text-[#101c29]">No audit log entries found.</p>
            <p className="max-w-md mx-auto text-[11px] text-[#424751]">
              The audit ledger is clean. Any disruption event injected in Disruption Lab or recovery plan authorized in Recovery Center will immediately be logged here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isApproval = log.event_type.includes('APPROVED');
              const isDisruption = log.event_type.includes('DISRUPTION');

              return (
                <div
                  key={log.audit_id}
                  className="p-3.5 rounded-lg bg-[#f8f9ff] border border-slate-200 hover:border-slate-300 transition space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-md ${
                        isApproval ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isDisruption ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-[#e4efff] text-[#003c76]'
                      }`}>
                        {isApproval ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-mono font-bold text-[#101c29]">{log.event_type}</span>
                      <span className="font-mono text-[#003c76] font-bold px-2 py-0.5 rounded bg-[#e4efff] border border-[#a9c9ff] text-[10px]">
                        {log.shipment_id}
                      </span>
                    </div>
                    <span className="font-mono text-[#727782] text-[11px]">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>


                  {log.justification && (
                    <p className="text-[#424751] italic pl-8">
                      "{log.justification}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#424751] pl-8 pt-0.5">
                    <span>Audit ID: <span className="font-mono text-[#101c29]">{log.audit_id}</span></span>
                    <span>Trigger: <span className="font-mono text-[#101c29]">{log.trigger_source}</span></span>
                    {log.operator_id && (
                      <span className="flex items-center gap-1 text-emerald-700 font-mono font-bold">
                        <User className="w-3 h-3" /> {log.operator_id}
                      </span>
                    )}
                  </div>

                  {(log.previous_state || log.new_state) && (
                    <div className="ml-8 mt-2 p-2.5 rounded-lg bg-[#eef4ff] border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                      {log.previous_state && (
                        <div>
                          <span className="text-[#424751] block mb-1 font-bold">Previous State:</span>
                          <pre className="text-red-700 overflow-x-auto">{JSON.stringify(log.previous_state, null, 1)}</pre>
                        </div>
                      )}
                      {log.new_state && (
                        <div>
                          <span className="text-[#424751] block mb-1 font-bold">New State:</span>
                          <pre className="text-emerald-700 overflow-x-auto">{JSON.stringify(log.new_state, null, 1)}</pre>
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
