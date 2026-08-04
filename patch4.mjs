import fs from 'fs';
let t = fs.readFileSync('index.html', 'utf8');

// Tabs
t = t.replace(/<div class="tab" onclick="switchTab\('live'\)">.*? Live Scores<\/div>/g, '<div class="tab" onclick="switchTab(\'live\')">Live Scores</div>');
t = t.replace(/<div class="tab" onclick="switchTab\('odds'\)">.*? Odds Movement<\/div>/g, '<div class="tab" onclick="switchTab(\'odds\')">Odds Movement</div>');
t = t.replace(/<div class="title" style="margin-bottom:2px">.*? Live Scores · Today's Slate<\/div>/g, '<div class="title" style="margin-bottom:2px">Live Scores · Today\\'s Slate</div>');
t = t.replace(/<div class="title" style="margin-bottom:4px">.*? Live Odds Movement<\/div>/g, '<div class="title" style="margin-bottom:4px">Live Odds Movement</div>');

// Weather and Park Factors
t = t.replace(/function pfLabel\(pf\) \{[\s\S]*?\}/, unction pfLabel(pf) {
  if (pf >= 110) return \🏟️ PF \ 🔥 Extreme Hitters Park\;
  if (pf >= 105) return \🏟️ PF \ 🔴 Hitters Park\;
  if (pf >= 102) return \🏟️ PF \ 🟠 Slight Hitters\;
  if (pf >= 99)  return \🏟️ PF \ ⚪ Neutral\;
  if (pf >= 96)  return \🏟️ PF \ 🔵 Slight Pitchers\;
  return \🏟️ PF \ 🟣 Pitchers Park\;
});

t = t.replace(/function windLabel\(windMph, dir\) \{[\s\S]*?\}/, unction windLabel(windMph, dir) {
  if (dir === 'dome') return '🏟️ Dome';
  if (windMph < 5)   return '🍃 Calm';
  const arrow = dir === 'out' ? '⬆️ Out' : dir === 'in' ? '⬇️ In' : '↔️ Cross';
  return \💨 \mph \\;
});

t = t.replace(/wStr = \.*? \$\{wxH\.temp \|\| 72\}(?:·|°)F · \$\{wLabel\} · \$\{sky\} · \$\{pfLabel\(pf\)\}\;/g, 
  "wStr = 🌡️ °F ·  ·  · ;");

fs.writeFileSync('index.html', t, 'utf8');