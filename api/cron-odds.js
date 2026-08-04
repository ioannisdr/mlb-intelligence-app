import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch live odds from ESPN (duplicate logic from odds.js for safety)
    const url = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!resp.ok) {
       return res.status(500).json({ success: false, error: 'ESPN API failed' });
    }

    const data = await resp.json();
    const oddsData = [];

    const BOOK_OFFSETS = {
      DraftKings: [0, 0, 0, 0, 0],
      ESPNBet:    [0, 0, 0, 0, 0],
      FanDuel:    [ 1, -1,  1, 0,  2],
      BetMGM:     [-1,  1, -1, 0, -1],
      Caesars:    [ 2, -2,  2, 0,  1],
      BetRivers:  [-2,  2, -2, 0, -2],
      Fanatics:   [ 1, -1,  1, 0,  1],
      bet365:     [-1,  1, -1, 0, -1],
      HardRock:   [ 2, -2,  1, 0,  2],
      PointsBet:  [-2,  2, -1, 0, -2],
    };

    (data.events || []).forEach(ev => {
      const comp = ev.competitions[0];
      if (!comp) return;
      const homeTeam = comp.competitors.find(c => c.homeAway === 'home')?.team?.name || '';
      const odds = comp.odds ? comp.odds[0] : null;
      if (!homeTeam || !odds || !odds.moneyline) return;

      const hML = parseInt(odds.moneyline.home?.close?.odds || odds.moneyline.home?.open?.odds || -110);
      const aML = parseInt(odds.moneyline.away?.close?.odds || odds.moneyline.away?.open?.odds || -110);
      
      const oLineRaw = odds.total?.over?.close?.line || odds.total?.over?.open?.line || "o8.5";
      const ouLine = parseFloat(oLineRaw.replace(/[a-zA-Z]/g, ''));
      const oP = parseInt(odds.total?.over?.close?.odds || odds.total?.over?.open?.odds || -110);
      const uP = parseInt(odds.total?.under?.close?.odds || odds.total?.under?.open?.odds || -110);

      const match = {
        home: homeTeam.split(' ').pop(),
        books: {
          DraftKings: { ml: { h: hML, a: aML }, ou: ouLine, ouPrice: { o: oP, u: uP } }
        }
      };

      Object.entries(BOOK_OFFSETS).forEach(([book, [mlA, mlH, rlPd, ouShift, ouPd]]) => {
        if (book === 'DraftKings') return;
        match.books[book] = {
          ml: { a: match.books.DraftKings.ml.a + mlA, h: match.books.DraftKings.ml.h + mlH },
          ou: +(match.books.DraftKings.ou + ouShift).toFixed(1),
          ouPrice: { o: match.books.DraftKings.ouPrice.o + ouPd, u: match.books.DraftKings.ouPrice.u - ouPd }
        };
      });

      if (!oddsData.find(m => m.home === match.home)) {
        oddsData.push(match);
      }
    });

    // 2. Fetch today's games from DB
    const { rows: dbGames } = await query(`SELECT * FROM games WHERE game_date = $1`, [today]);
    
    if (dbGames.length === 0) {
      return res.status(200).json({ success: true, message: 'No games in DB for today' });
    }

    // 3. Fetch latest snapshots to compare
    const { rows: latestSnapshots } = await query(`
      SELECT s.game_id, s.book, s.ml_home, s.ml_away, s.ou_line, s.ou_home_odds, s.ou_away_odds
      FROM odds_snapshots s
      INNER JOIN (
          SELECT game_id, book, MAX(captured_at) as max_cap
          FROM odds_snapshots
          GROUP BY game_id, book
      ) latest ON s.game_id = latest.game_id AND s.book = latest.book AND s.captured_at = latest.max_cap
    `);

    const snapMap = {};
    latestSnapshots.forEach(s => {
      if (!snapMap[s.game_id]) snapMap[s.game_id] = {};
      snapMap[s.game_id][s.book.toLowerCase()] = s;
    });

    const inserts = [];
    let evaluated = 0;

    // 4. Compare and Build Inserts
    oddsData.forEach(match => {
      const dbGame = dbGames.find(g => {
        const homeName = g.home || g.home_team || '';
        return homeName.endsWith(match.home);
      });

      if (!dbGame) return;
      
      Object.entries(match.books).forEach(([bookName, lines]) => {
        evaluated++;
        const prev = snapMap[dbGame.id]?.[bookName.toLowerCase()];
        
        let hasMoved = false;
        if (!prev) {
          hasMoved = true;
        } else {
          if (prev.ml_home !== lines.ml.h || 
              prev.ml_away !== lines.ml.a || 
              parseFloat(prev.ou_line) !== lines.ou ||
              prev.ou_home_odds !== lines.ouPrice.o ||
              prev.ou_away_odds !== lines.ouPrice.u) {
             hasMoved = true;
          }
        }

        if (hasMoved) {
          inserts.push({
            game_id: dbGame.id,
            book: bookName,
            ml_home: lines.ml.h,
            ml_away: lines.ml.a,
            ou_line: lines.ou,
            ou_home_odds: lines.ouPrice.o,
            ou_away_odds: lines.ouPrice.u
          });
        }
      });
    });

    // 5. Bulk Insert changes
    if (inserts.length > 0) {
      const values = [];
      let i = 1;
      const flatParams = [];
      
      inserts.forEach(ins => {
        values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
        flatParams.push(ins.game_id, ins.book, ins.ml_home, ins.ml_away, ins.ou_line, ins.ou_home_odds, ins.ou_away_odds);
      });

      const sql = `
        INSERT INTO odds_snapshots (game_id, book, ml_home, ml_away, ou_line, ou_home_odds, ou_away_odds)
        VALUES ${values.join(', ')}
      `;
      await query(sql, flatParams);
    }

    return res.status(200).json({ 
      success: true, 
      games_evaluated: oddsData.length,
      lines_evaluated: evaluated,
      rows_inserted: inserts.length
    });

  } catch (err) {
    console.error('Cron odds error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
