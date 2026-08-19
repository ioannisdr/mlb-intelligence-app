const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix runBacktest TODAY slate matching:
html = html.replace(
  'const isTodaySlate = TODAY.some(tg => tg.home === home && tg.away === away);',
  'const isTodaySlate = TODAY.some(tg => tg.home === home && tg.away === away && tg.homeP === homePName && tg.awayP === awayPName);'
);

// Fix the renderTrendsChart crash:
// In renderTrendsChart it was: game = oddsData.find(o => o.away === away && o.home === home && o.awayP === awayPName && o.homeP === homePName);
// But awayPName is undefined. We should use `mockG.awayP` and `mockG.homeP` or just match on away and home since it's just getting trend lines.
// Actually mockG has awayP: 'TBD', homeP: 'TBD'.
// The user doesn't care about the trends chart bug (which I introduced), they just want it fixed. Let's revert it.
html = html.replace(
  'game = oddsData.find(o => o.away === away && o.home === home && o.awayP === awayPName && o.homeP === homePName);',
  'game = oddsData.find(o => o.away === away && o.home === home);'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed runBacktest and reverted renderTrendsChart bug');
