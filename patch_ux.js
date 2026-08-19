const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// TASK 3: Real Sportsbook Logos
const bookMetaRegex = /const BOOK_META = \{[\s\S]*?\};\r?\n/;
const newBookMeta = `const BOOK_META = {
  DraftKings:  { icon: "<img src='https://www.draftkings.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#43a047' },
  FanDuel:     { icon: "<img src='https://www.fanduel.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#1976d2' },
  BetMGM:      { icon: "<img src='https://sports.betmgm.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#bfa15f' },
  Caesars:     { icon: "<img src='https://www.caesars.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#fdd835' },
  BetRivers:   { icon: "<img src='https://betrivers.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ffb300' },
  ESPNBet:     { icon: "<img src='https://espnbet.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' },
  Fanatics:    { icon: "<img src='https://sportsbook.fanatics.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#00d68f' },
  bet365:      { icon: "<img src='https://www.bet365.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#00b900' },
  HardRock:    { icon: "<img src='https://hardrock.bet/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ffd100' },
  PointsBet:   { icon: "<img src='https://pointsbet.com/favicon.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' },
};\n`;

if (code.match(bookMetaRegex)) {
  code = code.replace(bookMetaRegex, newBookMeta);
  console.log('Task 3: Replaced BOOK_META with image tags.');
} else {
  console.log('Task 3: Could not find BOOK_META regex match.');
}

// TASK 2: Persist Accordion State on Auto-Refresh
// Add global variable for accordion state
const globalVarAnchor = `let oddsRefreshTimer = null;`;
if (code.includes(globalVarAnchor) && !code.includes('let openAccordionGid = null;')) {
  code = code.replace(globalVarAnchor, `let oddsRefreshTimer = null;\nlet openAccordionGid = null;`);
  console.log('Task 2: Added openAccordionGid global state.');
}

// Update toggleLineTrends
const toggleOld = `function toggleLineTrends(gId, away, home, time) {
  const acc = document.getElementById(\`trends-acc-\${gId}\`);
  if (acc.style.display === 'none') {
    acc.style.display = 'block';
    renderTrendsChart(gId, away, home);
  } else {
    acc.style.display = 'none';
  }
}`;
const toggleNew = `function toggleLineTrends(gId, away, home, time) {
  const acc = document.getElementById(\`trends-acc-\${gId}\`);
  if (acc.style.display === 'none') {
    acc.style.display = 'block';
    openAccordionGid = gId;
    renderTrendsChart(gId, away, home);
  } else {
    acc.style.display = 'none';
    if (openAccordionGid === gId) openAccordionGid = null;
  }
}`;
if (code.includes(toggleOld)) {
  code = code.replace(toggleOld, toggleNew);
  console.log('Task 2: Updated toggleLineTrends.');
} else {
  // try regex or CRLF version
  const toggleOldCRLF = toggleOld.replace(/\n/g, '\r\n');
  if (code.includes(toggleOldCRLF)) {
    code = code.replace(toggleOldCRLF, toggleNew.replace(/\n/g, '\r\n'));
    console.log('Task 2: Updated toggleLineTrends (CRLF).');
  } else {
    console.log('Task 2: Could not find toggleLineTrends.');
  }
}

// Restore accordion state after rendering
const renderEndStr = `document.querySelectorAll('.trends-book-select').forEach(sel => {
    sel.addEventListener('change', function() {
      renderTrendsChart(this.dataset.gid, this.dataset.away, this.dataset.home);
    });
  });
}`;
const renderEndNew = `document.querySelectorAll('.trends-book-select').forEach(sel => {
    sel.addEventListener('change', function() {
      renderTrendsChart(this.dataset.gid, this.dataset.away, this.dataset.home);
    });
  });
  
  if (openAccordionGid) {
    const activeBtn = document.querySelector(\`.trends-toggle-btn[data-gid="\${openAccordionGid}"]\`);
    if (activeBtn) activeBtn.click();
  }
}`;
if (code.includes(renderEndStr)) {
  code = code.replace(renderEndStr, renderEndNew);
  console.log('Task 2: Restored accordion state at end of renderOddsTab.');
} else {
  const renderEndStrCRLF = renderEndStr.replace(/\n/g, '\r\n');
  if (code.includes(renderEndStrCRLF)) {
    code = code.replace(renderEndStrCRLF, renderEndNew.replace(/\n/g, '\r\n'));
    console.log('Task 2: Restored accordion state at end of renderOddsTab (CRLF).');
  } else {
    console.log('Task 2: Could not find end of renderOddsTab.');
  }
}

// TASK 1: Chart Granularity
const walkOld = `  const mlWalk = (startA) => {
    const pts = [startA];
    for (let i = 1; i < 6; i++) {
      const delta = Math.round((seed(\`ml\${i}\`) - 0.48) * 8);
      pts.push(pts[pts.length - 1] + delta);
    }
    return pts;
  };`;

const walkNew = `  const numPts = 60;
  const mlWalk = (startA) => {
    const pts = [startA];
    let current = startA;
    for (let i = 1; i < numPts; i++) {
      const delta = Math.round((seed(\`ml\${i}\`) - 0.48) * 6);
      current += delta;
      pts.push(current);
    }
    return pts;
  };`;

const labelsOld = `  const LABELS = ['Open', 'T-8h', 'T-4h', 'T-2h', 'T-1h', 'Close'];`;
const labelsNew = `  const numPts = 60;
  const LABELS = Array.from({length: numPts}, (_, i) => {
    if (i === 0) return 'Open';
    if (i === 12) return 'T-8h';
    if (i === 24) return 'T-4h';
    if (i === 36) return 'T-2h';
    if (i === 48) return 'T-1h';
    if (i === numPts - 1) return 'Close';
    return '';
  });`;

const modelPtsOld = `const modelPts = LABELS.map(() => homeFV);`;
const modelPtsNew = `const modelPts = Array(numPts).fill(homeFV);`;

if (code.includes(walkOld)) {
  code = code.replace(walkOld, walkNew);
  console.log('Task 1: Updated mlWalk.');
} else {
  const walkOldCRLF = walkOld.replace(/\n/g, '\r\n');
  if (code.includes(walkOldCRLF)) {
    code = code.replace(walkOldCRLF, walkNew.replace(/\n/g, '\r\n'));
    console.log('Task 1: Updated mlWalk (CRLF).');
  } else {
    console.log('Task 1: Could not find mlWalk.');
  }
}

if (code.includes(labelsOld)) {
  code = code.replace(labelsOld, labelsNew);
  console.log('Task 1: Updated LABELS.');
} else {
  const labelsOldCRLF = labelsOld.replace(/\n/g, '\r\n');
  if (code.includes(labelsOldCRLF)) {
    code = code.replace(labelsOldCRLF, labelsNew.replace(/\n/g, '\r\n'));
    console.log('Task 1: Updated LABELS (CRLF).');
  } else {
    console.log('Task 1: Could not find LABELS.');
  }
}

if (code.includes(modelPtsOld)) {
  code = code.replace(modelPtsOld, modelPtsNew);
  console.log('Task 1: Updated modelPts.');
} else {
  const modelPtsOldCRLF = modelPtsOld.replace(/\n/g, '\r\n');
  if (code.includes(modelPtsOldCRLF)) {
    code = code.replace(modelPtsOldCRLF, modelPtsNew.replace(/\n/g, '\r\n'));
    console.log('Task 1: Updated modelPts (CRLF).');
  } else {
    console.log('Task 1: Could not find modelPts.');
  }
}

// Ensure chart doesn't skip labels since we use empty strings
const ticksOld = `x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } }`;
const ticksNew = `x: { ticks: { color: '#888', font: { size: 10 }, autoSkip: false, maxRotation: 0 }, grid: { color: '#333' } }`;
if (code.includes(ticksOld)) {
  code = code.replace(ticksOld, ticksNew);
  console.log('Task 1: Updated x-axis ticks to show custom labels.');
} else {
  const ticksOldCRLF = ticksOld.replace(/\n/g, '\r\n');
  if (code.includes(ticksOldCRLF)) {
    code = code.replace(ticksOldCRLF, ticksNew.replace(/\n/g, '\r\n'));
    console.log('Task 1: Updated x-axis ticks to show custom labels (CRLF).');
  } else {
    console.log('Task 1: Could not find x-axis ticks.');
  }
}


fs.writeFileSync('index.html', code);
console.log('DONE!');
