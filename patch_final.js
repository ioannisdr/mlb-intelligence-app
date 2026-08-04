const fs = require('fs');
let t = fs.readFileSync('index.html', 'utf8');

const replacements = [
  // Refresh button
  ['>?? Refresh</button>', '>🔄 Refresh</button>'],
  ['>? Refresh</button>', '>🔄 Refresh</button>'],
  ['>↻ Refresh</button>', '>🔄 Refresh</button>'],

  // Sportsbook Logos
  ["FanDuel:     { icon: '???', color: '#4da6ff' },", "FanDuel:     { icon: '🛡️', color: '#4da6ff' },"],
  ["Caesars:     { icon: '???', color: '#a78bfa' },", "Caesars:     { icon: '🏛️', color: '#a78bfa' },"],
  ["DraftKings:  { icon: \"🔥\", color: '#00d68f' },", "DraftKings:  { icon: '👑', color: '#00d68f' },"],
  ["BetMGM:      { icon: \"🔥\", color: '#ffa500' },", "BetMGM:      { icon: '🦁', color: '#ffa500' },"],
  ["BetRivers:   { icon: \"🔥\", color: '#4da6ff' },", "BetRivers:   { icon: '🌊', color: '#4da6ff' },"],
  ["PointsBet:   { icon: \"🔥\", color: '#ef476f' },", "PointsBet:   { icon: '📍', color: '#ef476f' },"],

  // Acca builder emoji
  ['<span style="font-size:16px">??</span>', '<span style="font-size:16px">🎯</span>'],

  // Prev / Next 
  ['? Prev</button>', '◀ Prev</button>'],
  ['Next ?</button>', 'Next ▶</button>'],

  // About section
  ['<div class="faq-sec-title">?? Subscription & Membership Policy</div>', '<div class="faq-sec-title">💳 Subscription & Membership Policy</div>'],
  ['<div class="policy-title">?? Membership Terms & Conditions:</div>', '<div class="policy-title">⚠️ Membership Terms & Conditions:</div>'],
  ['<div class="faq-sec-title">?? How the Platform Works & Strategy</div>', '<div class="faq-sec-title">📈 How the Platform Works & Strategy</div>'],
  ['<div class="faq-sec-title">?? Betting Concepts: EV, CLV & Signals</div>', '<div class="faq-sec-title">🧠 Betting Concepts: EV, CLV & Signals</div>'],
  ['<button type="submit" class="form-btn">Send Message ??</button>', '<button type="submit" class="form-btn">Send Message ✉️</button>'],
  ['<div class="modal-title">?? Odds Converter & Betting Calculator</div>', '<div class="modal-title">🧮 Odds Converter & Betting Calculator</div>'],
  ['<div style="font-size:11px;font-weight:700;color:var(--b);margin-bottom:10px">?? 4-Way Odds & Implied % Converter</div>', '<div style="font-size:11px;font-weight:700;color:var(--b);margin-bottom:10px">🔄 4-Way Odds & Implied % Converter</div>'],
  ['<div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:10px">?? Payout & Expected Value (+EV)</div>', '<div style="font-size:11px;font-weight:700;color:var(--g);margin-bottom:10px">💰 Payout & Expected Value (+EV)</div>'],
  ['<span style="margin-left:auto;background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.25);color:var(--g);padding:3px 10px;border-radius:20px;font-size:9px;font-weight:700">?? Tip: bet the best available line to maximize value</span>', '<span style="margin-left:auto;background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.25);color:var(--g);padding:3px 10px;border-radius:20px;font-size:9px;font-weight:700">💡 Tip: bet the best available line to maximize value</span>'],
  ['<span style="font-size:10px;font-weight:700;color:var(--y)">?? Sportsbook Vig Multiplier</span>', '<span style="font-size:10px;font-weight:700;color:var(--y)">⚠️ Sportsbook Vig Multiplier</span>'],
  ["Updated ${now} · ${result.source === 'live' ? '?? Live' : '?? Simulated'}", "Updated ${now} · ${result.source === 'live' ? '🟢 Live' : '🟡 Simulated'}"],
  ["'?? Simulated (API offline)'", "'🟡 Simulated (API offline)'" ],
  ['?? The 2 Core Winning Strategies', '🎯 The 2 Core Winning Strategies'],
  ['?? Beating the Sportsbook', '📐 Beating the Sportsbook'],
  ['?? What If the "Best Bet" Shifts Later?', '📊 What If the "Best Bet" Shifts Later?'],
  ['?? Signal Tiers & Bankroll Management', '🔴 Signal Tiers & Bankroll Management'],
  ['?? Why can a Moneyline pick be PRIME while the Run Line is SKIP?', '🧾 Why can a Moneyline pick be PRIME while the Run Line is SKIP?'],
  ['?? The 3-Step Daily Subscriber Workflow', '📝 The 3-Step Daily Subscriber Workflow'],
];

for(let [orig, newStr] of replacements) {
    if(t.indexOf(orig) !== -1) {
        t = t.split(orig).join(newStr);
        console.log("REPLACED: " + orig.substring(0, 30));
    } else {
        console.log("NOT FOUND: " + orig.substring(0, 30));
    }
}

// 1. CalculateModel Fix
const calcStart = '  // Priority: real API odds > backtest override > simulated from model prob';
const calcNew = `  // Link live market odds state directly
  let liveMkt = null;
  if (typeof oddsData !== 'undefined' && Array.isArray(oddsData)) {
    const liveGame = oddsData.find(o => o.home === g.home);
    if (liveGame && liveGame.books && liveGame.books[currentBook]) {
      liveMkt = liveGame.books[currentBook];
    }
  }

  // Priority: real API odds > backtest override > simulated from model prob`;

if(t.includes(calcStart)) {
    t = t.replace(calcStart, calcNew);
    console.log("CALCULATEMODEL START PATCHED");
}

const oddsLogicStart = 'mkt = JSON.parse(JSON.stringify(window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]));\n  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {';
const oddsLogicNew = 'mkt = JSON.parse(JSON.stringify(window.HISTORICAL_ODDS[g.dateKey][g.home][currentBook]));\n  } else if (liveMkt) {\n    mkt = JSON.parse(JSON.stringify(liveMkt));\n  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {';

if(t.includes(oddsLogicStart)) {
    t = t.replace(oddsLogicStart, oddsLogicNew);
    console.log("CALCULATEMODEL MKT PATCHED");
}

// 2. Refresh predictions when Odds are loaded
const loadOddsEnd = 'oddsData = games;';
const loadOddsNew = 'oddsData = games;\n    // Force predictions to re-render using fresh oddsData\n    if (document.querySelector(".tab-active")?.textContent?.includes("Predictions")) {\n      renderPredictions();\n    }';

if(t.includes(loadOddsEnd)) {
    t = t.replace(loadOddsEnd, loadOddsNew);
    console.log("LOADODDSTAB RE-RENDER PATCHED");
}


fs.writeFileSync('index.html', t, 'utf8');