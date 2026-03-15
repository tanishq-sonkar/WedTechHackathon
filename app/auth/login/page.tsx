'use client';
// app/auth/login/page.tsx — Clean login: email + password only

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Flower2, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const supabase = getSupabase();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-dm-sans)' }}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center px-12 text-center"
           style={{ background: 'linear-gradient(135deg, #8B0000 0%, #C41E3A 40%, #B8860B 100%)' }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-8 left-8 w-28 h-28 rounded-full border-2 border-white/20" />
        <div className="absolute bottom-8 right-8 w-28 h-28 rounded-full border-2 border-yellow-300/20" />
        {['🌸','🌺','🪷','✨','🌼','🪔'].map((p,i) => (
          <span key={i} className="absolute text-2xl opacity-40"
                style={{ left:`${8+i*16}%`, top:`${10+(i%3)*28}%`,
                         animation:`float ${3+i*0.6}s ease-in-out infinite`, animationDelay:`${i*0.5}s` }}>
            {p}
          </span>
        ))}
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center mx-auto mb-8">
            <Flower2 className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}>WeddingDesk</h1>
          <p className="text-yellow-200 text-lg mb-8 font-light">India's smartest wedding RSVP platform</p>
          <div className="space-y-3 text-sm text-white/80 text-left max-w-xs mx-auto">
            {['Beautiful digital invitations','Auto email RSVP links to guests','Live response tracking dashboard','WhatsApp message generator'].map(f => (
              <div key={f} className="flex items-center gap-2"><span className="text-yellow-300">✦</span>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDF8F0]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#C41E3A,#B8860B)' }}>
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-cormorant)' }}>WeddingDesk</span>
          </div>

          <h2 className="text-3xl font-bold text-stone-900 mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>Welcome back</h2>
          <p className="text-stone-500 text-sm mb-8">Sign in to your planner dashboard</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                     placeholder="planner@gmail.com"
                     className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 focus:outline-none focus:ring-2 transition"
                     style={{'--tw-ring-color':'#C41E3A'} as React.CSSProperties} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required
                       placeholder="••••••••"
                       className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 focus:outline-none focus:ring-2 transition pr-12" />
                <button type="button" onClick={()=>setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                    style={{ background: loading?'#888':'linear-gradient(135deg,#C41E3A,#8B0000)', boxShadow:'0 4px 20px rgba(196,30,58,0.4)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-500">
              New planner?{' '}
              <Link href="/auth/signup" className="font-semibold" style={{color:'#C41E3A'}}>Create your account</Link>
            </p>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"/>
            <span className="text-amber-400 text-lg">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"/>
          </div>
          <p className="text-center text-xs text-stone-400 mt-4 italic">
            Login uses only your email &amp; password — no app passwords needed here.
          </p>
        </div>
      </div>
    </div>
  );
}
