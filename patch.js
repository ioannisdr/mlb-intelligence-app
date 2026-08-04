const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove red dot
code = code.replace('🔴 Live Scores', 'Live Scores');

// 2. Best available line UI fixes
code = code.replace('.odds-best::after { content:\'?\'; font-size:9px; vertical-align:super; margin-left:2px; opacity:.7; }', '.odds-best::after { content:\'⭐\'; font-size:9px; vertical-align:super; margin-left:2px; opacity:1; }');
code = code.replace('<span class=\"legend-dot\" style=\"background:#ffd100\"></span> Best available line', '<span style=\"font-size:10px;\">⭐</span> Best available line');

// 3. Pitcher Headshots 
// Replace the two occurrences of 67/current.png to 67:current.png
code = code.replace('d_people:generic:headshot:67/current.png', 'd_people:generic:headshot:67:current.png');
code = code.replace('d_people:generic:headshot:67/current.png', 'd_people:generic:headshot:67:current.png');

// 4. Sportsbook Logos
const bookMetaOld = `const BOOK_META = {
  DraftKings:  { icon: "🔥", color: '#00d68f' },
  FanDuel:     { icon: '🛡️', color: '#4da6ff' },
  BetMGM:      { icon: "🔥", color: '#ffa500' },
  Caesars:     { icon: '🏛️', color: '#a78bfa' },
  BetRivers:   { icon: "🔥", color: '#4da6ff' },
  ESPNBet:     { icon: "🔥", color: '#ef476f' },
  Fanatics:    { icon: "🔥", color: '#00d68f' },
  bet365:      { icon: "✅", color: '#00b900' },
  HardRock:    { icon: "🔥", color: '#ffd100' },
  PointsBet:   { icon: "🔥", color: '#ef476f' },
};`;

const bookMetaNew = `const BOOK_META = {
  DraftKings:  { icon: '👑', color: '#00d68f' },
  FanDuel:     { icon: '🛡️', color: '#4da6ff' },
  BetMGM:      { icon: '🦁', color: '#ffa500' },
  Caesars:     { icon: '🏛️', color: '#a78bfa' },
  BetRivers:   { icon: '🌊', color: '#4da6ff' },
  ESPNBet:     { icon: '🏈', color: '#ef476f' },
  Fanatics:    { icon: '🦅', color: '#00d68f' },
  bet365:      { icon: '⚽', color: '#00b900' },
  HardRock:    { icon: '🎸', color: '#ffd100' },
  PointsBet:   { icon: '📍', color: '#ef476f' },
};`;
code = code.replace(bookMetaOld, bookMetaNew);

// 5. Closing Odds Historical Fix
const mktOld = `  let mkt;
  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (g.dateKey && typeof window !== 'undefined' && window.HISTORICAL_ODDS && window.HISTORICAL_ODDS[g.dateKey] && window.HISTORICAL_ODDS[g.dateKey][g.home] && window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]) {
    mkt = JSON.parse(JSON.stringify(window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]));`;

const mktNew = `  let mkt;
  const cDateStr = g.dateKey && g.dateKey.length === 10 ? g.dateKey : (g.gameDate ? g.gameDate.split('T')[0] : null);
  const cFreezeKey = \`\${g.away}@\${g.home}\`;
  const isStarted = g.status === 'Final' || g.status === 'Live' || g.status?.abstractGameState === 'Final' || g.status?.abstractGameState === 'Live' || g.status?.statusCode === 'F' || g.status?.statusCode === 'O' || g.status?.statusCode === 'CR' || (typeof liveGameStatusCache !== 'undefined' && (liveGameStatusCache[cFreezeKey] === 'Final' || liveGameStatusCache[cFreezeKey] === 'Live'));
  const histOverrideEarly = (isStarted && cDateStr && typeof HISTORICAL_FROZEN !== 'undefined') ? (HISTORICAL_FROZEN[cDateStr] && HISTORICAL_FROZEN[cDateStr][cFreezeKey]) : null;

  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (histOverrideEarly && histOverrideEarly.mkt) {
    mkt = JSON.parse(JSON.stringify(histOverrideEarly.mkt));
    mkt.ouPrice = { o: -110, u: -110 };
    mkt.rl = { aLine: '+1.5', aPrice: -110, hLine: '-1.5', hPrice: -110 };
  } else if (g.dateKey && typeof window !== 'undefined' && window.HISTORICAL_ODDS && window.HISTORICAL_ODDS[g.dateKey] && window.HISTORICAL_ODDS[g.dateKey][g.home] && window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]) {
    mkt = JSON.parse(JSON.stringify(window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]));`;

code = code.replace(mktOld, mktNew);

fs.writeFileSync('index.html', code);
console.log('Patch complete.');
