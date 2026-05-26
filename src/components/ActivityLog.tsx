import React from "react";
import { Log } from "../types";
import { CheckCircle2, XCircle, AlertCircle, Mail, MessageSquare, ArrowRight, ShieldAlert } from "lucide-react";

interface ActivityLogProps {
  logs: Log[];
  onClearLogs?: () => Promise<void>;
}

export default function ActivityLog({ logs, onClearLogs }: ActivityLogProps) {
  return (
    <div id="activity-logs-panel" className="bg-[#161920] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" />
            AI Agent Action History Ledger
          </h3>
          <p className="text-xs text-slate-400">Live operational audit logs of AI auto-responses and saved draft instances.</p>
        </div>
        {logs.length > 0 && onClearLogs && (
          <button
            onClick={onClearLogs}
            id="clear-logs-button"
            className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Clear Log Feed
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-800/80 max-h-[350px] overflow-y-auto">
        {logs.length === 0 ? (
          <div id="empty-logs-view" className="p-8 text-center text-xs text-slate-500">
            No active operational runs logged yet.
          </div>
        ) : (
          [...logs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((log) => (
               <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-800/25 transition-colors text-xs">
                {/* Status Indicator */}
                <div className="mt-0.5">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : log.status === "pending" ? (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  )}
                </div>

                {/* Log Event Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      {log.channel === "gmail" ? (
                        <Mail className="h-3 w-3 text-[#EA4335]" />
                      ) : (
                        <MessageSquare className="h-3 w-3 text-emerald-400" />
                      )}
                      {log.channel === "gmail" ? "Gmail follow-up sent" : "WhatsApp reply compiled"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}{" "}
                      {new Date(log.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium">
                    To: <span className="font-semibold text-slate-300">{log.contact}</span>
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 italic font-sans">
                    &ldquo;{log.message}&rdquo;
                  </p>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
