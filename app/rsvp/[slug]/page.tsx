'use client';
// app/rsvp/[slug]/page.tsx
// The guest-facing invite & RSVP page.
// Indian Festive Luxury aesthetic: crimson, marigold, ivory, gold.

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabase, type Guest, type WeddingEvent } from '@/lib/supabase';
import { MapPin, Clock, Shirt, CheckCircle2, Heart, Loader2, CalendarDays, AlertCircle, Users, Flower2 } from 'lucide-react';

type RsvpChoice = {
  event_id: string;
  status: 'attending' | 'not_attending' | 'maybe';
  dietary_pref: 'veg' | 'non_veg' | 'jain' | 'vegan' | null;
  plus_ones_count: number;
  children_count: number;
  message: string;
};

// ── Decorative Divider ────────────────────────────────────────────────
function OrnamentDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #D4A96A)' }} />
      <span className="text-2xl">✦</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #D4A96A, transparent)' }} />
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8F0' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #C41E3A, #B8860B)' }}>
          <Flower2 className="w-8 h-8 text-white animate-pulse" />
        </div>
        <p className="text-stone-500 text-sm">Loading your invitation…</p>
      </div>
    </div>
  );
}

// ── Error ──────────────────────────────────────────────────────────────
function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FDF8F0' }}>
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>Invitation Not Found</h2>
        <p className="text-sm text-stone-400 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

// ── Success ────────────────────────────────────────────────────────────
function SuccessScreen({ guestName, coupleNames }: { guestName: string; coupleNames: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FDF8F0' }}>
      {/* Confetti-like decorative circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {['#C41E3A', '#F59E0B', '#065F46', '#7C3AED', '#0E7490'].map((color, i) => (
          <div key={i} className="absolute rounded-full opacity-10"
               style={{
                 width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
                 background: color,
                 top: `${10 + i * 18}%`, left: `${i % 2 === 0 ? 5 + i * 8 : 60 + i * 5}%`,
                 animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                 animationDelay: `${i * 0.4}s`,
               }} />
        ))}
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-stone-100">
        {/* Gold top border */}
        <div className="absolute top-0 left-8 right-8 h-1 rounded-full"
             style={{ background: 'linear-gradient(90deg, #C41E3A, #F59E0B, #C41E3A)' }} />

        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
             style={{ background: 'linear-gradient(135deg, #C41E3A, #B8860B)', boxShadow: '0 8px 30px rgba(196,30,58,0.4)' }}>
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl font-bold text-stone-900 mb-2"
            style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
          Thank you, {guestName.split(' ')[0]}! 🙏
        </h2>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          Your RSVP has been received for the <strong>{coupleNames}</strong> wedding.
          We can&apos;t wait to celebrate with you!
        </p>

        <div className="px-5 py-4 rounded-2xl border mb-4"
             style={{ background: '#FFF7ED', borderColor: '#FDE68A' }}>
          <p className="text-sm font-medium" style={{ color: '#B45309' }}>
            🪔 Keep an eye out for venue details and further updates closer to the date.
          </p>
        </div>

        <div className="flex justify-center gap-3 text-2xl animate-bounce">
          <span>💐</span><span>🎊</span><span>💐</span>
        </div>

        <OrnamentDivider />
        <p className="text-xs text-stone-400 italic">You can update your RSVP anytime using the same link.</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function RsvpPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? undefined;

  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [wedding, setWedding] = useState<{ couple_names: string; city: string; wedding_date: string | null; cover_message: string | null; rsvp_deadline: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [choices, setChoices] = useState<Record<string, RsvpChoice>>({});
  const [activeEvent, setActiveEvent] = useState(0);

  useEffect(() => {
    async function load() {
      if (!token) { setError('No invitation token found. Please use the link sent to you.'); setLoading(false); return; }
      const supabase = getSupabase();

      // Fetch wedding by slug
      const { data: weddingData } = await supabase
        .from('weddings').select('*').eq('slug', slug).single();
      if (!weddingData) { setError('This wedding invitation could not be found.'); setLoading(false); return; }
      setWedding(weddingData);

      // Fetch guest by token
      const { data: guestData } = await supabase
        .from('guests').select('*').eq('invite_token', token).single();
      if (!guestData) { setError('This invitation link is invalid or has expired. Please contact the wedding planner.'); setLoading(false); return; }
      setGuest(guestData);

      // Fetch events for this guest
      const { data: guestEventRows } = await supabase
        .from('guest_events').select('event_id').eq('guest_id', guestData.id);

      let eventList: WeddingEvent[] = [];
      if (guestEventRows && guestEventRows.length > 0) {
        const ids = guestEventRows.map((r: { event_id: string }) => r.event_id);
        const { data: eventsData } = await supabase.from('events').select('*').in('id', ids).order('display_order');
        eventList = eventsData ?? [];
      } else {
        const { data: allEvents } = await supabase.from('events').select('*').eq('wedding_id', weddingData.id).order('display_order');
        eventList = allEvents ?? [];
      }
      setEvents(eventList);

      // Init choices
      const init: Record<string, RsvpChoice> = {};
      eventList.forEach((e) => {
        init[e.id] = { event_id: e.id, status: 'attending', dietary_pref: null, plus_ones_count: 0, children_count: 0, message: '' };
      });
      setChoices(init);
      setLoading(false);
    }
    load();
  }, [token, slug]);

  function updateChoice(eventId: string, field: keyof RsvpChoice, value: unknown) {
    setChoices((prev) => ({ ...prev, [eventId]: { ...prev[eventId], [field]: value } }));
  }

  async function handleSubmit() {
    if (!guest || !wedding) return;
    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const rows = Object.values(choices).map((c) => ({
        guest_id: guest.id, event_id: c.event_id,
        wedding_id: guest.wedding_id, status: c.status,
        dietary_pref: c.dietary_pref,
        plus_ones_count: c.plus_ones_count, children_count: c.children_count,
        message: c.message || null,
      }));
      const { error: err } = await supabase.from('rsvps').upsert(rows, { onConflict: 'guest_id,event_id' });
      if (err) throw err;
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (error || !guest || !wedding) return <ErrorScreen message={error ?? 'Unknown error'} />;
  if (submitted) return <SuccessScreen guestName={guest.full_name} coupleNames={wedding.couple_names} />;

  const currentEvent = events[activeEvent];
  const currentChoice = currentEvent ? choices[currentEvent.id] : null;

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F0', fontFamily: 'var(--font-dm-sans)' }}>

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #8B0000 0%, #C41E3A 35%, #B8860B 80%, #F59E0B 100%)' }}>
        {/* Mandala grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
             style={{
               backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
               backgroundSize: '30px 30px',
             }} />

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-2 border-white/10" />
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border-2 border-yellow-300/10" />

        {/* Floating emoji petals */}
        {['🌸', '🌺', '🪷', '✨', '🌼', '🪔'].map((p, i) => (
          <span key={i} className="absolute text-2xl"
                style={{
                  opacity: 0.4,
                  left: `${8 + i * 16}%`, top: `${8 + (i % 3) * 28}%`,
                  animation: `float ${3 + i * 0.6}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}>
            {p}
          </span>
        ))}

        <div className="relative z-10 text-center px-6 pt-16 pb-14">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border border-white/30 backdrop-blur-sm"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Heart className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span className="text-white/90 text-xs font-medium tracking-widest uppercase">Wedding Invitation</span>
            <Heart className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          </div>

          {/* Couple names */}
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-3 leading-none"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            {wedding.couple_names.split('&')[0].trim()}
          </h1>
          <p className="text-3xl text-yellow-300 mb-2" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
            &amp;
          </p>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-none"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            {wedding.couple_names.split('&')[1]?.trim() ?? ''}
          </h1>

          {/* Date & City */}
          <div className="inline-flex items-center gap-5 px-7 py-3.5 rounded-2xl border border-white/30 backdrop-blur-sm mb-8"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            {wedding.wedding_date && (
              <div className="flex items-center gap-2 text-white text-sm">
                <CalendarDays className="w-4 h-4 text-yellow-300" />
                {new Date(wedding.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {wedding.city && (
              <>
                <div className="w-px h-5 bg-white/30" />
                <div className="flex items-center gap-2 text-white text-sm">
                  <MapPin className="w-4 h-4 text-yellow-300" />
                  {wedding.city}
                </div>
              </>
            )}
          </div>

          {/* Cover message */}
          {wedding.cover_message && (
            <div className="max-w-lg mx-auto mb-8">
              <p className="text-white/80 text-sm italic leading-relaxed"
                 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                &ldquo;{wedding.cover_message}&rdquo;
              </p>
            </div>
          )}

          {/* Guest welcome card */}
          <div className="inline-block px-8 py-5 rounded-3xl border border-white/40 backdrop-blur-sm"
               style={{ background: 'rgba(255,255,255,0.2)' }}>
            <p className="text-white/70 text-xs uppercase tracking-widest mb-1">You&apos;re cordially invited,</p>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
              {guest.full_name}
            </p>
            {guest.group_label && <p className="text-yellow-200 text-xs mt-1">{guest.group_label}</p>}
          </div>

          {/* RSVP deadline */}
          {wedding.rsvp_deadline && (
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-yellow-300/50"
                    style={{ background: 'rgba(251,191,36,0.2)', color: '#FEF08A' }}>
                <Clock className="w-3.5 h-3.5" />
                RSVP by {new Date(wedding.rsvp_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 md:h-16">
            <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" fill="#FDF8F0" />
          </svg>
        </div>
      </div>

      {/* ── CEREMONIES ────────────────────────────────────────────── */}
      {events.length > 0 && (
        <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
              Celebrations Await 🪔
            </h2>
            <p className="text-stone-500 text-sm">You&apos;re invited to {events.length} {events.length === 1 ? 'ceremony' : 'ceremonies'}</p>
          </div>

          {/* Event pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {events.map((event, i) => (
              <button key={event.id} onClick={() => setActiveEvent(i)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap"
                      style={activeEvent === i
                        ? { background: 'linear-gradient(135deg, #C41E3A, #8B0000)', color: '#fff', borderColor: '#C41E3A', boxShadow: '0 4px 12px rgba(196,30,58,0.3)' }
                        : { background: '#fff', color: '#78716c', borderColor: '#e7e5e4' }}>
                {event.name}
              </button>
            ))}
          </div>

          {/* Active event detail card */}
          {currentEvent && currentChoice && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-4 border border-stone-100 animate-fade-up">
              {/* Event card header */}
              <div className="px-7 pt-7 pb-5 border-b border-stone-100"
                   style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFF1F2 100%)' }}>
                <h3 className="text-2xl font-bold text-stone-900 mb-2"
                    style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                  {currentEvent.name}
                </h3>
                {currentEvent.description && (
                  <p className="text-sm text-stone-500 mb-3">{currentEvent.description}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-white px-3 py-1.5 rounded-full border border-stone-200">
                    <Clock className="w-3.5 h-3.5" style={{ color: '#C41E3A' }} />
                    {new Date(currentEvent.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(currentEvent.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {currentEvent.venue_name && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-white px-3 py-1.5 rounded-full border border-stone-200">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {currentEvent.venue_name}
                    </div>
                  )}
                  {currentEvent.dress_code && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-white px-3 py-1.5 rounded-full border border-stone-200">
                      <Shirt className="w-3.5 h-3.5 text-violet-400" />
                      {currentEvent.dress_code}
                    </div>
                  )}
                </div>
              </div>

              {/* RSVP fields */}
              <div className="px-7 py-6 space-y-6">

                {/* Attending? */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Will you be attending?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'attending' as const, emoji: '✅', label: 'Yes, I&apos;ll be there!', activeGrad: 'linear-gradient(135deg, #065F46, #0D9488)' },
                      { value: 'not_attending' as const, emoji: '❌', label: "Can't make it", activeGrad: 'linear-gradient(135deg, #4B5563, #374151)' },
                      { value: 'maybe' as const, emoji: '🤔', label: 'Maybe', activeGrad: 'linear-gradient(135deg, #B45309, #D97706)' },
                    ]).map(({ value, emoji, label, activeGrad }) => (
                      <button key={value} onClick={() => updateChoice(currentEvent.id, 'status', value)}
                              className="px-3 py-3 rounded-2xl border text-center transition-all duration-200 hover:scale-105"
                              style={currentChoice.status === value
                                ? { background: activeGrad, color: '#fff', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }
                                : { background: '#FAFAFA', color: '#57534E', borderColor: '#E7E5E4' }}>
                        <div className="text-xl mb-1">{emoji}</div>
                        <div className="text-xs font-semibold leading-tight" dangerouslySetInnerHTML={{ __html: label }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary */}
                {currentChoice.status !== 'not_attending' && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Dietary Preference</p>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { value: 'veg' as const, emoji: '🥦', label: 'Veg', color: '#065F46', activeBg: '#F0FDF4', activeBorder: '#BBF7D0' },
                        { value: 'non_veg' as const, emoji: '🍗', label: 'Non-Veg', color: '#9A3412', activeBg: '#FFF7ED', activeBorder: '#FED7AA' },
                        { value: 'jain' as const, emoji: '🌿', label: 'Jain', color: '#854D0E', activeBg: '#FEFCE8', activeBorder: '#FEF08A' },
                        { value: 'vegan' as const, emoji: '🌱', label: 'Vegan', color: '#134E4A', activeBg: '#F0FDFA', activeBorder: '#99F6E4' },
                      ]).map(({ value, emoji, label, color, activeBg, activeBorder }) => (
                        <button key={value}
                                onClick={() => updateChoice(currentEvent.id, 'dietary_pref', currentChoice.dietary_pref === value ? null : value)}
                                className="py-3 px-2 rounded-2xl border text-center transition-all hover:scale-105"
                                style={currentChoice.dietary_pref === value
                                  ? { background: activeBg, borderColor: activeBorder, color }
                                  : { background: '#FAFAFA', borderColor: '#E7E5E4', color: '#78716C' }}>
                          <div className="text-xl mb-1">{emoji}</div>
                          <div className="text-xs font-semibold">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plus ones & children */}
                {currentChoice.status !== 'not_attending' && guest.max_plus_ones > 0 && (
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Plus-ones', subtitle: `max ${guest.max_plus_ones}`, field: 'plus_ones_count' as const, value: currentChoice.plus_ones_count, max: guest.max_plus_ones },
                      { label: 'Children', subtitle: 'accompanying you', field: 'children_count' as const, value: currentChoice.children_count, max: 10 },
                    ].map(({ label, subtitle, field, value, max }) => (
                      <div key={field}>
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1">
                          <Users className="w-3 h-3 inline mr-1" />{label}
                        </p>
                        <p className="text-xs text-stone-400 mb-3">{subtitle}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateChoice(currentEvent.id, field, Math.max(0, value - 1))}
                                  className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg transition-colors flex items-center justify-center">
                            −
                          </button>
                          <span className="w-10 text-center text-xl font-bold text-stone-800"
                                style={{ fontFamily: 'var(--font-cormorant)' }}>
                            {value}
                          </span>
                          <button onClick={() => updateChoice(currentEvent.id, field, Math.min(max, value + 1))}
                                  className="w-10 h-10 rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center hover:scale-110"
                                  style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)' }}>
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message — only on last event */}
                {activeEvent === events.length - 1 && currentChoice.status !== 'not_attending' && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
                      💌 Message for the couple <span className="text-stone-300 font-normal">(optional)</span>
                    </p>
                    <textarea rows={3} value={currentChoice.message}
                              onChange={(e) => updateChoice(currentEvent.id, 'message', e.target.value)}
                              placeholder={`Send your blessings to ${wedding.couple_names}…`}
                              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 text-sm placeholder-stone-300 focus:outline-none focus:ring-2 resize-none transition"
                              style={{ '--tw-ring-color': '#C41E3A' } as React.CSSProperties} />
                  </div>
                )}

                {/* Next / Prev navigation */}
                <div className="flex gap-3">
                  {activeEvent > 0 && (
                    <button onClick={() => setActiveEvent(activeEvent - 1)}
                            className="px-5 py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors">
                      ← Previous
                    </button>
                  )}
                  {activeEvent < events.length - 1 ? (
                    <button onClick={() => setActiveEvent(activeEvent + 1)}
                            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm transition-all"
                            style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 14px rgba(184,134,11,0.4)' }}>
                      Next Ceremony →
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT BUTTON ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <OrnamentDivider />

        {/* Progress dots */}
        {events.length > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            {events.map((_, i) => (
              <button key={i} onClick={() => setActiveEvent(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === activeEvent ? '24px' : '8px',
                        height: '8px',
                        background: i === activeEvent ? '#C41E3A' : '#D4A96A',
                      }} />
            ))}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-5 rounded-3xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #C41E3A 0%, #8B0000 50%, #B8860B 100%)',
                  boxShadow: '0 8px 30px rgba(196,30,58,0.5)',
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.3rem',
                }}>
          {submitting
            ? <><Loader2 className="w-6 h-6 animate-spin" />Submitting…</>
            : <><Heart className="w-6 h-6 fill-white" />Submit My RSVP</>}
        </button>
        <p className="text-center text-xs text-stone-400 mt-3 italic">
          You can update your RSVP anytime using this same link.
        </p>

        {/* Footer ornament */}
        <div className="text-center mt-12 text-stone-300">
          <Flower2 className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">Powered by WeddingDesk</p>
        </div>
      </div>
    </div>
  );
}
