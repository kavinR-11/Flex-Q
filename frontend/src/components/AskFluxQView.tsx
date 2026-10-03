import React, { useState } from 'react';
import { askFluxQChat } from '../services/api';
import { AssistantChatResponse } from '../types';

interface AskFluxQViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectShipment?: (id: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  groundedEntities?: string[];
  suggestedFollowups?: string[];
  suggestedActions?: Array<{ label: string; target_tab: string; action_payload?: any }>;
}

export const AskFluxQView: React.FC<AskFluxQViewProps> = ({ onNavigateTab, onSelectShipment }) => {
  const [copilotType, setCopilotType] = useState<string>('hybrid');
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [contextCorridor, setContextCorridor] = useState<string | null>('Mumbai-BLR-MAA (NH-48)');
  const [contextShipment, setContextShipment] = useState<string | null>('SH-2113 (Bio-Pharma Labs)');
  const [contextSim, setContextSim] = useState<string | null>('Sim #4091 (Khandala Ghat)');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `### YOLO × FluxQ Conversational Intelligence Engine v4.8

Welcome, Controller. I am grounded in live IoT telematics, TreeSHAP feature attributions, and the multi-objective OR-Tools Pareto recovery engine.

**Active Corridors Monitored:** 5 Spines | **Consignments:** 249 Active | **Disruptions:** 86 Signals.

How can I assist your network dispatch today?`,
      groundedEntities: ['Live Telematics', 'TreeSHAP GBDT', 'OR-Tools SCIP MIP'],
      suggestedFollowups: [
        'Why is SH-2113 at high risk?',
        'Show cost impact of Plan A vs Plan B for Mumbai corridor.',
        'What network bottlenecks emerged in the last 2 hours?',
        'Explain SHAP drivers for temperature-sensitive cargo.'
      ],
      suggestedActions: [
        { label: 'View Control Tower', target_tab: 'control-tower' },
        { label: 'Inspect Corridors', target_tab: 'route-network' }
      ]
    }
  ]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const res: AssistantChatResponse = await askFluxQChat({
        message: query,
        copilot_type: copilotType,
        context_shipment_id: contextShipment ? 'SH-2113' : undefined,
        context_corridor_id: contextCorridor ? 'CORR-NH48-W' : undefined,
      });

      const assistantMsg: ChatMessage = {
        id: res.response_id,
        sender: 'assistant',
        timestamp: new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.answer_markdown,
        groundedEntities: res.grounded_entities,
        suggestedFollowups: res.suggested_followups,
        suggestedActions: res.suggested_actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `**System Communication Error:** Could not contact intelligence orchestrator: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleActionClick = (targetTab: string, payload?: any) => {
    if (payload?.shipment_id && onSelectShipment) {
      onSelectShipment(payload.shipment_id);
    }
    onNavigateTab(targetTab);
  };

  return (
    <div className="flex flex-col w-full pb-12 font-sans text-slate-800">
      {/* Top Banner / Header */}
      <div className="flex items-center justify-between pb-3 mb-4 shadow-sm bg-white px-4 py-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-900 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Conversational Intelligence Center</h2>
              <span className="px-2 py-0.5 rounded bg-purple-800 text-white text-[10px] font-bold uppercase tracking-wider">
                v4.8 Neural Grounding
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in live telemetry, TreeSHAP feature attributions, and multi-modal classical/quantum solvers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button className="px-3 py-1 rounded bg-white text-blue-900 font-bold shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Session
          </button>
          <button
            onClick={() => setMessages([messages[0]])}
            className="px-3 py-1 rounded text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Reset Chat
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Context | Right Interactive Conversation */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Left Column (3.5 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          {/* Active Engine Card */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Active Engine</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> 99.8% Online
              </span>
            </div>
            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">Target Specialized Copilot</label>
              <select
                value={copilotType}
                onChange={(e) => setCopilotType(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg p-2 border border-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="hybrid">Risk Explanation & Recovery Agent (Hybrid Ensemble)</option>
                <option value="shap_only">Risk Explanation Agent (SHAP / GBDT Only)</option>
                <option value="pareto_solver">Recovery Trade-Off Agent (Pareto Cost Solver)</option>
                <option value="st_gnn">Corridor Disruption Forecaster (ST-GNN)</option>
              </select>
            </div>
          </div>

          {/* Live Grounded Context Pins */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-blue-900">
                <span className="material-symbols-outlined text-[16px]">push_pin</span>
                <span className="text-[10px] uppercase font-bold tracking-wider">Live Grounded Context</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {[contextCorridor, contextShipment, contextSim].filter(Boolean).length} Linked
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              {contextCorridor && (
                <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-blue-600 text-[16px] shrink-0">route</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-500">Corridor</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{contextCorridor}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setContextCorridor(null)}
                    className="text-slate-400 hover:text-red-600"
                    title="Unpin"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}

              {contextShipment && (
                <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-red-600 text-[16px] shrink-0">inventory_2</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-500">Critical Consignment</span>
                      <span className="text-xs font-bold text-red-700 truncate">{contextShipment}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setContextShipment(null)}
                    className="text-slate-400 hover:text-red-600"
                    title="Unpin"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}

              {contextSim && (
                <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-purple-600 text-[16px] shrink-0">science</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-500">Active Simulation</span>
                      <span className="text-xs font-bold text-purple-800 truncate">{contextSim}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setContextSim(null)}
                    className="text-slate-400 hover:text-red-600"
                    title="Unpin"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Suggested Inquiries */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col gap-2">
            <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">
              Suggested Controller Inquiries
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                'Why is SH-2113 at high risk?',
                'Show cost impact of Plan A vs Plan B for Mumbai corridor.',
                'What network bottlenecks emerged in the last 2 hours?',
                'Explain SHAP drivers for temperature-sensitive cargo.'
              ].map((inq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(inq)}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-purple-50 transition-colors flex items-start gap-1.5 text-xs text-slate-700 hover:text-purple-950 font-medium"
                >
                  <span className="material-symbols-outlined text-purple-700 text-[14px] mt-0.5">bolt</span>
                  <span>"{inq}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat History & Input (8.5 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[700px]">
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {m.sender === 'user' ? 'Controller (You)' : 'FluxQ Intelligence Copilot'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[90%] p-3.5 rounded-xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-900 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="prose prose-xs max-w-none whitespace-pre-wrap font-sans">
                    {m.text}
                  </div>

                  {/* Grounded Entities Badge Strip */}
                  {m.groundedEntities && m.groundedEntities.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Grounded In:</span>
                      {m.groundedEntities.map((ent, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-blue-100 text-blue-950 font-mono text-[10px] font-semibold"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Suggestions */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {m.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act.target_tab, act.action_payload)}
                          className="px-2.5 py-1 rounded bg-purple-800 hover:bg-purple-900 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Followup suggestions under assistant message */}
                {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap pl-1">
                    <span className="text-[10px] text-slate-400 font-bold">Suggested:</span>
                    {m.suggestedFollowups.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(f)}
                        className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-900 text-[10px] font-medium transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-2 pl-2">
                <span className="w-3.5 h-3.5 border-2 border-purple-800 border-t-transparent rounded-full animate-spin"></span>
                <span>Querying telemetry and synthesizing recovery diagnosis...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about consignment risk, SHAP drivers, Plan A/B trade-offs, or corridor bottlenecks..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-sm"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Inquire</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
