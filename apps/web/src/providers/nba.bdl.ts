import { Provider, Game } from './types';

const BASE = 'https://api.balldontlie.io/v1';

export const NBA_BDL: Provider = {
  async searchTeams(q) {
    const r = await fetch(`${BASE}/teams?search=${encodeURIComponent(q)}`);
    const j: any = await r.json();
    return j.data.map((t: any) => ({
      id: String(t.id),
      name: t.full_name,
      short: t.abbreviation
    }));
  },

  async gamesByDate(dateISO) {
    const r = await fetch(`${BASE}/games?start_date=${dateISO}&end_date=${dateISO}&per_page=100`);
    const j: any = await r.json();
    const map = (g: any): Game => ({
      extId: String(g.id),
      league: 'NBA',
      dateUTC: g.date,
      status: (g.status || 'finished').toLowerCase(),
      home: {
        id: String(g.home_team.id),
        name: g.home_team.full_name,
        short: g.home_team.abbreviation,
        score: g.home_team_score
      },
      away: {
        id: String(g.visitor_team.id),
        name: g.visitor_team.full_name,
        short: g.visitor_team.abbreviation,
        score: g.visitor_team_score
      }
    });
    return j.data.map(map);
  },

  async teamLastNGames(teamId, n) {
    const r = await fetch(`${BASE}/games?team_ids[]=${teamId}&per_page=${n}`);
    const j: any = await r.json();
    return j.data.map((g: any): Game => ({
      extId: String(g.id),
      league: 'NBA',
      dateUTC: g.date,
      status: (g.status || 'finished').toLowerCase(),
      home: {
        id: String(g.home_team.id),
        name: g.home_team.full_name,
        short: g.home_team.abbreviation,
        score: g.home_team_score
      },
      away: {
        id: String(g.visitor_team.id),
        name: g.visitor_team.full_name,
        short: g.visitor_team.abbreviation,
        score: g.visitor_team_score
      }
    }));
  }
};
