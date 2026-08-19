const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Revert showLineMovement changes

// Replace the duplicate const numPts = 60; and LABELS back to original
const showLineLabelsBad = `  const numPts = 60;
  const LABELS = Array.from({length: numPts}, (_, i) => {
    if (i === 0) return 'Open';
    if (i === 12) return 'T-8h';
    if (i === 24) return 'T-4h';
    if (i === 36) return 'T-2h';
    if (i === 48) return 'T-1h';
    if (i === numPts - 1) return 'Close';
    return '';
  });`;
const showLineLabelsOrig = `  const LABELS = ['Open', 'T-8h', 'T-4h', 'T-2h', 'T-1h', 'Close'];`;
if (code.includes(showLineLabelsBad)) {
    code = code.replace(showLineLabelsBad, showLineLabelsOrig);
} else {
    code = code.replace(showLineLabelsBad.replace(/\n/g, '\r\n'), showLineLabelsOrig.replace(/\n/g, '\r\n'));
}

const showLineWalkBad = `  const numPts = 60;
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
const showLineWalkOrig = `  const mlWalk = (startA) => {
    const pts = [startA];
    for (let i = 1; i < 6; i++) {
      const delta = Math.round((seed(\`ml\${i}\`) - 0.48) * 8);
      pts.push(pts[pts.length - 1] + delta);
    }
    return pts;
  };`;
if (code.includes(showLineWalkBad)) {
    code = code.replace(showLineWalkBad, showLineWalkOrig);
} else {
    code = code.replace(showLineWalkBad.replace(/\n/g, '\r\n'), showLineWalkOrig.replace(/\n/g, '\r\n'));
}

// 2. Apply changes to renderTrendsChart
const renderTrendsLabelsOrig = `  const LABELS = ['Open', 'T-8h', 'T-4h', 'T-2h', 'T-1h', 'Close'];\n  const dStr`;
const renderTrendsLabelsNew = `  const numPts = 60;\n  const LABELS = Array.from({length: numPts}, (_, i) => {
    if (i === 0) return 'Open';
    if (i === 12) return 'T-8h';
    if (i === 24) return 'T-4h';
    if (i === 36) return 'T-2h';
    if (i === 48) return 'T-1h';
    if (i === numPts - 1) return 'Close';
    return '';
  });\n  const dStr`;
if (code.includes(renderTrendsLabelsOrig)) {
    code = code.replace(renderTrendsLabelsOrig, renderTrendsLabelsNew);
} else {
    code = code.replace(renderTrendsLabelsOrig.replace(/\n/g, '\r\n'), renderTrendsLabelsNew.replace(/\n/g, '\r\n'));
}

const renderTrendsWalkOrig = `  const mlWalk = (startA) => {\n    const pts = [startA];\n    for (let i = 1; i < 6; i++) {\n      const delta = Math.round((seed(\`ml\${i}\`) - 0.48) * 8);\n      pts.push(pts[pts.length - 1] + delta);\n    }\n    return pts;\n  };`;
const renderTrendsWalkNew = `  const mlWalk = (startA) => {\n    const pts = [startA];\n    let current = startA;\n    for (let i = 1; i < numPts; i++) {\n      const delta = Math.round((seed(\`ml\${i}\`) - 0.48) * 6);\n      current += delta;\n      pts.push(current);\n    }\n    return pts;\n  };`;
if (code.includes(renderTrendsWalkOrig)) {
    code = code.replace(renderTrendsWalkOrig, renderTrendsWalkNew);
} else {
    code = code.replace(renderTrendsWalkOrig.replace(/\n/g, '\r\n'), renderTrendsWalkNew.replace(/\n/g, '\r\n'));
}

const renderTrendsModelOrig = `  const modelPts = LABELS.map(() => homeFV);`;
const renderTrendsModelNew = `  const modelPts = Array(numPts).fill(homeFV);`;
if (code.includes(renderTrendsModelOrig)) {
    code = code.replace(renderTrendsModelOrig, renderTrendsModelNew);
} else {
    code = code.replace(renderTrendsModelOrig.replace(/\n/g, '\r\n'), renderTrendsModelNew.replace(/\n/g, '\r\n'));
}

const renderTrendsTicksOrig = `x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } },\n        y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } }`;
const renderTrendsTicksNew = `x: { ticks: { color: '#888', font: { size: 10 }, autoSkip: false, maxRotation: 0 }, grid: { color: '#333' } },\n        y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } }`;
if (code.includes(renderTrendsTicksOrig)) {
    code = code.replace(renderTrendsTicksOrig, renderTrendsTicksNew);
} else {
    code = code.replace(renderTrendsTicksOrig.replace(/\n/g, '\r\n'), renderTrendsTicksNew.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('index.html', code);
console.log('Fixed syntax error and applied correct chart granularity!');
