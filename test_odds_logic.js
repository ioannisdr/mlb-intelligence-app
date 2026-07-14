import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function handler() {
  try {
    const response = await fetch('https://www.sportsbookreview.com/betting-odds/mlb-baseball/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      agent
    });

    const oddsData = [];

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const nextData = $('#__NEXT_DATA__').html();
      
      if (nextData) {
        const json = JSON.parse(nextData);
        let tables = json.props?.pageProps?.oddsTables || [];
        
        if (tables.length > 0) {
          tables[0].gameRows?.forEach(row => {
            if (!row.gameView) return;
            let away = row.gameView.awayTeam?.shortName || row.gameView.awayTeam?.name;
            let home = row.gameView.homeTeam?.shortName || row.gameView.homeTeam?.name;
            
            if (away && home) {
               let books = {
                 DraftKings: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 },
                 FanDuel: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 },
                 BetMGM: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 },
                 Caesars: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 },
                 BetRivers: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 },
                 Bovada: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 }
               };

               row.oddsViews?.forEach(o => {
                 let sb = o.sportsbook;
                 let hOdds = o.currentLine?.homeOdds || -110;
                 let aOdds = o.currentLine?.awayOdds || -110;
                 
                 let mkt = null;
                 if (sb === 'draftkings') mkt = 'DraftKings';
                 if (sb === 'fanduel') mkt = 'FanDuel';
                 if (sb === 'betmgm') mkt = 'BetMGM';
                 if (sb === 'caesars') mkt = 'Caesars';
                 if (sb === 'betrivers') mkt = 'BetRivers';
                 if (sb === 'bovada') mkt = 'Bovada';
                 
                 if (mkt && hOdds && aOdds) {
                   books[mkt].ml.h = hOdds;
                   books[mkt].ml.a = aOdds;
                 }
               });
               
               oddsData.push({ away, home, books });
            }
          });
        }
      }
    }
    console.log(oddsData.length > 0 ? oddsData[0] : "Empty oddsData");
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
}
handler();
