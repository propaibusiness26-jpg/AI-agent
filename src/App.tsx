import React, { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { signInWithGoogle, signOut, onAuthStateChange, getAccessToken } from "./lib/auth";
import { Lead, Log, Setting } from "./types";

// Component imports
import GsiButton from "./components/GsiButton";
import DashboardStats from "./components/DashboardStats";
import LeadInbox from "./components/LeadInbox";
import SettingsPanel from "./components/SettingsPanel";
import SimulatorPanel from "./components/SimulatorPanel";
import ActivityLog from "./components/ActivityLog";

// Icons
import { Sparkles, ChartBar as BarChart, Mail, MessageSquare, Bot, Users, ShieldCheck, LogOut, RefreshCw, Clock, Settings, Grid2x2 as Grid, CircleAlert as AlertCircle, ExternalLink } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);

  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "simulator" | "settings">("dashboard");

  const [isScanningGmail, setIsScanningGmail] = useState(false);
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);
  const [refreshingLeadId, setRefreshingLeadId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user, session) => {
      setCurrentUser(user);
      setNeedsAuth(!user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync data from Supabase
  useEffect(() => {
    if (!currentUser) return;

    // Demo mode
    if (currentUser.id === "demo-user") {
      const savedSettings = localStorage.getItem("lead_agent_demo_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        const defaultSettings: Setting = {
          id: "demo-user",
          companyName: "Apex Digital Solutions",
          companyDescription: "We build premium bespoke websites, automated SaaS backends, and AI pipelines to save businesses hours of manual tasks. Consultation starts at $1500.",
          agentTone: "persuasive",
          gmailAutomationToggle: true,
          whatsappAutomationToggle: true,
          gmailAutoSend: false,
          whatsappAutoSend: false,
          ownerId: "demo-user",
        };
        setSettings(defaultSettings);
        localStorage.setItem("lead_agent_demo_settings", JSON.stringify(defaultSettings));
      }

      const savedLeads = localStorage.getItem("lead_agent_demo_leads");
      if (savedLeads) {
        setLeads(JSON.parse(savedLeads));
      } else {
        const initialLeads: Lead[] = [
          {
            id: "demo-lead-1",
            source: "gmail",
            name: "Alexander Hamilton",
            contact: "alex.ham@firsttreasury.io",
            status: "new",
            lastMessage: "Hi, I need a custom invoice tracking dashboard integrated with Stripe by next month. Can we schedule a meeting?",
            aiResponse: "Hi Alexander! Under Apex Digital Solutions, we would love to build your custom invoice tracking dashboard. We can definitely hit your deadline. Let's get a kick-off call scheduled. What is your phone number?",
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            ownerId: "demo-user",
          },
          {
            id: "demo-lead-2",
            source: "whatsapp",
            name: "Beatriz Gomez",
            contact: "+1 (555) 304-2931",
            status: "replied",
            lastMessage: "Hi, how much for a 5-page static landing page with Tailwind?",
            aiResponse: "Hi Beatriz, thank you for writing in! Under Apex Digital Solutions, our premium 5-page static landing pages start at $1200. I can set you up with an initial design plan this week. Here is our brief booking link: cal.com/apex-digital.",
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            ownerId: "demo-user",
          }
        ];
        setLeads(initialLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(initialLeads));
      }

      const savedLogs = localStorage.getItem("lead_agent_demo_logs");
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        const initialLogs: Log[] = [
          {
            id: "demo-log-1",
            leadId: "demo-lead-2",
            contact: "+1 (555) 304-2931",
            channel: "whatsapp",
            status: "success",
            message: "Hi Beatriz, thank you for writing in! Under Apex Digital Solutions, our premium 5-page static landing pages start at $1200...",
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            ownerId: "demo-user",
          }
        ];
        setLogs(initialLogs);
        localStorage.setItem("lead_agent_demo_logs", JSON.stringify(initialLogs));
      }

      return;
    }

    // Real Supabase subscriptions
    const leadsChannel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `owner_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new as Lead : l));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Leads channel error - realtime may not be enabled');
        }
      });

    const logsChannel = supabase
      .channel('logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'logs',
          filter: `owner_id=eq.${currentUser.id}`
        },
        (payload) => {
          setLogs(prev => [payload.new as Log, ...prev]);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Logs channel error - realtime may not be enabled');
        }
      });

    // Fetch initial data
    const fetchData = async () => {
      try {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('owner_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
        } else if (leadsData) {
          setLeads(leadsData.map(l => ({
            ...l,
            lastMessage: l.last_message,
            aiResponse: l.ai_response,
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            ownerId: l.owner_id
          })) as Lead[]);
        }

        const { data: logsData, error: logsError } = await supabase
          .from('logs')
          .select('*')
          .eq('owner_id', currentUser.id)
          .order('timestamp', { ascending: false });

        if (logsError) {
          console.error('Error fetching logs:', logsError);
        } else if (logsData) {
          setLogs(logsData.map(l => ({
            ...l,
            leadId: l.lead_id,
            ownerId: l.owner_id
          })) as Log[]);
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('owner_id', currentUser.id)
          .maybeSingle();

        if (settingsError) {
          console.error('Error fetching settings:', settingsError);
        } else if (settingsData) {
          setSettings({
            ...settingsData,
            companyName: settingsData.company_name,
            companyDescription: settingsData.company_description,
            agentTone: settingsData.agent_tone,
            gmailAutomationToggle: settingsData.gmail_automation_toggle,
            whatsappAutomationToggle: settingsData.whatsapp_automation_toggle,
            gmailAutoSend: settingsData.gmail_auto_send,
            whatsappAutoSend: settingsData.whatsapp_auto_send,
            ownerId: settingsData.owner_id,
            createdAt: settingsData.created_at,
            updatedAt: settingsData.updated_at
          } as Setting);
        }
      } catch (err) {
        console.error('Unexpected error fetching data:', err);
      }
    };

    fetchData();

    return () => {
      leadsChannel.unsubscribe();
      logsChannel.unsubscribe();
    };
  }, [currentUser]);

  // Auth handlers
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      // OAuth redirect will handle the rest
    } catch (err: any) {
      console.error(err);
      setAuthError(`Google Authentication failed: ${err.message || err}. Please try again.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEnterDemoMode = () => {
    const demoUser = {
      id: "demo-user",
      email: "demo@example.com",
    } as User;
    setCurrentUser(demoUser);
    setNeedsAuth(false);
    showNotification("Launched in Local Sandbox Mode! Database connections are simulated.");
  };

  const handleLogout = async () => {
    try {
      if (currentUser?.id !== "demo-user") {
        await signOut();
      }
      setCurrentUser(null);
      setNeedsAuth(true);
      setLeads([]);
      setLogs([]);
      setSettings(null);
      showNotification("Signed out safely.");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAIResponse = async (messageText: string, name: string): Promise<string> => {
    try {
      const response = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadMessage: messageText,
          leadName: name,
          companyName: settings?.companyName,
          companyDescription: settings?.companyDescription,
          agentTone: settings?.agentTone
        }),
      });

      if (!response.ok) {
        throw new Error("API call response error.");
      }

      const body = await response.json();
      return body.text || "Thank you for getting in touch! We will get back to you shortly.";
    } catch (err) {
      console.error("Gemini call error:", err);
      return `Hi ${name}, thank you for writing in! Under ${settings?.companyName || "our business"}, we would love to schedule a custom consult call to address this and get you set up. Best regards, AI Engine.`;
    }
  };

  const handleApproveSend = async (lead: Lead, customMessage: string) => {
    if (!currentUser) return;
    try {
      const timestampStr = new Date().toISOString();
      const updatedLead: Lead = {
        ...lead,
        aiResponse: customMessage,
        status: "replied",
        updatedAt: timestampStr
      };

      if (currentUser.id === "demo-user") {
        const nextLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));

        const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const successLog: Log = {
          id: logId,
          leadId: lead.id,
          contact: lead.contact,
          channel: lead.source,
          status: "success",
          message: customMessage,
          timestamp: timestampStr,
          ownerId: currentUser.id
        };
        const nextLogs = [successLog, ...logs];
        setLogs(nextLogs);
        localStorage.setItem("lead_agent_demo_logs", JSON.stringify(nextLogs));
        showNotification(`AI Reply dispatched successfully to ${lead.name}!`);
        return;
      }

      await supabase
        .from('leads')
        .update({
          ai_response: customMessage,
          status: 'replied',
          updated_at: timestampStr
        })
        .eq('id', lead.id);

      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await supabase.from('logs').insert({
        id: logId,
        lead_id: lead.id,
        contact: lead.contact,
        channel: lead.source,
        status: 'success',
        message: customMessage,
        owner_id: currentUser.id,
        timestamp: timestampStr
      });

      showNotification(`AI Reply dispatched successfully to ${lead.name}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async (lead: Lead) => {
    setRefreshingLeadId(lead.id);
    try {
      const newResponse = await fetchAIResponse(lead.lastMessage, lead.name);
      const updatedLead: Lead = {
        ...lead,
        aiResponse: newResponse,
        updatedAt: new Date().toISOString()
      };

      if (currentUser?.id === "demo-user") {
        const nextLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));
        showNotification("Regenerated optimized reply option with Gemini.");
        return;
      }

      await supabase
        .from('leads')
        .update({
          ai_response: newResponse,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      showNotification("Regenerated optimized reply option with Gemini.");
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingLeadId(null);
    }
  };

  const handleIgnore = async (lead: Lead) => {
    try {
      const updatedLead: Lead = {
        ...lead,
        status: "ignored",
        updatedAt: new Date().toISOString()
      };

      if (currentUser?.id === "demo-user") {
        const nextLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));
        showNotification("Lead snoozed catalogued successfully.");
        return;
      }

      await supabase
        .from('leads')
        .update({
          status: 'ignored',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      showNotification("Lead snoozed catalogued successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    const confirmed = window.confirm(`Remove prospect record "${lead.name}" permanently from the database?`);
    if (!confirmed) return;
    try {
      if (currentUser?.id === "demo-user") {
        const nextLeads = leads.filter(l => l.id !== lead.id);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));
        showNotification("Prospect record deleted.");
        return;
      }

      await supabase.from('leads').delete().eq('id', lead.id);
      showNotification("Prospect record deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLogs = async () => {
    const confirmed = window.confirm("Clear action logs? This does not alter prospect categories.");
    if (!confirmed) return;
    try {
      if (currentUser?.id === "demo-user") {
        setLogs([]);
        localStorage.removeItem("lead_agent_demo_logs");
        showNotification("Logs cleared safely.");
        return;
      }

      await supabase.from('logs').delete().eq('owner_id', currentUser?.id);
      showNotification("Logs cleared safely.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateLead = async (source: "gmail" | "whatsapp", name: string, contact: string, message: string) => {
    if (!currentUser) return;
    setIsSimulatingLead(true);
    try {
      const leadId = `sim-${Date.now()}`;
      const autoSendEngaged = source === "gmail" ? (settings?.gmailAutomationToggle && settings?.gmailAutoSend) : (settings?.whatsappAutomationToggle && settings?.whatsappAutoSend);
      const aiReply = await fetchAIResponse(message, name);
      const timestampStr = new Date().toISOString();

      const newLead: Lead = {
        id: leadId,
        source,
        name,
        contact,
        status: autoSendEngaged ? "replied" : "new",
        lastMessage: message,
        aiResponse: aiReply,
        createdAt: timestampStr,
        updatedAt: timestampStr,
        ownerId: currentUser.id
      };

      if (currentUser.id === "demo-user") {
        const nextLeads = [newLead, ...leads];
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));

        const logId = `log-${Date.now()}`;
        const newLog: Log = {
          id: logId,
          leadId: leadId,
          contact,
          channel: source,
          status: autoSendEngaged ? "success" : "pending",
          message: aiReply,
          timestamp: timestampStr,
          ownerId: currentUser.id
        };
        const nextLogs = [newLog, ...logs];
        setLogs(nextLogs);
        localStorage.setItem("lead_agent_demo_logs", JSON.stringify(nextLogs));
        showNotification(`Simulated inbound lead from ${name}!`);
        return;
      }

      await supabase.from('leads').insert({
        id: leadId,
        source,
        name,
        contact,
        status: autoSendEngaged ? 'replied' : 'new',
        last_message: message,
        ai_response: aiReply,
        owner_id: currentUser.id
      });

      const logId = `log-${Date.now()}`;
      await supabase.from('logs').insert({
        id: logId,
        lead_id: leadId,
        contact,
        channel: source,
        status: autoSendEngaged ? 'success' : 'pending',
        message: aiReply,
        owner_id: currentUser.id
      });

      showNotification(`Simulated inbound lead from ${name}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingLead(false);
    }
  };

  const scanGmailInbox = async () => {
    if (!currentUser) return;
    setIsScanningGmail(true);
    try {
      if (currentUser.id === "demo-user") {
        await new Promise(resolve => setTimeout(resolve, 800));

        const demoPool = [
          {
            name: "Sophia Lopez",
            contact: "sophia.l@merchantflow.com",
            message: "Looking for premium custom Shopify store setup and invoice integrations. Budget is $2000.",
          },
          {
            name: "John Carter",
            contact: "john@carterventures.com",
            message: "Need a smart customer support agent on WhatsApp built with Gemini. Do you have a calendar link?",
          },
          {
            name: "Maya Lin",
            contact: "maya@designstudio.co",
            message: "Hi there, do you offer ongoing technical maintenance or is it just project-based development?",
          }
        ];

        const available = demoPool.filter(p => !leads.some(l => l.contact === p.contact));
        if (available.length === 0) {
          showNotification("Workspace checked: No new unread business mails in Inbox.");
          setIsScanningGmail(false);
          return;
        }

        const picked = available[0];
        const leadId = `gmail-sim-${Date.now()}`;
        const timestampStr = new Date().toISOString();
        const autoSendActive = settings?.gmailAutomationToggle && settings?.gmailAutoSend;

        const aiDraft = await fetchAIResponse(picked.message, picked.name);

        const capturedProspect: Lead = {
          id: leadId,
          source: "gmail",
          name: picked.name,
          contact: picked.contact,
          status: autoSendActive ? "replied" : "new",
          lastMessage: picked.message,
          aiResponse: aiDraft,
          createdAt: timestampStr,
          updatedAt: timestampStr,
          ownerId: currentUser.id
        };

        const logId = `log-g-${Date.now()}`;
        const autoLog: Log = {
          id: logId,
          leadId: leadId,
          contact: picked.contact,
          channel: "gmail",
          status: autoSendActive ? "success" : "pending",
          message: aiDraft,
          timestamp: timestampStr,
          ownerId: currentUser.id
        };

        const nextLeads = [capturedProspect, ...leads];
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));

        const nextLogs = [autoLog, ...logs];
        setLogs(nextLogs);
        localStorage.setItem("lead_agent_demo_logs", JSON.stringify(nextLogs));

        showNotification(`Workspace Gmail query completed! Simulated 1 new unread client inquiry (${picked.name}) with auto-draft response.`);
        setIsScanningGmail(false);
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        alert("Google Access Token unavailable or expired. Please re-authenticate.");
        setIsScanningGmail(false);
        return;
      }

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread label:INBOX", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        throw new Error("Failed to contact Gmail API. Ensure scopes are allowed.");
      }

      const data = await res.json();
      if (!data.messages || data.messages.length === 0) {
        showNotification("Workspace scan success: 0 unread inquiries in Inbox.");
        setIsScanningGmail(false);
        return;
      }

      let count = 0;
      for (const msg of data.messages) {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();

        const headers = detail.payload.headers;
        const fromVal = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
        const subVal = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";
        const snippet = detail.snippet || "";

        let parsedName = "Prospective Client";
        let parsedEmail = fromVal;
        const match = fromVal.match(/^(.*?)\s*<(.*?)>$/);
        if (match) {
          parsedName = match[1].replace(/^["']|["']$/g, "").trim();
          parsedEmail = match[2];
        }

        const leadId = `gmail-${msg.id}`;
        if (leads.some(l => l.id === leadId)) continue;

        count++;
        const aiDraft = await fetchAIResponse(snippet, parsedName);
        const timestampStr = new Date().toISOString();
        const autoSendActive = settings?.gmailAutomationToggle && settings?.gmailAutoSend;

        await supabase.from('leads').insert({
          id: leadId,
          source: 'gmail',
          name: parsedName,
          contact: parsedEmail,
          status: autoSendActive ? 'replied' : 'new',
          last_message: snippet || `Subject: ${subVal}`,
          ai_response: aiDraft,
          owner_id: currentUser.id
        });

        const logId = `log-g-${Date.now()}-${msg.id}`;
        await supabase.from('logs').insert({
          id: logId,
          lead_id: leadId,
          contact: parsedEmail,
          channel: 'gmail',
          status: autoSendActive ? 'success' : 'pending',
          message: aiDraft,
          owner_id: currentUser.id
        });
      }

      if (count > 0) {
        showNotification(`Workspace query completed! Successfully imported ${count} new unread inquiries with auto-draft responses.`);
      } else {
        showNotification("Workspace checked: No new unread business mails in Inbox.");
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`Gmail scanning error: ${err.message || err}`);
    } finally {
      setIsScanningGmail(false);
    }
  };

  const handleSaveSettings = async (updatedSettings: Setting) => {
    if (!currentUser) return;
    if (currentUser.id === "demo-user") {
      setSettings(updatedSettings);
      localStorage.setItem("lead_agent_demo_settings", JSON.stringify(updatedSettings));
      return;
    }

    await supabase.from('settings').upsert({
      id: currentUser.id,
      company_name: updatedSettings.companyName,
      company_description: updatedSettings.companyDescription,
      agent_tone: updatedSettings.agentTone,
      gmail_automation_toggle: updatedSettings.gmailAutomationToggle,
      whatsapp_automation_toggle: updatedSettings.whatsappAutomationToggle,
      gmail_auto_send: updatedSettings.gmailAutoSend,
      whatsapp_auto_send: updatedSettings.whatsappAutoSend,
      owner_id: currentUser.id
    });

    setSettings(updatedSettings);
  };

  // Render auth gate
  if (needsAuth) {
    return (
      <div
        id="gate-portal-view"
        className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white"
      >
        <div className="w-full max-w-md bg-[#161920] p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-8 relative overflow-hidden transition-all">

          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-indigo-600 to-emerald-500"></div>

          <div className="space-y-3 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm mb-2">
              <Bot className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">
              Lead Follow-up AI Agent
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Automate multi-channel client inquiries. Scan Gmail opportunities, integrate WhatsApp responders, and deliver AI-generated responses instantly.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-3 justify-center">
              <GsiButton onClick={handleLogin} isLoading={isLoggingIn} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Application
  return (
    <div id="application-dashboard-root" className="min-h-screen bg-[#0A0C10] text-[#CBD5E1] font-sans selection:bg-indigo-500 selection:text-white pb-12">

      {notification && (
        <div
          id="global-toast-notification"
          className="fixed bottom-5 right-5 z-50 bg-[#161920] text-slate-200 text-xs font-bold py-3.5 px-6 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2 max-w-md animate-fade-in"
        >
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#0A0C10]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight font-sans">AI Lead Agent</h1>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Workspace Copilot</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser?.id === "demo-user" && (
              <span className="text-[10px] font-extrabold uppercase bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse text-amber-400" />
                Sandbox Mode
              </span>
            )}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-white">{currentUser?.email || "Connected Client"}</span>
              <span className="text-[10px] text-indigo-400 font-semibold">{currentUser?.id}</span>
            </div>
            <button
              onClick={handleLogout}
              id="google-logout-button"
              className="p-2 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/50 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      <div className="bg-gradient-to-b from-[#11141A] to-transparent py-8 border-b border-slate-800/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">AI Leads Auto-Responder</h2>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span>Training Tone:</span>
              <span className="font-bold underline text-indigo-400 capitalize">{settings?.agentTone || "friendly"}</span>
              <span>&bull; Status:</span>
              <span className="flex items-center gap-1.5 text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Active listening
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={scanGmailInbox}
              disabled={isScanningGmail}
              id="scan-gmail-leads-button"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanningGmail ? "animate-spin" : ""}`} />
              {isScanningGmail ? "Scanning Inbox..." : "Scan Gmail Inbox for Leads"}
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className="px-4 py-2 bg-[#161920] border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Inbound Simulated Trials
            </button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto gap-6 font-semibold text-sm">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-3 transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "dashboard" ? "text-white border-b-2 border-indigo-500 font-extrabold" : "text-slate-500 hover:text-slate-300"}`}
          >
            <BarChart className="h-4.5 w-4.5" />
            Dashboard Metrics
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "leads" ? "text-white border-b-2 border-indigo-500 font-extrabold" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Users className="h-4.5 w-4.5" />
            Prospect Pipeline ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`pb-3 transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "simulator" ? "text-white border-b-2 border-indigo-500 font-extrabold" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Bot className="h-4.5 w-4.5" />
            Simulation Suite
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "settings" ? "text-white border-b-2 border-indigo-500 font-extrabold" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Settings className="h-4.5 w-4.5" />
            AI Persona Training
          </button>
        </div>

        <div className="space-y-10">

          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              <DashboardStats leads={leads} logs={logs} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LeadInbox
                    leads={leads.slice(0, 5)}
                    onApproveSend={handleApproveSend}
                    onRegenerate={handleRegenerate}
                    onIgnore={handleIgnore}
                    onDelete={handleDeleteLead}
                    refreshingLeadId={refreshingLeadId}
                  />
                </div>
                <div>
                  <ActivityLog logs={logs} onClearLogs={handleClearLogs} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "leads" && (
            <div className="animate-fade-in">
              <LeadInbox
                leads={leads}
                onApproveSend={handleApproveSend}
                onRegenerate={handleRegenerate}
                onIgnore={handleIgnore}
                onDelete={handleDeleteLead}
                refreshingLeadId={refreshingLeadId}
              />
            </div>
          )}

          {activeTab === "simulator" && (
            <div className="animate-fade-in">
              {settings && (
                <SimulatorPanel
                  settings={settings}
                  onSimulateLead={handleSimulateLead}
                  isSimulating={isSimulatingLead}
                />
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              {settings && (
                <SettingsPanel
                  settings={settings}
                  onSave={handleSaveSettings}
                />
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}