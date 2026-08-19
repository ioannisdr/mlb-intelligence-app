const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const fanaticsRegex = /Fanatics:\s*\{ icon: "<img[^>]+>", color: '#00d68f' \}/;
const fanaticsNew = `Fanatics:    { icon: "<img src='https://icons.duckduckgo.com/ip3/sportsbook.fanatics.com.ico' style='width:16px;height:16px;border-radius:2px;vertical-align:middle;object-fit:contain;background-color:white;padding:1px;'>", color: '#00d68f' }`;
code = code.replace(fanaticsRegex, fanaticsNew);

const pointsbetRegex = /PointsBet:\s*\{ icon: "<img[^>]+>", color: '#ef476f' \}/;
const pointsbetNew = `PointsBet:   { icon: "<img src='https://icons.duckduckgo.com/ip3/pointsbet.com.ico' style='width:16px;height:16px;border-radius:2px;vertical-align:middle;object-fit:contain;background-color:white;padding:1px;'>", color: '#ef476f' }`;
code = code.replace(pointsbetRegex, pointsbetNew);

fs.writeFileSync('index.html', code);
console.log('Fixed invisible/missing logos and layout collapse.');
