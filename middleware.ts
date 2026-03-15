// middleware.ts — protects /dashboard and /onboarding routes
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
  get(name: string) {
    return request.cookies.get(name)?.value;
  },
  set(
    name: string,
    value: string,
    options: Record<string, unknown>
  ) {
    request.cookies.set({ name, value, ...options });
    response = NextResponse.next({ request: { headers: request.headers } });
    response.cookies.set({ name, value, ...(options as object) });
  },
  remove(name: string, options: Record<string, unknown>) {
    request.cookies.set({ name, value: '', ...(options as object) });
    response = NextResponse.next({ request: { headers: request.headers } });
    response.cookies.set({ name, value: '', ...(options as object) });
  },
}
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  // Protect dashboard & onboarding
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect logged-in users away from auth pages
  if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/auth/:path*'],
};
