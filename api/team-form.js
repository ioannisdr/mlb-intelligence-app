// api/team-form.js — Fetches last 6 game results for every team playing today
// Uses MLB Stats API (free, no key required)
// Cache: 30 min (stale-while-revalidate 1h) — forms change only when games end

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { teams } = req.query; // comma-separated list of teamIds e.g. "147,111,119"
  if (!teams) return res.status(400).json({ error: 'teams param required' });

  const ids = teams.split(',').map(s => parseInt(s)).filter(Boolean);
  const season = new Date().getFullYear();
  const today  = new Date();
  const end    = today.toISOString().slice(0, 10);
  // Look back 40 days to guarantee 6+ games
  const start  = new Date(today.getTime() - 40 * 86400000).toISOString().slice(0, 10);

  const results = {};

  await Promise.all(ids.map(async teamId => {
    try {
      const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&season=${season}&gameType=R&hydrate=linescore&startDate=${start}&endDate=${end}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(7000),
      });
      if (!resp.ok) return;
      const data = await resp.json();

      const games = [];
      if (data.dates) {
        for (const d of data.dates) {
          for (const g of (d.games || [])) {
            // Must be final and NOT postponed/cancelled
            if (g.status?.abstractGameState !== 'Final') continue;
            if (g.status?.detailedState === 'Postponed' || g.status?.detailedState === 'Cancelled') continue;
            
            const isHome = g.teams.home.team.id === teamId;
            const myScore  = isHome ? (g.teams.home.score ?? 0) : (g.teams.away.score ?? 0);
            const oppScore = isHome ? (g.teams.away.score ?? 0) : (g.teams.home.score ?? 0);
            const opp = isHome ? g.teams.away.team.name : g.teams.home.team.name;
            games.push({
              date:     d.date,
              opp:      opp,
              isHome,
              myScore,
              oppScore,
              won:      myScore > oppScore,
            });
          }
        }
      }

      // Keep only the last 6 completed
      results[teamId] = games.slice(-6);
    } catch (e) {
      results[teamId] = [];
    }
  }));

  return res.status(200).json(results);
}
