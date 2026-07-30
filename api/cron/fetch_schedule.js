import { query } from '../db.js';

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher,linescore`;
    const response = await fetch(url);
    const data = await response.json();

    const games = data?.dates?.[0]?.games || [];
    let count = 0;

    for (const g of games) {
      const gameId = `${today}-${g.teams.away.team.id}-${g.teams.home.team.id}`;
      const awayName = g.teams.away.team.name;
      const homeName = g.teams.home.team.name;
      const gameTime = g.gameDate;
      const status = g.status.abstractGameState || g.status.detailedState;
      const awayScore = g.teams.away.score || 0;
      const homeScore = g.teams.home.score || 0;

      await query(`
        INSERT INTO games (id, game_date, away, home, game_time, status, away_score, home_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          away_score = EXCLUDED.away_score,
          home_score = EXCLUDED.home_score
      `, [gameId, today, awayName, homeName, gameTime, status, awayScore, homeScore]);
      count++;
    }

    return res.status(200).json({ success: true, games_synced: count });
  } catch (err) {
    console.error('Fetch schedule cron error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
