export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          source: 'gmail' | 'whatsapp'
          name: string
          contact: string
          status: 'new' | 'replied' | 'converted' | 'ignored'
          last_message: string
          ai_response: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: 'gmail' | 'whatsapp'
          name: string
          contact: string
          status?: 'new' | 'replied' | 'converted' | 'ignored'
          last_message: string
          ai_response?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source?: 'gmail' | 'whatsapp'
          name?: string
          contact?: string
          status?: 'new' | 'replied' | 'converted' | 'ignored'
          last_message?: string
          ai_response?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          lead_id: string
          contact: string
          channel: 'gmail' | 'whatsapp'
          status: 'success' | 'pending' | 'failed'
          message: string
          owner_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          lead_id: string
          contact: string
          channel: 'gmail' | 'whatsapp'
          status: 'success' | 'pending' | 'failed'
          message: string
          owner_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          lead_id?: string
          contact?: string
          channel?: 'gmail' | 'whatsapp'
          status?: 'success' | 'pending' | 'failed'
          message?: string
          owner_id?: string
          timestamp?: string
        }
      }
      settings: {
        Row: {
          id: string
          company_name: string
          company_description: string
          agent_tone: 'professional' | 'friendly' | 'persuasive' | 'direct'
          gmail_automation_toggle: boolean
          whatsapp_automation_toggle: boolean
          gmail_auto_send: boolean
          whatsapp_auto_send: boolean
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name: string
          company_description: string
          agent_tone?: 'professional' | 'friendly' | 'persuasive' | 'direct'
          gmail_automation_toggle?: boolean
          whatsapp_automation_toggle?: boolean
          gmail_auto_send?: boolean
          whatsapp_auto_send?: boolean
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          company_description?: string
          agent_tone?: 'professional' | 'friendly' | 'persuasive' | 'direct'
          gmail_automation_toggle?: boolean
          whatsapp_automation_toggle?: boolean
          gmail_auto_send?: boolean
          whatsapp_auto_send?: boolean
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
