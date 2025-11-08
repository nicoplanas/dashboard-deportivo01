import { NextRequest, NextResponse } from 'next/server';
import { providers } from '@/providers';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const league = (req.nextUrl.searchParams.get('league') || 'nba').toLowerCase();
  const id = req.nextUrl.searchParams.get('id');
  const type = (req.nextUrl.searchParams.get('type') || 'team').toLowerCase();
  const provider = (providers as any)[league];

  if (!provider) return NextResponse.json({ error: 'League/provider not supported' }, { status: 400 });
  if (!id) return NextResponse.json({ error: 'id param required' }, { status: 400 });

  if (type === 'team') {
    if (!provider.teamStats) return NextResponse.json({ error: 'teamStats not supported by provider' }, { status: 400 });
    try {
      const data = await cache(`stats:team:${league}:${id}`, 600, async () => await provider.teamStats!(id));
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('teamStats error', { league, id, err: err?.message || err });
      return NextResponse.json({ error: 'Failed to fetch team stats', details: String(err?.message || err) }, { status: 502 });
    }
  }

  if (type === 'player') {
    if (!provider.playerStats) return NextResponse.json({ error: 'playerStats not supported by provider' }, { status: 400 });
    try {
      const data = await cache(`stats:player:${league}:${id}`, 600, async () => await provider.playerStats!(id));
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('playerStats error', { league, id, err: err?.message || err });
      return NextResponse.json({ error: 'Failed to fetch player stats', details: String(err?.message || err) }, { status: 502 });
    }
  }

  return NextResponse.json({ error: 'type must be team or player' }, { status: 400 });
}
