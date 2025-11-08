import { Provider } from './types';

const BASE = 'https://www.thesportsdb.com/api/v1/json/1';

export const THESPORTSDB: Provider = {
  async searchTeams(q) {
    if (!q) return [];
    const r = await fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(q)}`);
    const j: any = await r.json();
    const teams = j && j.teams ? j.teams : [];
    return teams.map((t: any) => ({ id: String(t.idTeam), name: t.strTeam, short: t.strShort || undefined }));
  },

  async searchPlayers(q) {
    if (!q) return [];
    const r = await fetch(`${BASE}/searchplayers.php?p=${encodeURIComponent(q)}`);
    const j: any = await r.json();
    const players = j && j.player ? j.player : [];
    return players.map((p: any) => ({ id: String(p.idPlayer), name: p.strPlayer, team: p.strTeam }));
  },

  async teamStats(teamExtId) {
    // Provide team details and roster when possible
    const detailsRes = await fetch(`${BASE}/lookupteam.php?id=${teamExtId}`);
    const detailsJson: any = await detailsRes.json();
    const team = detailsJson && detailsJson.teams ? detailsJson.teams[0] : null;

    const rosterRes = await fetch(`${BASE}/lookup_all_players.php?id=${teamExtId}`);
    const rosterJson: any = await rosterRes.json();
    const roster = rosterJson && rosterJson.player ? rosterJson.player : [];

    return { team, roster };
  },

  async playerStats(playerExtId) {
    // TheSportsDB provides player details but not advanced per-season stats in public API
    const r = await fetch(`${BASE}/lookupplayer.php?id=${playerExtId}`);
    const j: any = await r.json();
    return j && j.players ? j.players[0] : null;
  }
};

export default THESPORTSDB;
