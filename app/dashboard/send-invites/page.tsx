'use client';
// app/dashboard/send-invites/page.tsx
// Email sender + WhatsApp generator.
// App password is ONLY asked here, not during login/signup.

import { useEffect, useState, useCallback } from 'react';
import { getSupabase, type Guest } from '@/lib/supabase';
import {
  Send, Mail, MessageSquare, Copy, Check,
  ChevronDown, ChevronUp, Eye, Loader2,
  Users, CheckCircle2, AlertCircle, Smartphone,
  Lock, ExternalLink, HelpCircle,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface GuestWithLink extends Guest {
  rsvpLink: string;
  whatsappMsg: string;
  emailSelected: boolean;
}

// ── Step-by-step App Password guide ──────────────────────────────────
function AppPasswordGuide() {
  const steps = [
    { n:1, title:'Open Google Account', desc:'Go to myaccount.google.com', link:'https://myaccount.google.com', linkText:'Open →' },
    { n:2, title:'Go to Security tab', desc:'Click "Security" in the left sidebar', link:null, linkText:null },
    { n:3, title:'Enable 2-Step Verification', desc:'Must be ON before you can create app passwords', link:'https://myaccount.google.com/signinoptions/two-step-verification', linkText:'Enable →' },
    { n:4, title:'Search "App Passwords"', desc:'Type it in the search bar at the top of your Google Account page', link:null, linkText:null },
    { n:5, title:'Create a new App Password', desc:'Select "Mail" as app, any device name → click Generate', link:'https://myaccount.google.com/apppasswords', linkText:'App Passwords →' },
    { n:6, title:'Copy the 16-character code', desc:'Paste it in the field below. Spaces are auto-removed.', link:null, linkText:null },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100"
           style={{ background:'linear-gradient(135deg,#FEF9C3,#FFF)' }}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500"/>
          <h2 className="text-sm font-semibold text-stone-700">How to get Gmail App Password</h2>
        </div>
        <p className="text-xs text-stone-400 mt-1">One-time setup · takes 2 minutes · only needed to send emails</p>
      </div>
      <div className="px-6 py-5">
        <div className="space-y-4">
          {steps.map(({ n, title, desc, link, linkText }) => (
            <div key={n} className="flex gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                   style={{ background:'linear-gradient(135deg,#C41E3A,#B8860B)' }}>
                {n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">{title}</p>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                {link && (
                  <a href={link} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1 text-xs font-medium mt-1 underline"
                     style={{ color:'#C41E3A' }}>
                    {linkText} <ExternalLink className="w-3 h-3"/>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="mt-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-3">
          <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-emerald-700 leading-relaxed">
            <strong>Your password is safe.</strong> It is never stored in our database.
            It&apos;s used only in this browser session to send emails through Gmail&apos;s SMTP server, then immediately discarded.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SendInvitesPage() {
  const [guests, setGuests]         = useState<GuestWithLink[]>([]);
  const [weddingSlug, setWeddingSlug] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading]       = useState(true);

  const [senderEmail, setSenderEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [subject, setSubject]         = useState('');
  const [msgTemplate, setMsgTemplate] = useState('');

  const [activeTab, setActiveTab]     = useState<'email'|'whatsapp'>('email');
  const [sending, setSending]         = useState(false);
  const [results, setResults]         = useState<{email:string;success:boolean;error?:string}[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [copiedId, setCopiedId]       = useState('');
  const [previewGuest, setPreviewGuest] = useState<GuestWithLink|null>(null);
  const [selectAll, setSelectAll]     = useState(true);

  const buildWA = useCallback((g:Guest, link:string, names:string, date:string) =>
    `🌸 *You're Invited!* 🌸\n\nDear ${g.full_name},\n\nWith great joy, we invite you to celebrate the wedding of *${names}*${date?` on *${date}*`:''}.

Please confirm your attendance using your personal RSVP link:

👉 ${link}

_This link is exclusive to you._\n\nWith love & blessings 💐`, []);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return;
      const { data:w } = await supabase.from('weddings').select('*').eq('planner_id',user.id).single();
      if (!w) { setLoading(false); return; }
      setWeddingSlug(w.slug); setCoupleNames(w.couple_names);
      const dateStr = w.wedding_date ? new Date(w.wedding_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '';
      setWeddingDate(dateStr);
      setSubject(`You're invited to ${w.couple_names}'s Wedding 💍`);
      setMsgTemplate(`Dear {guest_name},\n\nWith immense joy, we invite you to celebrate the wedding of ${w.couple_names}${dateStr?` on ${dateStr}`:''}.

Please click the link below to RSVP and confirm your attendance:

{rsvp_link}

This link is personal to you. Kindly respond at your earliest convenience.

With love & blessings,\nThe Wedding Family`);
      const { data:gData } = await supabase.from('guests').select('*').eq('wedding_id',w.id).order('created_at');
      const enriched:GuestWithLink[] = (gData??[]).map((g:Guest) => {
        const link = `${APP_URL}/rsvp/${w.slug}?token=${g.invite_token}`;
        return { ...g, rsvpLink:link, whatsappMsg:buildWA(g,link,w.couple_names,dateStr), emailSelected:!!g.email };
      });
      setGuests(enriched);
      setPreviewGuest(enriched.find(g=>g.email)??enriched[0]??null);
      setLoading(false);
    }
    load();
  }, [buildWA]);

  function toggleGuest(id:string) { setGuests(p=>p.map(g=>g.id===id?{...g,emailSelected:!g.emailSelected}:g)); }
  function toggleAll() { const v=!selectAll; setSelectAll(v); setGuests(p=>p.map(g=>({...g,emailSelected:v&&!!g.email}))); }

  function buildEmail(g:GuestWithLink) {
    return msgTemplate.replace(/{guest_name}/g,g.full_name).replace(/{rsvp_link}/g,g.rsvpLink).replace(/{couple_names}/g,coupleNames).replace(/{wedding_date}/g,weddingDate);
  }

  async function handleSend() {
    const sel = guests.filter(g=>g.emailSelected&&g.email);
    if (!sel.length)       { alert('No guests with emails selected.'); return; }
    if (!senderEmail||!appPassword) { alert('Please enter your Gmail address and App Password.'); return; }
    setSending(true); setShowResults(false); setResults([]);
    try {
      const res = await fetch('/api/send-emails',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ senderEmail, appPassword, subject,
          guests:sel.map(g=>({name:g.full_name,email:g.email,message:buildEmail(g),rsvpLink:g.rsvpLink})) }),
      });
      const data = await res.json();
      setResults(data.results??[]);
      setShowResults(true);
    } catch { alert('Something went wrong.'); }
    finally { setSending(false); }
  }

  function copyLink(link:string, id:string) { navigator.clipboard.writeText(link); setCopiedId(id); setTimeout(()=>setCopiedId(''),2000); }
  function copyWA(msg:string, id:string)    { navigator.clipboard.writeText(msg);  setCopiedId(id); setTimeout(()=>setCopiedId(''),2000); }

  const selectedCount     = guests.filter(g=>g.emailSelected&&g.email).length;
  const guestsWithEmail   = guests.filter(g=>g.email).length;
  const guestsWithoutEmail= guests.filter(g=>!g.email).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"/></div>;
  if (!guests.length) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Users className="w-12 h-12 text-stone-200 mb-3"/>
      <p className="font-semibold text-stone-500 mb-4">No guests yet — add them first.</p>
      <a href="/dashboard/guests" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
         style={{background:'linear-gradient(135deg,#C41E3A,#8B0000)'}}>Go to Guest List →</a>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Send className="w-5 h-5" style={{color:'#C41E3A'}}/>
          <h1 className="text-2xl font-bold text-stone-900" style={{fontFamily:'var(--font-cormorant)'}}>Send Invites</h1>
        </div>
        <p className="text-stone-500 text-sm">Send personalized RSVP links to guests via Email or WhatsApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {l:'Total Guests',              v:guests.length,       c:'#7C3AED',bg:'#F5F3FF'},
          {l:'Have Email',                v:guestsWithEmail,     c:'#065F46',bg:'#F0FDF4'},
          {l:'No Email (WhatsApp only)',  v:guestsWithoutEmail,  c:'#B45309',bg:'#FFFBEB'},
        ].map(({l,v,c,bg})=>(
          <div key={l} className="rounded-2xl border px-5 py-4 shadow-sm" style={{background:bg,borderColor:c+'30'}}>
            <p className="text-3xl font-bold" style={{color:c,fontFamily:'var(--font-cormorant)'}}>{v}</p>
            <p className="text-xs font-medium uppercase tracking-widest mt-0.5" style={{color:c}}>{l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['email','whatsapp'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={activeTab===tab
                    ?{background:'linear-gradient(135deg,#C41E3A,#8B0000)',color:'#fff',borderColor:'#C41E3A',boxShadow:'0 4px 12px rgba(196,30,58,0.3)'}
                    :{background:'#fff',color:'#78716c',borderColor:'#e7e5e4'}}>
            {tab==='email'?<Mail className="w-4 h-4"/>:<Smartphone className="w-4 h-4"/>}
            {tab==='email'?'Send via Email':'WhatsApp Links'}
          </button>
        ))}
      </div>

      {/* ── EMAIL TAB ── */}
      {activeTab==='email' && (
        <div className="grid grid-cols-3 gap-6">

          {/* Col 1: App password guide */}
          <div className="col-span-1">
            <AppPasswordGuide />
          </div>

          {/* Col 2+3: Config + guest selector */}
          <div className="col-span-2 space-y-5">

            {/* Credentials */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2"
                   style={{background:'linear-gradient(135deg,#FFF7ED,#FFF)'}}>
                <Lock className="w-4 h-4 text-amber-500"/>
                <h2 className="text-sm font-semibold text-stone-700">Your Gmail Credentials</h2>
                <span className="ml-auto text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Only for sending — never stored</span>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Gmail Address</label>
                  <input type="email" value={senderEmail} onChange={e=>setSenderEmail(e.target.value)}
                         placeholder="yourname@gmail.com"
                         className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">App Password (16 chars)</label>
                  <div className="relative">
                    <input type={showPass?'text':'password'} value={appPassword} onChange={e=>setAppPassword(e.target.value)}
                           placeholder="xxxx xxxx xxxx xxxx"
                           className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition pr-10 font-mono"/>
                    <button type="button" onClick={()=>setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      <Eye className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Message template */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between"
                   style={{background:'linear-gradient(135deg,#FFF7ED,#FFF)'}}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500"/>
                  <h2 className="text-sm font-semibold text-stone-700">Message Template</h2>
                </div>
                <div className="flex gap-1.5 text-xs text-stone-400">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-mono">{'{guest_name}'}</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-mono">{'{rsvp_link}'}</span>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Email Subject</label>
                  <input type="text" value={subject} onChange={e=>setSubject(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Message Body</label>
                  <textarea rows={8} value={msgTemplate} onChange={e=>setMsgTemplate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 transition resize-none font-mono text-xs leading-relaxed"/>
                </div>
              </div>
            </div>

            {/* Guest selector + preview side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Selector */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between"
                     style={{background:'linear-gradient(135deg,#FFF7ED,#FFF)'}}>
                  <h3 className="text-xs font-semibold text-stone-700">Select Recipients</h3>
                  <button onClick={toggleAll} className="text-xs font-medium px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600">
                    {selectAll?'Deselect All':'Select All'}
                  </button>
                </div>
                <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
                  {guests.map(g=>(
                    <div key={g.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50">
                      <input type="checkbox" checked={g.emailSelected&&!!g.email} disabled={!g.email}
                             onChange={()=>toggleGuest(g.id)}
                             className="w-4 h-4 rounded accent-red-600 cursor-pointer disabled:cursor-not-allowed"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800 truncate">{g.full_name}</p>
                        {g.email
                          ?<p className="text-[10px] text-stone-400 truncate">{g.email}</p>
                          :<p className="text-[10px] text-amber-500">No email — use WhatsApp</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50/40">
                  <p className="text-xs text-stone-400">{selectedCount} of {guestsWithEmail} selected</p>
                </div>
              </div>

              {/* Preview */}
              {previewGuest && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between"
                       style={{background:'linear-gradient(135deg,#FFF1F2,#FFF)'}}>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" style={{color:'#C41E3A'}}/>
                      <h3 className="text-xs font-semibold text-stone-700">Preview</h3>
                    </div>
                    <select onChange={e=>{const g=guests.find(x=>x.id===e.target.value);if(g)setPreviewGuest(g);}}
                            className="text-xs border border-stone-200 rounded-lg px-2 py-1 text-stone-600 bg-white focus:outline-none">
                      {guests.slice(0,8).map(g=><option key={g.id} value={g.id}>{g.full_name.split(' ')[0]}</option>)}
                    </select>
                  </div>
                  <div className="px-4 py-4">
                    <div className="text-xs text-stone-400 mb-0.5"><strong>To:</strong> {previewGuest.email||'No email'}</div>
                    <div className="text-xs text-stone-400 mb-3"><strong>Subject:</strong> {subject}</div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-mono">
                      {buildEmail(previewGuest)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button onClick={handleSend} disabled={sending||selectedCount===0}
                    className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.01] disabled:opacity-60 shadow-xl"
                    style={{background:'linear-gradient(135deg,#C41E3A,#8B0000)',boxShadow:'0 8px 24px rgba(196,30,58,0.4)'}}>
              {sending
                ?<><Loader2 className="w-5 h-5 animate-spin"/>Sending emails…</>
                :<><Send className="w-5 h-5"/>Send to {selectedCount} Guest{selectedCount!==1?'s':''} via Email</>}
            </button>
          </div>
        </div>
      )}

      {/* ── WHATSAPP TAB ── */}
      {activeTab==='whatsapp' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2"
               style={{background:'linear-gradient(135deg,#F0FDF4,#FFF)'}}>
            <Smartphone className="w-4 h-4 text-emerald-500"/>
            <h2 className="text-sm font-semibold text-stone-700">WhatsApp Messages</h2>
            <span className="ml-auto text-xs text-stone-400">Copy any message → open WhatsApp → paste & send</span>
          </div>
          <div className="divide-y divide-stone-100">
            {guests.map((g,i)=>{
              const cols=['#C41E3A','#065F46','#1D4ED8','#7C3AED','#0E7490','#B45309'];
              const initials=g.full_name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
              const waId=g.id+'_wa', lnId=g.id+'_ln';
              return (
                <div key={g.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                         style={{background:cols[i%cols.length]}}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{g.full_name}</p>
                          <p className="text-xs text-stone-400">{g.phone||'No phone'} · {g.group_label||g.family_side||'—'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>copyLink(g.rsvpLink,lnId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                                  style={copiedId===lnId?{background:'#F0FDF4',color:'#065F46',borderColor:'#BBF7D0'}:{background:'#FFF7ED',color:'#B45309',borderColor:'#FDE68A'}}>
                            {copiedId===lnId?<Check className="w-3 h-3"/>:<Copy className="w-3 h-3"/>}
                            {copiedId===lnId?'Copied!':'RSVP Link'}
                          </button>
                          <button onClick={()=>copyWA(g.whatsappMsg,waId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                                  style={copiedId===waId?{background:'#F0FDF4',color:'#065F46',borderColor:'#BBF7D0'}:{background:'#F0FDF4',color:'#065F46',borderColor:'#BBF7D0'}}>
                            {copiedId===waId?<Check className="w-3 h-3"/>:<Smartphone className="w-3 h-3"/>}
                            {copiedId===waId?'Copied!':'Copy WhatsApp'}
                          </button>
                        </div>
                      </div>
                      <details className="group">
                        <summary className="flex items-center gap-1.5 text-xs text-stone-400 cursor-pointer hover:text-stone-600 select-none list-none">
                          <ChevronDown className="w-3.5 h-3.5 group-open:hidden"/>
                          <ChevronUp className="w-3.5 h-3.5 hidden group-open:block"/>
                          Preview message
                        </summary>
                        <div className="mt-3 p-4 text-xs text-stone-700 whitespace-pre-wrap leading-relaxed"
                             style={{background:'#DCF8C6',borderRadius:'0 12px 12px 12px'}}>
                          {g.whatsappMsg}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && results.length>0 && (
        <div className="mt-6 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2"
               style={{background:'linear-gradient(135deg,#F0FDF4,#FFF)'}}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
            <h2 className="text-sm font-semibold text-stone-700">Send Results</h2>
            <span className="ml-auto text-xs text-emerald-600 font-medium">
              ✅ {results.filter(r=>r.success).length} sent · ❌ {results.filter(r=>!r.success).length} failed
            </span>
          </div>
          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {results.map((r,i)=>(
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                {r.success?<CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0"/>:<AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0"/>}
                <span className="text-sm text-stone-700 flex-1">{r.email}</span>
                {!r.success&&<span className="text-xs text-red-500 truncate max-w-xs">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
