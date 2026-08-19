const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace header icon
html = html.replace(/<p>Signal Intelligence · 🟢 PRIME \/ 🟡 EDGE \/ .*? SKIP · Statcast/g, '<p>Signal Intelligence · 🟢 PRIME / 🟡 EDGE / ⬜ SKIP · Statcast');

// Replace anywhere there is <span class="sig-box sig-skip">... SKIP</span>
html = html.replace(/<span class="sig-box sig-skip">.*?SKIP<\/span>/g, '<span class="sig-box sig-skip">⬜ SKIP</span>');

// Replace inside javascript object: l: 'SKIP', c: 'sig-skip', v: 1, icon: "?" 
// using regex that matches the whole object and replaces the icon value
html = html.replace(/(l:\s*['"]SKIP['"],\s*c:\s*['"]sig-skip['"],\s*v:\s*1,\s*icon:\s*)['"].*?['"]/g, '$1"⬜"');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed skip icons.');
