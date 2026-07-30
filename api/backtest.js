import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { from, to, signal } = req.query;

    let sql = `
      SELECT b.game_id, b.market, b.pick, b.signal, b.ev, b.hit, b.profit, b.game_date,
             g.away, g.home, g.away_score, g.home_score
      FROM backtest_results b
      JOIN games g ON b.game_id = g.id
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      params.push(from);
      sql += ` AND b.game_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      sql += ` AND b.game_date <= $${params.length}`;
    }
    if (signal && signal !== 'ALL') {
      params.push(signal);
      sql += ` AND b.signal = $${params.length}`;
    }

    sql += ` ORDER BY b.game_date DESC, b.id DESC`;

    const { rows } = await query(sql, params);

    // Compute aggregated KPIs
    let totalWins = 0;
    let totalBets = rows.length;
    let totalProfit = 0;

    rows.forEach(r => {
      if (r.hit) totalWins++;
      totalProfit += parseFloat(r.profit || 0);
    });

    const winRate = totalBets > 0 ? (totalWins / totalBets * 100).toFixed(1) : 0;
    const roi = totalBets > 0 ? (totalProfit / totalBets * 100).toFixed(2) : 0;

    return res.status(200).json({
      success: true,
      summary: { totalBets, totalWins, winRate: `${winRate}%`, totalProfit: totalProfit.toFixed(2), roi: `${roi}%` },
      results: rows
    });
  } catch (err) {
    return res.status(200).json({ success: false, fallback: true, error: err.message, results: [] });
  }
}
