import { NextRequest, NextResponse } from 'next/server';
import { providers } from '@/providers';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const league = (req.nextUrl.searchParams.get('league') || 'nba').toLowerCase();
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const provider = (providers as any)[league];

  if (!provider) {
    return NextResponse.json({ error: 'League not supported' }, { status: 400 });
  }

  const data = await cache(`games:${league}:${date}`, 300, () => provider.gamesByDate(date));

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' }
  });
}
