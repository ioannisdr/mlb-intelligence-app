const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /\${o\.away}@\${o\.home}` === `\${g\.away}@\${g\.home}`/g;
html = html.replace(regex, '${o.away}@${o.home}-${o.awayP}-${o.homeP}` === `${g.away}@${g.home}-${g.awayP}-${g.homeP}`');

// Wait! In `runBacktest`, the match is:
// game = oddsData.find(g => g.away === away && g.home === home);
// We should update it to:
// game = oddsData.find(o => o.away === away && o.home === home && o.awayP === awayPName && o.homeP === homePName);
html = html.replace(
  'game = oddsData.find(g => g.away === away && g.home === home);',
  'game = oddsData.find(o => o.away === away && o.home === home && o.awayP === awayPName && o.homeP === homePName);'
);

// Also Odds Movement tab creates a key:
// const snapKey = `${away}@${home}`;
// oddsSnapshot[key] = ...
// const prevGame = oddsData.find(oldG => `${oldG.away}@${oldG.home}` === key);
// Let's replace the odds movement tab logic:
html = html.replace(/const key = `\${g\.away}@\${g\.home}`;/g, 'const key = `${g.away}@${g.home}-${g.awayP}-${g.homeP}`;');
html = html.replace(/const snapKey = `\${away}@\${home}`;/g, 'const snapKey = `${away}@${home}-${game.awayP}-${game.homeP}`;');

// And in `loadOddsTab` for `prevGame`:
html = html.replace(/const prevGame = oddsData\.find\(oldG => `\${oldG\.away}@\${oldG\.home}` === key\);/g, 'const prevGame = oddsData.find(oldG => `${oldG.away}@${oldG.home}-${oldG.awayP}-${oldG.homeP}` === key);');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed matching logic to include pitchers');
