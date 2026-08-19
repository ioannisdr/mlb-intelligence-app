const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

let changed = false;

// Task 1: Fix broken logos
const fanaticsOld = `Fanatics:    { icon: "<img src='https://www.google.com/s2/favicons?domain=fanatics.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#00d68f' }`;
const fanaticsNew = `Fanatics:    { icon: "<img src='https://icons.duckduckgo.com/ip3/sportsbook.fanatics.com.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#00d68f' }`;
if (code.includes(fanaticsOld)) {
  code = code.replace(fanaticsOld, fanaticsNew);
  console.log('Fixed Fanatics logo.');
  changed = true;
} else if (code.includes(fanaticsOld.replace(/\n/g, '\r\n'))) {
  code = code.replace(fanaticsOld.replace(/\n/g, '\r\n'), fanaticsNew.replace(/\n/g, '\r\n'));
  console.log('Fixed Fanatics logo (CRLF).');
  changed = true;
}

const pointsBetOld = `PointsBet:   { icon: "<img src='https://www.google.com/s2/favicons?domain=pointsbet.com&sz=32' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' }`;
const pointsBetNew = `PointsBet:   { icon: "<img src='https://icons.duckduckgo.com/ip3/pointsbet.com.ico' style='width:16px;height:16px;border-radius:3px;vertical-align:middle;object-fit:contain;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' }`;
if (code.includes(pointsBetOld)) {
  code = code.replace(pointsBetOld, pointsBetNew);
  console.log('Fixed PointsBet logo.');
  changed = true;
} else if (code.includes(pointsBetOld.replace(/\n/g, '\r\n'))) {
  code = code.replace(pointsBetOld.replace(/\n/g, '\r\n'), pointsBetNew.replace(/\n/g, '\r\n'));
  console.log('Fixed PointsBet logo (CRLF).');
  changed = true;
}

// Task 2: Fix Legend Arrows
const legendUpOld = `<span><span style="color:var(--g);font-weight:700">^</span> Line moved in your favor (better odds than open)</span>`;
const legendUpNew = `<span><span style="color:var(--g);font-weight:700">▲</span> Line moved in your favor (better odds than open)</span>`;
if (code.includes(legendUpOld)) {
  code = code.replace(legendUpOld, legendUpNew);
  console.log('Fixed legend UP arrow.');
  changed = true;
}

const legendDownOld = `<span><span style="color:var(--r);font-weight:700">·</span> Line moved against (worse than open)</span>`;
const legendDownNew = `<span><span style="color:var(--r);font-weight:700">▼</span> Line moved against (worse than open)</span>`;
if (code.includes(legendDownOld)) {
  code = code.replace(legendDownOld, legendDownNew);
  console.log('Fixed legend DOWN arrow.');
  changed = true;
}

if (changed) {
  fs.writeFileSync('index.html', code);
  console.log('Patch complete.');
} else {
  console.log('No matches found for any target strings.');
}
