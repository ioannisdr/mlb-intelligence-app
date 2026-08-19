const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ── 1. Inject the fuzzy matcher helper right before calculateModel ──────────
const calcModelAnchor = '// -- MARKET ODDS ----------------------------------------------------------\n  // Priority: real API odds > backtest override > simulated from model prob\n  let liveMkt = null;';

const fuzzyHelper = `// -- SMART ODDS MATCHER ---------------------------------------------------
  // Matches by teams first; if multiple games exist (series), uses fuzzy
  // pitcher last-name substring matching to pick the right game.
  function findOddsGame(oddsArr, away, home, awayPitcher, homePitcher) {
    if (!oddsArr || !Array.isArray(oddsArr)) return null;
    const teamMatches = oddsArr.filter(o => o.away === away && o.home === home);
    if (teamMatches.length === 0) return null;
    if (teamMatches.length === 1) return teamMatches[0];
    // Multiple games (series) — fuzzy match pitchers
    const lastWord = (s) => (s || '').trim().split(/\\s+/).pop().toLowerCase();
    const fuzzyP = (dbP, espnP) => {
      if (!dbP || !espnP || dbP === 'TBD' || espnP === 'TBD') return false;
      const a = dbP.toLowerCase(), b = espnP.toLowerCase();
      if (a === b) return true;
      if (a.includes(b) || b.includes(a)) return true;
      return lastWord(dbP) === lastWord(espnP);
    };
    // Try to find exact fuzzy pitcher match
    const pitcherMatch = teamMatches.find(o =>
      fuzzyP(awayPitcher, o.awayP) && fuzzyP(homePitcher, o.homeP)
    );
    if (pitcherMatch) return pitcherMatch;
    // Partial: at least one pitcher matches
    const partialMatch = teamMatches.find(o =>
      fuzzyP(awayPitcher, o.awayP) || fuzzyP(homePitcher, o.homeP)
    );
    if (partialMatch) return partialMatch;
    // Last resort: return first team match
    return teamMatches[0];
  }

  // -- MARKET ODDS ----------------------------------------------------------
  // Priority: real API odds > backtest override > simulated from model prob
  let liveMkt = null;`;

html = html.replace(calcModelAnchor, fuzzyHelper);

// ── 2. Replace the calculateModel oddsData.find with findOddsGame ───────────
html = html.replace(
  `const liveGame = oddsData.find(o => \`\${o.away}@\${o.home}-\${o.awayP}-\${o.homeP}\` === \`\${g.away}@\${g.home}-\${g.awayP}-\${g.homeP}\`);`,
  `const liveGame = findOddsGame(oddsData, g.away, g.home, g.awayP, g.homeP);`
);

// ── 3. Fix runBacktest isTodaySlate — fuzzy pitcher match ────────────────────
html = html.replace(
  `const isTodaySlate = TODAY.some(tg => tg.home === home && tg.away === away && tg.homeP === homePName && tg.awayP === awayPName);`,
  `const isTodaySlate = TODAY.some(tg => tg.home === home && tg.away === away);`
);

// ── 4. Revert Odds Movement snapshot keys to simple away@home ───────────────
//    These keys are internal to the Odds Movement tab and do NOT need pitchers.
html = html.replace(
  "const key = `${g.away}@${g.home}-${g.awayP}-${g.homeP}`;",
  "const key = `${g.away}@${g.home}`;"
);
html = html.replace(
  "const prevGame = oddsData.find(oldG => `${oldG.away}@${oldG.home}-${oldG.awayP}-${oldG.homeP}` === key);",
  "const prevGame = oddsData.find(oldG => `${oldG.away}@${oldG.home}` === key);"
);
html = html.replace(
  "const snapKey = `${away}@${home}-${game.awayP}-${game.homeP}`;",
  "const snapKey = `${away}@${home}`;"
);

// ── 5. Fix backfill matching in loadOddsTab — use simple team match ─────────
html = html.replace(
  "if (!oddsData.find(o => `${o.away}@${o.home}-${o.awayP}-${o.homeP}` === `${g.away}@${g.home}-${g.awayP}-${g.homeP}`)) {",
  "if (!oddsData.find(o => o.away === g.away && o.home === g.home)) {"
);
html = html.replace(
  "const simGame = simOdds.find(o => `${o.away}@${o.home}-${o.awayP}-${o.homeP}` === `${g.away}@${g.home}-${g.awayP}-${g.homeP}`);",
  "const simGame = simOdds.find(o => o.away === g.away && o.home === g.home);"
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fuzzy matcher applied successfully.');
