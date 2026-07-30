import { query } from '../db.js';

export default async function handler(req, res) {
  try {
    // Find games marked Final that don't have backtest_results logged yet
    const { rows: finalGames } = await query(`
      SELECT g.id, g.game_date, g.away, g.home, g.away_score, g.home_score,
             p.best_pick, p.best_ev, p.best_signal, p.best_is_ou, p.ml_pick, p.ml_odds, p.ou_line
      FROM games g
      INNER JOIN predictions p ON g.id = p.game_id AND p.is_closing = TRUE
      LEFT JOIN backtest_results b ON g.id = b.game_id
      WHERE g.status = 'Final' AND b.id IS NULL
    `);

    let recordedCount = 0;

    for (const g of finalGames) {
      const winner = g.home_score > g.away_score ? g.home : g.away;
      const totalScore = g.away_score + g.home_score;
      const isOU = g.best_is_ou;
      let hit = false;
      let profit = 0;

      if (!isOU) {
        // Moneyline bet
        hit = g.best_pick.startsWith(winner);
        const amOdds = g.ml_odds || -110;
        const decOdds = amOdds > 0 ? (amOdds / 100) + 1 : (100 / Math.abs(amOdds)) + 1;
        profit = hit ? (decOdds - 1) : -1;
      } else {
        // O/U bet
        const line = parseFloat(g.ou_line || 8.5);
        const isOver = g.best_pick.startsWith('OVER');
        if (totalScore === line) {
          hit = false; profit = 0; // push
        } else {
          hit = isOver ? (totalScore > line) : (totalScore < line);
          profit = hit ? 0.909 : -1;
        }
      }

      await query(`
        INSERT INTO backtest_results (game_id, market, pick, signal, ev, hit, profit, game_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        g.id,
        isOU ? 'OU' : 'ML',
        g.best_pick,
        g.best_signal,
        g.best_ev,
        hit,
        profit,
        g.game_date
      ]);

      recordedCount++;
    }

    return res.status(200).json({ success: true, results_recorded: recordedCount });
  } catch (err) {
    console.error('Record results cron error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
