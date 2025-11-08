import { Provider, Game } from './types';

const BASE = 'https://api.balldontlie.io/v1';

async function fetchJson(url: string) {
  const r = await fetch(url);
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`HTTP ${r.status} when fetching ${url}: ${text}`);
  }
  if (!ct.includes('application/json')) {
    throw new Error(`Expected JSON response from ${url}, got: ${ct} -> ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new Error(`Invalid JSON from ${url}: ${e.message} -> ${text.slice(0, 300)}`);
  }
}

export const NBA_BDL: Provider = {
  async searchTeams(q) {
    const j: any = await fetchJson(`${BASE}/teams?search=${encodeURIComponent(q)}`);
    return j.data.map((t: any) => ({ id: String(t.id), name: t.full_name, short: t.abbreviation }));
  },

  async searchPlayers(q) {
    const j: any = await fetchJson(`${BASE}/players?search=${encodeURIComponent(q)}&per_page=100`);
    return j.data.map((p: any) => ({ id: String(p.id), name: `${p.first_name} ${p.last_name}`, team: p.team ? p.team.full_name : undefined }));
  },

  async gamesByDate(dateISO) {
    try {
      const j: any = await fetchJson(`${BASE}/games?start_date=${dateISO}&end_date=${dateISO}&per_page=100`);
      const map = (g: any): Game => ({
        extId: String(g.id),
        league: 'NBA',
        dateUTC: g.date,
        status: (g.status || 'finished').toLowerCase(),
        home: { id: String(g.home_team.id), name: g.home_team.full_name, short: g.home_team.abbreviation, score: g.home_team_score },
        away: { id: String(g.visitor_team.id), name: g.visitor_team.full_name, short: g.visitor_team.abbreviation, score: g.visitor_team_score }
      });
      return j.data.map(map);
    } catch (err: any) {
      // If balldontlie returns unauthorized or HTML, try ESPN scraper as fallback
      const msg = String(err?.message || err || '');
      console.error('NBA provider gamesByDate failed, attempting ESPN fallback', { dateISO, msg });
      try {
        const { espnNbAGamesByDate } = await import('@/lib/scrapers/espn');
        const games = await espnNbAGamesByDate(dateISO);
        if (games && games.length) return games;
      } catch (e) {
        console.error('ESPN fallback failed', e);
      }
      throw err;
    }
  },

  async teamLastNGames(teamId, n) {
    const j: any = await fetchJson(`${BASE}/games?team_ids[]=${teamId}&per_page=${n}`);
    return j.data.map((g: any): Game => ({
      extId: String(g.id),
      league: 'NBA',
      dateUTC: g.date,
      status: (g.status || 'finished').toLowerCase(),
      home: { id: String(g.home_team.id), name: g.home_team.full_name, short: g.home_team.abbreviation, score: g.home_team_score },
      away: { id: String(g.visitor_team.id), name: g.visitor_team.full_name, short: g.visitor_team.abbreviation, score: g.visitor_team_score }
    }));
  },

  async playerStats(playerId) {
    const season = new Date().getFullYear() - 1;
    const j: any = await fetchJson(`${BASE}/season_averages?player_ids[]=${playerId}&season=${season}`);
    return j.data && j.data.length ? j.data[0] : null;
  }
};
