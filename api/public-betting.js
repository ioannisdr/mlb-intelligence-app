export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Try multiple strategies to get real data from sportsbettingdime.com
  const SBD_URL = 'https://www.sportsbettingdime.com/mlb/public-betting-trends/';

  try {
    const response = await fetch(SBD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (response.ok) {
      const html = await response.text();
      const games = parseSBDPage(html);
      if (games && games.length > 0) {
        return res.status(200).json({ source: 'live', games });
      }
    }
  } catch (e) {
    console.log('SBD fetch error:', e.message);
  }

  // Fallback — client generates simulated data
  return res.status(200).json({ source: 'simulated', games: [] });
}

function parseSBDPage(html) {
  const games = [];

  try {
    // Strategy 1: Look for embedded JSON in Next.js __NEXT_DATA__ or similar
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      const props = data?.props?.pageProps;
      // Try common data paths
      const trends = props?.trends || props?.data?.trends || props?.publicBetting;
      if (trends && Array.isArray(trends)) {
        trends.forEach(t => {
          if (t.awayTeam || t.away) {
            games.push({
              away: t.awayTeam || t.away,
              home: t.homeTeam || t.home,
              ml:  { awayBet: t.awayMLBets || t.awayML || 50, homeBet: t.homeMLBets || t.homeML || 50,
                     awayMoney: t.awayMLMoney || t.awayMLDollars || 50, homeMoney: t.homeMLMoney || t.homeMLDollars || 50 },
              rl:  { awayBet: t.awayRLBets || 50, homeBet: t.homeRLBets || 50,
                     awayMoney: t.awayRLMoney || 50, homeMoney: t.homeRLMoney || 50 },
              ou:  { overBet: t.overBets || t.overOU || 50, underBet: t.underBets || t.underOU || 50,
                     overMoney: t.overMoney || t.overOUMoney || 50, underMoney: t.underMoney || t.underOUMoney || 50 },
            });
          }
        });
        if (games.length > 0) return games;
      }
    }

    // Strategy 2: Parse HTML table rows
    // SBD table usually has: team | ml_bet% | ml_money% | rl_bet% | rl_money% | ou_bet% | ou_money%
    const rows = [...html.matchAll(/<tr[^>]*class="[^"]*(?:game|matchup|team-row)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi)];
    if (rows.length === 0) {
      // Try generic table rows with enough percentage cells
      const allRows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      for (let i = 0; i < allRows.length - 1; i += 2) {
        const row1 = allRows[i][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const row2 = allRows[i+1][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const pcts1 = [...row1.matchAll(/(\d{1,3})%/g)].map(m => parseInt(m[1]));
        const pcts2 = [...row2.matchAll(/(\d{1,3})%/g)].map(m => parseInt(m[1]));
        const teamMatch = row1.match(/([A-Z][a-z]+ [A-Z][a-z]+|[A-Z]{2,4})/);
        if (pcts1.length >= 3 && pcts2.length >= 3 && teamMatch) {
          games.push({
            away: teamMatch[1],
            home: 'TBD',
            ml:  { awayBet: pcts1[0], homeBet: 100-pcts1[0], awayMoney: pcts1[1], homeMoney: 100-pcts1[1] },
            rl:  { awayBet: pcts1[2]||50, homeBet: 100-(pcts1[2]||50), awayMoney: pcts1[3]||50, homeMoney: 100-(pcts1[3]||50) },
            ou:  { overBet: pcts2[0]||50, underBet: 100-(pcts2[0]||50), overMoney: pcts2[1]||50, underMoney: 100-(pcts2[1]||50) },
          });
        }
      }
    }
  } catch (e) {
    console.log('SBD parse error:', e.message);
  }

  return games;
}
