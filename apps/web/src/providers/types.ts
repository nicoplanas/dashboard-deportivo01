export type Game = {
  extId: string;
  league: string;
  dateUTC: string;
  status: 'scheduled' | 'live' | 'finished';
  home: { id: string; name: string; short?: string; score?: number };
  away: { id: string; name: string; short?: string; score?: number };
};

export interface Provider {
  // search by team name
  searchTeams?(q: string): Promise<{ id: string; name: string; short?: string }[]>;
  // search by player name
  searchPlayers?(q: string): Promise<{ id: string; name: string; team?: string }[]>;
  // get games for a date
  gamesByDate?(dateISO: string, sport?: string): Promise<Game[]>;
  // last N games for a team
  teamLastNGames?(teamExtId: string, n: number): Promise<Game[]>;
  // basic team statistics or roster
  teamStats?(teamExtId: string): Promise<any>;
  // basic player statistics
  playerStats?(playerExtId: string): Promise<any>;
}
