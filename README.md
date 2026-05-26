<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Lead Follow-up AI Agent

An autonomous AI dashboard to connect Gmail and WhatsApp, scan for leads, and automatically draft or reply to inquirers using Gemini.

## Recent Migration: Firebase to Supabase

This application has been successfully migrated from Firebase Firestore to Supabase PostgreSQL database with the following improvements:

- Supabase PostgreSQL database with Row Level Security (RLS)
- Google OAuth authentication via Supabase Auth
- Real-time data synchronization using Supabase Realtime
- Proper foreign key relationships and constraints
- Immutable audit logs (no updates/deletes)
- Auto-creation of user settings on signup

## Run Locally

**Prerequisites:** Node.js, Supabase Account

### Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Configure Google OAuth Provider in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth Client ID and Secret
   - Configure redirect URLs

4. Set environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. Run the database migration (already applied):
   - Tables created: `leads`, `logs`, `settings`
   - RLS policies enabled for all tables
   - Automatic user settings creation on signup

6. Run the app:
   ```bash
   npm run dev
   ```

## Database Schema

### leads
- Stores business leads from Gmail and WhatsApp
- Fields: id, source, name, contact, status, last_message, ai_response, owner_id, created_at, updated_at
- RLS: Users can only access their own leads

### logs
- Immutable audit trail of AI agent actions
- Fields: id, lead_id, contact, channel, status, message, owner_id, timestamp
- RLS: Users can only read and create logs (no updates/deletes)

### settings
- User-specific AI agent configuration
- Fields: id, company_name, company_description, agent_tone, automation toggles, owner_id
- Auto-created on user signup with default values

## Features

- Google OAuth authentication with Gmail API scopes
- Real-time lead updates via Supabase Realtime
- AI-generated response drafts using Gemini
- Gmail inbox scanning for new leads
- WhatsApp integration for inbound messages
- Customizable agent tone and behavior
- Activity logging and audit trail

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Lucide Icons
- Backend: Express, Node.js
- Database: Supabase PostgreSQL
- Auth: Supabase Auth with Google OAuth
- AI: Google Gemini API
