'use client';
// app/dashboard/rsvps/page.tsx

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import {
  ClipboardCheck, CheckCircle2, XCircle, HelpCircle,
  Inbox, Utensils, Users, BedDouble, TrendingUp,
  Search, Filter, Download,
} from 'lucide-react';

interface RsvpRow {
  id: string; status: string; dietary_pref: string|null;
  plus_ones_count: number; children_count: number;
  message: string|null; submitted_at: string;
  guests: { full_name:string; family_side:string|null; group_label:string|null; phone:string|null; email:string|null; accommodation_required:boolean } | null;
  events: { name:string } | null;
}

export default function RsvpsPage() {
  const [rsvps, setRsvps]       = useState<RsvpRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all'|'attending'|'not_attending'|'maybe'>('all');
  const [filterEvent, setFilterEvent]   = useState('all');
  const [search, setSearch]     = useState('');
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [coupleNames, setCoupleNames] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: wedding } = await supabase.from('weddings').select('id,couple_names').eq('planner_id', user.id).single();
      if (!wedding) { setLoading(false); return; }
      setCoupleNames(wedding.couple_names);
      const { data } = await supabase
        .from('rsvps')
        .select('*, guests(full_name,family_side,group_label,phone,email,accommodation_required), events(name)')
        .eq('wedding_id', wedding.id)
        .order('submitted_at', { ascending: false });
      const rows = data ?? [];
      setRsvps(rows);
      const names = [...new Set(rows.map((r: RsvpRow) => r.events?.name).filter(Boolean))] as string[];
      setEventNames(names);
      setLoading(false);
    }
    load();
  }, []);

  const attending    = rsvps.filter(r => r.status === 'attending').length;
  const notAttending = rsvps.filter(r => r.status === 'not_attending').length;
  const maybe        = rsvps.filter(r => r.status === 'maybe').length;
  const totalHeads   = rsvps.filter(r => r.status === 'attending').reduce((a,r) => a+1+(r.plus_ones_count??0)+(r.children_count??0), 0);
  const needRoom     = rsvps.filter(r => r.guests?.accommodation_required && r.status==='attending').length;
  const dietary      = {
    veg:rsvps.filter(r=>r.dietary_pref==='veg').length,
    non_veg:rsvps.filter(r=>r.dietary_pref==='non_veg').length,
    jain:rsvps.filter(r=>r.dietary_pref==='jain').length,
    vegan:rsvps.filter(r=>r.dietary_pref==='vegan').length,
  };

  const filtered = rsvps.filter(r => {
    const ms = filterStatus==='all' || r.status===filterStatus;
    const me = filterEvent==='all'  || r.events?.name===filterEvent;
    const mq = !search || r.guests?.full_name.toLowerCase().includes(search.toLowerCase()) || r.guests?.email?.toLowerCase().includes(search.toLowerCase());
    return ms && me && mq;
  });

  function exportCSV() {
    const header = ['Guest Name','Email','Phone','Event','Status','Dietary','Plus Ones','Children','Accommodation','Message','Submitted'];
    const rows = filtered.map(r=>[
      r.guests?.full_name??'', r.guests?.email??'', r.guests?.phone??'',
      r.events?.name??'', r.status, r.dietary_pref??'',
      r.plus_ones_count, r.children_count,
      r.guests?.accommodation_required?'Yes':'No',
      (r.message??'').replace(/,/g,''),
      new Date(r.submitted_at).toLocaleDateString('en-IN'),
    ]);
    const csv = [header,...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`rsvps-${coupleNames.replace(/\s/g,'-')}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const StatusBadge = ({status}:{status:string}) => {
    const c:{[k:string]:{l:string;bg:string;color:string;border:string;I:React.ElementType}} = {
      attending:     {l:'Attending',     bg:'#F0FDF4',color:'#065F46',border:'#BBF7D0',I:CheckCircle2},
      not_attending: {l:'Not Attending', bg:'#FFF1F2',color:'#BE123C',border:'#FECDD3',I:XCircle},
      maybe:         {l:'Maybe',         bg:'#FFFBEB',color:'#B45309',border:'#FDE68A',I:HelpCircle},
    };
    const s = c[status]??c.maybe;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{background:s.bg,color:s.color,borderColor:s.border}}><s.I className="w-3 h-3"/>{s.l}</span>;
  };

  const DietBadge = ({pref}:{pref:string|null}) => {
    if (!pref) return <span className="text-stone-300 text-xs">—</span>;
    const m:{[k:string]:{e:string;c:string;bg:string}} = {veg:{e:'🥦',c:'#065F46',bg:'#F0FDF4'},non_veg:{e:'🍗',c:'#9A3412',bg:'#FFF7ED'},jain:{e:'🌿',c:'#854D0E',bg:'#FEFCE8'},vegan:{e:'🌱',c:'#134E4A',bg:'#F0FDFA'}};
    const labels:{[k:string]:string} = {veg:'Veg',non_veg:'Non-Veg',jain:'Jain',vegan:'Vegan'};
    const s = m[pref]??{e:'?',c:'#555',bg:'#eee'};
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{background:s.bg,color:s.c}}>{s.e} {labels[pref]??pref}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"/></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-5 h-5" style={{color:'#C41E3A'}}/>
            <h1 className="text-2xl font-bold text-stone-900" style={{fontFamily:'var(--font-cormorant)'}}>RSVP Responses</h1>
          </div>
          <p className="text-stone-500 text-sm">Live responses for <strong>{coupleNames}</strong></p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-stone-50 transition-all" style={{background:'#fff',borderColor:'#e7e5e4',color:'#57534e'}}>
          <Download className="w-4 h-4"/> Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {label:'Total Responses',value:rsvps.length,  grad:'from-violet-500 to-purple-600',sh:'shadow-purple-200', I:TrendingUp},
          {label:'Attending',      value:attending,      grad:'from-emerald-500 to-teal-600',  sh:'shadow-emerald-200',I:CheckCircle2},
          {label:'Not Attending',  value:notAttending,   grad:'from-rose-500 to-red-600',      sh:'shadow-red-200',   I:XCircle},
          {label:'Maybe',          value:maybe,          grad:'from-amber-400 to-orange-500',  sh:'shadow-orange-200',I:HelpCircle},
          {label:'Total Heads',    value:totalHeads,     grad:'from-sky-500 to-blue-600',      sh:'shadow-blue-200',  I:Users},
        ].map(({label,value,grad,sh,I})=>(
          <div key={label} className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${grad} ${sh}`}>
            <I className="w-5 h-5 mb-3 opacity-80"/>
            <p className="text-3xl font-bold" style={{fontFamily:'var(--font-cormorant)'}}>{value}</p>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Dietary + Accommodation */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2" style={{background:'linear-gradient(135deg,#F0FDF4,#FFF)'}}>
            <Utensils className="w-4 h-4 text-emerald-500"/><h3 className="text-sm font-semibold text-stone-700">Dietary Breakdown</h3>
          </div>
          <div className="p-5 grid grid-cols-4 gap-3">
            {[{l:'🥦 Veg',v:dietary.veg,c:'#065F46',bg:'#F0FDF4'},{l:'🍗 Non-Veg',v:dietary.non_veg,c:'#9A3412',bg:'#FFF7ED'},{l:'🌿 Jain',v:dietary.jain,c:'#854D0E',bg:'#FEFCE8'},{l:'🌱 Vegan',v:dietary.vegan,c:'#134E4A',bg:'#F0FDFA'}].map(({l,v,c,bg})=>(
              <div key={l} className="rounded-2xl p-3 text-center" style={{background:bg}}>
                <p className="text-2xl font-bold" style={{color:c,fontFamily:'var(--font-cormorant)'}}>{v}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{color:c}}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2" style={{background:'linear-gradient(135deg,#EFF6FF,#FFF)'}}>
            <BedDouble className="w-4 h-4 text-blue-500"/><h3 className="text-sm font-semibold text-stone-700">Key Counts</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{background:'#EFF6FF'}}>
              <span className="text-sm text-stone-700 font-medium flex items-center gap-2"><BedDouble className="w-4 h-4 text-blue-400"/>Need Accommodation</span>
              <span className="text-2xl font-bold text-blue-700" style={{fontFamily:'var(--font-cormorant)'}}>{needRoom}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{background:'#FFF7ED'}}>
              <span className="text-sm text-stone-700 font-medium">💌 Left a Message</span>
              <span className="text-2xl font-bold text-amber-700" style={{fontFamily:'var(--font-cormorant)'}}>{rsvps.filter(r=>r.message).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-stone-100 flex flex-wrap items-center gap-3" style={{background:'linear-gradient(135deg,#FFF7ED,#FFF)'}}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300"/>
            <input type="text" placeholder="Search guest name or email…" value={search} onChange={e=>setSearch(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-2 bg-white transition"/>
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400"/>
            {(['all','attending','not_attending','maybe'] as const).map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={filterStatus===s?{background:'#C41E3A',color:'#fff',borderColor:'#C41E3A'}:{background:'#fff',color:'#78716c',borderColor:'#e7e5e4'}}>
                {s==='all'?'All':s==='not_attending'?'Not Attending':s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          {eventNames.length > 1 && (
            <select value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600 bg-white focus:outline-none">
              <option value="all">All Ceremonies</option>
              {eventNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <span className="ml-auto text-xs text-stone-400">{filtered.length} records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Inbox className="w-14 h-14 text-stone-200 mb-4"/>
            <p className="font-semibold text-stone-500 mb-1">{rsvps.length===0?'No RSVPs yet':'No results match'}</p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              {rsvps.length===0?'Send invite links from the Send Invites page — responses appear here.':'Try clearing the filters.'}
            </p>
            {rsvps.length===0 && (
              <a href="/dashboard/send-invites" className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                 style={{background:'linear-gradient(135deg,#C41E3A,#8B0000)'}}>Send Invites →</a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  {['Guest','Ceremony','Status','Dietary','Heads','Room','Note','Date'].map(col=>(
                    <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((rsvp,i)=>{
                  const cols=['#C41E3A','#065F46','#1D4ED8','#7C3AED','#0E7490','#B45309'];
                  const initials=(rsvp.guests?.full_name??'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
                  const heads=1+(rsvp.plus_ones_count??0)+(rsvp.children_count??0);
                  return (
                    <tr key={rsvp.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                               style={{background:cols[i%cols.length]}}>{initials}</div>
                          <div>
                            <p className="font-semibold text-stone-800">{rsvp.guests?.full_name??'—'}</p>
                            <p className="text-[11px] text-stone-400">{rsvp.guests?.email??rsvp.guests?.phone??''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium whitespace-nowrap">{rsvp.events?.name??'—'}</span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={rsvp.status}/></td>
                      <td className="px-5 py-4"><DietBadge pref={rsvp.dietary_pref}/></td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-lg font-bold text-stone-700" style={{fontFamily:'var(--font-cormorant)'}}>{rsvp.status==='attending'?heads:'—'}</span>
                        {rsvp.status==='attending'&&(rsvp.plus_ones_count>0||rsvp.children_count>0)&&(
                          <p className="text-[10px] text-stone-400">+{rsvp.plus_ones_count} · {rsvp.children_count} kids</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {rsvp.guests?.accommodation_required
                          ?<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium"><BedDouble className="w-3 h-3"/>Yes</span>
                          :<span className="text-stone-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 max-w-[140px]">
                        {rsvp.message?<p className="text-xs text-stone-500 italic truncate">&ldquo;{rsvp.message}&rdquo;</p>:<span className="text-stone-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-400 whitespace-nowrap">
                        {new Date(rsvp.submitted_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
              <p className="text-xs text-stone-400">Showing <strong>{filtered.length}</strong> of <strong>{rsvps.length}</strong> responses</p>
              <button onClick={exportCSV} className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1"><Download className="w-3.5 h-3.5"/>Export this view</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
