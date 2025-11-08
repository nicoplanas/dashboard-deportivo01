'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [games, setGames] = useState<any[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [league, setLeague] = useState<'nba' | 'thesportsdb'>('nba');

  // UI mode: 'games' shows games by date; 'search' shows search UI
  const [mode, setMode] = useState<'games' | 'search'>('games');

  // search state
  const [searchQ, setSearchQ] = useState('');
  const [searchType, setSearchType] = useState<'team' | 'player'>('team');
  const [results, setResults] = useState<any[] | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'games') return;
    fetch(`/api/games?league=${league}&date=${date}`)
      .then((r) => r.json())
      .then(setGames)
      .catch(console.error);
  }, [date, league, mode]);

  async function doSearch() {
    setLoading(true);
    setResults(null);
    setStats(null);
    try {
      const res = await fetch(
        `/api/search?league=${encodeURIComponent(league)}&type=${encodeURIComponent(searchType)}&q=${encodeURIComponent(
          searchQ
        )}`
      );
      const j = await res.json();
      setResults(Array.isArray(j) ? j : []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(item: any) {
    // item expected to have id
    const id = item.id || item.extId || item.idTeam || item.idPlayer;
    if (!id) return;
    setLoading(true);
    setStats(null);
    try {
      const res = await fetch(
        `/api/stats?league=${encodeURIComponent(league)}&type=${encodeURIComponent(searchType)}&id=${encodeURIComponent(
          id
        )}`
      );
      const j = await res.json();
      setStats(j);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard Deportivo 🏀⚽⚾🏈🎾</h1>

      <div className="mb-4 flex gap-4 items-center">
        <label>
          Liga:{' '}
          <select value={league} onChange={(e) => setLeague(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="nba">NBA (Basket)</option>
            <option value="thesportsdb">TheSportsDB (Multi)</option>
          </select>
        </label>

        <label>
          Modo:{' '}
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="games">Juegos por fecha</option>
            <option value="search">Buscar equipo/jugador</option>
          </select>
        </label>
      </div>

      {mode === 'games' && (
        <>
          <p className="mb-2 text-gray-600">Juegos del {date}</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-2 py-1 mb-4"
          />

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Liga</th>
                <th className="text-left p-2">Home</th>
                <th className="text-left p-2">Away</th>
                <th className="text-left p-2">Marcador</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.extId} className="border-b hover:bg-gray-50">
                  <td className="p-2">{g.league}</td>
                  <td className="p-2">{g.home.name}</td>
                  <td className="p-2">{g.away.name}</td>
                  <td className="p-2">
                    {g.home.score ?? '-'} : {g.away.score ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {mode === 'search' && (
        <section>
          <div className="mb-4 flex gap-2">
            <select value={searchType} onChange={(e) => setSearchType(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="team">Equipo</option>
              <option value="player">Jugador</option>
            </select>

            <input
              type="text"
              placeholder={searchType === 'team' ? 'Buscar equipo...' : 'Buscar jugador...'}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="border rounded px-2 py-1 flex-1"
            />

            <button onClick={doSearch} className="bg-blue-600 text-white px-3 py-1 rounded">
              Buscar
            </button>
          </div>

          {loading && <p>Cargando...</p>}

          {results && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Resultados</h3>
              <ul>
                {results.map((r: any, idx: number) => (
                  <li key={r.id ?? r.extId ?? idx} className="p-2 border-b flex justify-between items-center">
                    <div>
                      <div className="font-medium">{r.name || r.strTeam || r.strPlayer}</div>
                      <div className="text-sm text-gray-600">{r.team || r.short || r.abbreviation || ''}</div>
                    </div>
                    <div>
                      <button onClick={() => loadStats(r)} className="text-sm text-blue-600">
                        Ver stats
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats && (
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Estadísticas / Detalles</h3>
              <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(stats, null, 2)}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
