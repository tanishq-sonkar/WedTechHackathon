-- ============================================================
-- SUPABASE SETUP SQL v2 — Paste this ENTIRE file into
-- your Supabase SQL Editor and click RUN
-- https://supabase.com/dashboard/project/zfgfgftrfpjaviauwtfy/sql
-- ============================================================

-- STEP 1: Drop old tables if re-running (safe to skip if first run)
-- ============================================================
DROP TABLE IF EXISTS rsvps CASCADE;
DROP TABLE IF EXISTS guest_events CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS weddings CASCADE;
DROP TABLE IF EXISTS planners CASCADE;

-- STEP 2: Create tables with auth support
-- ============================================================

-- Weddings: each planner owns one wedding
CREATE TABLE weddings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id     UUID NOT NULL,          -- links to auth.users.id
  couple_names   TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  wedding_date   DATE,
  city           TEXT NOT NULL DEFAULT '',
  venue_name     TEXT,
  theme_color    TEXT DEFAULT '#C41E3A',
  cover_message  TEXT,
  rsvp_deadline  DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Events: ceremonies for a wedding
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  venue_name    TEXT,
  venue_address TEXT,
  dress_code    TEXT,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Guests: master guest list
CREATE TABLE guests (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id             UUID REFERENCES weddings(id) ON DELETE CASCADE,
  full_name              TEXT NOT NULL,
  phone                  TEXT,
  email                  TEXT,
  family_side            TEXT CHECK (family_side IN ('bride', 'groom', 'mutual')),
  group_label            TEXT,
  invite_token           TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  max_plus_ones          INT DEFAULT 0,
  accommodation_required BOOLEAN DEFAULT false,
  accommodation_notes    TEXT,
  rsvp_sent              BOOLEAN DEFAULT false,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- guest_events: which events each guest is invited to
CREATE TABLE guest_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id   UUID REFERENCES guests(id) ON DELETE CASCADE,
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(guest_id, event_id)
);

-- RSVPs: guest responses
CREATE TABLE rsvps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id         UUID REFERENCES guests(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
  wedding_id       UUID REFERENCES weddings(id) ON DELETE CASCADE,
  status           TEXT CHECK (status IN ('attending', 'not_attending', 'maybe')) NOT NULL,
  dietary_pref     TEXT CHECK (dietary_pref IN ('veg', 'non_veg', 'jain', 'vegan')),
  plus_ones_count  INT DEFAULT 0,
  children_count   INT DEFAULT 0,
  message          TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guest_id, event_id)
);

-- STEP 3: Disable RLS for MVP (no auth blocking)
-- ============================================================
ALTER TABLE weddings     DISABLE ROW LEVEL SECURITY;
ALTER TABLE events       DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests       DISABLE ROW LEVEL SECURITY;
ALTER TABLE guest_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps        DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- DONE! Your database is ready.
--
-- Now in your app:
-- 1. Run: npm install
-- 2. Copy .env.example to .env.local and add your Supabase keys
-- 3. Run: npm run dev
-- 4. Visit: http://localhost:3000/auth/signup
-- 5. Create your planner account
-- 6. Fill in wedding details on the onboarding page
-- 7. Add guests from the dashboard
-- 8. Copy each guest's RSVP link and share via WhatsApp/SMS
-- ============================================================
