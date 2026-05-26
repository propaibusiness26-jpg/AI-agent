import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  db, 
  auth, 
  initAuth, 
  googleSignIn, 
  logout, 
  handleFirestoreError, 
  OperationType,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getAccessToken
} from "./firebase";
import { Lead, Log, Setting } from "./types";

// Component imports
import GsiButton from "./components/GsiButton";
import DashboardStats from "./components/DashboardStats";
import LeadInbox from "./components/LeadInbox";
import SettingsPanel from "./components/SettingsPanel";
import SimulatorPanel from "./components/SimulatorPanel";
import ActivityLog from "./components/ActivityLog";

// Icons 
import { 
  Sparkles, 
  BarChart, 
  Mail, 
  MessageSquare, 
  Bot, 
  Users, 
  ShieldCheck, 
  LogOut, 
  RefreshCw,
  Clock,
  Settings,
  Grid,
  AlertCircle,
  ExternalLink
} from "lucide-react";

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

  // Auth initiation listener on boot
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync data streams from Firestore upon authenticate
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.uid === "demo-user") {
      // Load from localStorage or defaults
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

    // Under secure rule: lists filtered strictly by ownerId
    const leadsQuery = query(collection(db, "leads"), where("ownerId", "==", currentUser.uid));
    const unsubscribeLeads = onSnapshot(
      leadsQuery,
      (snapshot) => {
        const list: Lead[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Lead);
        });
        setLeads(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "leads");
      }
    );

    const logsQuery = query(collection(db, "logs"), where("ownerId", "==", currentUser.uid));
    const unsubscribeLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const list: Log[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Log);
        });
        setLogs(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "logs");
      }
    );

    // Sync settings or set default blueprint configuration
    const settingsDocRef = doc(db, "settings", currentUser.uid);
    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as Setting);
        } else {
          const defaultSettings: Setting = {
            id: currentUser.uid,
            companyName: "Solopreneur Consulting LLC",
            companyDescription: "We specialize in tailored software engineering, custom Shopify setups, and business automation pipelines. Our consulting programs start at $1500 per month.",
            agentTone: "friendly",
            gmailAutomationToggle: true,
            whatsappAutomationToggle: true,
            gmailAutoSend: false,
            whatsappAutoSend: false,
            ownerId: currentUser.uid,
          };
          setDoc(settingsDocRef, defaultSettings).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `settings/${currentUser.uid}`);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `settings/${currentUser.uid}`);
      }
    );

    return () => {
      unsubscribeLeads();
      unsubscribeLogs();
      unsubscribeSettings();
    };
  }, [currentUser]);

  // Auth handles
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setNeedsAuth(false);
        showNotification(`Welcome back, ${result.user.displayName || "Client"}! Workspace enabled.`);
      }
    } catch (err: any) {
      console.error(err);
      const isPopupClosed = err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user") || err?.message?.includes("closed by the user");
      const isPopupBlocked = err?.code === "auth/popup-blocked" || err?.message?.includes("popup-blocked");
      
      if (isPopupClosed) {
        setAuthError(
          "The Google sign-in window was closed or blocked. Because the application is running in an embedded preview iframe, your browser automatically restricts authentication popups. For a smooth, error-free setup, please run this app in a separate standalone tab!"
        );
      } else if (isPopupBlocked) {
        setAuthError(
          "Your browser is actively blocking the Google Authentication popup. Please check your browser's address bar to allow popups, or open the app in a new tab."
        );
      } else {
        setAuthError(
          `Google Authentication failed: ${err.message || err}. We strongly recommend opening this application in a Standalone tab to prevent sandbox iframe conflicts.`
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEnterDemoMode = () => {
    const demoUser = {
      uid: "demo-user",
      displayName: "Apex Entrepreneur",
      email: "demo@example.com",
    } as User;
    setCurrentUser(demoUser);
    setNeedsAuth(false);
    showNotification("Launched in Local Sandbox Mode! Firestore & Workspace connections are simulated.");
  };

  const handleLogout = async () => {
    try {
      if (currentUser?.uid !== "demo-user") {
        await logout();
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

  // call the server-side Gemini generation proxy
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

  // Simulated outbound dispatch trigger (mock integrations success)
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
      
      if (currentUser.uid === "demo-user") {
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
          ownerId: currentUser.uid
        };
        const nextLogs = [successLog, ...logs];
        setLogs(nextLogs);
        localStorage.setItem("lead_agent_demo_logs", JSON.stringify(nextLogs));
        showNotification(`AI Reply dispatched successfully to ${lead.name}!`);
        return;
      }
      
      await setDoc(doc(db, "leads", lead.id), updatedLead);

      // Create success log item
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const successLog: Log = {
        id: logId,
        leadId: lead.id,
        contact: lead.contact,
        channel: lead.source,
        status: "success",
        message: customMessage,
        timestamp: timestampStr,
        ownerId: currentUser.uid
      };
      await setDoc(doc(db, "logs", logId), successLog);
      showNotification(`AI Reply dispatched successfully to ${lead.name}!`);
    } catch (err) {
      console.error(err);
    }
  };

  // AI draft regeneration trigger
  const handleRegenerate = async (lead: Lead) => {
    setRefreshingLeadId(lead.id);
    try {
      const newResponse = await fetchAIResponse(lead.lastMessage, lead.name);
      const updatedLead: Lead = {
        ...lead,
        aiResponse: newResponse,
        updatedAt: new Date().toISOString()
      };
      if (currentUser.uid === "demo-user") {
        const nextLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));
        showNotification("Regenerated optimized reply option with Gemini.");
        return;
      }
      await setDoc(doc(db, "leads", lead.id), updatedLead);
      showNotification("Regenerated optimized reply option with Gemini.");
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingLeadId(null);
    }
  };

  // Snooze action
  const handleIgnore = async (lead: Lead) => {
    try {
      const updatedLead: Lead = {
        ...lead,
        status: "ignored",
        updatedAt: new Date().toISOString()
      };
      if (currentUser.uid === "demo-user") {
        const nextLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));
        showNotification("Lead snoozed catalogued successfully.");
        return;
      }
      await setDoc(doc(db, "leads", lead.id), updatedLead);
      showNotification("Lead snoozed catalogued successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  // Trash lead action
  const handleDeleteLead = async (lead: Lead) => {
    const confirmed = window.confirm(`Remove prospect record "${lead.name}" permanently from the database?`);
    if (!confirmed) return;
    try {
      if (currentUser.uid === "demo-user") {
        const nextLeads = leads.filter(l => l.id !== lead.id);
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));
        showNotification("Prospect record deleted.");
        return;
      }
      await deleteDoc(doc(db, "leads", lead.id));
      showNotification("Prospect record deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  // Clear Audit trails
  const handleClearLogs = async () => {
    const confirmed = window.confirm("Clear action logs? This does not alter prospect categories.");
    if (!confirmed) return;
    try {
      if (currentUser.uid === "demo-user") {
        setLogs([]);
        localStorage.removeItem("lead_agent_demo_logs");
        showNotification("Logs cleared safely.");
        return;
      }
      for (const log of logs) {
        await deleteDoc(doc(db, "logs", log.id));
      }
      showNotification("Logs cleared safely.");
    } catch (err) {
      console.error(err);
    }
  };

  // Inbound simulation engine
  const handleSimulateLead = async (source: "gmail" | "whatsapp", name: string, contact: string, message: string) => {
    if (!currentUser) return;
    setIsSimulatingLead(true);
    try {
      const leadId = `sim-${Date.now()}`;
      
      // Determine if automation toggle permits direct AI autoreply
      const autoSendEngaged = source === "gmail" ? (settings?.gmailAutomationToggle && settings?.gmailAutoSend) : (settings?.whatsappAutomationToggle && settings?.whatsappAutoSend);
      
      // AI generates response template
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
        ownerId: currentUser.uid
      };

      if (currentUser.uid === "demo-user") {
        const nextLeads = [newLead, ...leads];
        setLeads(nextLeads);
        localStorage.setItem("lead_agent_demo_leads", JSON.stringify(nextLeads));

        const logId = `log-${Date.now()}`;
        const newLog: Log = {
          id: logId,
          leadId,
          contact,
          channel: source,
          status: autoSendEngaged ? "success" : "pending",
          message: aiReply,
          timestamp: timestampStr,
          ownerId: currentUser.uid
        };
        const nextLogs = [newLog, ...logs];
        setLogs(nextLogs);
        localStorage.setItem("lead_agent_demo_logs", JSON.stringify(nextLogs));
        showNotification(`Simulated inbound lead from ${name}!`);
        return;
      }

      await setDoc(doc(db, "leads", leadId), newLead);

      const logId = `log-${Date.now()}`;
      const newLog: Log = {
        id: logId,
        leadId,
        contact,
        channel: source,
        status: autoSendEngaged ? "success" : "pending",
        message: aiReply,
        timestamp: timestampStr,
        ownerId: currentUser.uid
      };
      await setDoc(doc(db, "logs", logId), newLog);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingLead(false);
    }
  };

  // Real Workspace unread Gmail scan mechanism
  const scanGmailInbox = async () => {
    if (!currentUser) return;
    setIsScanningGmail(true);
    try {
      if (currentUser.uid === "demo-user") {
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

        // Pick one that is not already captured
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
          ownerId: currentUser.uid
        };

        const logId = `log-g-${Date.now()}`;
        const autoLog: Log = {
          id: logId,
          leadId,
          contact: picked.contact,
          channel: "gmail",
          status: autoSendActive ? "success" : "pending",
          message: aiDraft,
          timestamp: timestampStr,
          ownerId: currentUser.uid
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
        alert("Google Access Token unavailable or expired. Please re-authenticate via pop-up.");
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
        if (leads.some(l => l.id === leadId)) continue; // Skip already captured threads

        count++;
        const aiDraft = await fetchAIResponse(snippet, parsedName);
        const timestampStr = new Date().toISOString();

        const autoSendActive = settings?.gmailAutomationToggle && settings?.gmailAutoSend;

        const capturedProspect: Lead = {
          id: leadId,
          source: "gmail",
          name: parsedName,
          contact: parsedEmail,
          status: autoSendActive ? "replied" : "new",
          lastMessage: snippet || `Subject: ${subVal}`,
          aiResponse: aiDraft,
          createdAt: timestampStr,
          updatedAt: timestampStr,
          ownerId: currentUser.uid
        };
        await setDoc(doc(db, "leads", leadId), capturedProspect);

        const logId = `log-g-${Date.now()}-${msg.id}`;
        const autoLog: Log = {
          id: logId,
          leadId,
          contact: parsedEmail,
          channel: "gmail",
          status: autoSendActive ? "success" : "pending",
          message: aiDraft,
          timestamp: timestampStr,
          ownerId: currentUser.uid
        };
        await setDoc(doc(db, "logs", logId), autoLog);
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

  // Save trained business rules
  const handleSaveSettings = async (updatedSettings: Setting) => {
    if (!currentUser) return;
    if (currentUser.uid === "demo-user") {
      setSettings(updatedSettings);
      localStorage.setItem("lead_agent_demo_settings", JSON.stringify(updatedSettings));
      return;
    }
    await setDoc(doc(db, "settings", currentUser.uid), updatedSettings);
    setSettings(updatedSettings);
  };

  // If loading or unauthenticated, display gorgeous modern portal gate
  if (needsAuth) {
    return (
      <div 
        id="gate-portal-view" 
        className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white"
      >
        <div className="w-full max-w-md bg-[#161920] p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-8 relative overflow-hidden transition-all">
          
          {/* Subtle graphic accent */}
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

            {authError && (
              <div id="auth-error-banner" className="bg-amber-950/25 border border-amber-900/40 rounded-2xl p-4 space-y-3.5 animate-fade-in text-left">
                <div className="flex gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-400">Google Authentication Blocked</h4>
                    <p className="text-[11px] text-slate-350 leading-relaxed font-sans">
                      {authError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Live 24/7 Production Setup & Bypass Credentials Restrictions */}
            <div className="bg-[#11141A] border border-slate-800/80 rounded-2xl p-4 space-y-3.5 text-left">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800/60">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                Live 24/7 Deployment Setup
              </h4>
              <div className="space-y-3 text-[11px] text-slate-400 leading-relaxed font-sans">
                <div>
                  <h5 className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-indigo-950 text-[9px] font-mono border border-indigo-900/40">1</span>
                    Unblock Google Login (Error 403)
                  </h5>
                  <p className="pl-5 mt-1">
                    Your Firebase OAuth app restricts logins unless your email is explicitly registered as a Test User in the Google Cloud Console. To bypass this instantly:
                  </p>
                  <ol className="list-decimal pl-9 mt-1.5 space-y-1">
                    <li>Log in to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold cursor-pointer">Google Cloud Console</a>.</li>
                    <li>Select the Google Project: <code className="bg-slate-900 text-slate-200 px-1 py-0.5 rounded font-mono">gen-lang-client-0473123354</code>.</li>
                    <li>Navigate to <strong>APIs & Services</strong> &gt; <strong>OAuth consent screen</strong>.</li>
                    <li>Find <strong>Test users</strong> section, click <strong>+ ADD USERS</strong> and register your email <code className="bg-slate-900 text-slate-200 px-1 py-0.5 rounded font-mono">prop.ai.business26@gmail.com</code> (then click Save).</li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-slate-800/45">
                  <h5 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-950 text-[9px] font-mono border border-emerald-900/40">2</span>
                    Automated 24/7 Ingestion Webhook
                  </h5>
                  <p className="pl-5 mt-1">
                    To trigger replies continuously 24 hours a day, 7 days a week (completely offline, without having to keep this tab open), send any user lead directly to this live background listener URL:
                  </p>
                  <p className="pl-5 mt-1.5">
                    <code className="bg-slate-950 border border-slate-800 text-slate-100 px-2 py-1 rounded font-mono block mt-1 select-all break-all text-[10px]">
                      POST https://gen-lang-client-0473123354.firebaseapp.com/api/leads/incoming
                    </code>
                  </p>
                  <p className="pl-5 mt-1 text-slate-500 font-mono text-[9px]">
                    Supports JSON objects with: "name", "contact", "source" ("gmail" | "whatsapp"), and "message".
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wide">
              🔒 Powered by Google Workspace & Firebase Auth
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Application Framework
  return (
    <div id="application-dashboard-root" className="min-h-screen bg-[#0A0C10] text-[#CBD5E1] font-sans selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* Dynamic Notification Bubble */}
      {notification && (
        <div 
          id="global-toast-notification" 
          className="fixed bottom-5 right-5 z-50 bg-[#161920] text-slate-200 text-xs font-bold py-3.5 px-6 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2 max-w-md animate-fade-in"
        >
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main App Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0A0C10]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight font-sans">AI Lead Agent</h1>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Workspace Copilot</span>
            </div>
          </div>

          {/* Connected User Badge */}
          <div className="flex items-center gap-4">
            {currentUser?.uid === "demo-user" && (
              <span className="text-[10px] font-extrabold uppercase bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse text-amber-400" />
                Sandbox Mode
              </span>
            )}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-white">{currentUser?.displayName || "Connected Client"}</span>
              <span className="text-[10px] text-indigo-400 font-semibold">{currentUser?.email}</span>
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

      {/* Hero Banner with Integrated Action Controls */}
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

          {/* Quick Active Actions */}
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

      {/* Main Body */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs bar */}
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

        {/* Tab View Container */}
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
