// api/odds.js — Real MLB odds from ESPN + Neon DB persistence
// Every fetch: save live odds to Neon. When ESPN drops odds (in-progress/final), serve from Neon.
// Cache: 90s

import { query, initDb } from './db.js';

let dbReady = false;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Ensure DB tables exist (runs once per cold start)
  if (!dbReady) {
    try { await initDb(); dbReady = true; } catch(e) { console.log('DB init skip:', e.message); }
  }

  const today = new Date().toISOString().split('T')[0];
  const espnDate = today.replace(/-/g, '');

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${espnDate}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });

    if (!resp.ok) throw new Error('ESPN returned ' + resp.status);

    const data = await resp.json();
    const liveOdds = [];   // games ESPN has odds for right now
    const noOddsGames = []; // games ESPN dropped odds for (in-progress/final)

    (data.events || []).forEach(ev => {
      const comp = ev.competitions[0];
      if (!comp) return;

      const homeComp = comp.competitors.find(c => c.homeAway === 'home');
      const awayComp = comp.competitors.find(c => c.homeAway === 'away');
      const homeTeam = homeComp?.team?.name || '';
      const awayTeam = awayComp?.team?.name || '';
      const homeP = homeComp?.probables?.[0]?.athlete?.fullName || 'TBD';
      const awayP = awayComp?.probables?.[0]?.athlete?.fullName || 'TBD';
      const gameTime = comp.date || ev.date || null;
      const status = comp.status?.type?.description || 'Scheduled';
      const odds = comp.odds ? comp.odds[0] : null;

      const awayName = getTeamName(awayTeam);
      const homeName = getTeamName(homeTeam);

      if (!homeTeam || !awayTeam) return;

      // If ESPN has no odds for this game, remember it for DB lookup
      if (!odds || !odds.moneyline || Object.keys(odds.moneyline).length === 0) {
        noOddsGames.push({ away: awayName, home: homeName, awayP, homeP, status, gameTime });
        return;
      }

      const ml = odds.moneyline || {};
      const sp = odds.pointSpread || {};
      const tot = odds.total || {};

      const hML = parseInt(ml.home?.close?.odds || ml.home?.open?.odds || -110);
      const aML = parseInt(ml.away?.close?.odds || ml.away?.open?.odds || -110);

      const hRL = sp.home?.close?.line || sp.home?.open?.line || "-1.5";
      const hRLP = parseInt(sp.home?.close?.odds || sp.home?.open?.odds || -110);
      const aRL = sp.away?.close?.line || sp.away?.open?.line || "+1.5";
      const aRLP = parseInt(sp.away?.close?.odds || sp.away?.open?.odds || -110);

      const oLineRaw = tot.over?.close?.line || tot.over?.open?.line || "o8.5";
      const ouLine = parseFloat(oLineRaw.replace(/[a-zA-Z]/g, ''));
      const oP = parseInt(tot.over?.close?.odds || tot.over?.open?.odds || -110);
      const uP = parseInt(tot.under?.close?.odds || tot.under?.open?.odds || -110);

      const hMLOpen = parseInt(ml.home?.open?.odds || hML);
      const aMLOpen = parseInt(ml.away?.open?.odds || aML);
      const hRLPOpen = parseInt(sp.home?.open?.odds || hRLP);
      const aRLPOpen = parseInt(sp.away?.open?.odds || aRLP);
      const oPOpen = parseInt(tot.over?.open?.odds || oP);
      const uPOpen = parseInt(tot.under?.open?.odds || uP);

      const match = {
        away: awayName, home: homeName, awayP, homeP, status,
        books: {
          DraftKings: {
            ml: { h: hML, a: aML },
            rl: { hLine: hRL, hPrice: hRLP, aLine: aRL, aPrice: aRLP },
            ou: ouLine,
            ouPrice: { o: oP, u: uP }
          }
        },
        openBooks: {
          DraftKings: {
            ml: { h: hMLOpen, a: aMLOpen },
            rl: { hLine: hRL, hPrice: hRLPOpen, aLine: aRL, aPrice: aRLPOpen },
            ou: ouLine,
            ouPrice: { o: oPOpen, u: uPOpen }
          }
        }
      };

      if (!liveOdds.find(m => m.away === match.away && m.home === match.home)) {
        liveOdds.push(match);
      }
    });

    // --- SAVE live odds to Neon DB (non-blocking) ---
    saveOddsToNeon(liveOdds, today).catch(e => console.log('Neon save error:', e.message));

    // --- RESTORE odds for games ESPN dropped (in-progress/final) from Neon ---
    let restoredOdds = [];
    if (noOddsGames.length > 0) {
      try {
        restoredOdds = await restoreOddsFromNeon(noOddsGames, today);
      } catch(e) {
        console.log('Neon restore error:', e.message);
      }
    }

    const allOdds = [...liveOdds, ...restoredOdds];

    if (allOdds.length > 0) {
      return res.status(200).json({
        source: restoredOdds.length > 0 ? 'live-espn+db' : 'live-espn',
        games: allOdds,
        live: liveOdds.length,
        restored: restoredOdds.length
      });
    }

  } catch (e) {
    console.log('ESPN fetch error:', e.message);
    // If ESPN is completely down, try serving everything from Neon
    try {
      const dbOdds = await getAllOddsFromNeon(today);
      if (dbOdds.length > 0) {
        return res.status(200).json({ source: 'db-only', games: dbOdds, restored: dbOdds.length });
      }
    } catch(e2) {
      console.log('Neon fallback error:', e2.message);
    }
  }

  return res.status(200).json({ source: 'fallback', games: [] });
}

function getTeamName(fullName) {
  if (!fullName) return "UNK";
  if (fullName.includes("Red Sox")) return "Red Sox";
  if (fullName.includes("White Sox")) return "White Sox";
  if (fullName.includes("Blue Jays")) return "Blue Jays";
  return fullName.split(' ').pop();
}

// ─── NEON DB: Save live odds ─────────────────────────────────────────────────
async function saveOddsToNeon(liveOdds, dateStr) {
  if (!liveOdds || liveOdds.length === 0) return;

  for (const game of liveOdds) {
    const dk = game.books.DraftKings;
    if (!dk) continue;
    const gameId = `${dateStr}-${game.away}-${game.home}`;

    // Upsert into a simple odds_cache table
    await query(`
      INSERT INTO odds_cache (game_id, game_date, away, home, away_pitcher, home_pitcher,
        ml_home, ml_away, rl_home_line, rl_home_price, rl_away_line, rl_away_price,
        ou_line, ou_over_price, ou_under_price,
        ml_home_open, ml_away_open, ou_line_open, ou_over_open, ou_under_open,
        updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, NOW())
      ON CONFLICT (game_id) DO UPDATE SET
        ml_home = EXCLUDED.ml_home, ml_away = EXCLUDED.ml_away,
        rl_home_line = EXCLUDED.rl_home_line, rl_home_price = EXCLUDED.rl_home_price,
        rl_away_line = EXCLUDED.rl_away_line, rl_away_price = EXCLUDED.rl_away_price,
        ou_line = EXCLUDED.ou_line, ou_over_price = EXCLUDED.ou_over_price, ou_under_price = EXCLUDED.ou_under_price,
        ml_home_open = EXCLUDED.ml_home_open, ml_away_open = EXCLUDED.ml_away_open,
        ou_line_open = EXCLUDED.ou_line_open, ou_over_open = EXCLUDED.ou_over_open, ou_under_open = EXCLUDED.ou_under_open,
        updated_at = NOW()
    `, [
      gameId, dateStr, game.away, game.home, game.awayP || 'TBD', game.homeP || 'TBD',
      dk.ml.h, dk.ml.a,
      dk.rl?.hLine || '-1.5', dk.rl?.hPrice || -110, dk.rl?.aLine || '+1.5', dk.rl?.aPrice || -110,
      dk.ou, dk.ouPrice?.o || -110, dk.ouPrice?.u || -110,
      game.openBooks?.DraftKings?.ml?.h || dk.ml.h,
      game.openBooks?.DraftKings?.ml?.a || dk.ml.a,
      game.openBooks?.DraftKings?.ou || dk.ou,
      game.openBooks?.DraftKings?.ouPrice?.o || -110,
      game.openBooks?.DraftKings?.ouPrice?.u || -110
    ]);
  }
}

// ─── NEON DB: Restore odds for games ESPN dropped ────────────────────────────
async function restoreOddsFromNeon(games, dateStr) {
  const restored = [];
  for (const g of games) {
    const gameId = `${dateStr}-${g.away}-${g.home}`;
    const { rows } = await query(`SELECT * FROM odds_cache WHERE game_id = $1`, [gameId]);
    if (rows.length > 0) {
      const r = rows[0];
      restored.push({
        away: r.away, home: r.home,
        awayP: r.away_pitcher || g.awayP || 'TBD',
        homeP: r.home_pitcher || g.homeP || 'TBD',
        status: g.status || 'In Progress',
        fromDb: true,
        books: {
          DraftKings: {
            ml: { h: r.ml_home, a: r.ml_away },
            rl: { hLine: r.rl_home_line || '-1.5', hPrice: r.rl_home_price || -110,
                  aLine: r.rl_away_line || '+1.5', aPrice: r.rl_away_price || -110 },
            ou: parseFloat(r.ou_line),
            ouPrice: { o: r.ou_over_price || -110, u: r.ou_under_price || -110 }
          }
        },
        openBooks: {
          DraftKings: {
            ml: { h: r.ml_home_open || r.ml_home, a: r.ml_away_open || r.ml_away },
            rl: { hLine: r.rl_home_line || '-1.5', hPrice: -110,
                  aLine: r.rl_away_line || '+1.5', aPrice: -110 },
            ou: parseFloat(r.ou_line_open || r.ou_line),
            ouPrice: { o: r.ou_over_open || -110, u: r.ou_under_open || -110 }
          }
        }
      });
    }
  }
  return restored;
}

// ─── NEON DB: Get all cached odds for a date (ESPN completely down) ──────────
async function getAllOddsFromNeon(dateStr) {
  const { rows } = await query(`SELECT * FROM odds_cache WHERE game_date = $1`, [dateStr]);
  return rows.map(r => ({
    away: r.away, home: r.home,
    awayP: r.away_pitcher || 'TBD', homeP: r.home_pitcher || 'TBD',
    fromDb: true,
    books: {
      DraftKings: {
        ml: { h: r.ml_home, a: r.ml_away },
        rl: { hLine: r.rl_home_line || '-1.5', hPrice: r.rl_home_price || -110,
              aLine: r.rl_away_line || '+1.5', aPrice: r.rl_away_price || -110 },
        ou: parseFloat(r.ou_line),
        ouPrice: { o: r.ou_over_price || -110, u: r.ou_under_price || -110 }
      }
    },
    openBooks: {
      DraftKings: {
        ml: { h: r.ml_home_open || r.ml_home, a: r.ml_away_open || r.ml_away },
        rl: { hLine: '-1.5', hPrice: -110, aLine: '+1.5', aPrice: -110 },
        ou: parseFloat(r.ou_line_open || r.ou_line),
        ouPrice: { o: r.ou_over_open || -110, u: r.ou_under_open || -110 }
      }
    }
  }));
}
