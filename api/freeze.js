import { query } from './db.js';
import oddsHandler from './odds.js';
import teamsHandler from './teams.js';
import pitchersHandler from './pitchers.js';
import weatherHandler from './weather.js';

function mockRes() {
  let resolveJSON;
  const promise = new Promise(resolve => { resolveJSON = resolve; });
  return {
    setHeader: () => {},
    status: function() { return this; },
    json: function(data) { resolveJSON(data); },
    promise
  };
}

// ── Model Logic Ported from index.html ──
function seedRand(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return (h / 4294967296) + 0.5;
}

function calculateRegression(p) {
  if (!p) return { score: 0, text: null };
  let era = parseFloat(p.era || 4.20);
  let xera = parseFloat(p.xera || era);
  let xfip = parseFloat(p.xFIP || p.fip || era);
  let woba = parseFloat(p.woba || 0.315);
  let xwoba = parseFloat(p.xwoba || woba);
  let babip = parseFloat(p.babip || 0.295);
  let hardhit = parseFloat(p.hardhit || 38.0);
  let barrel = parseFloat(p.barrel || 7.0);
  let score = 0;

  let eraGap = era - ((xera + xfip) / 2); 
  score += Math.max(-2.0, Math.min(2.0, eraGap)); 
  let wobaGap = woba - xwoba; 
  score += Math.max(-1.5, Math.min(1.5, wobaGap * 20));
  let babipGap = babip - 0.295;
  score += Math.max(-1.0, Math.min(1.0, babipGap * 15));

  if (hardhit > 45.0) score -= 0.6; 
  else if (hardhit < 30.0) score += 0.4;
  if (barrel > 10.0) score -= 0.6; 
  else if (barrel < 5.0) score += 0.4;

  return { score: Math.max(-3.0, Math.min(3.0, score)), text: null };
}

function getPitcherComposite(p) {
  if (!p) return 4.20;
  let xera  = parseFloat(p.xera  || 4.20);
  let xfip  = parseFloat(p.xFIP  || p.fip || (xera + 0.12));
  let fip   = parseFloat(p.fip   || (xera + 0.10));
  let era   = parseFloat(p.era   || xera);
  let kpct  = parseFloat(p.kpct  || 22.5);
  let bbpct = parseFloat(p.bbpct || 7.2);
  let comp  = (xera * 0.45) + (xfip * 0.25) + (fip * 0.15) + (era * 0.15);
  let kbbDiff = kpct - bbpct;
  let commandAdj = (kbbDiff - 15.0) * -0.015;
  return comp + commandAdj;
}

function getSignal(market, { ev = 0, mlPickProb = 0.5, ouAbsDiff = 0 } = {}) {
  const PRIME = { l: 'PRIME', c: 'sig-prime', v: 3, icon: '🔥' };
  const EDGE  = { l: 'EDGE',  c: 'sig-edge',  v: 2, icon: '✅' };
  const SKIP  = { l: 'SKIP',  c: 'sig-skip',  v: 1, icon: '⬜' };
  if (market === 'ML') {
    if ((mlPickProb >= 0.525 && ev >= 0.020) || (mlPickProb >= 0.515 && ev >= 0.100) || ev >= 0.150) return PRIME;
    if ((mlPickProb >= 0.505 && ev >= 0.010) || ev >= 0.050) return EDGE;
    return SKIP;
  }
  if (market === 'OU') {
    if (ouAbsDiff >= 0.80) return PRIME;
    if (ouAbsDiff >= 0.60) return EDGE;
    return SKIP;
  }
  return SKIP;
}

function amToProb(am) {
  if (am < 0) return -am / (-am + 100);
  return 100 / (am + 100);
}
function probToAmLine(p) {
  p = Math.max(0.25, Math.min(0.80, p));
  if (p >= 0.5) return -Math.round(p / (1 - p) * 100 / 5) * 5;
  return Math.round((1 - p) / p * 100 / 5) * 5;
}
function windEffect(windMph, dir) {
  if (dir === 'dome' || windMph < 5) return 0;
  const factor = dir === 'out' ? 0.028 : dir === 'in' ? -0.025 : 0.008;
  return windMph * factor;
}
function tempEffect(tempF) {
  return (tempF - 72) * 0.012;
}

export default async function handler(req, res) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Fetch MLB Schedule directly for accuracy
    const schedUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${todayStr}&hydrate=probablePitcher,linescore`;
    const schedResp = await fetch(schedUrl);
    const schedData = await schedResp.json();
    const games = schedData?.dates?.[0]?.games || [];

    if (games.length === 0) {
      return res.status(200).json({ success: true, message: 'No games today.' });
    }

    // Identify games locking within ~15 minutes
    const now = new Date();
    
    const lockingGames = games.filter(g => {
      const gt = new Date(g.gameDate);
      const diffMins = (gt - now) / 60000;
      return diffMins <= 2 && diffMins > -180 && (g.status.abstractGameState === 'Preview' || g.status.abstractGameState === 'Live');
    });

    if (lockingGames.length === 0) {
      return res.status(200).json({ success: true, message: 'No games locking soon.' });
    }

    // Check which ones are already frozen
    const lockingGameIds = lockingGames.map(g => `${todayStr}-${g.teams.away.team.id}-${g.teams.home.team.id}`);
    
    let frozenIds = new Set();
    try {
        const { rows: existing } = await query(
          `SELECT game_id FROM predictions WHERE game_id = ANY($1) AND is_closing = TRUE`,
          [lockingGameIds]
        );
        frozenIds = new Set(existing.map(r => r.game_id));
    } catch (e) {
        // Allow DB fallback (if testing locally or DB down)
        console.warn('DB check failed, falling back to all locking games', e);
    }

    const gamesToFreeze = lockingGames.filter(g => {
      const gid = `${todayStr}-${g.teams.away.team.id}-${g.teams.home.team.id}`;
      return !frozenIds.has(gid);
    });

    if (gamesToFreeze.length === 0) {
      return res.status(200).json({ success: true, message: 'All locking games are already frozen.' });
    }

    // 2. Fetch all data using mockRes
    const resO = mockRes(), resT = mockRes(), resP = mockRes(), resW = mockRes();
    await Promise.all([
      oddsHandler({}, resO),
      teamsHandler({}, resT),
      pitchersHandler({}, resP),
      weatherHandler({}, resW)
    ]);

    const ODDS = (await resO.promise).games || [];
    const S = await resT.promise;
    const P = await resP.promise;
    const WX = await resW.promise;

    let frozenCount = 0;

    for (const g of gamesToFreeze) {
      const gameId = `${todayStr}-${g.teams.away.team.id}-${g.teams.home.team.id}`;
      const away = g.teams.away.team.name.split(' ').pop();
      const home = g.teams.home.team.name.split(' ').pop();
      const awayPName = g.teams.away.probablePitcher ? g.teams.away.probablePitcher.fullName : 'TBD';
      const homePName = g.teams.home.probablePitcher ? g.teams.home.probablePitcher.fullName : 'TBD';
      const dateKey = todayStr;

      let ap = P[awayPName] || { xera: 4.2, kpct: 22, fip: 4.3 };
      let hp = P[homePName] || { xera: 4.2, kpct: 22, fip: 4.3 };
      let as = S[away] || { woba: 0.315 };
      let hs = S[home] || { woba: 0.315 };

      let a_comp = getPitcherComposite(ap);
      let h_comp = getPitcherComposite(hp);
      let a_pitch = a_comp * -0.20;
      let h_pitch = h_comp * -0.20;
      let a_off = as.woba * 5.0;
      let h_off = hs.woba * 5.0;

      let eraGapLogit = 0;
      if (awayPName !== 'TBD' && homePName !== 'TBD' && ap.era && hp.era) {
        let aReg = calculateRegression(ap);
        let hReg = calculateRegression(hp);
        eraGapLogit = (-aReg.score + hReg.score) * 0.05;
      }

      let r1 = seedRand(away + home + "var1") * 2 - 1;
      let r2 = seedRand(away + home + dateKey + "ouline") * 2 - 1;

      let logit = (h_off + h_pitch + 0.08) - (a_off + a_pitch) + (r1 * 0.22) + eraGapLogit;
      let homeProb = 1 / (1 + Math.exp(-logit));
      let awayProb = 1 - homeProb;

      const mktGame = ODDS.find(m => m.home === home);
      let mkt;
      if (mktGame && mktGame.books && mktGame.books.DraftKings) {
        mkt = mktGame.books.DraftKings;
      } else {
        // Strict Zero Mock Data Directive: Force negative EV and SKIP signal if odds missing
        mkt = { ml: { h: -10000, a: -10000 }, ou: 0 };
      }

      let payoutH = mkt.ml.h > 0 ? (mkt.ml.h / 100) : (100 / Math.abs(mkt.ml.h));
      let payoutA = mkt.ml.a > 0 ? (mkt.ml.a / 100) : (100 / Math.abs(mkt.ml.a));
      let evH = (homeProb * payoutH) - awayProb;
      let evA = (awayProb * payoutA) - homeProb;

      let projOU = mkt.ou + ((hp.xera || 4.20) - 4.20) * 0.50 + ((ap.xera || 4.20) - 4.20) * 0.50 + (r1 * 0.20);
      const wxH = WX[home] || {};
      const pf = wxH.pf || 100;
      projOU *= (pf / 100);
      if (wxH && !wxH.dome) {
        projOU += windEffect(wxH.windMph || 0, wxH.windDir || 'calm');
        projOU += tempEffect(wxH.temp || 72);
      }
      const awOBA = (as.woba || 0.315) - 0.315;
      const hwOBA = (hs.woba || 0.315) - 0.315;
      projOU += (awOBA + hwOBA) * 8;
      projOU = Math.round(projOU * 10) / 10;

      let ouAbsDiff = mkt.ou === 0 ? 0 : Math.abs(projOU - mkt.ou);
      let ouEV = mkt.ou === 0 ? -99 : Math.min(0.14, Math.max(0, (ouAbsDiff / 0.5) * 0.05 - 0.02));

      let mlTeamPick = evH >= evA ? home : away;
      let mlTeamEV = evH >= evA ? evH : evA;
      let mlPickProb = mlTeamPick === home ? homeProb : awayProb;
      
      const mlSig = getSignal('ML', { ev: mlTeamEV, mlPickProb });
      const ouSigVal = getSignal('OU', { ouAbsDiff });

      let bestPick, bestEV, bestIsOU, bestSig;
      let ouPick = projOU > mkt.ou ? 'OVER' : 'UNDER';
      
      if (mlSig.v > ouSigVal.v) {
        bestPick = `${mlTeamPick} ML`; bestEV = mlTeamEV; bestIsOU = false; bestSig = mlSig.l;
      } else if (ouSigVal.v > mlSig.v) {
        bestPick = `${ouPick} ${mkt.ou}`; bestEV = ouEV; bestIsOU = true; bestSig = ouSigVal.l;
      } else if (mlSig.v > 1 || ouSigVal.v > 1) {
        if (ouEV > mlTeamEV && ouSigVal.v > 1) {
          bestPick = `${ouPick} ${mkt.ou}`; bestEV = ouEV; bestIsOU = true; bestSig = ouSigVal.l;
        } else {
          bestPick = `${mlTeamPick} ML`; bestEV = mlTeamEV; bestIsOU = false; bestSig = mlSig.l;
        }
      } else {
        bestPick = `${mlTeamPick} ML`; bestEV = Math.max(0, mlTeamEV); bestIsOU = false; bestSig = mlSig.l;
      }

      await query(`
        INSERT INTO predictions (
          game_id, is_closing, best_pick, best_ev, best_signal, best_is_ou,
          ml_pick, ml_ev, ml_signal, ml_odds,
          ou_pick, ou_ev, ou_signal, ou_line,
          proj_total, home_prob, away_prob
        ) VALUES (
          $1, TRUE, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16
        )
      `, [
        gameId, bestPick, bestEV, bestSig, bestIsOU,
        `${mlTeamPick} ML`, mlTeamEV, mlSig.l, mlTeamPick === home ? mkt.ml.h : mkt.ml.a,
        ouPick, ouEV, ouSigVal.l, mkt.ou,
        projOU, homeProb, awayProb
      ]);

      frozenCount++;
    }

    return res.status(200).json({ success: true, message: `Froze ${frozenCount} games.` });

  } catch (err) {
    console.error('Freeze error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}



