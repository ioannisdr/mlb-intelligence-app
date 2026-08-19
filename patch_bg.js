const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const fanaticsRegex = /Fanatics:\s*\{ icon: "<img src='[^']+' style='([^']+)' onerror=\\"this\.style\.display='none'\\">", color: '#00d68f' \}/;
code = code.replace(fanaticsRegex, `Fanatics:    { icon: "<img src='https://logo.clearbit.com/fanatics.com' style='$1;background-color:white;padding:1px;' onerror=\\"this.style.display='none'\\">", color: '#00d68f' }`);

const pointsbetRegex = /PointsBet:\s*\{ icon: "<img src='[^']+' style='([^']+)' onerror=\\"this\.style\.display='none'\\">", color: '#ef476f' \}/;
code = code.replace(pointsbetRegex, `PointsBet:   { icon: "<img src='https://logo.clearbit.com/pointsbet.com' style='$1;background-color:white;padding:1px;' onerror=\\"this.style.display='none'\\">", color: '#ef476f' }`);

fs.writeFileSync('index.html', code);
console.log('Patch complete.');
