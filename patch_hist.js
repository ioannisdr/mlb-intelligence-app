const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the anchor: right after HISTORICAL_ODDS definition (or right before calculateModel)
// We will inject right before the `const HISTORICAL_FROZEN` declaration
const anchor = 'const HISTORICAL_FROZEN = {';

const template = `// ═══════════════════════════════════════════════════════════════════════════════
// HARDCODED HISTORICAL BET365 ODDS — Aug 1-6, 2026
// Format mirrors oddsData: { away, home, books: { bet365: { ml: {h, a}, ou: N, ouPrice: {o, u} } } }
// ═══════════════════════════════════════════════════════════════════════════════
const HISTORICAL_BET365 = {
  // ────────── AUGUST 1 ──────────
  // PASTE REAL BET365 ODDS BELOW. Example format for each game:
  // { away: "TeamAbbr", home: "TeamAbbr", ml: { h: -150, a: +130 }, ou: 8.5 }
  "2026-08-01": [
    // e.g. { away: "Nationals", home: "Phillies", ml: { h: -180, a: +155 }, ou: 8.0 },
  ],
  // ────────── AUGUST 2 ──────────
  "2026-08-02": [
  ],
  // ────────── AUGUST 3 ──────────
  "2026-08-03": [
  ],
  // ────────── AUGUST 4 ──────────
  "2026-08-04": [
  ],
  // ────────── AUGUST 5 ──────────
  "2026-08-05": [
  ],
  // ────────── AUGUST 6 ──────────
  "2026-08-06": [
  ],
};

// Helper: lookup hardcoded bet365 odds for a game on a historical date
function getHistoricalBet365(dateStr, away, home) {
  const dayGames = HISTORICAL_BET365[dateStr];
  if (!dayGames || dayGames.length === 0) return null;
  const match = dayGames.find(g => g.away === away && g.home === home);
  if (!match) return null;
  // Return in the same shape as a books[bookName] entry
  return {
    ml: match.ml,
    ou: match.ou,
    ouPrice: match.ouPrice || { o: -110, u: -110 },
    rl: match.rl || { aLine: '+1.5', aPrice: -110, hLine: '-1.5', hPrice: -110 }
  };
}

const HISTORICAL_FROZEN = {`;

html = html.replace(anchor, template);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Injected HISTORICAL_BET365 template and helper.');

