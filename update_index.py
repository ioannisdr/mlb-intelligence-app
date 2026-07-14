import re

with open('C:\\Users\\jdros\\.gemini\\antigravity\\scratch\\mlb-intelligence\\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Bookmaker Dropdown to Header
header_dropdown = """
  <div style="display:flex;align-items:center;gap:8px">
    <select id="book-select" onchange="changeBook(this.value)" style="background:var(--bg3);color:var(--tx);border:1px solid var(--bdr2);border-radius:4px;padding:3px;font-size:10px;outline:none;">
      <option value="DraftKings">DraftKings</option>
      <option value="FanDuel">FanDuel</option>
      <option value="BetMGM">BetMGM</option>
      <option value="Caesars">Caesars</option>
      <option value="BetRivers">BetRivers</option>
      <option value="Bovada">Bovada</option>
    </select>
    <span id="live-status" style="font-size:10px;color:var(--tx2)">Connecting...</span>
"""
html = html.replace('<div style="display:flex;align-items:center;gap:8px">\n    <span id="live-status"', header_dropdown)

# 2. Add Backtest Summary UI
backtest_sum = '<div class="bt-sum" id="bt-sum"></div>\n  <div class="bt-wrap">'
html = html.replace('<div class="bt-wrap">', backtest_sum)

# 3. JS State for bookmaker
js_state = """// State
let currentBook = 'DraftKings';
"""
html = html.replace('// State\n', js_state)

# 4. JS changeBook
js_changebook = """
function changeBook(b) {
  currentBook = b;
  renderApp();
}

function formatDateStr(d) {
"""
html = html.replace('function formatDateStr(d) {', js_changebook)

# 5. Modify fetchAllData parsing of odds
odds_parse_old = """    if (Array.isArray(oddsRes)) {
      oddsRes.forEach(o => { ODDS[o.home] = o; });
    }"""
odds_parse_new = """    if (Array.isArray(oddsRes)) {
      oddsRes.forEach(o => { ODDS[o.home] = o.books; });
    }
    runBacktest(); // Trigger backtest in background
"""
html = html.replace(odds_parse_old, odds_parse_new)

# 6. Remove old mkt assignment in TODAY
mkt_assign_old = "let mkt = ODDS[home] || { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 };"
mkt_assign_new = "let mkt = {}; // Mkt is evaluated dynamically in calculateModel"
html = html.replace(mkt_assign_old, mkt_assign_new)

# 7. Update calculateModel to accept dynamic book
calc_old = "function calculateModel(g) {"
calc_new = """function calculateModel(g, overrideMkt = null) {
  let mkt = overrideMkt || (ODDS[g.home] && ODDS[g.home][currentBook]) || { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 };
"""
html = html.replace(calc_old, calc_new)

# 8. Replace `g.mkt` with `mkt` in calculateModel
html = html.replace('g.mkt.ml.h', 'mkt.ml.h')
html = html.replace('g.mkt.ml.a', 'mkt.ml.a')
html = html.replace('g.mkt.ou', 'mkt.ou')

# 9. In renderApp, use currentBook for rendering UI text
render_old = "let mod = calculateModel(g);"
render_new = """
    let mkt = (ODDS[g.home] && ODDS[g.home][currentBook]) || { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 };
    let mod = calculateModel(g, mkt);
"""
html = html.replace(render_old, render_new)

# Replace all remaining `g.mkt` with `mkt` inside renderApp
html = html.replace('g.mkt.rl.a', 'mkt.rl.a')

# 10. Populate Odds Tab
odds_tab_old = """  document.getElementById('slate-label').textContent = currentDate.toDateString();"""
odds_tab_new = """  document.getElementById('slate-label').textContent = currentDate.toDateString();

  let oddsHtml = '';
  TODAY.forEach(g => {
    let o = ODDS[g.home];
    if(o && o.DraftKings) {
       oddsHtml += `<tr>
         <td style="font-weight:600">${g.away} @ ${g.home}</td>
         <td><span style="color:var(--y)">${o.DraftKings.ml.a>0?'+'+o.DraftKings.ml.a:o.DraftKings.ml.a}</span> / <span style="color:var(--b)">${o.DraftKings.ml.h>0?'+'+o.DraftKings.ml.h:o.DraftKings.ml.h}</span></td>
         <td><span style="color:var(--y)">${o.FanDuel.ml.a>0?'+'+o.FanDuel.ml.a:o.FanDuel.ml.a}</span> / <span style="color:var(--b)">${o.FanDuel.ml.h>0?'+'+o.FanDuel.ml.h:o.FanDuel.ml.h}</span></td>
         <td><span style="color:var(--y)">${o.BetMGM.ml.a>0?'+'+o.BetMGM.ml.a:o.BetMGM.ml.a}</span> / <span style="color:var(--b)">${o.BetMGM.ml.h>0?'+'+o.BetMGM.ml.h:o.BetMGM.ml.h}</span></td>
         <td><span style="color:var(--y)">${o.Caesars.ml.a>0?'+'+o.Caesars.ml.a:o.Caesars.ml.a}</span> / <span style="color:var(--b)">${o.Caesars.ml.h>0?'+'+o.Caesars.ml.h:o.Caesars.ml.h}</span></td>
         <td><span style="color:var(--y)">${o.BetRivers.ml.a>0?'+'+o.BetRivers.ml.a:o.BetRivers.ml.a}</span> / <span style="color:var(--b)">${o.BetRivers.ml.h>0?'+'+o.BetRivers.ml.h:o.BetRivers.ml.h}</span></td>
         <td><span style="color:var(--y)">${o.Bovada.ml.a>0?'+'+o.Bovada.ml.a:o.Bovada.ml.a}</span> / <span style="color:var(--b)">${o.Bovada.ml.h>0?'+'+o.Bovada.ml.h:o.Bovada.ml.h}</span></td>
       </tr>`;
    }
  });
  if(oddsHtml) {
      document.getElementById('oddslist').innerHTML = `<table class="bt-t" style="margin-top:10px;"><thead><tr><th>Game</th><th>DraftKings</th><th>FanDuel</th><th>BetMGM</th><th>Caesars</th><th>BetRivers</th><th>Bovada</th></tr></thead><tbody>${oddsHtml}</tbody></table>`;
  } else {
      document.getElementById('oddslist').innerHTML = '<div class="loading">No odds available for today yet.</div>';
  }
"""
html = html.replace(odds_tab_old, odds_tab_new)

# 11. Add runBacktest logic
backtest_logic = """
async function runBacktest() {
  document.getElementById('bt-body').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Running 2026 Season Simulation...</td></tr>';
  const pastRes = await fetch('https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2026-03-20&endDate=' + formatDateStr(new Date())).then(r=>r.json()).catch(()=>null);
  
  let html = '';
  let wins = 0;
  let total = 0;

  if (pastRes && pastRes.dates) {
    // Reverse to show most recent first
    pastRes.dates.reverse().forEach(d => {
      d.games.forEach(g => {
        if(g.status.abstractGameState === "Final" || g.status.statusCode === "F") {
           let away = g.teams.away.team.name.split(' ').pop();
           let home = g.teams.home.team.name.split(' ').pop();
           let awayScore = g.teams.away.score || 0;
           let homeScore = g.teams.home.score || 0;
           
           // Mock past matchup using standard baseline market odds for backtest evaluating
           let mockG = { away, home, awayP:'TBD', homeP:'TBD', awayStrNum:0, homeStrNum:0, awayStrType:'W', homeStrType:'W' };
           let baselineMkt = { ml: {a:+110, h:-120}, ou: 8.5 };
           let mod = calculateModel(mockG, baselineMkt);
           
           let pick = mod.evH > mod.evA ? home : away;
           let ev = Math.max(mod.evH, mod.evA);
           let winner = homeScore > awayScore ? home : away;
           
           if(ev > 0.05) { // Only evaluate A/A+ bets
             total++;
             let isWin = pick === winner;
             if(isWin) wins++;
             html += `<tr><td>${d.date}</td><td>${away} @ ${home}</td><td>${winner} (${awayScore}-${homeScore})</td><td style="color:${isWin?'var(--g)':'var(--r)'};font-weight:700;">${pick} ML</td><td style="color:var(--g)">+${(ev*100).toFixed(1)}%</td></tr>`;
           }
        }
      });
    });
  }
  document.getElementById('bt-body').innerHTML = html;
  
  let roi = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  document.getElementById('bt-sum').innerHTML = `
    <div class="btm"><div class="bv">${total}</div><div class="bl">A/A+ Bets Identified</div></div>
    <div class="btm"><div class="bv" style="color:${roi>50?'var(--g)':'var(--r)'}">${wins} - ${total-wins}</div><div class="bl">Win/Loss Record</div></div>
    <div class="btm"><div class="bv" style="color:var(--b)">${roi}%</div><div class="bl">Win Rate</div></div>
  `;
}

window.onload = () => {
"""
html = html.replace('window.onload = () => {', backtest_logic)

with open('C:\\Users\\jdros\\.gemini\\antigravity\\scratch\\mlb-intelligence\\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
