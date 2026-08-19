const fs = require('fs');

const fPath = 'C:/Users/Jannis/.gemini/antigravity/brain/e99348c8-96a7-4fcb-b3f8-51a21544be56/.user_uploaded/media_1785832474158.png';
const pbPath = 'C:/Users/Jannis/.gemini/antigravity/brain/e99348c8-96a7-4fcb-b3f8-51a21544be56/.user_uploaded/media_1785832474172.png';

const fBase64 = fs.readFileSync(fPath).toString('base64');
const pbBase64 = fs.readFileSync(pbPath).toString('base64');

let code = fs.readFileSync('index.html', 'utf8');

const fRegex = /Fanatics:\s*\{\s*icon:\s*"<img[^>]+>",\s*color:\s*'#00d68f'\s*\}/;
const fNew = `Fanatics:    { icon: "<img src='data:image/png;base64,${fBase64}' style='width:16px;height:16px;border-radius:2px;vertical-align:middle;object-fit:contain;'>", color: '#00d68f' }`;
code = code.replace(fRegex, fNew);

const pbRegex = /PointsBet:\s*\{\s*icon:\s*"<img[^>]+>",\s*color:\s*'#ef476f'\s*\}/;
const pbNew = `PointsBet:   { icon: "<img src='data:image/png;base64,${pbBase64}' style='width:16px;height:16px;border-radius:2px;vertical-align:middle;object-fit:contain;'>", color: '#ef476f' }`;
code = code.replace(pbRegex, pbNew);

fs.writeFileSync('index.html', code);
console.log('Base64 injected successfully.');
