import React, { useState } from "react";
import { Setting } from "../types";
import { Settings, Shield, ToggleLeft, ToggleRight, Sparkles, Send, Check } from "lucide-react";

interface SettingsPanelProps {
  settings: Setting;
  onSave: (updatedSettings: Setting) => Promise<void>;
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState<Setting>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: keyof Setting) => {
    setForm((prev) => ({ ...prev, [name]: !prev[name] as any }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("idle");
    try {
      await onSave(form);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="settings-configuration-panel" className="bg-[#161920] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#11141A]/40">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400" />
            AI Training & Automations
          </h3>
          <p className="text-xs text-slate-400 font-normal">Configure business information used by Gemini to draft personalized replies.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-900/30 px-3 py-1 rounded-full">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Active Engine
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Business Grounding Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-slate-500" />
            1. Business Grounding Info
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="companyName">
                Company / Application Name
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g., Apex Web Services"
                className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="companyDescription">
                Company Bio, Products & Pitch (AI Knowledge Base)
              </label>
              <textarea
                id="companyDescription"
                name="companyDescription"
                rows={4}
                value={form.companyDescription}
                onChange={handleChange}
                placeholder="Give details about your prices, services, FAQs, and appointment booking links. Gemini uses this to draft answers."
                className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="agentTone">
                AI Voice Agent Tone
              </label>
              <select
                id="agentTone"
                name="agentTone"
                value={form.agentTone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="professional" className="bg-[#161920]">🤵 Professional (Respectful, formal, and informative)</option>
                <option value="friendly" className="bg-[#161920]">😊 Friendly (Warm, enthusiastic, and approachable)</option>
                <option value="persuasive" className="bg-[#161920]">🔥 Persuasive (Oriented on setting appointments and conversions)</option>
                <option value="direct" className="bg-[#161920]">🎯 Direct (Clear, brief, and factual)</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Channel Routing Actions */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Channel Automation Controls
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gmail Automation Toggle */}
            <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">Gmail Agent Integration</span>
                  <p className="text-[11px] text-slate-400">Scan incoming Gmail inquiries for keywords</p>
                </div>
                <button
                  type="button"
                  id="toggle-gmail-automation"
                  onClick={() => handleToggle("gmailAutomationToggle")}
                  className="focus:outline-none p-1"
                >
                  {form.gmailAutomationToggle ? (
                    <ToggleRight className="h-10 w-10 text-indigo-400 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-slate-600 cursor-pointer" />
                  )}
                </button>
              </div>

              {form.gmailAutomationToggle && (
                <div id="gmail-autosend-config" className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Response Delivery Style:</span>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg text-xs border border-slate-800/80">
                    <button
                      type="button"
                      id="gmail-autosend-draft"
                      onClick={() => setForm(f => ({ ...f, gmailAutoSend: false }))}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${!form.gmailAutoSend ? 'bg-[#161920] text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      Draft First
                    </button>
                    <button
                      type="button"
                      id="gmail-autosend-direct"
                      onClick={() => setForm(f => ({ ...f, gmailAutoSend: true }))}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${form.gmailAutoSend ? 'bg-[#161920] text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      Auto-Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp Integration Panel */}
            <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">WhatsApp Agent Integration</span>
                  <p className="text-[11px] text-slate-400">Auto-reply triggers on incoming chat pings</p>
                </div>
                <button
                  type="button"
                  id="toggle-whatsapp-automation"
                  onClick={() => handleToggle("whatsappAutomationToggle")}
                  className="focus:outline-none p-1"
                >
                  {form.whatsappAutomationToggle ? (
                    <ToggleRight className="h-10 w-10 text-emerald-400 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-slate-600 cursor-pointer" />
                  )}
                </button>
              </div>

              {form.whatsappAutomationToggle && (
                <div id="whatsapp-autosend-config" className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Response Delivery Style:</span>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg text-xs border border-slate-800/80">
                    <button
                      type="button"
                      id="whatsapp-autosend-draft"
                      onClick={() => setForm(f => ({ ...f, whatsappAutoSend: false }))}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${!form.whatsappAutoSend ? 'bg-[#161920] text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      Draft Approval
                    </button>
                    <button
                      type="button"
                      id="whatsapp-autosend-direct"
                      onClick={() => setForm(f => ({ ...f, whatsappAutoSend: true }))}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${form.whatsappAutoSend ? 'bg-[#161920] text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      Auto-Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Block */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
          <div>
            {saveStatus === "success" && (
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-bounce">
                <Check className="h-4 w-4" />
                Settings compiled & saved securely!
              </p>
            )}
            {saveStatus === "error" && (
              <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                Failed to save settings. Please try again.
              </p>
            )}
          </div>
          <button
            type="submit"
            id="save-settings-button"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors selection:bg-indigo-300 cursor-pointer disabled:opacity-50"
          >
            {saving ? "Compiling..." : "Save Config & Train Agent"}
          </button>
        </div>
      </form>
    </div>
  );
}
