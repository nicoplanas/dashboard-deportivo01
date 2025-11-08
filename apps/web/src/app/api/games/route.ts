import { NextRequest, NextResponse } from 'next/server';
import { providers } from '@/providers';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const league = (req.nextUrl.searchParams.get('league') || 'nba').toLowerCase();
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const provider = (providers as any)[league];
  const sport = req.nextUrl.searchParams.get('sport') || undefined;

  if (!provider) {
    return NextResponse.json({ error: 'League not supported' }, { status: 400 });
  }

  if (!provider.gamesByDate) {
    return NextResponse.json({ error: 'gamesByDate not supported by provider' }, { status: 400 });
  }

  try {
    const data = await cache(`games:${league}:${date}:${sport || 'all'}`, 300, async () => await provider.gamesByDate!(date, sport));
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' }
    });
  } catch (err: any) {
    // Log server-side for debugging
    console.error('Error fetching gamesByDate', { league, date, err: err?.message || err });
    return NextResponse.json({ error: 'Failed to fetch games', details: String(err?.message || err) }, { status: 502 });
  }
}
