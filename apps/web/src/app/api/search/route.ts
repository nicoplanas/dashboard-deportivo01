import { NextRequest, NextResponse } from 'next/server';
import { providers } from '@/providers';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const league = (req.nextUrl.searchParams.get('league') || 'nba').toLowerCase();
  const q = req.nextUrl.searchParams.get('q') || '';
  const type = (req.nextUrl.searchParams.get('type') || 'team').toLowerCase();
  const provider = (providers as any)[league];

  if (!provider) return NextResponse.json({ error: 'League/provider not supported' }, { status: 400 });

  if (type === 'team') {
    if (!provider.searchTeams) return NextResponse.json({ error: 'searchTeams not supported by provider' }, { status: 400 });
    const data = await cache(`search:teams:${league}:${q}`, 3600, () => provider.searchTeams!(q));
    return NextResponse.json(data);
  }

  if (type === 'player') {
    if (!provider.searchPlayers) return NextResponse.json({ error: 'searchPlayers not supported by provider' }, { status: 400 });
    const data = await cache(`search:players:${league}:${q}`, 3600, () => provider.searchPlayers!(q));
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'type must be team or player' }, { status: 400 });
}
