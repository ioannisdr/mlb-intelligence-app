const url = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

fetch(url)
  .then(r => r.json())
  .then(data => {
    const oddsData = [];
    data.events.forEach(ev => {
      const comp = ev.competitions[0];
      if (!comp) return;
      
      const homeTeam = comp.competitors.find(c => c.homeAway === 'home')?.team?.name || '';
      const awayTeam = comp.competitors.find(c => c.homeAway === 'away')?.team?.name || '';
      const odds = comp.odds ? comp.odds[0] : null;
      
      if (!homeTeam || !awayTeam || !odds) return;

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
        }
      };
      oddsData.push(match);
    });
    console.log(JSON.stringify(oddsData, null, 2));
  });
