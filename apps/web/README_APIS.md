APIs and providers for search & stats

Implemented providers:
- `nba` (balldontlie - https://www.balldontlie.io/) — no API key required. Supports team search, player search, games by date, last N games and basic player season averages.
- `thesportsdb` (TheSportsDB - https://www.thesportsdb.com/) — public key `1` used. Supports team search, player search, team details + roster and basic player details.

New API routes (server-side Next.js app routes):
- `GET /api/search?league={league}&type={team|player}&q={query}`
  - Examples:
    - `/api/search?league=nba&type=team&q=Lakers`
    - `/api/search?league=thesportsdb&type=player&q=Messi`

- `GET /api/stats?league={league}&type={team|player}&id={externalId}`
  - Examples:
    - `/api/stats?league=nba&type=player&id=237`  (player id from balldontlie)
    - `/api/stats?league=thesportsdb&type=team&id=133604`

Notes & assumptions
- No external API keys are required for these two providers (balldontlie is free; TheSportsDB public key `1` is used). Rate limits apply.
- Some providers expose different shapes for data. The routes return provider-specific payloads (they are not normalized to a single unified schema beyond earlier `Game` shape).
- ESPN scraping was discussed but not implemented here (it's fragile and requires HTML parsing + dependency). I can add a scraping fallback if you want — that'll require adding `cheerio` and drafting selectors per sport.

Caching
- Responses are cached using the existing `cache` helper (Redis if `REDIS_URL` is set; otherwise in-memory/no cache behavior preserved). TTLs used: search=3600s, stats=600s, games=300s.

Next steps you might want
- Add normalization layer to return unified shapes across providers.
- Add ESPN scraper for richer per-player/game stats (requires dependency `cheerio`).
- Add tests for endpoints and mock provider responses.
