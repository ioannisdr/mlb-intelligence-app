const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Replace Fanatics Logo
const fanaticsRegex = /Fanatics:\s*\{ icon: "<img src='[^']+'([^>]+)>", color: '#00d68f' \}/;
code = code.replace(fanaticsRegex, `Fanatics:    { icon: "<img src='fanatics.png'$1>", color: '#00d68f' }`);

// 2. Replace PointsBet Logo
const pointsbetRegex = /PointsBet:\s*\{ icon: "<img src='[^']+'([^>]+)>", color: '#ef476f' \}/;
code = code.replace(pointsbetRegex, `PointsBet:   { icon: "<img src='pointsbet.png'$1>", color: '#ef476f' }`);

// 3. Replace Legend Up Arrow
code = code.replace(
  `<span><span style="color:var(--g);font-weight:700">▲</span> Line moved in your favor (better odds than open)</span>`,
  `<span><span style="color: var(--success-color, #00C853);">▲</span> Line moved in your favor (better odds than open)</span>`
);

// 4. Replace Legend Down Arrow
code = code.replace(
  `<span><span style="color:var(--r);font-weight:700">▼</span> Line moved against (worse than open)</span>`,
  `<span><span style="color: var(--danger-color, #FF3D00);">▼</span> Line moved against (worse than open)</span>`
);

fs.writeFileSync('index.html', code);
console.log('Patch complete for local images and legend arrows.');
