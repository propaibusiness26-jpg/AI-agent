import React from "react";
import { Lead, Log } from "../types";
import { Users, Mail, MessageSquare, CheckCircle, RefreshCw, AlertCircle, Clock } from "lucide-react";

interface DashboardStatsProps {
  leads: Lead[];
  logs: Log[];
}

export default function DashboardStats({ leads, logs }: DashboardStatsProps) {
  const totalLeads = leads.length;
  
  const gmailLeads = leads.filter((l) => l.source === "gmail").length;
  const whatsappLeads = leads.filter((l) => l.source === "whatsapp").length;

  const repliedLeads = leads.filter((l) => l.status === "replied" || l.status === "converted").length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const ignoredLeads = leads.filter((l) => l.status === "ignored").length;

  const successLogsCount = logs.filter((l) => l.status === "success").length;
  const pendingLogsCount = logs.filter((l) => l.status === "pending").length;
  const failedLogsCount = logs.filter((l) => l.status === "failed").length;

  const followUpRate = totalLeads > 0 ? Math.round((repliedLeads / totalLeads) * 100) : 0;

  return (
    <div id="dashboard-statistics" className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#161920] p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 capitalize">Total Leads Captured</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight font-sans">{totalLeads}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Across channels
            </p>
          </div>
          <div className="p-3 bg-indigo-950/45 text-indigo-400 rounded-xl border border-indigo-900/40">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#161920] p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 capitalize">AI Action Rate</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight font-sans">{followUpRate}%</h3>
            <p className="text-xs text-emerald-400 font-medium">Auto-responded leads</p>
          </div>
          <div className="p-3 bg-emerald-950/45 text-emerald-400 rounded-xl border border-emerald-900/40">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#161920] p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 capitalize">Gmail Messages</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight font-sans">{gmailLeads}</h3>
            <p className="text-xs text-slate-500">Unread label filter</p>
          </div>
          <div className="p-3 bg-rose-950/45 text-rose-400 rounded-xl border border-rose-900/40">
            <Mail className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#161920] p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 capitalize">WhatsApp Messages</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight font-sans">{whatsappLeads}</h3>
            <p className="text-xs text-slate-500">Inbound chat logs</p>
          </div>
          <div className="p-3 bg-teal-950/45 text-teal-400 rounded-xl border border-teal-900/40">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Status Breakdown */}
        <div className="bg-[#161920] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h4 className="text-base font-semibold text-white mb-4">Pipeline Status</h4>
          <div className="space-y-4">
            {/* Progres item 1 */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Leads Replied ({repliedLeads})</span>
                <span>{totalLeads > 0 ? Math.round((repliedLeads / totalLeads) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (repliedLeads / totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Progres item 2 */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>New Opportunities ({newLeads})</span>
                <span>{totalLeads > 0 ? Math.round((newLeads / totalLeads) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Progres item 3 */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Ignored / Snoozed ({ignoredLeads})</span>
                <span>{totalLeads > 0 ? Math.round((ignoredLeads / totalLeads) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-700 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (ignoredLeads / totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Ledger Summary */}
        <div className="bg-[#161920] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-base font-semibold text-white mb-3">AI Engine Integrity</h4>
            <p className="text-xs text-slate-400 mb-4 font-normal">Audit checklist of auto-response logs processed by Gemini.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-auto">
            <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/30">
              <span className="block text-xl font-bold text-emerald-400 font-mono">{successLogsCount}</span>
              <span className="text-[10px] font-semibold text-emerald-500/90">Delivered</span>
            </div>
            <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-900/30">
              <span className="block text-xl font-bold text-amber-400 font-mono">{pendingLogsCount}</span>
              <span className="text-[10px] font-semibold text-amber-500/90">Pending Drafts</span>
            </div>
            <div className="p-3 bg-[#1c1214] rounded-xl border border-rose-950/30">
              <span className="block text-xl font-bold text-rose-400 font-mono">{failedLogsCount}</span>
              <span className="text-[10px] font-semibold text-rose-400/90">Failed API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
