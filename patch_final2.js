const fs = require('fs');
let t = fs.readFileSync('index.html', 'utf8');

const replacements = [
  ['<span style="font-size:16px">??</span>', '<span style="font-size:16px">🎯</span>'],
  ['? Prev</button>', '◀ Prev</button>'],
  ['Next ?</button>', 'Next ▶</button>'],
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
    }
}

fs.writeFileSync('index.html', t, 'utf8');
