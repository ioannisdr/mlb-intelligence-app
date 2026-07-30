import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { date } = req.query;
    const dateStr = date || new Date().toISOString().split('T')[0];

    // Get all predictions for the requested date joined with game info
    const sql = `
      SELECT 
        g.id AS game_id,
        g.away,
        g.home,
        g.game_time,
        g.status,
        g.away_score,
        g.home_score,
        p.best_pick,
        p.best_ev,
        p.best_signal,
        p.best_is_ou,
        p.ml_pick,
        p.ml_ev,
        p.ml_signal,
        p.ml_odds,
        p.ou_pick,
        p.ou_ev,
        p.ou_signal,
        p.ou_line,
        p.proj_total,
        p.is_closing
      FROM games g
      LEFT JOIN predictions p ON g.id = p.game_id AND p.is_closing = TRUE
      WHERE g.game_date = $1
      ORDER BY g.game_time ASC
    `;

    const { rows } = await query(sql, [dateStr]);
    return res.status(200).json({ success: true, date: dateStr, picks: rows });
  } catch (err) {
    // If DB is not configured yet, return empty array so frontend falls back gracefully
    return res.status(200).json({ success: false, fallback: true, error: err.message, picks: [] });
  }
}
