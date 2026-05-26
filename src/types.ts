export interface Lead {
  id: string;
  source: "gmail" | "whatsapp";
  name: string;
  contact: string;
  status: "new" | "replied" | "converted" | "ignored";
  lastMessage: string;
  aiResponse?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface Log {
  id: string;
  leadId: string;
  contact: string;
  channel: "gmail" | "whatsapp";
  status: "success" | "pending" | "failed";
  message: string;
  timestamp: string;
  ownerId: string;
}

export interface Setting {
  id: string;
  companyName: string;
  companyDescription: string;
  agentTone: "professional" | "friendly" | "persuasive" | "direct";
  gmailAutomationToggle: boolean;
  whatsappAutomationToggle: boolean;
  gmailAutoSend: boolean;
  whatsappAutoSend: boolean;
  ownerId: string;
}
