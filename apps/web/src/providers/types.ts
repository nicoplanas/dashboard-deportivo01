export type Game = {
  extId: string;
  league: string;
  dateUTC: string;
  status: 'scheduled' | 'live' | 'finished';
  home: { id: string; name: string; short?: string; score?: number };
  away: { id: string; name: string; short?: string; score?: number };
};

export interface Provider {
  searchTeams(q: string): Promise<{ id: string; name: string; short?: string }[]>;
  gamesByDate(dateISO: string): Promise<Game[]>;
  teamLastNGames(teamExtId: string, n: number): Promise<Game[]>;
}
