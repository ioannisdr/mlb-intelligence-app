const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// TASK 1: Google Favicon API
const bookMetaRegex = /const BOOK_META = \{[\s\S]*?\};\r?\n/;
const newBookMeta = `const BOOK_META = {
  DraftKings:  { icon: "<img src='https://www.google.com/s2/favicons?domain=draftkings.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#43a047' },
  FanDuel:     { icon: "<img src='https://www.google.com/s2/favicons?domain=fanduel.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#1976d2' },
  BetMGM:      { icon: "<img src='https://www.google.com/s2/favicons?domain=betmgm.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#bfa15f' },
  Caesars:     { icon: "<img src='https://www.google.com/s2/favicons?domain=caesars.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#fdd835' },
  BetRivers:   { icon: "<img src='https://www.google.com/s2/favicons?domain=betrivers.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ffb300' },
  ESPNBet:     { icon: "<img src='https://www.google.com/s2/favicons?domain=espnbet.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' },
  Fanatics:    { icon: "<img src='https://www.google.com/s2/favicons?domain=fanatics.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#00d68f' },
  bet365:      { icon: "<img src='https://www.google.com/s2/favicons?domain=bet365.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#00b900' },
  HardRock:    { icon: "<img src='https://www.google.com/s2/favicons?domain=hardrock.bet&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ffd100' },
  PointsBet:   { icon: "<img src='https://www.google.com/s2/favicons?domain=pointsbet.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' },
};\n`;

if (code.match(bookMetaRegex)) {
  code = code.replace(bookMetaRegex, newBookMeta);
  console.log('Task 1: Updated BOOK_META with Google Favicon API.');
} else {
  console.log('Task 1 Error: Could not find BOOK_META regex match.');
}

// TASK 2: Enhanced Tooltip
// Find the tooltip callback in renderTrendsChart
const tooltipOld = `tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw > 0 ? '+' : '') + Math.round(ctx.raw); } } }`;
const tooltipNew = `tooltip: { 
          callbacks: { 
            label: function(ctx) { 
              const homeVal = Math.round(ctx.raw);
              const oppOdds = homeVal > 0 ? -1 * (homeVal + 20) : Math.abs(homeVal) - 20;
              const fmt = v => (v > 0 ? '+' : '') + v;
              return \`\${ctx.dataset.label}: \${home} \${fmt(homeVal)} | \${away} \${fmt(oppOdds)}\`; 
            } 
          } 
        }`;

if (code.includes(tooltipOld)) {
  code = code.replace(tooltipOld, tooltipNew);
  console.log('Task 2: Updated tooltip callback.');
} else {
  const tooltipOldCRLF = tooltipOld.replace(/\n/g, '\r\n');
  if (code.includes(tooltipOldCRLF)) {
    code = code.replace(tooltipOldCRLF, tooltipNew.replace(/\n/g, '\r\n'));
    console.log('Task 2: Updated tooltip callback (CRLF).');
  } else {
    console.log('Task 2 Error: Could not find tooltip configuration in renderTrendsChart.');
  }
}

fs.writeFileSync('index.html', code);
console.log('Patch complete.');
