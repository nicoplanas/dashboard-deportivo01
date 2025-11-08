import { Provider } from './types';

const BASE = 'https://www.thesportsdb.com/api/v1/json/1';

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

export const THESPORTSDB: Provider = {
  async searchTeams(q) {
    if (!q) return [];
    const j: any = await fetchJson(`${BASE}/searchteams.php?t=${encodeURIComponent(q)}`);
    const teams = j && j.teams ? j.teams : [];
    return teams.map((t: any) => ({ id: String(t.idTeam), name: t.strTeam, short: t.strShort || undefined }));
  },

  async searchPlayers(q) {
    if (!q) return [];
    const j: any = await fetchJson(`${BASE}/searchplayers.php?p=${encodeURIComponent(q)}`);
    const players = j && j.player ? j.player : [];
    return players.map((p: any) => ({ id: String(p.idPlayer), name: p.strPlayer, team: p.strTeam }));
  },

  async teamStats(teamExtId) {
    // Provide team details and roster when possible
    const detailsJson: any = await fetchJson(`${BASE}/lookupteam.php?id=${teamExtId}`);
    const team = detailsJson && detailsJson.teams ? detailsJson.teams[0] : null;

    const rosterJson: any = await fetchJson(`${BASE}/lookup_all_players.php?id=${teamExtId}`);
    const roster = rosterJson && rosterJson.player ? rosterJson.player : [];

    return { team, roster };
  },

  async playerStats(playerExtId) {
    const j: any = await fetchJson(`${BASE}/lookupplayer.php?id=${playerExtId}`);
    return j && j.players ? j.players[0] : null;
  }
,

  async gamesByDate(dateISO, sport) {
    // TheSportsDB supports events by day: /eventsday.php?d=YYYY-MM-DD
    // It returns events across sports; we filter by sport when provided.
    const j: any = await fetchJson(`${BASE}/eventsday.php?d=${dateISO}`);
    const events = j && j.events ? j.events : [];
    const filtered = sport ? events.filter((e: any) => (e.strSport || '').toLowerCase() === sport.toLowerCase()) : events;
    // Map to Game shape
    const map = (ev: any) => ({
      extId: ev.idEvent ? String(ev.idEvent) : `${dateISO}-${ev.strEvent}`,
      league: ev.strLeague || ev.strSport || 'Unknown',
      dateUTC: ev.dateEvent ? new Date(`${ev.dateEvent}T${ev.strTime || '00:00:00'}`).toISOString() : new Date(dateISO).toISOString(),
      status: (ev.intHomeScore || ev.intAwayScore) ? 'finished' : 'scheduled',
      home: { id: ev.idHomeTeam ? String(ev.idHomeTeam) : ev.strHomeTeam, name: ev.strHomeTeam, short: undefined, score: ev.intHomeScore ? Number(ev.intHomeScore) : undefined },
      away: { id: ev.idAwayTeam ? String(ev.idAwayTeam) : ev.strAwayTeam, name: ev.strAwayTeam, short: undefined, score: ev.intAwayScore ? Number(ev.intAwayScore) : undefined }
    });
    return filtered.map(map);
  }
};

export default THESPORTSDB;
