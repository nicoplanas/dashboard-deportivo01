import { Game } from '@/providers/types';

// Scraper for NBA schedule on ESPN as a fallback. Best-effort parsing; may need
// adjustments if ESPN changes markup.
export async function espnNbAGamesByDate(dateISO: string): Promise<Game[]> {
  // ESPN uses YYYYMMDD in the URL
  const d = dateISO.replace(/-/g, '');
  const url = `https://www.espn.com/nba/schedule/_/date/${d}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`ESPN fetch failed: HTTP ${res.status} -> ${text.slice(0, 300)}`);
  }

  // Dynamic import of cheerio to avoid hard crash when the package isn't
  // installed (or when bundler resolves differently in production).
  let cheerioMod: any;
  try {
    // try to import ESM default
    const imported = await import('cheerio');
    cheerioMod = imported.default ?? imported;
  } catch (e) {
    throw new Error(`Cheerio not available: ${String(e || '')}`);
  }

  if (!cheerioMod || typeof cheerioMod.load !== 'function') {
    throw new Error('Cheerio import did not expose .load — ensure cheerio is installed');
  }

  const $ = cheerioMod.load(text);
  const games: Game[] = [];

  // Try to find schedule tables. ESPN markup may contain multiple tables per day.
  $('table').each((i: any, table: any) => {
    const rows = $(table).find('tbody > tr');
    rows.each((j: any, row: any) => {
      const tds = $(row).find('td');
      // Expect at least two team columns; skip header/other rows
      if (tds.length < 3) return;

      // Heuristic: first team name link in first td, second team name link in third td
      const homeCell = $(tds[2]);
      const awayCell = $(tds[0]);

      const homeName = homeCell.find('a').first().text().trim() || homeCell.text().trim();
      const awayName = awayCell.find('a').first().text().trim() || awayCell.text().trim();

      // Try to extract scores if present
      const scoreText = $(tds[1]).text().trim();
      let homeScore: number | undefined = undefined;
      let awayScore: number | undefined = undefined;
      // scoreText sometimes like "L 110-120" or "110 - 120"
      const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (scoreMatch) {
        awayScore = parseInt(scoreMatch[1], 10);
        homeScore = parseInt(scoreMatch[2], 10);
      }

      if (homeName || awayName) {
        games.push({
          extId: `${d}-${i}-${j}`,
          league: 'NBA',
          dateUTC: new Date(dateISO).toISOString(),
          status: scoreMatch ? 'finished' : 'scheduled',
          home: { id: homeName, name: homeName, short: undefined, score: homeScore },
          away: { id: awayName, name: awayName, short: undefined, score: awayScore }
        });
      }
    });
  });

  // If no games parsed from tables, try alternative selectors (div-based cards)
  if (games.length === 0) {
    // ESPN sometimes has .Card with .teamName
    $('.Card').each((ci: any, card: any) => {
      $(card).find('.team').each((ti: any, teamEl: any) => {
        // not a reliable structure; skip
      });
    });
  }

  return games;
}
