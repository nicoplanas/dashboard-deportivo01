'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [games, setGames] = useState<any[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch(`/api/games?league=nba&date=${date}`)
      .then((r) => r.json())
      .then(setGames)
      .catch(console.error);
  }, [date]);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard Deportivo 🏀⚽⚾🏈🎾</h1>
      <p className="mb-4 text-gray-600">Juegos del {date}</p>

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
    </main>
  );
}
