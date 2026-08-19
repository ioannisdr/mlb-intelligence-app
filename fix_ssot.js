// fix_ssot.js - Single Source of Truth: make Predictions tab read from oddsData
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changes = 0;

// ── CHANGE 1 ──────────────────────────────────────────────────────────────────
// After ODDS is populated in loadData(), eagerly populate oddsData from the same
// API response so it's available BEFORE renderApp() runs.
// We insert right after the "} catch(e) {}" that closes the localStorage caching block.

const oddsPopTarget = "ODDS = { ...cachedOdds, ...ODDS };\n    } catch(e) {}";
const oddsPopReplace = `ODDS = { ...cachedOdds, ...ODDS };
    } catch(e) {}

    // -- Eagerly populate oddsData (Single Source of Truth for Predictions + Odds Movement) --
    const oddsGames = oddsRes?.games || (Array.isArray(oddsRes) ? oddsRes : []);
    if (oddsGames.length > 0) {
      oddsData = oddsGames;
    }`;

if (html.includes(oddsPopTarget)) {
  html = html.replace(oddsPopTarget, oddsPopReplace);
  changes++;
  console.log('CHANGE 1 applied: oddsData eagerly populated in loadData()');
} else {
  console.log('CHANGE 1 FAILED: target not found');
}

// ── CHANGE 2 ──────────────────────────────────────────────────────────────────
// Remove the duplicate currentFrontEndOdds dead code from calculateModel.
// liveMkt (lines 2073-2078) already reads from oddsData, so currentFrontEndOdds
// is redundant. Remove the declaration AND the else-if branch.

const deadCode1 = `  const frontEndOddsGame = typeof oddsData !== "undefined" ? oddsData.find(od => od.home === g.home) : null;
  const currentFrontEndOdds = frontEndOddsGame && frontEndOddsGame.books ? frontEndOddsGame.books[currentBook] : null;

  let mkt;`;
const deadCode1Replace = `  let mkt;`;

if (html.includes(deadCode1)) {
  html = html.replace(deadCode1, deadCode1Replace);
  changes++;
  console.log('CHANGE 2a applied: removed duplicate currentFrontEndOdds declaration');
} else {
  console.log('CHANGE 2a FAILED: target not found');
}

const deadCode2 = `  } else if (currentFrontEndOdds) {
    mkt = JSON.parse(JSON.stringify(currentFrontEndOdds));
  } else if (ODDS[g.home]`;
const deadCode2Replace = `  } else if (ODDS[g.home]`;

if (html.includes(deadCode2)) {
  html = html.replace(deadCode2, deadCode2Replace);
  changes++;
  console.log('CHANGE 2b applied: removed duplicate currentFrontEndOdds else-if');
} else {
  console.log('CHANGE 2b FAILED: target not found');
}

// ── CHANGE 3 ──────────────────────────────────────────────────────────────────
// Fix the broken renderPredictions() call inside loadOddsTab to renderApp().
// renderPredictions() does not exist, so the Predictions tab never re-renders.

const brokenCall = 'renderPredictions();';
const fixedCall = 'renderApp();';

if (html.includes(brokenCall)) {
  html = html.replace(brokenCall, fixedCall);
  changes++;
  console.log('CHANGE 3 applied: renderPredictions() -> renderApp()');
} else {
  console.log('CHANGE 3 FAILED: target not found (may already be fixed)');
}

// ── CHANGE 4 ──────────────────────────────────────────────────────────────────
// Also clean up the duplicate currentFrontEndOdds in runBacktest if it exists
const btDeadCode = `            const frontEndOddsGame = typeof oddsData !== "undefined" ? oddsData.find(od => od.home === home) : null;
            const currentFrontEndOdds = frontEndOddsGame && frontEndOddsGame.books ? frontEndOddsGame.books[currentBook] : null;
            
            if (isTodaySlate && currentFrontEndOdds) {
               realMkt = currentFrontEndOdds;
            } else if (isTodaySlate && ODDS[home] && ODDS[home][currentBook]) {`;
const btDeadCodeReplace = `            if (isTodaySlate && ODDS[home] && ODDS[home][currentBook]) {`;

if (html.includes(btDeadCode)) {
  html = html.replace(btDeadCode, btDeadCodeReplace);
  changes++;
  console.log('CHANGE 4 applied: removed duplicate currentFrontEndOdds from runBacktest');
} else {
  console.log('CHANGE 4 FAILED: target not found');
}

// Also fix isRealOdds if it was patched with currentFrontEndOdds
const isRealOddsOld = '!!currentFrontEndOdds || !!(ODDS[home] && ODDS[home][currentBook])';
const isRealOddsNew = '!!(ODDS[home] && ODDS[home][currentBook])';

if (html.includes(isRealOddsOld)) {
  html = html.replace(isRealOddsOld, isRealOddsNew);
  changes++;
  console.log('CHANGE 5 applied: reverted isRealOdds to clean state');
} else {
  console.log('CHANGE 5 SKIPPED: not found (already clean)');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log(`\nDone. ${changes} changes applied.`);
