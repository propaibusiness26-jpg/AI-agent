import React, { useState } from "react";
import { Setting } from "../types";
import { Send, Mail, MessageSquare, ShieldAlert, Sparkles, Smartphone, ArrowRight, User } from "lucide-react";

interface SimulatorPanelProps {
  settings: Setting;
  onSimulateLead: (source: "gmail" | "whatsapp", name: string, contact: string, message: string) => Promise<void>;
  isSimulating: boolean;
}

const PRESET_LEADS = [
  {
    name: "Sarah Jenkins",
    contact: "sarah.j.dev@gmail.com",
    message: "Hey there! I saw your services online. Could you send over standard pricing plans for a custom dashboard build? Also, how soon can you start?",
    source: "gmail" as const
  },
  {
    name: "Marcus Aurelius",
    contact: "+1 (555) 0192",
    message: "Hello! Urgent question: Do you offer same-day consultancy or quick tech support calls? Wanted to check before booking on your website.",
    source: "whatsapp" as const
  },
  {
    name: "Aidan Sterling",
    contact: "asterling@sterlingcorp.co",
    message: "Hello, looking to get a custom quote. We have a team of 45 and need integrations with Google Drive and Slack. Are you available for a brief Zoom meeting tomorrow?",
    source: "gmail" as const
  },
  {
    name: "Elena Rostova",
    contact: "+44 7911 123456",
    message: "Hi, I am interested in your services but have some specific technical questions. Do you support PostgreSQL automated replication out of the box?",
    source: "whatsapp" as const
  }
];

export default function SimulatorPanel({ settings, onSimulateLead, isSimulating }: SimulatorPanelProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [customName, setCustomName] = useState("");
  const [customContact, setCustomContact] = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [customSource, setCustomSource] = useState<"gmail" | "whatsapp">("gmail");

  const [simulatedStatus, setSimulatedStatus] = useState<string | null>(null);

  const triggerSimulation = async (source: "gmail" | "whatsapp", name: string, contact: string, msg: string) => {
    setSimulatedStatus("Simulating incoming ping...");
    try {
      await onSimulateLead(source, name, contact, msg);
      setSimulatedStatus(`Success! Simulated ${source === "gmail" ? "email" : "WhatsApp"} lead. Watch the live dashboard response.`);
      setTimeout(() => setSimulatedStatus(null), 4000);
    } catch (err: any) {
      console.error(err);
      setSimulatedStatus(`Connection Error: ${err.message || err}`);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customContact || !customMsg) return;
    await triggerSimulation(customSource, customName, customContact, customMsg);
    setCustomName("");
    setCustomContact("");
    setCustomMsg("");
  };

  return (
    <div id="emulator-lead-engine" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left panel: Simulation trigger suite */}
      <div className="lg:col-span-12 xl:col-span-7 bg-[#161920] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Inbound Lead Simulator Suite
              </h3>
              <p className="text-xs text-slate-400">Inject high-fidelity test inquiries through Gmail or WhatsApp to trigger the automated AI response flow rules.</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("presets")}
              className={`pb-2 transition-all cursor-pointer ${activeTab === "presets" ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-350"}`}
            >
              Preset Lead library
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`pb-2 transition-all cursor-pointer ${activeTab === "custom" ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-350"}`}
            >
              Custom Simulator
            </button>
          </div>

          {/* Active section displays */}
          {activeTab === "presets" ? (
            <div id="preset-library-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {PRESET_LEADS.map((lead, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/35 hover:border-indigo-900/40 hover:bg-slate-900/60 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                        <span className="p-1 bg-[#161920] rounded-md border border-slate-800 inline-block">
                          <User className="h-3 w-3 text-slate-400" />
                        </span>
                        {lead.name}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${lead.source === "gmail" ? "bg-rose-950/40 text-rose-400 border border-rose-900/40" : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"}`}>
                        {lead.source === "gmail" ? <Mail className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
                        {lead.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic line-clamp-3">
                      &ldquo;{lead.message}&rdquo;
                    </p>
                  </div>

                  <button
                    onClick={() => triggerSimulation(lead.source, lead.name, lead.contact, lead.message)}
                    disabled={isSimulating}
                    className="w-full py-1.5 bg-slate-900 border border-slate-800 text-[11px] font-bold text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    Simulate Inbound {lead.source === "gmail" ? "Email" : "WhatsApp"}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} id="custom-simulation-form" className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" htmlFor="customName">Inquirer Name</label>
                  <input
                    id="customName"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 text-white border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" htmlFor="customContact">Email / Phone</label>
                  <input
                    id="customContact"
                    type="text"
                    value={customContact}
                    onChange={(e) => setCustomContact(e.target.value)}
                    placeholder="e.g., jane@company.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 text-white border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" htmlFor="customSource">Source Platform</label>
                  <select
                    id="customSource"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 text-white border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="gmail" className="bg-[#161920]">📭 Gmail Message</option>
                    <option value="whatsapp" className="bg-[#161920]">💬 WhatsApp Message</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" htmlFor="customMsg">Message Context</label>
                <textarea
                  id="customMsg"
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type simulated custom lead text..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 text-white border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                id="sumbit-custom-simulation"
                disabled={isSimulating}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSimulating ? "AI Processing Inbound Lead..." : "Send Custom Simulated Lead"}
              </button>
            </form>
          )}
        </div>

        {/* Action feedback banner */}
        {simulatedStatus && (
          <div id="action-feedback-simulator" className="mt-4 p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl text-xs text-indigo-400 font-semibold font-sans">
            {simulatedStatus}
          </div>
        )}
      </div>

      {/* Right panel: Static phone screen mockup showing live active conversations */}
      <div className="lg:col-span-12 xl:col-span-5 bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-2xl flex flex-col font-sans max-h-[500px]">
        {/* Phone Speaker & Camera Header */}
        <div className="flex justify-center items-center gap-2 mb-3">
          <div className="w-12 h-2.5 bg-slate-850 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-slate-850 rounded-full"></div>
        </div>

        <div className="flex-1 rounded-2xl bg-[#0A0C10] p-4 overflow-y-auto flex flex-col justify-between border border-slate-800/80 max-h-[400px]">
          {/* Mock Screen Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px] text-slate-500">
            <span className="font-semibold flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400 font-bold" />
              WhatsApp Live Simulation Node
            </span>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>AUTO ACTIVE</span>
            </div>
          </div>

          {/* Active Conversation Body */}
          <div className="flex-1 space-y-4 text-xs overflow-y-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span>Inbound Lead</span>
              </div>
              <div className="bg-[#161920] border border-slate-800 text-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[85%]">
                <p className="font-bold text-white mb-1">Marcus Aurelius</p>
                Hello! Do you offer same-day booking?
              </div>
            </div>

            <div className="space-y-1 flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] text-emerald-400/80">
                <Sparkles className="h-3 w-3" />
                <span>AI Automated Reply Drafted</span>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-920 text-emerald-300 rounded-2xl rounded-tr-none p-3 max-w-[85%]">
                <p className="font-bold text-emerald-400 mb-1">AI Assistant Tone: {settings.agentTone}</p>
                Hi Marcus! Under {settings.companyName || "our firm"}, we definitely support responsive bookings. I'd love to organize a call for you immediately. Could you share your email or click our scheduler link?
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <input 
              disabled 
              type="text" 
              placeholder="WhatsApp Bot Auto-Listening..." 
              className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-500 focus:outline-none" 
            />
            <button disabled className="p-1.5 bg-emerald-600 rounded-full text-white opacity-40">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
