'use client';
// app/dashboard/settings/page.tsx

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Settings, CalendarDays, MapPin, Clock, Key, PlusCircle, Globe } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function SettingsPage() {
  const [wedding, setWedding] = useState<{ id: string; couple_names: string; slug: string; city: string; venue_name: string | null; wedding_date: string | null; rsvp_deadline: string | null; cover_message: string | null } | null>(null);
  const [events, setEvents] = useState<{ id: string; name: string; event_date: string; venue_name: string | null; dress_code: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: w } = await supabase.from('weddings').select('*').eq('planner_id', user.id).single();
      if (w) {
        setWedding(w);
        const { data: e } = await supabase.from('events').select('*').eq('wedding_id', w.id).order('display_order');
        setEvents(e ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  function copyBaseUrl() {
    if (!wedding) return;
    navigator.clipboard.writeText(`${APP_URL}/rsvp/${wedding.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" /></div>;
  if (!wedding) return <div className="text-center py-20 text-stone-400">No wedding found. <a href="/onboarding" className="text-red-600 underline">Set up your wedding →</a></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5" style={{ color: '#C41E3A' }} />
        <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant)' }}>Settings</h1>
      </div>

      {/* Wedding Details Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100"
             style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF)' }}>
          <h2 className="text-sm font-semibold text-stone-700">Wedding Details</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Couple Names</label>
            <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-semibold"
                 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
              {wedding.couple_names}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                <CalendarDays className="w-3 h-3 inline mr-1" />Wedding Date
              </label>
              <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm">
                {wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                <Clock className="w-3 h-3 inline mr-1" />RSVP Deadline
              </label>
              <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm">
                {wedding.rsvp_deadline ? new Date(wedding.rsvp_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                <MapPin className="w-3 h-3 inline mr-1" />City
              </label>
              <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm">{wedding.city}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Main Venue</label>
              <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm">{wedding.venue_name || '—'}</div>
            </div>
          </div>
          {wedding.cover_message && (
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Cover Message</label>
              <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-sm italic leading-relaxed">&ldquo;{wedding.cover_message}&rdquo;</div>
            </div>
          )}
        </div>
      </div>

      {/* RSVP Base Link */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF)' }}>
          <h2 className="text-sm font-semibold text-stone-700"><Globe className="w-4 h-4 inline mr-1.5 text-amber-500" />RSVP Base URL</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs text-stone-500 mb-3">This is the base URL for your wedding invites. Each guest gets their own unique token appended automatically.</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 font-mono truncate">
              {APP_URL}/rsvp/{wedding.slug}?token=…
            </div>
            <button onClick={copyBaseUrl}
                    className="px-4 py-3 rounded-xl text-white text-xs font-semibold flex-shrink-0 transition-all"
                    style={{ background: copied ? '#065F46' : 'linear-gradient(135deg, #C41E3A, #8B0000)' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">💡 How to share: Go to Guest List → click &ldquo;Copy Link&rdquo; next to each guest → paste in WhatsApp, SMS, or Email</p>
          </div>
        </div>
      </div>

      {/* Ceremonies */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between"
             style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF)' }}>
          <h2 className="text-sm font-semibold text-stone-700">Ceremonies & Events</h2>
          <a href="/onboarding"
             className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-amber-100"
             style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}>
            <PlusCircle className="w-3.5 h-3.5" /> Add via Onboarding
          </a>
        </div>
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">No ceremonies found.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {events.map((event, i) => {
              const colors = ['#C41E3A', '#065F46', '#1D4ED8', '#7C3AED', '#0E7490'];
              return (
                <div key={event.id} className="px-6 py-4 flex items-start gap-4 hover:bg-stone-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                       style={{ background: colors[i % colors.length] }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{event.name}</p>
                    <p className="text-xs text-stone-400">{new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {event.venue_name && <p className="text-xs text-stone-400">📍 {event.venue_name}</p>}
                    {event.dress_code && <p className="text-xs text-stone-400">👗 {event.dress_code}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/40">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-stone-300" />
            <p className="text-xs text-stone-400 font-mono">Wedding ID: {wedding.id.slice(0, 16)}…</p>
          </div>
        </div>
      </div>
    </div>
  );
}
