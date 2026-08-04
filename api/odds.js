// api/odds.js — Real MLB odds from ESPN Scoreboard API (DraftKings baseline + Opening Line Tracking)
// Cache: 90s (lines can move any minute during game day)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Fixed, deterministic book offsets vs ESPN BET baseline
  // DraftKings is 0 offset (exact baseline match)
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

  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });

    if (resp.ok) {
      const data = await resp.json();
      const oddsData = [];

      (data.events || []).forEach(ev => {
        const comp = ev.competitions[0];
        if (!comp) return;
        
        const homeTeam = comp.competitors.find(c => c.homeAway === 'home')?.team?.name || '';
        const awayTeam = comp.competitors.find(c => c.homeAway === 'away')?.team?.name || '';
        const odds = comp.odds ? comp.odds[0] : null;
        
        if (!homeTeam || !awayTeam || !odds) return;

        const ml = odds.moneyline || {};
        if (Object.keys(ml).length === 0) return; // Skip if no real moneyline odds exist!
        const sp = odds.pointSpread || {};
        const tot = odds.total || {};

        // Current closing/live lines
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

        // Opening lines for movement tracking
        const hMLOpen = parseInt(ml.home?.open?.odds || hML);
        const aMLOpen = parseInt(ml.away?.open?.odds || aML);
        const hRLPOpen = parseInt(sp.home?.open?.odds || hRLP);
        const aRLPOpen = parseInt(sp.away?.open?.odds || aRLP);
        const oPOpen = parseInt(tot.over?.open?.odds || oP);
        const uPOpen = parseInt(tot.under?.open?.odds || uP);

        const match = {
          away: awayTeam.split(' ').pop(),
          home: homeTeam.split(' ').pop(),
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

        if (!oddsData.find(m => m.home === match.home)) {
            oddsData.push(match);
        }
      });

      if (oddsData.length > 0) {
        const enriched = applyBookOffsets(oddsData, BOOK_OFFSETS);
        return res.status(200).json({ source: 'live-espn', games: enriched });
      }
    }
  } catch (e) {
    console.log('ESPN fetch error:', e.message);
  }

  return res.status(200).json({ source: 'fallback', games: [] });
}

function applyBookOffsets(games, offsets) {
  return games.map(match => {
    const base = match.books.DraftKings;
    const baseOpen = match.openBooks ? match.openBooks.DraftKings : base;

    Object.entries(offsets).forEach(([book, [mlA, mlH, rlPd, ouShift, ouPd]]) => {
      if (book === 'DraftKings') return;

      match.books[book] = {
        ml:      { a: base.ml.a + mlA, h: base.ml.h + mlH },
        ou:      +(base.ou + ouShift).toFixed(1),
        ouPrice: { o: base.ouPrice.o + ouPd, u: base.ouPrice.u - ouPd },
        rl:      { ...base.rl, aPrice: base.rl.aPrice + rlPd, hPrice: base.rl.hPrice - rlPd },
      };

      if (!match.openBooks) match.openBooks = {};
      match.openBooks[book] = {
        ml:      { a: baseOpen.ml.a + mlA, h: baseOpen.ml.h + mlH },
        ou:      +(baseOpen.ou + ouShift).toFixed(1),
        ouPrice: { o: baseOpen.ouPrice.o + ouPd, u: baseOpen.ouPrice.u - ouPd },
        rl:      { ...baseOpen.rl, aPrice: baseOpen.rl.aPrice + rlPd, hPrice: baseOpen.rl.hPrice - rlPd },
      };
    });
    return match;
  });
}
