const fs = require('fs');
let t = fs.readFileSync('index.html', 'utf8');

const replacements = [
  ['?? Live Scores', '🔴 Live Scores'],
  ['?? Odds Movement', '📊 Odds Movement'],
  ["?? Live Scores · Today's Slate", "🔴 Live Scores — Today's Slate"],
  ['?? Live Odds Movement', '📊 Live Odds Movement'],
  ['??? Dome', '🏟️ Dome'],
  ['?? Calm', '🍃 Calm'],
  ['?? Out', '⬆️ Out'],
  ['?? In', '⬇️ In'],
  ['-? Cross', '↔️ Cross'],
  ['?? ${windMph}mph', '💨 ${windMph}mph'],
  ['??? PF ${pf} ?? Extreme Hitters Park', '🏟️ PF ${pf} 🔥 Extreme Hitters Park'],
  ['??? PF ${pf} ?? Hitters Park', '🏟️ PF ${pf} 🔴 Hitters Park'],
  ['??? PF ${pf} ?? Slight Hitters', '🏟️ PF ${pf} 🟠 Slight Hitters'],
  ['??? PF ${pf} ? Neutral', '🏟️ PF ${pf} ⚪ Neutral'],
  ['??? PF ${pf} ?? Slight Pitchers', '🏟️ PF ${pf} 🔵 Slight Pitchers'],
  ['??? PF ${pf} ?? Pitchers Park', '🏟️ PF ${pf} 🟣 Pitchers Park'],
  ['??? ${wxH.temp}', '🌡️ ${wxH.temp}'],
  ['?? Locked (T-2m)', '🔒 Locked (T-2m)'],
  ['Bet every ?? <strong>PRIME</strong>', 'Bet every 🔴 <strong>PRIME</strong>'],
  ["FanDuel:     { icon: '???', color: '#4da6ff' },", "FanDuel:     { icon: '🛡️', color: '#4da6ff' },"],
  ["Caesars:     { icon: '???', color: '#a78bfa' },", "Caesars:     { icon: '🏛️', color: '#a78bfa' },"],
  ['justify-content:center;font-size:18px;">??</div>', 'justify-content:center;font-size:18px;">🎯</div>']
];

for(let [orig, newStr] of replacements) {
    if(t.indexOf(orig) !== -1) {
        t = t.split(orig).join(newStr);
        console.log("REPLACED: " + orig.substring(0, 30));
    }
}

// Replace the 6 about-card-icons sequentially
const icons = ['🧪', '📐', '📊', '🎯', '🔴', '🧾'];
let i = 0;
t = t.replace(/<div class="about-card-icon">\?\?<\/div>/g, () => {
    return '<div class="about-card-icon">' + (icons[i++] || '??') + '</div>';
});

fs.writeFileSync('index.html', t, 'utf8');
