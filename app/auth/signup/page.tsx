'use client';
// app/auth/signup/page.tsx — Simple signup: name, email, password only

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Flower2, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const supabase = getSupabase();
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-dm-sans)' }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center px-12 text-center"
           style={{ background: 'linear-gradient(135deg,#065F46 0%,#0D9488 50%,#F59E0B 100%)' }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage:'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="absolute top-8 left-8 w-28 h-28 rounded-full border-2 border-white/20" />
        <div className="absolute bottom-8 right-8 w-28 h-28 rounded-full border-2 border-yellow-300/20" />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center mx-auto mb-8">
            <Flower2 className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 italic" style={{ fontFamily:'var(--font-cormorant)' }}>
            Start your journey
          </h1>
          <p className="text-yellow-100 text-lg mb-8 font-light">Set up your wedding in minutes</p>
          <div className="space-y-3 text-sm text-white/80 text-left max-w-xs mx-auto">
            {['1. Create account (email + password)','2. Enter wedding details & ceremonies','3. Add your guest list','4. Send RSVP links via Email or WhatsApp','5. Track live responses on dashboard'].map(s=>(
              <div key={s} className="flex items-center gap-2"><span className="text-yellow-300">→</span>{s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDF8F0]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background:'linear-gradient(135deg,#065F46,#F59E0B)' }}>
              <Flower2 className="w-5 h-5 text-white"/>
            </div>
            <span className="text-xl font-bold text-stone-800" style={{ fontFamily:'var(--font-cormorant)' }}>WeddingDesk</span>
          </div>

          <h2 className="text-3xl font-bold text-stone-900 mb-1" style={{ fontFamily:'var(--font-cormorant)' }}>Create account</h2>
          <p className="text-stone-500 text-sm mb-8">Just your name, email, and a password — that's it.</p>

          {error && <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Your Full Name</label>
              <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} required
                     placeholder="e.g. Pooja Sharma"
                     className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 focus:outline-none focus:ring-2 transition"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                     placeholder="you@gmail.com"
                     className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 focus:outline-none focus:ring-2 transition"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}
                       placeholder="Min. 6 characters"
                       className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 focus:outline-none focus:ring-2 transition pr-12"/>
                <button type="button" onClick={()=>setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                    style={{ background:loading?'#888':'linear-gradient(135deg,#065F46,#0D9488)', boxShadow:'0 4px 20px rgba(6,95,70,0.4)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Creating…</> : 'Create Account →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold" style={{color:'#C41E3A'}}>Sign in</Link>
            </p>
          </div>

          <div className="mt-8 px-4 py-3 rounded-xl bg-stone-100 border border-stone-200">
            <p className="text-xs text-stone-500 text-center">
              🔒 No app passwords or Gmail setup needed to create an account.<br/>
              Those are only asked when you want to <strong>send emails to guests</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
