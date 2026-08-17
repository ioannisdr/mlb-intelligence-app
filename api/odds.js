// api/odds.js — Real MLB odds from ESPN Scoreboard API
// Cache: 90s (lines can move any minute during game day)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${todayStr}`;
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
        
        const homeComp = comp.competitors.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors.find(c => c.homeAway === 'away');
        const homeTeam = homeComp?.team?.name || '';
        const awayTeam = awayComp?.team?.name || '';
        const homeP = homeComp?.probables?.[0]?.athlete?.fullName || 'TBD';
        const awayP = awayComp?.probables?.[0]?.athlete?.fullName || 'TBD';
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

        function getTeamName(fullName) {
          if(!fullName) return "UNK";
          if(fullName.includes("Red Sox")) return "Red Sox";
          if(fullName.includes("White Sox")) return "White Sox";
          if(fullName.includes("Blue Jays")) return "Blue Jays";
          return fullName.split(' ').pop();
        }

        const match = {
          away: getTeamName(awayTeam),
          home: getTeamName(homeTeam),
          awayP: awayP,
          homeP: homeP,
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
        return res.status(200).json({ source: 'live-espn', games: oddsData });
      }
    }
  } catch (e) {
    console.log('ESPN fetch error:', e.message);
  }

  return res.status(200).json({ source: 'fallback', games: [] });
}
