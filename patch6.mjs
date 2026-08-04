const fs = require('fs');
let t = fs.readFileSync('index.html', 'utf8');

// The exact string replacements
const replacements = [
  ['<div class="tab" onclick="switchTab(\'live\')">?? Live Scores</div>', '<div class="tab" onclick="switchTab(\'live\')">Live Scores</div>'],
  ['<div class="tab" onclick="switchTab(\'odds\')">?? Odds Movement</div>', '<div class="tab" onclick="switchTab(\'odds\')">Odds Movement</div>'],
  ['<div class="sec" style="margin-bottom:2px">?? Live Scores · Today\\'s Slate</div>', '<div class="sec" style="margin-bottom:2px">Live Scores · Today\\'s Slate</div>'],
  ['<div class="sec" style="margin-bottom:4px">?? Live Odds Movement</div>', '<div class="sec" style="margin-bottom:4px">Live Odds Movement</div>'],
  ['if (pf >= 110) return \??? PF \ ?? Extreme Hitters Park\;', 'if (pf >= 110) return \🏟️ PF \ 🔥 Extreme Hitters Park\;'],
  ['if (pf >= 105) return \??? PF \ ?? Hitters Park\;', 'if (pf >= 105) return \🏟️ PF \ 🔴 Hitters Park\;'],
  ['if (pf >= 102) return \??? PF \ ?? Slight Hitters\;', 'if (pf >= 102) return \🏟️ PF \ 🟠 Slight Hitters\;'],
  ['if (pf >= 99)  return \??? PF \ ? Neutral\;', 'if (pf >= 99)  return \🏟️ PF \ ⚪ Neutral\;'],
  ['if (pf >= 96)  return \??? PF \ ?? Slight Pitchers\;', 'if (pf >= 96)  return \🏟️ PF \ 🔵 Slight Pitchers\;'],
  ['return \??? PF \ ?? Pitchers Park\;', 'return \🏟️ PF \ 🟣 Pitchers Park\;'],
  ['if (dir === \\'dome\\') return \\'??? Dome\\';', 'if (dir === \\'dome\\') return \\'🏟️ Dome\\';'],
  ['if (windMph < 5)   return \\'?? Calm\\';', 'if (windMph < 5)   return \\'🍃 Calm\\';'],
  ['const arrow = dir === \\'out\\' ? \\'?? Out\\' : dir === \\'in\\' ? \\'?? In\\' : \\'-? Cross\\';', 'const arrow = dir === \\'out\\' ? \\'⬆️ Out\\' : dir === \\'in\\' ? \\'⬇️ In\\' : \\'↔️ Cross\\';'],
  ['return \?? \mph \\;', 'return \💨 \mph \\;'],
  ['wStr = \??? \·F · \ · \ · \\;', 'wStr = \🌡️ \°F · \ · \ · \\;'],
  ['let wStr = \\'? Fetching weather...\\';', 'let wStr = \\'🌤️ Fetching weather...\\';']
];

for (let [orig, newStr] of replacements) {
  if (t.indexOf(orig) !== -1) {
    t = t.split(orig).join(newStr);
  } else {
    console.log("NOT FOUND: ", orig);
  }
}

fs.writeFileSync('index.html', t, 'utf8');