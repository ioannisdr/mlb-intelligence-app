const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const fanaticsRegex = /Fanatics:\s*\{ icon: "<img src='[^']+'( style='width:16px;height:16px;border-radius:2px;vertical-align:middle;object-fit:contain;background-color:white;padding:1px;'>)", color: '#00d68f' \}/;
const fanaticsNew = `Fanatics:    { icon: "<img src='https://pbs.twimg.com/profile_images/1655959954497675266/bL32o10i_400x400.jpg'$1", color: '#00d68f' }`;
code = code.replace(fanaticsRegex, fanaticsNew);

const pointsbetRegex = /PointsBet:\s*\{ icon: "<img src='[^']+'( style='width:16px;height:16px;border-radius:2px;vertical-align:middle;object-fit:contain;background-color:white;padding:1px;'>)", color: '#ef476f' \}/;
const pointsbetNew = `PointsBet:   { icon: "<img src='https://pbs.twimg.com/profile_images/1422610738368147461/fIu1bY1O_400x400.jpg'$1", color: '#ef476f' }`;
code = code.replace(pointsbetRegex, pointsbetNew);

fs.writeFileSync('index.html', code);
console.log('Fixed twitter logo urls');
