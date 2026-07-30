import { query } from '../db.js';

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch live games for today from DB
    const { rows: games } = await query(
      `SELECT id, home, away FROM games WHERE game_date = $1 AND status != 'Final'`,
      [today]
    );

    if (games.length === 0) {
      return res.status(200).json({ success: true, message: 'No active games to fetch odds for.' });
    }

    // Fetch odds from Odds API proxy or source
    const oddsRes = await fetch('https://mlb-intelligence-app.vercel.app/api/odds');
    const oddsData = await oddsRes.json().catch(() => ({}));

    let snapshotsCount = 0;

    for (const g of games) {
      const gameOdds = oddsData[g.home]?.draftkings || oddsData[g.home]?.consensus;
      if (!gameOdds) continue;

      const mlHome = gameOdds.ml?.h || -110;
      const mlAway = gameOdds.ml?.a || -110;
      const ouLine = gameOdds.ou || 8.5;

      await query(`
        INSERT INTO odds_snapshots (game_id, snapshot_type, book, ml_home, ml_away, ou_line)
        VALUES ($1, 'rolling', 'draftkings', $2, $3, $4)
      `, [g.id, mlHome, mlAway, ouLine]);

      snapshotsCount++;
    }

    return res.status(200).json({ success: true, snapshots_created: snapshotsCount });
  } catch (err) {
    console.error('Fetch odds cron error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
