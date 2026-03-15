# WeddingDesk v2 — Setup Guide

## What's New in v2
- ✅ Full authentication (Signup / Login / Logout)
- ✅ Per-planner wedding workspace
- ✅ Onboarding wizard: enter couple names, date, city, ceremonies
- ✅ Add guests via modal + copy unique RSVP link per guest
- ✅ Gorgeous Indian festive RSVP page (crimson + marigold + gold)
- ✅ Live RSVP tracker on dashboard

---

## Setup (5 minutes)

### Step 1 — Supabase
1. Open: https://supabase.com/dashboard/project/zfgfgftrfpjaviauwtfy/sql
2. Paste the **entire contents** of `SUPABASE_SETUP.sql`
3. Click **Run**

### Step 2 — Environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://zfgfgftrfpjaviauwtfy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key from Supabase settings>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Find your anon key at:
https://supabase.com/dashboard/project/zfgfgftrfpjaviauwtfy/settings/api

### Step 3 — Install & Run
```bash
npm install
npm run dev
```

---

## User Journey

### Planner Flow
1. Visit `http://localhost:3000` → redirects to Dashboard
2. Redirected to `/auth/login` (not logged in)
3. Click "Create account" → `/auth/signup`
4. Fill name, email, password → redirected to `/onboarding`
5. Enter wedding details (couple names, date, city, message)
6. Add ceremonies (use preset buttons for quick add)
7. Finish → redirected to `/dashboard`
8. Go to **Guest List** → Add guests via modal
9. Click **Copy Link** next to each guest → paste in WhatsApp/SMS
10. Watch **RSVPs** page fill up live!

### Guest Flow
1. Guest receives link like: `http://localhost:3000/rsvp/priya-arjun-2026?token=abc123`
2. Beautiful Indian festive invite page loads
3. Guest sees their name, the couple names, date, city
4. Swipes through each ceremony tab
5. Selects attending/not attending, dietary pref, plus-ones
6. Hits "Submit My RSVP" → success screen

---

## File Structure
```
app/
  auth/
    login/page.tsx      ← Planner login
    signup/page.tsx     ← Planner signup
  onboarding/page.tsx   ← Wedding setup wizard
  dashboard/
    layout.tsx          ← Red sidebar shell
    page.tsx            ← Overview with live stats
    guests/page.tsx     ← Guest list + Add modal + Copy RSVP link
    rsvps/page.tsx      ← RSVP response tracker
    settings/page.tsx   ← Wedding details view
  rsvp/[slug]/page.tsx  ← Guest-facing invite + RSVP form
  api/
    rsvp-headcount/     ← CRM REST API
lib/
  supabase.ts           ← Browser client + types
  supabase-server.ts    ← Server client
middleware.ts           ← Auth route protection
```
