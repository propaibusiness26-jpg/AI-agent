import React, { useState } from "react";
import { Lead } from "../types";
import { Mail, MessageSquare, Check, RefreshCw, Trash2, Edit2, CheckCircle2, User, Eye, Send } from "lucide-react";

interface LeadInboxProps {
  leads: Lead[];
  onApproveSend: (lead: Lead, customMessage: string) => Promise<void>;
  onRegenerate: (lead: Lead) => Promise<void>;
  onIgnore: (lead: Lead) => Promise<void>;
  onDelete: (lead: Lead) => Promise<void>;
  refreshingLeadId: string | null;
}

export default function LeadInbox({
  leads,
  onApproveSend,
  onRegenerate,
  onIgnore,
  onDelete,
  refreshingLeadId
}: LeadInboxProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "new" | "replied" | "ignored">("all");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");

  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "all") return true;
    return lead.status === activeFilter;
  });

  const handleEditClick = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditBuffer(lead.aiResponse || "");
  };

  const handleSaveEdit = (lead: Lead) => {
    lead.aiResponse = editBuffer;
    setEditingLeadId(null);
  };

  const verifyAndSend = (lead: Lead, text: string) => {
    // Mandated User Confirmation for email send or communication integrations
    const confirmed = window.confirm(
      `Send and log this automated follow-up ${lead.source === "gmail" ? "email" : "WhatsApp"} reply to ${lead.name} (${lead.contact})?\n\nContent:\n"${text}"`
    );
    if (confirmed) {
      onApproveSend(lead, text);
    }
  };

  return (
    <div id="lead-inbox-management" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Lead Pipeline & AI Drafts</h3>
          <p className="text-xs text-slate-400">Examine lead messages, edit drafts, and dispatch responses.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-xl text-xs font-semibold border border-slate-800/60">
          {(["all", "new", "replied", "ignored"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${activeFilter === filter ? "bg-[#161920] text-indigo-400 border border-indigo-900/30 shadow-sm" : "text-slate-400 hover:text-white border border-transparent"}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div id="empty-leads-view" className="bg-[#161920] rounded-2xl border border-slate-800 p-12 text-center space-y-3 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
            <Mail className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No leads match this filter.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Click "Preset Lead library" or "Custom Simulator" in the Simulator Panel below to inject mock inbound leads instantly and train your AI agent!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLeads.map((lead) => {
            const isRefreshing = refreshingLeadId === lead.id;
            const isEditing = editingLeadId === lead.id;

            return (
              <div
                key={lead.id}
                id={`lead-card-${lead.id}`}
                className="bg-[#161920] rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4 flex flex-col md:grid md:grid-cols-12 md:gap-6 md:space-y-0"
              >
                {/* Left side: Lead Info (col-span-4) */}
                <div className="md:col-span-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${lead.source === "gmail" ? "bg-rose-950/40 text-rose-400 border border-rose-900/40" : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"}`}>
                      {lead.source === "gmail" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {lead.source}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${lead.status === "new" ? "bg-amber-950/40 text-amber-400 border border-amber-900/40" : lead.status === "replied" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" : "bg-slate-900 text-slate-400 border border-slate-800/60"}`}>
                      {lead.status === "new" ? "reviewing" : lead.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                      <User className="h-4 w-4 text-slate-500" />
                      {lead.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate max-w-[200px] font-mono">{lead.contact}</p>
                  </div>

                  <div className="p-3 bg-slate-900/55 rounded-xl space-y-1 border border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Lead Message</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans max-h-[100px] overflow-y-auto">
                      &ldquo;{lead.lastMessage}&rdquo;
                    </p>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <span>Detected:</span>
                    <span>{new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Right side: AI Follow-up draft (col-span-8) */}
                <div className="md:col-span-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                        Gemini AI Responder
                      </span>
                      {lead.aiResponse && !isEditing && lead.status === "new" && (
                        <button
                          onClick={() => handleEditClick(lead)}
                          className="text-[11px] font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Edit Draft
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={editBuffer}
                          onChange={(e) => setEditBuffer(e.target.value)}
                          className="w-full text-xs p-3 bg-slate-900 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingLeadId(null)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 bg-slate-950 rounded-md border border-slate-800 hover:bg-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(lead)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 cursor-pointer"
                          >
                            Save edits
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-indigo-950/10 border border-indigo-900/10 rounded-xl min-h-[100px] flex flex-col justify-between">
                        <p className="text-xs text-slate-200 lg:leading-relaxed font-sans whitespace-pre-wrap">
                          {isRefreshing ? (
                            <span className="text-slate-500 italic">Generating optimized follow-up draft response...</span>
                          ) : (
                            lead.aiResponse || <span className="text-slate-500 italic">No response drafted yet. Click "Regenerate" below to initialize.</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    <div className="flex gap-1.5">
                      {lead.status === "new" && lead.aiResponse && !isEditing && (
                        <button
                          onClick={() => verifyAndSend(lead, lead.aiResponse || "")}
                          disabled={isRefreshing}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          <Send className="h-3 w-3" /> Approve & Send
                        </button>
                      )}
                      
                      {lead.status === "new" && (
                        <button
                          onClick={() => onRegenerate(lead)}
                          disabled={isRefreshing}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                          Regenerate
                        </button>
                      )}

                      {lead.status === "new" && (
                        <button
                          onClick={() => onIgnore(lead)}
                          disabled={isRefreshing}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 text-[11px] font-semibold rounded-lg cursor-pointer transition-all"
                        >
                          Snooze
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onDelete(lead)}
                      id={`delete-lead-${lead.id}`}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Remove Lead Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
