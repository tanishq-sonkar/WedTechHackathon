'use client';
// app/dashboard/guests/page.tsx
// Full guest manager: add guests, view list, copy RSVP invite links

import { useEffect, useState } from 'react';
import { getSupabase, type Guest } from '@/lib/supabase';
import {
  Users, UserPlus, Copy, Check, X, Loader2,
  Heart, Crown, Handshake, BedDouble, Mail, Phone,
  Search, Send, Inbox,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [weddingId, setWeddingId] = useState('');
  const [weddingSlug, setWeddingSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<'all' | 'bride' | 'groom' | 'mutual'>('all');

  // Form state
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', family_side: 'bride',
    group_label: '', max_plus_ones: 0, accommodation_required: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadGuests();
  }, []);

  async function loadGuests() {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wedding } = await supabase
      .from('weddings').select('id, slug').eq('planner_id', user.id).single();
    if (!wedding) { setLoading(false); return; }

    setWeddingId(wedding.id);
    setWeddingSlug(wedding.slug);

    const { data } = await supabase
      .from('guests').select('*').eq('wedding_id', wedding.id).order('created_at');
    setGuests(data ?? []);
    setLoading(false);
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError('');

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('guests')
      .insert({ ...form, wedding_id: weddingId })
      .select()
      .single();

    if (error) { setFormError(error.message); setSaving(false); return; }

    // Also link to all events
    const { data: events } = await supabase
      .from('events').select('id').eq('wedding_id', weddingId);
    if (events && data) {
      await supabase.from('guest_events').insert(
        events.map((e: { id: string }) => ({ guest_id: data.id, event_id: e.id }))
      );
    }

    setGuests((prev) => [...prev, data]);
    setShowModal(false);
    setForm({ full_name: '', phone: '', email: '', family_side: 'bride', group_label: '', max_plus_ones: 0, accommodation_required: false });
    setSaving(false);
  }

  function copyRsvpLink(token: string, guestId: string) {
    const link = `${APP_URL}/rsvp/${weddingSlug}?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(guestId);
    setTimeout(() => setCopiedId(''), 2500);
  }

  const filtered = guests.filter((g) => {
    const matchSearch = g.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        (g.group_label ?? '').toLowerCase().includes(search.toLowerCase());
    const matchSide = filterSide === 'all' || g.family_side === filterSide;
    return matchSearch && matchSide;
  });

  const FamilyBadge = ({ side }: { side: Guest['family_side'] }) => {
    const c = {
      bride: { label: "Bride's", icon: Heart, bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
      groom: { label: "Groom's", icon: Crown, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
      mutual: { label: 'Mutual', icon: Handshake, bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
    };
    if (!side) return <span className="text-stone-300 text-xs">—</span>;
    const { label, icon: Icon, bg, color, border } = c[side];
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
            style={{ background: bg, color, borderColor: border }}>
        <Icon className="w-3 h-3" /> {label}
      </span>
    );
  };

  const initials = (name: string) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarColors = ['#C41E3A', '#065F46', '#1D4ED8', '#7C3AED', '#B45309', '#0E7490'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5" style={{ color: '#C41E3A' }} />
            <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant)' }}>Guest List</h1>
          </div>
          <p className="text-stone-500 text-sm">{guests.length} guests · Copy their RSVP link to share via WhatsApp, SMS, or Email</p>
        </div>
        <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)', boxShadow: '0 4px 16px rgba(196,30,58,0.4)' }}>
          <UserPlus className="w-4 h-4" /> Add Guest
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: guests.length, color: '#7C3AED', bg: '#F5F3FF' },
          { label: "Bride's Side", value: guests.filter((g) => g.family_side === 'bride').length, color: '#BE123C', bg: '#FFF1F2' },
          { label: "Groom's Side", value: guests.filter((g) => g.family_side === 'groom').length, color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Need Accommodation', value: guests.filter((g) => g.accommodation_required).length, color: '#0E7490', bg: '#ECFEFF' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl border px-5 py-4 shadow-sm" style={{ background: bg, borderColor: color + '30' }}>
            <p className="text-3xl font-bold mb-0.5" style={{ color, fontFamily: 'var(--font-cormorant)' }}>{value}</p>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-4 flex-wrap"
             style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF)' }}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
            <input type="text" placeholder="Search guests…" value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-2 transition bg-white" />
          </div>
          <div className="flex gap-2">
            {(['all', 'bride', 'groom', 'mutual'] as const).map((side) => (
              <button key={side} onClick={() => setFilterSide(side)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={filterSide === side
                        ? { background: '#C41E3A', color: '#fff', borderColor: '#C41E3A' }
                        : { background: '#fff', color: '#78716c', borderColor: '#e7e5e4' }}>
                {side === 'all' ? 'All' : side.charAt(0).toUpperCase() + side.slice(1) + "'s"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="w-12 h-12 text-stone-200 mb-3" />
            <p className="font-semibold text-stone-500 mb-1">No guests found</p>
            <p className="text-xs text-stone-400">Add your first guest using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  {['Guest', 'Side', 'Group', 'Contact', '+1s', 'Accommodation', 'RSVP Link'].map((col) => (
                    <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((guest, i) => (
                  <tr key={guest.id} className="hover:bg-amber-50/20 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                             style={{ background: avatarColors[i % avatarColors.length] }}>
                          {initials(guest.full_name)}
                        </div>
                        <p className="font-semibold text-stone-800">{guest.full_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4"><FamilyBadge side={guest.family_side} /></td>
                    <td className="px-5 py-4">
                      {guest.group_label
                        ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">{guest.group_label}</span>
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {guest.email && <div className="flex items-center gap-1.5 text-xs text-stone-500"><Mail className="w-3 h-3 text-stone-300" /><span className="truncate max-w-36">{guest.email}</span></div>}
                        {guest.phone && <div className="flex items-center gap-1.5 text-xs text-stone-500"><Phone className="w-3 h-3 text-stone-300" />{guest.phone}</div>}
                        {!guest.email && !guest.phone && <span className="text-stone-300 text-xs">No contact</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex w-7 h-7 rounded-lg bg-stone-100 items-center justify-center text-xs font-bold text-stone-600">
                        +{guest.max_plus_ones}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {guest.accommodation_required
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium"><BedDouble className="w-3 h-3" />Needed</span>
                        : <span className="text-stone-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => copyRsvpLink(guest.invite_token, guest.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:scale-105"
                              style={copiedId === guest.id
                                ? { background: '#F0FDF4', color: '#065F46', borderColor: '#BBF7D0' }
                                : { background: '#FFF7ED', color: '#C41E3A', borderColor: '#FECDD3' }}>
                        {copiedId === guest.id
                          ? <><Check className="w-3.5 h-3.5" />Copied!</>
                          : <><Send className="w-3.5 h-3.5" />Copy Link</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/40">
              <p className="text-xs text-stone-400">Showing {filtered.length} of {guests.length} guests</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Guest Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up">
            {/* Modal header */}
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between"
                 style={{ background: 'linear-gradient(135deg, #C41E3A 0%, #8B0000 100%)' }}>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-cormorant)' }}>Add New Guest</h2>
                <p className="text-red-200 text-xs mt-0.5">They&apos;ll receive a unique RSVP invite link</p>
              </div>
              <button onClick={() => setShowModal(false)}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="p-8 space-y-5">
              {formError && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                       placeholder="e.g. Rajesh Sharma" required
                       className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                         placeholder="+91 98100 00000"
                         className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                         placeholder="guest@email.com"
                         className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Family Side</label>
                  <select value={form.family_side} onChange={(e) => setForm({ ...form, family_side: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition bg-white">
                    <option value="bride">Bride&apos;s Side</option>
                    <option value="groom">Groom&apos;s Side</option>
                    <option value="mutual">Mutual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Group / Family Name</label>
                  <input type="text" value={form.group_label} onChange={(e) => setForm({ ...form, group_label: e.target.value })}
                         placeholder="e.g. Sharma Family"
                         className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Max +1s Allowed</label>
                  <select value={form.max_plus_ones} onChange={(e) => setForm({ ...form, max_plus_ones: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition bg-white">
                    {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>+{n}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={form.accommodation_required}
                             onChange={(e) => setForm({ ...form, accommodation_required: e.target.checked })} />
                      <div className={`w-11 h-6 rounded-full transition-colors ${form.accommodation_required ? 'bg-red-500' : 'bg-stone-200'}`} />
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.accommodation_required ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Needs Room</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                        className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                        className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #C41E3A, #8B0000)' }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : <><UserPlus className="w-4 h-4" />Add Guest</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
