const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target1 = \  let mkt;
  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (histOverrideEarly && histOverrideEarly.mkt) {\;

const replacement1 = \  const frontEndOddsGame = typeof oddsData !== 'undefined' ? oddsData.find(od => od.home === g.home) : null;
  const currentFrontEndOdds = frontEndOddsGame && frontEndOddsGame.books ? frontEndOddsGame.books[currentBook] : null;

  let mkt;
  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (histOverrideEarly && histOverrideEarly.mkt) {\;

const target2 = \  } else if (liveMkt) {
    mkt = JSON.parse(JSON.stringify(liveMkt));
  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {\;

const replacement2 = \  } else if (liveMkt) {
    mkt = JSON.parse(JSON.stringify(liveMkt));
  } else if (currentFrontEndOdds) {
    mkt = JSON.parse(JSON.stringify(currentFrontEndOdds));
  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {\;

html = html.replace(target1, replacement1);
html = html.replace(target2, replacement2);

fs.writeFileSync('index.html', html, 'utf8');
console.log('calculateModel updated with oddsData source.');
