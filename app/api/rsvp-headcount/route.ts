// app/api/rsvp-headcount/route.ts
// REST API for third-party CRM integration
// GET /api/rsvp-headcount?wedding_id=XXX&event_id=YYY

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wedding_id = searchParams.get('wedding_id');
  const event_id = searchParams.get('event_id');

  if (!wedding_id) {
    return NextResponse.json({ error: 'Missing required parameter: wedding_id' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from('rsvps')
      .select(`status, plus_ones_count, children_count, dietary_pref, events(id, name, event_date, venue_name)`)
      .eq('wedding_id', wedding_id);

    if (event_id) query = query.eq('event_id', event_id);
    const { data, error } = await query;
    if (error) throw error;

    const eventMap: Record<string, { event_id: string; event_name: string; event_date: string; venue_name: string | null; attending: number; not_attending: number; maybe: number; total_heads: number; dietary: { veg: number; non_veg: number; jain: number; vegan: number } }> = {};

    for (const row of (data ?? [])) {
      const evt = row.events as { id: string; name: string; event_date: string; venue_name: string | null } | null;
      if (!evt) continue;
      if (!eventMap[evt.id]) {
        eventMap[evt.id] = { event_id: evt.id, event_name: evt.name, event_date: evt.event_date, venue_name: evt.venue_name, attending: 0, not_attending: 0, maybe: 0, total_heads: 0, dietary: { veg: 0, non_veg: 0, jain: 0, vegan: 0 } };
      }
      const b = eventMap[evt.id];
      if (row.status === 'attending') { b.attending++; b.total_heads += 1 + (row.plus_ones_count ?? 0) + (row.children_count ?? 0); }
      else if (row.status === 'not_attending') b.not_attending++;
      else if (row.status === 'maybe') b.maybe++;
      if (row.dietary_pref && row.dietary_pref in b.dietary) b.dietary[row.dietary_pref as keyof typeof b.dietary]++;
    }

    return NextResponse.json({ wedding_id, generated_at: new Date().toISOString(), events: Object.values(eventMap) });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
