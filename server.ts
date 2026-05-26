import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Firebase App for Server-side Automation
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Lazy initialize Gemini so it doesn't crash on boot if the key is missing from the environment
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Route to generate AI follow-up response
app.post("/api/generate-response", async (req, res) => {
  try {
    const { leadMessage, leadName, companyName, companyDescription, agentTone } = req.body;
    
    if (!leadMessage) {
      return res.status(400).json({ error: "Lead message is required." });
    }

    const client = getGeminiClient();
    const systemInstruction = `You are an AI lead follow-up specialist for ${companyName || 'our company'}. 
Our business is described as: ${companyDescription || 'providing high-performance services and customer support'}. 
Your goal is to follow up with the lead named "${leadName || 'Valued Customer'}" who sent the message: "${leadMessage}".
Write a reply to follow up on this inquiry, answering their question or asking to schedule a call if appropriate.
The tone of your reply must be exactly: ${agentTone || 'professional'}.
Do not start with placeholders like [Lead Name] or [Your Name]. Write a complete, ready-to-send, beautifully structured message. 
Keep it concise, friendly, and highly engaging.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Draft a lead follow-up response to the message: "${leadMessage}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Response Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

// API Route for 24/7 Live Automated Lead Intake Webhook
app.post("/api/leads/incoming", async (req, res) => {
  try {
    const { name, contact, source, message, ownerId } = req.body;
    
    if (!name || !contact || !message) {
      return res.status(400).json({ 
        error: "Missing required fields. Please supply 'name', 'contact', and 'message' in JSON body." 
      });
    }

    const leadSource = (source === "whatsapp" || source === "gmail") ? source : "gmail";
    
    // Resolve ownerId and settings
    let targetOwnerId = ownerId;
    let businessSettings: any = null;

    if (targetOwnerId) {
      const settingsSnap = await getDoc(doc(db, "settings", targetOwnerId));
      if (settingsSnap.exists()) {
        businessSettings = settingsSnap.data();
      }
    } else {
      // If ownerId is omitted, automatically find the first trained business settings saved in Firestore
      const settingsColl = collection(db, "settings");
      const settingsQuery = await getDocs(settingsColl);
      if (!settingsQuery.empty) {
        const firstDoc = settingsQuery.docs[0];
        targetOwnerId = firstDoc.id;
        businessSettings = firstDoc.data();
      }
    }

    if (!targetOwnerId || !businessSettings) {
      // Default live backup configuration if no credentials exist in database
      targetOwnerId = "default-live-owner";
      businessSettings = {
        companyName: "Automated Lead Assistant",
        companyDescription: "A high-performance business following up with all inquiries immediately.",
        agentTone: "friendly",
        gmailAutomationToggle: true,
        whatsappAutomationToggle: true,
        gmailAutoSend: false,
        whatsappAutoSend: false,
      };
    }

    // Call Gemini with saved training settings
    const client = getGeminiClient();
    const systemInstruction = `You are an AI lead follow-up specialist for ${businessSettings.companyName}. 
Our business is described as: ${businessSettings.companyDescription}. 
Your goal is to follow up with the lead named "${name}" who sent the message: "${message}".
Write a reply to follow up on this inquiry, answering their question or asking to schedule a call if appropriate.
The tone of your reply must be exactly: ${businessSettings.agentTone || "friendly"}.
Do not start with placeholders like [Lead Name] or [Your Name]. Write a complete, ready-to-send, beautifully structured message. 
Keep it concise, friendly, and highly engaging.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Draft a lead follow-up response to the message: "${message}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const aiResponseText = response.text || "Thank you for contacting us. We will get back to you shortly!";
    const isAutoSend = leadSource === "gmail" 
      ? (businessSettings.gmailAutomationToggle && businessSettings.gmailAutoSend)
      : (businessSettings.whatsappAutomationToggle && businessSettings.whatsappAutoSend);

    const leadId = `wh-lead-${Date.now()}`;
    const timestampStr = new Date().toISOString();

    const newLead = {
      id: leadId,
      source: leadSource,
      name,
      contact,
      status: isAutoSend ? "replied" : "new",
      lastMessage: message,
      aiResponse: aiResponseText,
      createdAt: timestampStr,
      updatedAt: timestampStr,
      ownerId: targetOwnerId,
    };

    // Save Live Lead Record to Firestore (triggers real-time client UI sync naturally via SDK)
    await setDoc(doc(db, "leads", leadId), newLead);

    // Save Auditable Activity Log
    const logId = `log-wh-${Date.now()}`;
    const logItem = {
      id: logId,
      leadId,
      contact,
      channel: leadSource,
      status: isAutoSend ? "success" : "pending",
      message: aiResponseText,
      timestamp: timestampStr,
      ownerId: targetOwnerId,
    };
    await setDoc(doc(db, "logs", logId), logItem);

    res.json({
      status: "success",
      message: `Lead captured successfully! AI Responder triggered.`,
      leadId,
      ownerId: targetOwnerId,
      channel: leadSource,
      autoSent: isAutoSend,
      draftResponse: aiResponseText
    });

  } catch (error: any) {
    console.error("24/7 Lead Ingestion Error:", error);
    res.status(500).json({ error: error.message || "Failed to process inbound lead." });
  }
});

// Vite middleware for development vs static files for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
