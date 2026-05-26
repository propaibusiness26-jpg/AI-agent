/*
  # Firebase to Supabase Migration - Lead Follow-up AI Agent

  This migration creates the complete database schema migrated from Firebase Firestore,
  including proper PostgreSQL constraints, indexes, and Row Level Security policies.

  1. New Tables
    - `leads`: Stores business leads from Gmail and WhatsApp channels
      - `id` (uuid, primary key)
      - `source` (text, gmail/whatsapp)
      - `name` (text)
      - `contact` (text)
      - `status` (text, new/replied/converted/ignored)
      - `last_message` (text)
      - `ai_response` (text, nullable)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `logs`: Audit trail of AI agent actions
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references leads)
      - `contact` (text)
      - `channel` (text, gmail/whatsapp)
      - `status` (text, success/pending/failed)
      - `message` (text)
      - `owner_id` (uuid, references auth.users)
      - `timestamp` (timestamptz)
    
    - `settings`: User-specific AI agent configuration
      - `id` (uuid, primary key, matches auth.users.id)
      - `company_name` (text)
      - `company_description` (text)
      - `agent_tone` (text, professional/friendly/persuasive/direct)
      - `gmail_automation_toggle` (boolean)
      - `whatsapp_automation_toggle` (boolean)
      - `gmail_auto_send` (boolean)
      - `whatsapp_auto_send` (boolean)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data (owner_id checks)
    - Logs are append-only (no updates or deletes by users)
    - All policies use auth.uid() for user identification

  3. Performance
    - Indexes on owner_id for all tables (filtering)
    - Index on lead_id in logs table (JOIN performance)
    - Index on created_at in leads table (ordering)
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('gmail', 'whatsapp')),
  name text NOT NULL,
  contact text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'converted', 'ignored')),
  last_message text NOT NULL,
  ai_response text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('gmail', 'whatsapp')),
  status text NOT NULL CHECK (status IN ('success', 'pending', 'failed')),
  message text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_description text NOT NULL,
  agent_tone text NOT NULL DEFAULT 'friendly' CHECK (agent_tone IN ('professional', 'friendly', 'persuasive', 'direct')),
  gmail_automation_toggle boolean DEFAULT true,
  whatsapp_automation_toggle boolean DEFAULT true,
  gmail_auto_send boolean DEFAULT false,
  whatsapp_auto_send boolean DEFAULT false,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_owner_id ON logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_logs_lead_id ON logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_settings_owner_id ON settings(owner_id);

-- Enable Row Level Security on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads table
CREATE POLICY "Users can read own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create RLS policies for logs table (append-only)
CREATE POLICY "Users can read own logs"
  ON logs FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own logs"
  ON logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Note: No UPDATE or DELETE policies for logs (immutable audit trail)

-- Create RLS policies for settings table
CREATE POLICY "Users can read own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup (auto-create settings)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (
    id,
    company_name,
    company_description,
    agent_tone,
    gmail_automation_toggle,
    whatsapp_automation_toggle,
    gmail_auto_send,
    whatsapp_auto_send,
    owner_id
  ) VALUES (
    NEW.id,
    'Solopreneur Consulting LLC',
    'We specialize in tailored software engineering, custom Shopify setups, and business automation pipelines. Our consulting programs start at $1500 per month.',
    'friendly',
    true,
    true,
    false,
    false,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();