import { NextRequest, NextResponse } from 'next/server';
import { providers } from '@/providers';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const league = (req.nextUrl.searchParams.get('league') || 'nba').toLowerCase();
  const q = req.nextUrl.searchParams.get('q') || '';
  const provider = (providers as any)[league];

  if (!provider) return NextResponse.json({ error: 'League not supported' }, { status: 400 });

  const data = await cache(`teams:${league}:${q}`, 3600, () => provider.searchTeams(q));
  return NextResponse.json(data);
}
