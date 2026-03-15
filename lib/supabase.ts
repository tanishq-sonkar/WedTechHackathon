// lib/supabase.ts — browser client (for client components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for convenience in client components
let client: ReturnType<typeof createClient> | null = null;
export function getSupabase() {
  if (!client) client = createClient();
  return client;
}

// ── Shared Types ──────────────────────────────────────────────────────
export type FamilySide = 'bride' | 'groom' | 'mutual';
export type RsvpStatus = 'attending' | 'not_attending' | 'maybe';
export type DietaryPref = 'veg' | 'non_veg' | 'jain' | 'vegan';

export interface Wedding {
  id: string;
  planner_id: string;
  couple_names: string;
  slug: string;
  wedding_date: string;
  city: string;
  venue_name: string | null;
  theme_color: string;
  cover_message: string | null;
  rsvp_deadline: string | null;
  created_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  name: string;
  description: string | null;
  event_date: string;
  venue_name: string | null;
  venue_address: string | null;
  dress_code: string | null;
  display_order: number;
}

export interface Guest {
  id: string;
  wedding_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  family_side: FamilySide | null;
  group_label: string | null;
  invite_token: string;
  max_plus_ones: number;
  accommodation_required: boolean;
  rsvp_sent: boolean;
  created_at: string;
}

export interface Rsvp {
  id: string;
  guest_id: string;
  event_id: string;
  wedding_id: string;
  status: RsvpStatus;
  dietary_pref: DietaryPref | null;
  plus_ones_count: number;
  children_count: number;
  message: string | null;
  submitted_at: string;
}
