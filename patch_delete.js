const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const injectStr = `
    // INJECTED OVERRIDES
    if (HISTORICAL_FROZEN['2026-08-03']) {
      delete HISTORICAL_FROZEN['2026-08-03']['Nationals@Phillies'];
      delete HISTORICAL_FROZEN['2026-08-03']['Cardinals@Yankees'];
      delete HISTORICAL_FROZEN['2026-08-03']['Pirates@Brewers'];
      delete HISTORICAL_FROZEN['2026-08-03']['Dodgers@Cubs'];
      delete HISTORICAL_FROZEN['2026-08-03']['Giants@Rangers'];
      delete HISTORICAL_FROZEN['2026-08-03']['Rays@Rockies'];
      delete HISTORICAL_FROZEN['2026-08-03']['Padres@Diamondbacks'];
    }
    try { localStorage.removeItem('mlb_frozen_2026-08-03'); } catch(e){}
`;

if (!code.includes('INJECTED OVERRIDES')) {
  code = code.replace('HISTORICAL_FROZEN[d]["Nationals@Braves"] = skipObj;', 'HISTORICAL_FROZEN[d]["Nationals@Braves"] = skipObj;' + injectStr);
  fs.writeFileSync('index.html', code);
  console.log('Successfully injected deletion script');
} else {
  console.log('Already injected.');
}
