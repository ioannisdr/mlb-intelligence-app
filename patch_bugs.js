const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// CHANGE 1: Prioritize liveMkt in calculateModel
const mktBlockOld = `  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (histOverrideEarly && histOverrideEarly.mkt) {
    mkt = JSON.parse(JSON.stringify(histOverrideEarly.mkt));
  } else if (cDateStr && typeof window !== 'undefined' && window.HISTORICAL_ODDS && window.HISTORICAL_ODDS[cDateStr] && window.HISTORICAL_ODDS[cDateStr][g.home] && window.HISTORICAL_ODDS[cDateStr][g.home][currentBook]) {
    mkt = JSON.parse(JSON.stringify(window.HISTORICAL_ODDS[cDateStr][g.home][currentBook]));
  } else if (liveMkt) {
    mkt = JSON.parse(JSON.stringify(liveMkt));
  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {`;

const mktBlockNew = `  if (overrideMkt) {
    mkt = JSON.parse(JSON.stringify(overrideMkt));
  } else if (liveMkt) {
    mkt = JSON.parse(JSON.stringify(liveMkt));
  } else if (histOverrideEarly && histOverrideEarly.mkt) {
    mkt = JSON.parse(JSON.stringify(histOverrideEarly.mkt));
  } else if (cDateStr && typeof window !== 'undefined' && window.HISTORICAL_ODDS && window.HISTORICAL_ODDS[cDateStr] && window.HISTORICAL_ODDS[cDateStr][g.home] && window.HISTORICAL_ODDS[cDateStr][g.home][currentBook]) {
    mkt = JSON.parse(JSON.stringify(window.HISTORICAL_ODDS[cDateStr][g.home][currentBook]));
  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {`;

// Normalize line endings to \n
let htmlNormalized = html.replace(/\r\n/g, '\n');
let blockOldNorm = mktBlockOld.replace(/\r\n/g, '\n');

if (htmlNormalized.includes(blockOldNorm)) {
  html = htmlNormalized.replace(blockOldNorm, mktBlockNew);
  console.log('CHANGE 1 (mkt priority) applied successfully');
} else {
  console.log('CHANGE 1 FAILED');
}

// CHANGE 2: Replace skip icons in header and JS
// Header icon
html = html.replace(/⚪ SKIP/g, '⬜ SKIP');
// Header icon fallback
html = html.replace(/(\?\s*)?SKIP/g, function(match, p1) {
    if (match === '⬜ SKIP') return match;
    if (match === '⚪ SKIP') return '⬜ SKIP';
    // Only target places with actual symbols before SKIP, not just the word SKIP in JS.
    return match;
});

// Javascript icons
// Find all instances of icon: "..." or icon: '...' for SKIP
html = html.replace(/(l:\s*['"]SKIP['"],\s*c:\s*['"]sig-skip['"],\s*v:\s*1,\s*icon:\s*)['"].*?['"]/g, '$1"⬜"');

// Fix in HTML string templates where the skip icon is rendered
html = html.replace(/<span class="sig-box sig-skip">.*?SKIP<\/span>/g, '<span class="sig-box sig-skip">⬜ SKIP</span>');
html = html.replace(/<span class='sig-box sig-skip'>.*?SKIP<\/span>/g, '<span class=\'sig-box sig-skip\'>⬜ SKIP</span>');

// Replace any leftover ⚪ if any was hardcoded in another format
html = html.replace(/⚪/g, '⬜');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Finished applying changes.');
