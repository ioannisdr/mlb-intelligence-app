import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const { gId } = req.query;

    if (!gId) {
      return res.status(400).json({ success: false, error: 'Missing gId parameter' });
    }

    // Query historical snapshots for the specified game
    const sql = `
      SELECT captured_at, book, ml_home, ml_away, ou_line, ou_home_odds, ou_away_odds 
      FROM odds_snapshots 
      WHERE game_id = $1 
      ORDER BY captured_at ASC
    `;
    const { rows } = await query(sql, [gId]);

    // Group rows by rounded timestamp (minute-level) since books are inserted in batches
    const snapshotsMap = {};

    rows.forEach(r => {
      const ts = new Date(r.captured_at);
      ts.setSeconds(0, 0); // Round to minute
      const key = ts.toISOString();

      if (!snapshotsMap[key]) {
        snapshotsMap[key] = {
          timestamp: key,
          books: {}
        };
      }

      // Ensure the book name capitalization matches what the UI expects if they were saved in lowercase
      const bookMap = {
        'draftkings': 'DraftKings',
        'fanduel': 'FanDuel',
        'betmgm': 'BetMGM',
        'caesars': 'Caesars',
        'betrivers': 'BetRivers',
        'espnbet': 'ESPNBet',
        'fanatics': 'Fanatics',
        'bet365': 'bet365',
        'hardrock': 'HardRock',
        'pointsbet': 'PointsBet'
      };
      
      let bookName = bookMap[r.book.toLowerCase()] || r.book;
      
      snapshotsMap[key].books[bookName] = {
        ml: { h: r.ml_home, a: r.ml_away },
        ou: parseFloat(r.ou_line),
        ouPrice: { o: r.ou_home_odds, u: r.ou_away_odds }
      };
    });

    const historyData = Object.values(snapshotsMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.status(200).json(historyData);
  } catch (err) {
    console.error('History fetch error:', err);
    // Return empty array on failure so frontend doesn't crash
    return res.status(200).json([]);
  }
}
