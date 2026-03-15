'use client';
// app/onboarding/page.tsx
// Multi-step wedding setup wizard shown after first signup.
// Step 1: Wedding basics | Step 2: Add ceremonies | Step 3: Done

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Flower2, Plus, Trash2, Loader2, CalendarDays, MapPin, Clock, CheckCircle2 } from 'lucide-react';

interface EventForm {
  name: string;
  event_date: string;
  venue_name: string;
  venue_address: string;
  dress_code: string;
  description: string;
  display_order: number;
}

const PRESET_EVENTS = [
  { name: 'Haldi Ceremony', description: 'Turmeric blessings and folk music', dress_code: 'Yellow / White Traditional' },
  { name: 'Mehendi Evening', description: 'Intricate henna art and celebration', dress_code: 'Festive Ethnic Wear' },
  { name: 'Sangeet Night', description: 'Dance, music, and merriment', dress_code: 'Cocktail Traditional' },
  { name: 'Baraat & Wedding', description: 'Sacred Vedic rituals and pheras', dress_code: 'Full Traditional' },
  { name: 'Wedding Reception', description: 'Dinner celebration for the newlyweds', dress_code: 'Formal Indian' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 state
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState('');
  const [venueName, setVenueName] = useState('');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [coverMessage, setCoverMessage] = useState('');

  // Step 2 state
  const [events, setEvents] = useState<EventForm[]>([{
    name: '', event_date: '', venue_name: '', venue_address: '',
    dress_code: '', description: '', display_order: 1,
  }]);

  function addEvent() {
    setEvents([...events, {
      name: '', event_date: '', venue_name: '', venue_address: '',
      dress_code: '', description: '', display_order: events.length + 1,
    }]);
  }

  function addPreset(preset: typeof PRESET_EVENTS[0]) {
    setEvents([...events, {
      name: preset.name,
      description: preset.description,
      dress_code: preset.dress_code,
      event_date: '', venue_name: venueName, venue_address: '',
      display_order: events.length + 1,
    }]);
  }

  function removeEvent(i: number) {
    setEvents(events.filter((_, idx) => idx !== i));
  }

  function updateEvent(i: number, field: keyof EventForm, value: string | number) {
    const updated = [...events];
    (updated[i] as Record<string, string | number>)[field] = value;
    setEvents(updated);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate slug from couple names
      const slug = coupleNames
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 40) + '-' + new Date().getFullYear();

      // Insert wedding
      const { data: wedding, error: wErr } = await supabase
        .from('weddings')
        .insert({
          planner_id: user.id,
          couple_names: coupleNames,
          slug,
          wedding_date: weddingDate || null,
          city,
          venue_name: venueName || null,
          rsvp_deadline: rsvpDeadline || null,
          cover_message: coverMessage || null,
          theme_color: '#C41E3A',
        })
        .select()
        .single();

      if (wErr) throw wErr;

      // Insert events
      const validEvents = events.filter((e) => e.name && e.event_date);
      if (validEvents.length > 0) {
        const { error: eErr } = await supabase
          .from('events')
          .insert(validEvents.map((e) => ({ ...e, wedding_id: wedding.id })));
        if (eErr) throw eErr;
      }

      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Success ──────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #C41E3A, #B8860B)' }}>
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-stone-900 mb-3"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
            Your wedding is set up! 🎉
          </h2>
          <p className="text-stone-500 mb-8 text-sm leading-relaxed">
            Now head to the dashboard to add your guest list and start sending RSVP links.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)', boxShadow: '0 4px 20px rgba(196,30,58,0.4)' }}
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #C41E3A, #B8860B)' }}>
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-stone-800" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
              WeddingDesk
            </span>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'text-white' : 'bg-stone-200 text-stone-500'
                }`} style={step >= s ? { background: 'linear-gradient(135deg, #C41E3A, #B8860B)' } : {}}>
                  {s}
                </div>
                {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-amber-400' : 'bg-stone-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── STEP 1: Wedding Basics ── */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h1 className="text-4xl font-bold text-stone-900 mb-2"
                style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
              Tell us about the wedding 💍
            </h1>
            <p className="text-stone-500 text-sm mb-8">These details will appear on guest invitation pages.</p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                  Couple Names *
                </label>
                <input
                  type="text"
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  required
                  placeholder="e.g. Priya & Arjun Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': '#C41E3A' } as React.CSSProperties}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                    <CalendarDays className="w-3 h-3 inline mr-1" />Wedding Date *
                  </label>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                    <Clock className="w-3 h-3 inline mr-1" />RSVP Deadline
                  </label>
                  <input
                    type="date"
                    value={rsvpDeadline}
                    onChange={(e) => setRsvpDeadline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                    <MapPin className="w-3 h-3 inline mr-1" />City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                    Main Venue
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. The Grand Leela Palace"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                  Message for Guests (shown on invite)
                </label>
                <textarea
                  rows={3}
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                  placeholder="e.g. With great joy, we invite you to celebrate the beginning of our forever…"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => { if (!coupleNames || !city) { setError('Please fill in Couple Names and City'); return; } setError(''); setStep(2); }}
              className="mt-6 w-full py-4 rounded-2xl text-white font-semibold text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)', boxShadow: '0 4px 20px rgba(196,30,58,0.4)' }}
            >
              Next: Add Ceremonies →
            </button>
          </div>
        )}

        {/* ── STEP 2: Events ── */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h1 className="text-4xl font-bold text-stone-900 mb-2"
                style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
              Add your ceremonies 🪔
            </h1>
            <p className="text-stone-500 text-sm mb-6">Guests will RSVP separately for each ceremony they&apos;re invited to.</p>

            {/* Preset quick-add */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Quick add common ceremonies:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_EVENTS.map((p) => (
                  <button key={p.name} onClick={() => addPreset(p)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105"
                          style={{ borderColor: '#B8860B', color: '#B8860B', background: '#FFFBEB' }}>
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              {events.map((event, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                           style={{ background: 'linear-gradient(135deg, #C41E3A, #B8860B)' }}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-stone-700">Ceremony {i + 1}</span>
                    </div>
                    {events.length > 1 && (
                      <button onClick={() => removeEvent(i)}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <input type="text" placeholder="Ceremony name *" value={event.name}
                             onChange={(e) => updateEvent(i, 'name', e.target.value)}
                             className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                    </div>
                    <div>
                      <input type="datetime-local" value={event.event_date}
                             onChange={(e) => updateEvent(i, 'event_date', e.target.value)}
                             className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                    </div>
                    <div>
                      <input type="text" placeholder="Venue name" value={event.venue_name}
                             onChange={(e) => updateEvent(i, 'venue_name', e.target.value)}
                             className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                    </div>
                    <div>
                      <input type="text" placeholder="Dress code" value={event.dress_code}
                             onChange={(e) => updateEvent(i, 'dress_code', e.target.value)}
                             className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                    </div>
                    <div>
                      <input type="text" placeholder="Short description" value={event.description}
                             onChange={(e) => updateEvent(i, 'description', e.target.value)}
                             className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addEvent}
                    className="mt-4 w-full py-3 rounded-2xl border-2 border-dashed border-amber-300 text-amber-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Another Ceremony
            </button>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                      className="px-6 py-3 rounded-2xl border border-stone-200 text-stone-600 font-medium text-sm hover:bg-stone-50 transition-colors">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading}
                      className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)', boxShadow: '0 4px 20px rgba(196,30,58,0.4)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating wedding…</> : 'Finish Setup 🎉'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
