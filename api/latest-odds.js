import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { book } = req.query;

    if (!book) {
      return res.status(400).json({ success: false, error: 'Missing book parameter' });
    }

    const bookName = book;

    const sql = `
      SELECT g.away, g.home, s.book, s.ml_home, s.ml_away, s.ou_line, s.ou_home_odds, s.ou_away_odds
      FROM odds_snapshots s
      JOIN games g ON s.game_id = g.id
      INNER JOIN (
          SELECT game_id, MAX(captured_at) as max_cap
          FROM odds_snapshots
          WHERE book ILIKE $1
          GROUP BY game_id
      ) latest ON s.game_id = latest.game_id AND s.captured_at = latest.max_cap
      WHERE s.book ILIKE $1 AND g.game_date >= (CURRENT_DATE - INTERVAL '1 day')
    `;

    const { rows } = await query(sql, [bookName]);

    const formattedData = rows.map(r => ({
      away: r.away,
      home: r.home,
      books: {
        [book]: {
          ml: { h: r.ml_home, a: r.ml_away },
          ou: parseFloat(r.ou_line),
          ouPrice: { o: r.ou_home_odds, u: r.ou_away_odds }
        }
      }
    }));

    return res.status(200).json(formattedData);
  } catch (err) {
    console.error('Latest odds error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
