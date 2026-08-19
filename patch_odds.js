const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const injection = `
window.HISTORICAL_ODDS = window.HISTORICAL_ODDS || {};
window.HISTORICAL_ODDS['2026-08-03'] = {};
const Aug3Games = {
  'Phillies': { ml: { a: +135, h: -160 }, ou: 9, ouPrice: { o: -125, u: +105 } },
  'Yankees': { ml: { a: +205, h: -250 }, ou: 8, ouPrice: { o: +100, u: -120 } },
  'Brewers': { ml: { a: -110, h: -110 }, ou: 8.5, ouPrice: { o: -120, u: +100 } },
  'Cubs': { ml: { a: -125, h: +105 }, ou: 7.5, ouPrice: { o: -115, u: -105 } },
  'Rangers': { ml: { a: +110, h: -130 }, ou: 8, ouPrice: { o: -110, u: -110 } },
  'Rockies': { ml: { a: -170, h: +145 }, ou: 11.5, ouPrice: { o: -105, u: -115 } },
  'Diamondbacks': { ml: { a: -110, h: -110 }, ou: 8.5, ouPrice: { o: -120, u: +100 } }
};
const books = ['DraftKings', 'ESPNBet', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers', 'Fanatics', 'bet365', 'HardRock', 'PointsBet'];
for (const home in Aug3Games) {
  window.HISTORICAL_ODDS['2026-08-03'][home] = {};
  for (const book of books) {
    window.HISTORICAL_ODDS['2026-08-03'][home][book] = Aug3Games[home];
  }
}
`;

if (!code.includes("window.HISTORICAL_ODDS['2026-08-03']")) {
  code = code.replace('const HISTORICAL_FROZEN = {', injection + '\nconst HISTORICAL_FROZEN = {');
  fs.writeFileSync('index.html', code);
  console.log('Successfully injected HISTORICAL_ODDS into index.html');
} else {
  console.log('HISTORICAL_ODDS already injected.');
}
