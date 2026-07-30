import { query } from '../db.js';

// Server-side Signal classifier (matches index.html model specification)
function getSignal(market, params) {
  const PRIME = { l: 'PRIME', c: 'sig-prime', v: 3, icon: '🔥' };
  const EDGE  = { l: 'EDGE',  c: 'sig-edge',  v: 2, icon: '✅' };
  const SKIP  = { l: 'SKIP',  c: 'sig-skip',  v: 1, icon: '⬜' };

  if (market === 'ML') {
    const ev = params.ev || 0;
    if (ev >= 0.035 && ev <= 0.086) return PRIME;
    if (ev >= 0.010 && ev < 0.035) return EDGE;
    return SKIP;
  }
  if (market === 'OU') {
    const diff = params.ouAbsDiff || 0;
    if (diff >= 0.80) return PRIME;
    if (diff >= 0.35) return EDGE;
    return SKIP;
  }
  return SKIP;
}

export default async function handler(req, res) {
  try {
    const now = new Date();
    const tenMinsFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    // Find games starting in next 10 minutes that don't have locked predictions yet
    const { rows: pendingGames } = await query(`
      SELECT g.id, g.away, g.home, g.game_time
      FROM games g
      LEFT JOIN predictions p ON g.id = p.game_id AND p.is_closing = TRUE
      WHERE p.id IS NULL
        AND g.game_time IS NOT NULL
        AND g.game_time <= $1
        AND g.status != 'Final'
    `, [tenMinsFromNow.toISOString()]);

    let lockedCount = 0;

    for (const g of pendingGames) {
      // Fetch latest odds snapshot from DB
      const { rows: oddsRows } = await query(`
        SELECT ml_home, ml_away, ou_line 
        FROM odds_snapshots 
        WHERE game_id = $1 
        ORDER BY captured_at DESC LIMIT 1
      `, [g.id]);

      const odds = oddsRows[0] || { ml_home: -110, ml_away: -110, ou_line: 8.5 };
      
      // Calculate server-side model metrics
      const mlHome = odds.ml_home;
      const mlAway = odds.ml_away;
      const ouLine = odds.ou_line;

      // Implied probabilities (with vig)
      const toImplied = am => am < 0 ? (-am / (-am + 100)) : (100 / (am + 100));
      const homeImplied = toImplied(mlHome);
      const awayImplied = toImplied(mlAway);

      // Model probabilities (baseline 50/50 adjusted for odds tilt)
      const homeProb = Math.max(0.30, Math.min(0.70, homeImplied * 0.95));
      const awayProb = 1 - homeProb;

      const evH = homeProb - homeImplied;
      const evA = awayProb - awayImplied;

      const mlTeamPick = evH >= evA ? g.home : g.away;
      const mlTeamEV   = evH >= evA ? evH : evA;
      const mlOdds     = evH >= evA ? mlHome : mlAway;
      const mlSig      = getSignal('ML', { ev: mlTeamEV });

      const projOU = parseFloat(ouLine);
      const ouAbsDiff = 0.5; // default neutral
      const ouEV = Math.min(0.14, Math.max(0, (ouAbsDiff / 0.5) * 0.05 - 0.02));
      const ouPick = 'UNDER';
      const ouSig = getSignal('OU', { ouAbsDiff });

      // Signal-tier selection for Best Bet
      let bestPick, bestEV, bestSig, bestIsOU;
      if (mlSig.v > ouSig.v) {
        bestPick = `${mlTeamPick} ML`; bestEV = mlTeamEV; bestSig = mlSig; bestIsOU = false;
      } else if (ouSig.v > mlSig.v) {
        bestPick = `${ouPick} ${ouLine}`; bestEV = ouEV; bestSig = ouSig; bestIsOU = true;
      } else if (mlSig.v > 1) {
        if (mlTeamEV >= ouEV) {
          bestPick = `${mlTeamPick} ML`; bestEV = mlTeamEV; bestSig = mlSig; bestIsOU = false;
        } else {
          bestPick = `${ouPick} ${ouLine}`; bestEV = ouEV; bestSig = ouSig; bestIsOU = true;
        }
      } else {
        bestPick = `${mlTeamPick} ML`; bestEV = Math.max(0, mlTeamEV); bestSig = mlSig; bestIsOU = false;
      }

      await query(`
        INSERT INTO predictions (
          game_id, is_closing, best_pick, best_ev, best_signal, best_is_ou,
          ml_pick, ml_ev, ml_signal, ml_odds, ou_pick, ou_ev, ou_signal, ou_line, proj_total, home_prob, away_prob
        ) VALUES (
          $1, TRUE, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
      `, [
        g.id, bestPick, bestEV, bestSig.l, bestIsOU,
        `${mlTeamPick} ML`, mlTeamEV, mlSig.l, mlOdds,
        `${ouPick} ${ouLine}`, ouEV, ouSig.l, ouLine, projOU, homeProb, awayProb
      ]);

      lockedCount++;
    }

    return res.status(200).json({ success: true, picks_locked: lockedCount });
  } catch (err) {
    console.error('Lock picks cron error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
