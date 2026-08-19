const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// TASK 1: Replace VS with @
code = code.replace(/<span class="gc-vs-badge">VS<\/span>/g, '<span class="gc-vs-badge">@</span>');
code = code.replace(/<div class="ls-matchup">\$\{g\.away\} vs \$\{g\.home\}<\/div>/g, '<div class="ls-matchup">${g.away} @ ${g.home}</div>');

// TASK 2: Fix HISTORICAL_FROZEN logic in calculateModel
const mktBlock = `  let liveMkt = null;
  if (typeof oddsData !== 'undefined' && Array.isArray(oddsData)) {
    const liveGame = oddsData.find(o => o.home === g.home);
    if (liveGame && liveGame.books && liveGame.books[currentBook]) {
      liveMkt = liveGame.books[currentBook];
    }
  }

  const cDateStr = g.dateKey || (typeof formatDateStr !== 'undefined' ? formatDateStr(g.gameDate ? new Date(g.gameDate) : new Date()) : null);
  const cFreezeKey = \`\${g.away}@\${g.home}\`;
  const histOverrideEarly = (cDateStr && typeof HISTORICAL_FROZEN !== 'undefined') ? (HISTORICAL_FROZEN[cDateStr] && HISTORICAL_FROZEN[cDateStr][cFreezeKey]) : null;

  let mkt;
  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (histOverrideEarly && histOverrideEarly.mkt) {
    mkt = JSON.parse(JSON.stringify(histOverrideEarly.mkt));
  } else if (g.dateKey && typeof window !== 'undefined' && window.HISTORICAL_ODDS && window.HISTORICAL_ODDS[g.dateKey] && window.HISTORICAL_ODDS[g.dateKey][g.home] && window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]) {`;

code = code.replace(/  let liveMkt = null;[\s\S]*?window\.HISTORICAL_ODDS\[g\.dateKey\]\[g\.home\]\[currentBook\]\) \{/, mktBlock);

fs.writeFileSync('index.html', code);
console.log('Patched index.html');
