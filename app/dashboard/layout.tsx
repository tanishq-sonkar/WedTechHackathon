'use client';
// app/dashboard/layout.tsx

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import {
  LayoutDashboard, Users, ClipboardCheck,
  Settings, Flower2, LogOut, Send,
} from 'lucide-react';

const navItems = [
  { label: 'Overview',      href: '/dashboard',             icon: LayoutDashboard, desc: 'Live stats' },
  { label: 'Guest List',    href: '/dashboard/guests',       icon: Users,           desc: 'Add & manage guests' },
  { label: 'Send Invites',  href: '/dashboard/send-invites', icon: Send,            desc: 'Email RSVP links' },
  { label: 'RSVPs',         href: '/dashboard/rsvps',        icon: ClipboardCheck,  desc: 'Track responses' },
  { label: 'Settings',      href: '/dashboard/settings',     icon: Settings,        desc: 'Wedding details' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FDF8F0', fontFamily: 'var(--font-dm-sans)' }}>
      <aside className="w-64 flex flex-col fixed top-0 left-0 h-full z-20 shadow-xl"
             style={{ background: 'linear-gradient(180deg, #8B0000 0%, #C41E3A 50%, #9A1515 100%)' }}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
              <Flower2 className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="font-bold text-white" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>WeddingDesk</p>
              <p className="text-[10px] text-red-200 uppercase tracking-widest">Planner Portal</p>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-4 mb-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/20">
          <p className="text-[10px] text-yellow-300 uppercase tracking-widest font-medium mb-0.5">Active Wedding</p>
          <p className="text-sm font-semibold text-white truncate">Your Wedding</p>
          <p className="text-xs text-red-200">Live on Supabase</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon, desc }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150"
                    style={active ? { background: 'rgba(255,255,255,0.25)' } : {}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <Icon className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white leading-tight">{label}</p>
                  <p className="text-[11px] text-red-300 truncate">{desc}</p>
                </div>
                {label === 'Send Invites' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-yellow-400 text-yellow-900">NEW</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-6 border-t border-white/10 pt-4">
          <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-200 hover:text-white hover:bg-white/10 transition-all">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-8 py-4">
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · Supabase Connected
            </span>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
