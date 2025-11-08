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
};

export default THESPORTSDB;
