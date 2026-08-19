const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace in calculateModel
html = html.replace(
  'const liveGame = oddsData.find(o => o.home === g.home);',
  'const liveGame = oddsData.find(o => `${o.away}@${o.home}` === `${g.away}@${g.home}`);'
);

// Replace in loadOddsTab
html = html.replace(
  'if (!oddsData.find(o => o.home === g.home)) {',
  'if (!oddsData.find(o => `${o.away}@${o.home}` === `${g.away}@${g.home}`)) {'
);
html = html.replace(
  'const simGame = simOdds.find(o => o.home === g.home);',
  'const simGame = simOdds.find(o => `${o.away}@${o.home}` === `${g.away}@${g.home}`);'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed matching logic.');
