'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [games, setGames] = useState<any[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  // sport selection: map UI sport -> provider key and sport string for provider
  const [sport, setSport] = useState<'basketball' | 'soccer' | 'tennis' | 'american_football'>('basketball');
  const sportToProvider: Record<string, { provider: string; sportParam?: string }> = {
    basketball: { provider: 'nba', sportParam: 'Basketball' },
    soccer: { provider: 'thesportsdb', sportParam: 'Soccer' },
    tennis: { provider: 'thesportsdb', sportParam: 'Tennis' },
    american_football: { provider: 'thesportsdb', sportParam: 'American Football' }
  };
  const providerKey = sportToProvider[sport].provider;

  // UI mode: 'games' shows games by date; 'search' shows search UI
  const [mode, setMode] = useState<'games' | 'search'>('games');

  // search state
  const [searchQ, setSearchQ] = useState('');
  const [searchType, setSearchType] = useState<'team' | 'player'>('team');
  const [results, setResults] = useState<any[] | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  // pagination for search results
  const [searchPage, setSearchPage] = useState(1);
  const SEARCH_PER_PAGE = 25;
  // pagination for games list
  const [gamesPage, setGamesPage] = useState(1);
  const GAMES_PER_PAGE = 25;

  useEffect(() => {
    if (mode !== 'games') return;
    const sportParam = encodeURIComponent(sportToProvider[sport].sportParam || '');
    fetch(`/api/games?league=${providerKey}&date=${date}&sport=${sportParam}`)
      .then((r) => r.json())
      .then((j) => {
        // Providers should return an array of games, but on error the API
        // may return an object like { error: '...' }. Normalize here to
        // always set an array to avoid runtime errors when rendering.
        if (Array.isArray(j)) {
          setGames(j);
          setGamesPage(1);
        } else if (j && Array.isArray((j as any).games)) {
          setGames((j as any).games);
          setGamesPage(1);
        } else {
          console.error('Unexpected /api/games response', j);
          setGames([]);
        }
      })
      .catch((e) => {
        console.error('Failed fetching /api/games', e);
        setGames([]);
      });
  }, [date, providerKey, mode]);

  async function doSearch() {
    setLoading(true);
    setResults(null);
    setStats(null);
    setSearchPage(1);
    try {
      const res = await fetch(
        `/api/search?league=${encodeURIComponent(providerKey)}&type=${encodeURIComponent(searchType)}&q=${encodeURIComponent(
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
        `/api/stats?league=${encodeURIComponent(providerKey)}&type=${encodeURIComponent(searchType)}&id=${encodeURIComponent(
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
            <select value={sport} onChange={(e) => setSport(e.target.value as any)} className="select">
              <option value="basketball">Basketball</option>
              <option value="soccer">Fútbol</option>
              <option value="tennis">Tenis</option>
              <option value="american_football">Fútbol Americano</option>
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
                  {(() => {
                    const totalGames = games.length || 0;
                    const totalGamesPages = Math.max(1, Math.ceil(totalGames / GAMES_PER_PAGE));
                    const currentGamesPage = Math.min(Math.max(1, gamesPage), totalGamesPages);
                    const start = (currentGamesPage - 1) * GAMES_PER_PAGE;
                    const end = Math.min(start + GAMES_PER_PAGE, totalGames);
                    const pageGames = (games || []).slice(start, end);
                    return pageGames.map((g: any) => (
                      <tr key={g.extId} style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
                        <td style={{padding:12}}>{g.league}</td>
                        <td style={{padding:12}}>{g.home?.name}</td>
                        <td style={{padding:12}}>{g.away?.name}</td>
                        <td style={{padding:12}}>{g.home?.score ?? '-'} : {g.away?.score ?? '-'}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                <div style={{color:'var(--muted)'}}>
                  {(() => {
                    const total = games.length || 0;
                    if (total === 0) return 'Mostrando 0 de 0';
                    const totalPages = Math.max(1, Math.ceil(total / GAMES_PER_PAGE));
                    const current = Math.min(Math.max(1, gamesPage), totalPages);
                    const start = (current - 1) * GAMES_PER_PAGE + 1;
                    const end = Math.min(current * GAMES_PER_PAGE, total);
                    return `Mostrando ${start} - ${end} de ${total}`;
                  })()}
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button className="btn" onClick={() => setGamesPage((p) => Math.max(1, p - 1))} disabled={gamesPage <= 1}>Anterior</button>
                  <div style={{padding:'6px 10px',color:'var(--muted)'}}>Página {Math.max(1, gamesPage)} / {Math.max(1, Math.ceil((games.length || 0) / GAMES_PER_PAGE))}</div>
                  <button className="btn" onClick={() => setGamesPage((p) => Math.min(Math.max(1, Math.ceil((games.length || 0) / GAMES_PER_PAGE)), p + 1))} disabled={gamesPage >= Math.max(1, Math.ceil((games.length || 0) / GAMES_PER_PAGE))}>Siguiente</button>
                </div>
              </div>
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
                  {(() => {
                    const total = (results || []).length;
                    const totalPages = Math.max(1, Math.ceil(total / SEARCH_PER_PAGE));
                    const current = Math.min(Math.max(1, searchPage), totalPages);
                    const start = (current - 1) * SEARCH_PER_PAGE;
                    const end = Math.min(start + SEARCH_PER_PAGE, total);
                    const pageItems = (results || []).slice(start, end);
                    return (
                      <>
                        {pageItems.map((r: any, idx: number) => (
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

                        {/* pagination controls */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                          <div style={{color:'var(--muted)'}}>
                            Mostrando {total === 0 ? 0 : start + 1} - {end} de {total}
                          </div>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            <button className="btn" onClick={() => setSearchPage((p) => Math.max(1, p - 1))} disabled={current <= 1}>Anterior</button>
                            <div style={{color:'var(--muted)'}}>Página {current} / {totalPages}</div>
                            <button className="btn" onClick={() => setSearchPage((p) => Math.min(totalPages, p + 1))} disabled={current >= totalPages}>Siguiente</button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
