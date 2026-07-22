// api/public-betting.js — Real public betting trends from sportsbettingdime.com
// Refreshes every 60 minutes (SBD updates their data about that frequently)
// Falls back to a date-seeded deterministic simulation if scrape fails.

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const SBD_URL   = 'https://www.sportsbettingdime.com/mlb/public-betting-trends/';
  const SBD_API   = 'https://www.sportsbettingdime.com/api/betting-trends/mlb/';
  const SBD_API2  = 'https://www.sportsbettingdime.com/api/public-betting/mlb/';

  // ── Strategy 1: Try SBD internal JSON API endpoints ───────────────────────
  for (const apiUrl of [SBD_API, SBD_API2]) {
    try {
      const r = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.sportsbettingdime.com/',
          'Origin': 'https://www.sportsbettingdime.com',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const text = await r.text();
        if (text.startsWith('[') || text.startsWith('{')) {
          const data = JSON.parse(text);
          const games = parseSBDJSON(data);
          if (games.length > 0) return res.status(200).json({ source: 'live', games });
        }
      }
    } catch (_) {}
  }

  // ── Strategy 2: Full page scrape, extract Next.js data blob ───────────────
  try {
    const r = await fetch(SBD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (r.ok) {
      const html = await r.text();
      const games = parseSBDHTML(html);
      if (games.length > 0) return res.status(200).json({ source: 'live', games });
    }
  } catch (e) {
    console.log('SBD HTML fetch error:', e.message);
  }

  // ── Strategy 3: Simulated — deterministic, date-seeded ────────────────────
  // Returns empty so frontend generates its own simulation keyed by matchup
  return res.status(200).json({ source: 'simulated', games: [] });
}

// ── Parser: SBD JSON format (multiple possible shapes) ────────────────────
function parseSBDJSON(data) {
  const games = [];
  const arr   = Array.isArray(data) ? data : (data.data || data.games || data.trends || []);

  for (const item of arr) {
    try {
      // Common keys used by SBD
      const away = item.awayTeam || item.away_team || item.away || '';
      const home = item.homeTeam || item.home_team || item.home || '';
      if (!away && !home) continue;

      const g = {
        away, home,
        ml: {
          awayBet:   toInt(item.awayMLBets   || item.away_ml_bets   || item.awayML   || 50),
          homeBet:   toInt(item.homeMLBets   || item.home_ml_bets   || item.homeML   || 50),
          awayMoney: toInt(item.awayMLMoney  || item.away_ml_money  || item.awayMLDollars || 50),
          homeMoney: toInt(item.homeMLMoney  || item.home_ml_money  || item.homeMLDollars || 50),
        },
        rl: {
          awayBet:   toInt(item.awayRLBets   || item.away_rl_bets   || 50),
          homeBet:   toInt(item.homeRLBets   || item.home_rl_bets   || 50),
          awayMoney: toInt(item.awayRLMoney  || item.away_rl_money  || 50),
          homeMoney: toInt(item.homeRLMoney  || item.home_rl_money  || 50),
        },
        ou: {
          overBet:    toInt(item.overBets     || item.over_bets    || item.overOU   || 50),
          underBet:   toInt(item.underBets    || item.under_bets   || 100 - toInt(item.overOU || 50)),
          overMoney:  toInt(item.overMoney    || item.over_money   || 50),
          underMoney: toInt(item.underMoney   || item.under_money  || 50),
        },
      };
      // Normalise so both sides sum to 100
      normalise(g.ml, 'awayBet', 'homeBet');
      normalise(g.ml, 'awayMoney', 'homeMoney');
      normalise(g.rl, 'awayBet', 'homeBet');
      normalise(g.rl, 'awayMoney', 'homeMoney');
      normalise(g.ou, 'overBet', 'underBet');
      normalise(g.ou, 'overMoney', 'underMoney');
      games.push(g);
    } catch (_) {}
  }
  return games;
}

// ── Parser: SBD HTML — tries multiple extraction strategies ──────────────
function parseSBDHTML(html) {
  // Strategy A: __NEXT_DATA__ JSON blob
  const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextMatch) {
    try {
      const blob = JSON.parse(nextMatch[1]);
      // Walk common paths where SBD stores trend data
      const paths = [
        blob?.props?.pageProps?.trends,
        blob?.props?.pageProps?.data?.trends,
        blob?.props?.pageProps?.publicBetting,
        blob?.props?.pageProps?.bettingTrends,
        blob?.props?.pageProps?.games,
      ];
      for (const p of paths) {
        if (Array.isArray(p) && p.length > 0) {
          const g = parseSBDJSON(p);
          if (g.length > 0) return g;
        }
      }
    } catch (_) {}
  }

  // Strategy B: find inline JSON arrays in script tags
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  for (const sm of scriptMatches) {
    const content = sm[1];
    if (content.includes('awayTeam') || content.includes('away_team') || content.includes('betsAway')) {
      const jsonMatch = content.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const g = parseSBDJSON(parsed);
          if (g.length > 0) return g;
        } catch (_) {}
      }
    }
  }

  // Strategy C: Parse HTML table rows with percentage data
  const games = [];
  // SBD typically has two rows per game (away team / home team)
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (let i = 0; i < rows.length - 1; i++) {
    const r1 = rows[i][1], r2 = rows[i+1][1];
    const pcts1 = extractPcts(r1);
    const pcts2 = extractPcts(r2);
    const team1 = extractTeam(r1);
    const team2 = extractTeam(r2);
    if (pcts1.length >= 4 && pcts2.length >= 2 && team1 && team2) {
      games.push({
        away: team1, home: team2,
        ml:  { awayBet: pcts1[0], homeBet: pcts2[0], awayMoney: pcts1[1], homeMoney: pcts2[1] },
        rl:  { awayBet: pcts1[2]||50, homeBet: pcts2[2]||50, awayMoney: pcts1[3]||50, homeMoney: pcts2[3]||50 },
        ou:  { overBet: 50, underBet: 50, overMoney: 50, underMoney: 50 },
      });
      i++; // skip home row
    }
  }
  return games;
}

function extractPcts(html) {
  return [...html.matchAll(/(\d{1,3})%/g)].map(m => parseInt(m[1]));
}
function extractTeam(html) {
  const m = html.match(/>([A-Z][a-z]+(?: [A-Z][a-z]+)+)</);
  return m ? m[1] : null;
}
function toInt(v) { return parseInt(v) || 50; }
function normalise(obj, k1, k2) {
  const s = (obj[k1]||0) + (obj[k2]||0);
  if (s !== 100 && s > 0) {
    obj[k1] = Math.round(obj[k1] / s * 100);
    obj[k2] = 100 - obj[k1];
  }
}
