import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const job = req.query.job;
    const today = new Date().toISOString().split('T')[0];
    
    if (job === 'init') {
      return res.status(200).json({ success: true, message: 'Neon DB Schema initialized.' });
    }

    let count = 0;
    let settled = 0;
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher,linescore`;
    const resp = await fetch(url);
    const data = await resp.json();
    
    if (!data.dates || data.dates.length === 0) {
      return res.status(200).json({ success: true, message: 'No games today', games_synced: 0, games_settled: 0 });
    }

    for (const g of data.dates[0].games) {
      const awayName = g.teams.away.team.name;
      const homeName = g.teams.home.team.name;
      const gameTime = g.gameDate;
      const status = g.status.abstractGameState;
      const awayScore = g.teams.away.score || 0;
      const homeScore = g.teams.home.score || 0;

      const gameId = `${today}-${g.teams.away.team.id}-${g.teams.home.team.id}`;
      
      await query(`
        INSERT INTO games (id, game_date, away_team, home_team, game_time, status, away_score, home_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET 
          status = EXCLUDED.status, away_score = EXCLUDED.away_score, home_score = EXCLUDED.home_score;
      `, [gameId, today, awayName, homeName, gameTime, status, awayScore, homeScore]);
      count++;

      // POST-GAME SETTLEMENT: If Final, settle predictions
      if (status === 'Final') {
         const { rows: existingSettlement } = await query(`SELECT id FROM backtest_results WHERE game_id = $1`, [gameId]);
         if (existingSettlement.length === 0) {
            // Find closing prediction
            const { rows: preds } = await query(`SELECT * FROM predictions WHERE game_id = $1 AND is_closing = TRUE`, [gameId]);
            if (preds.length > 0) {
               const p = preds[0];
               const totalScore = awayScore + homeScore;
               
               // Grade ML
               if (p.ml_signal !== 'SKIP' && p.ml_pick !== 'SKIP') {
                 const wonH = p.ml_pick === homeName && homeScore > awayScore;
                 const wonA = p.ml_pick === awayName && awayScore > homeScore;
                 const mlHit = wonH || wonA ? 1 : 0;
                 const odds = p.ml_odds;
                 let mlProfit = 0;
                 if (mlHit) {
                    mlProfit = odds > 0 ? (odds / 100) : (100 / Math.abs(odds));
                 } else {
                    mlProfit = -1.0;
                 }
                 await query(`
                  INSERT INTO backtest_results (game_id, market, pick, signal, ev, hit, profit, game_date)
                  VALUES ($1, 'ML', $2, $3, $4, $5, $6, $7)
                 `, [gameId, p.ml_pick, p.ml_signal, p.ml_ev, mlHit, mlProfit, today]);
               }

               // Grade OU
               if (p.ou_signal !== 'SKIP' && p.ou_pick !== 'SKIP') {
                 const isOver = p.ou_pick === 'OVER';
                 const line = p.ou_line;
                 let ouHit = 0;
                 let ouProfit = 0;
                 if ((isOver && totalScore > line) || (!isOver && totalScore < line)) {
                    ouHit = 1;
                    ouProfit = 100 / 110; // Standard -110 juice
                 } else if (totalScore === line) {
                    ouHit = 0;
                    ouProfit = 0; // Push
                 } else {
                    ouHit = 0;
                    ouProfit = -1.0;
                 }
                 await query(`
                  INSERT INTO backtest_results (game_id, market, pick, signal, ev, hit, profit, game_date)
                  VALUES ($1, 'OU', $2, $3, $4, $5, $6, $7)
                 `, [gameId, p.ou_pick + ' ' + p.ou_line, p.ou_signal, p.ou_ev, ouHit, ouProfit, today]);
               }
               settled++;
            }
         }
      }
    }

    return res.status(200).json({ success: true, job: job || 'schedule', games_synced: count, games_settled: settled });
  } catch(err) {
    console.error('Cron error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
