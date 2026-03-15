'use client';
// app/dashboard/page.tsx

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Users, CheckCircle2, XCircle, HelpCircle, BedDouble, TrendingUp, CalendarDays, UtensilsCrossed } from 'lucide-react';

export default function DashboardPage() {
  const [wedding, setWedding] = useState<{ couple_names: string; city: string; wedding_date: string; rsvp_deadline: string | null } | null>(null);
  const [stats, setStats] = useState({ total: 0, attending: 0, notAttending: 0, awaiting: 0, accommodation: 0 });
  const [events, setEvents] = useState<{ id: string; name: string; event_date: string; venue_name: string | null }[]>([]);
  const [dietary, setDietary] = useState({ veg: 0, non_veg: 0, jain: 0, vegan: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: weddingData } = await supabase
        .from('weddings').select('*').eq('planner_id', user.id).single();
      if (!weddingData) { setLoading(false); return; }
      setWedding(weddingData);

      const [{ data: guests }, { data: rsvps }, { data: eventsData }] = await Promise.all([
        supabase.from('guests').select('*').eq('wedding_id', weddingData.id),
        supabase.from('rsvps').select('*').eq('wedding_id', weddingData.id),
        supabase.from('events').select('*').eq('wedding_id', weddingData.id).order('display_order'),
      ]);

      const g = guests ?? []; const r = rsvps ?? [];
      setStats({
        total: g.length,
        attending: r.filter((x: { status: string }) => x.status === 'attending').length,
        notAttending: r.filter((x: { status: string }) => x.status === 'not_attending').length,
        awaiting: g.length - r.length,
        accommodation: g.filter((x: { accommodation_required: boolean }) => x.accommodation_required).length,
      });
      setEvents(eventsData ?? []);
      setDietary({
        veg: r.filter((x: { dietary_pref: string }) => x.dietary_pref === 'veg').length,
        non_veg: r.filter((x: { dietary_pref: string }) => x.dietary_pref === 'non_veg').length,
        jain: r.filter((x: { dietary_pref: string }) => x.dietary_pref === 'jain').length,
        vegan: r.filter((x: { dietary_pref: string }) => x.dietary_pref === 'vegan').length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
    </div>
  );

  if (!wedding) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-stone-500 mb-4">No wedding found. Complete onboarding first.</p>
      <a href="/onboarding" className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
         style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)' }}>
        Set Up Wedding →
      </a>
    </div>
  );

  const statCards = [
    { label: 'Total Invited', value: stats.total, icon: Users, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-200' },
    { label: 'Attending', value: stats.attending, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
    { label: 'Not Attending', value: stats.notAttending, icon: XCircle, gradient: 'from-rose-500 to-red-600', shadow: 'shadow-red-200' },
    { label: 'Awaiting RSVP', value: stats.awaiting, icon: HelpCircle, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-200' },
    { label: 'Need Accommodation', value: stats.accommodation, icon: BedDouble, gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-blue-200' },
  ];

  const rsvpRate = stats.total > 0 ? Math.round(((stats.attending + stats.notAttending) / stats.total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5" style={{ color: '#C41E3A' }} />
          <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Overview
          </h1>
        </div>
        <p className="text-stone-500 text-sm">
          Live stats for <strong>{wedding.couple_names}</strong> · {wedding.city}
          {wedding.rsvp_deadline && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200">
              RSVP deadline: {new Date(wedding.rsvp_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </p>
      </div>

      {/* RSVP Progress Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-6 py-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-stone-700">RSVP Response Rate</p>
          <p className="text-2xl font-bold" style={{ color: '#C41E3A', fontFamily: 'var(--font-cormorant)' }}>
            {rsvpRate}%
          </p>
        </div>
        <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
               style={{
                 width: `${rsvpRate}%`,
                 background: 'linear-gradient(90deg, #C41E3A, #F59E0B)',
               }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-stone-400">
          <span>{stats.attending + stats.notAttending} responded</span>
          <span>{stats.awaiting} pending</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, gradient, shadow }) => (
          <div key={label} className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient} ${shadow}`}>
            <Icon className="w-6 h-6 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: 'var(--font-cormorant)' }}>{value}</p>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Ceremonies */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2"
               style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF)' }}>
            <CalendarDays className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-stone-700">Ceremony Schedule</h2>
          </div>
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400 text-sm">No ceremonies added yet.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {events.map((event, i) => (
                <div key={event.id} className="px-6 py-4 flex items-center gap-4 hover:bg-amber-50/30 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                       style={{ background: `hsl(${i * 35}, 70%, 45%)` }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{event.name}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {event.venue_name && ` · ${event.venue_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dietary */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2"
               style={{ background: 'linear-gradient(135deg, #F0FDF4, #FFF)' }}>
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-stone-700">Dietary Breakdown</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              { label: 'Vegetarian 🥦', value: dietary.veg, bg: '#F0FDF4', color: '#065F46', border: '#BBF7D0' },
              { label: 'Non-Veg 🍗', value: dietary.non_veg, bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
              { label: 'Jain 🌿', value: dietary.jain, bg: '#FEFCE8', color: '#854D0E', border: '#FEF08A' },
              { label: 'Vegan 🌱', value: dietary.vegan, bg: '#F0FDFA', color: '#134E4A', border: '#99F6E4' },
            ].map(({ label, value, bg, color, border }) => (
              <div key={label} className="rounded-2xl p-4 border"
                   style={{ background: bg, borderColor: border }}>
                <p className="text-3xl font-bold mb-1" style={{ color, fontFamily: 'var(--font-cormorant)' }}>{value}</p>
                <p className="text-xs font-medium" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
