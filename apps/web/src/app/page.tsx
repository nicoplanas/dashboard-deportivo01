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
    <main>
      <section className="hero">
        <div className="hero-left">
          <h1 className="title">Dashboard Deportivo</h1>
          <p className="subtitle">Resultados, búsquedas y estadísticas por liga, equipo o jugador.</p>

          <div className="controls">
            <select value={league} onChange={(e) => setLeague(e.target.value as any)} className="select">
              <option value="nba">NBA (Basket)</option>
              <option value="thesportsdb">TheSportsDB (Multi)</option>
            </select>

            <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="select">
              <option value="games">Juegos por fecha</option>
              <option value="search">Buscar equipo/jugador</option>
            </select>

            {mode === 'games' && (
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            )}
          </div>

          <div className="date">Juegos del {date}</div>
        </div>

        <div className="hero-right">
          {/* decorative block similar to reference aesthetic */}
          <div style={{width:300,height:300,borderRadius:20,background:'radial-gradient(circle at 30% 30%, rgba(123,47,247,0.6), rgba(255,77,158,0.2))'}} />
        </div>
      </section>

      <section className="section">
        {mode === 'games' && (
          <>
            <h2>Juegos</h2>
            <div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{textAlign:'left',padding:12}}>Liga</th>
                    <th style={{textAlign:'left',padding:12}}>Home</th>
                    <th style={{textAlign:'left',padding:12}}>Away</th>
                    <th style={{textAlign:'left',padding:12}}>Marcador</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => (
                    <tr key={g.extId} style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
                      <td style={{padding:12}}>{g.league}</td>
                      <td style={{padding:12}}>{g.home.name}</td>
                      <td style={{padding:12}}>{g.away.name}</td>
                      <td style={{padding:12}}>{g.home.score ?? '-'} : {g.away.score ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {mode === 'search' && (
          <>
            <h2>Buscar</h2>
            <div style={{display:'flex',gap:12,marginBottom:18}}>
              <select value={searchType} onChange={(e) => setSearchType(e.target.value as any)} className="select">
                <option value="team">Equipo</option>
                <option value="player">Jugador</option>
              </select>
              <input type="text" placeholder={searchType === 'team' ? 'Buscar equipo...' : 'Buscar jugador...'} value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="input" />
              <button onClick={doSearch} className="btn">Buscar</button>
            </div>

            {loading && <p style={{color:'var(--muted)'}}>Cargando...</p>}

            {results && (
              <div>
                <h3>Resultados</h3>
                <ul>
                  {(results || []).map((r: any, idx: number) => (
                    <li key={r.id ?? r.extId ?? idx} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <div>
                        <div style={{fontWeight:700}}>{r.name || r.strTeam || r.strPlayer}</div>
                        <div style={{color:'var(--muted)'}}>{r.team || r.short || r.abbreviation || ''}</div>
                      </div>
                      <div>
                        <button onClick={() => loadStats(r)} className="select" style={{background:'transparent'}}>Ver stats</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stats && (
              <div style={{marginTop:12}}>
                <h3>Estadísticas / Detalles</h3>
                <pre className="stats-pre">{JSON.stringify(stats, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </section>

      <section className="section">
        <h2>Services</h2>
        <div className="services-grid">
          <div className="service-card"><div className="big">A</div><p>Promoting your personal brand</p></div>
          <div className="service-card"><div className="big">B</div><p>Promotion on social media</p></div>
          <div className="service-card"><div className="big">G</div><p>Business promotion on Google</p></div>
        </div>
      </section>

      <section className="section">
        <h2>Cases</h2>
        <div className="cases-card">Ejemplo de caso — contenido de muestra</div>
      </section>

      <section style={{marginTop:36}} className="cta">
        <div>
          <h3>Let's begin cooperation</h3>
          <div style={{color:'var(--muted)'}}>Contact me to start tracking your favorite teams and players.</div>
        </div>
        <div>
          <button className="btn">Contact us</button>
        </div>
      </section>
    </main>
  );
}
