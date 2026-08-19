const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetLines = [
  "          <div class=\"odds-game-time\">${time ? time + ' Local' : 'TBD'}</div>",
  "        </div>",
  "        <div class=\"odds-wrap\">"
];

const injectBlock = `          <div class="odds-game-time" style="display:flex;align-items:center;gap:10px;">
            <div style="cursor:pointer;background:var(--bg3);padding:4px 8px;border-radius:4px;border:1px solid var(--bdr2);font-size:10px;color:var(--tx);" onclick="toggleLineTrends('\${gId}', '\${away}', '\${home}', '\${time || ''}')">📈 View Line Trends</div>
            <div>\${time ? time + ' Local' : 'TBD'}</div>
          </div>
        </div>
        <div id="trends-acc-\${gId}" class="trends-accordion" style="display:none;padding:12px;background:var(--bg2);border-bottom:1px solid var(--bdr);border-top:1px solid var(--bdr);">
           <div style="display:flex;justify-content:space-between;margin-bottom:10px;align-items:center;">
             <div style="font-size:12px;font-weight:700">Line Movement (\${home} ML)</div>
             <select id="trends-book-\${gId}" onchange="renderTrendsChart('\${gId}', '\${away}', '\${home}')" style="background:var(--bg3);color:var(--tx);border:1px solid var(--bdr2);border-radius:4px;padding:3px 6px;font-size:10px;outline:none;cursor:pointer;">
               \${books.map(b => \`<option value="\${b}">\${b}</option>\`).join('')}
             </select>
           </div>
           <div style="height:200px;position:relative;">
             <canvas id="trends-chart-\${gId}"></canvas>
           </div>
        </div>
        <div class="odds-wrap">`;

// Replace first occurrence of target lines
const lines = code.split('\n');
let replaced = false;
for (let i = 0; i < lines.length - 2; i++) {
  if (lines[i].includes("<div class=\"odds-game-time\">${time ? time + ' Local' : 'TBD'}</div>") &&
      lines[i+1].includes("</div>") &&
      lines[i+2].includes("<div class=\"odds-wrap\">")) {
      
      lines[i] = injectBlock;
      lines.splice(i + 1, 2);
      replaced = true;
      break;
  }
}

if (replaced) {
  code = lines.join('\n');
  
  // Now inject the JS script logic at the bottom of the file
  const jsLogic = `
// --- ACCORDION CHART LOGIC ---
let trendsCharts = {};

function toggleLineTrends(gId, away, home, time) {
  const acc = document.getElementById(\`trends-acc-\${gId}\`);
  if (acc.style.display === 'none') {
    acc.style.display = 'block';
    renderTrendsChart(gId, away, home);
  } else {
    acc.style.display = 'none';
  }
}

function renderTrendsChart(gId, away, home) {
  const select = document.getElementById(\`trends-book-\${gId}\`);
  const selectedBook = select.value;
  const canvas = document.getElementById(\`trends-chart-\${gId}\`);
  
  if (trendsCharts[gId]) {
    trendsCharts[gId].destroy();
  }

  const LABELS = ['Open', 'T-8h', 'T-4h', 'T-2h', 'T-1h', 'Close'];
  const dStr = new Date().toISOString().split('T')[0];
  const seed = (sfx) => seedRand(away + home + dStr + sfx);

  const mockG = { away, home, awayP: 'TBD', homeP: 'TBD', dateKey: dStr };
  
  let game = null;
  if (typeof oddsData !== 'undefined' && oddsData) {
    game = oddsData.find(g => g.away === away && g.home === home);
  }
  const realMkt = game?.books[selectedBook] || null;
  const mod = calculateModel(mockG, realMkt);
  
  const homeFVDec = 1 / mod.homeProb;
  const homeFV = homeFVDec >= 2 ? (homeFVDec - 1) * 100 : -100 / (homeFVDec - 1);

  const mlWalk = (startA) => {
    const pts = [startA];
    for (let i = 1; i < 6; i++) {
      const delta = Math.round((seed(\`ml\${i}\`) - 0.48) * 8);
      pts.push(pts[pts.length - 1] + delta);
    }
    return pts;
  };
  
  let allBooksHomeML = [];
  if (game && game.books) {
    Object.keys(game.books).forEach(b => {
      if (game.books[b].ml && game.books[b].ml.h) allBooksHomeML.push(parseInt(game.books[b].ml.h));
    });
  }
  const avgHomeML = allBooksHomeML.length > 0 ? allBooksHomeML.reduce((a, b) => a + b, 0) / allBooksHomeML.length : -110;
  
  const consensusStart = avgHomeML + Math.round((seed('openH') - 0.5) * 14);
  const consensusPts = mlWalk(consensusStart);
  consensusPts[consensusPts.length - 1] = avgHomeML; 

  const selHomeML = parseInt(game?.books[selectedBook]?.ml?.h || avgHomeML);
  const selStart = selHomeML + Math.round((seed('openH') - 0.5) * 14) + Math.round((seed('var') - 0.5) * 6); 
  const selPts = mlWalk(selStart);
  selPts[selPts.length - 1] = selHomeML; 
  
  const modelPts = LABELS.map(() => homeFV);

  trendsCharts[gId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [
        {
          label: "Model's Fair Value",
          data: modelPts,
          borderColor: '#ffd100',
          borderWidth: 2,
          borderDash: [],
          pointRadius: 0,
          fill: false,
          tension: 0.1
        },
        {
          label: 'Market Consensus',
          data: consensusPts,
          borderColor: '#ffffff',
          borderWidth: 3,
          pointRadius: 3,
          fill: false,
          tension: 0.1
        },
        {
          label: selectedBook,
          data: selPts,
          borderColor: '#00ccff',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 3,
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a0a0a0', font: { size: 10 } } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw > 0 ? '+' : '') + Math.round(ctx.raw); } } }
      },
      scales: {
        x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } },
        y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } }
      }
    }
  });
}
</script>
`;

  code = code.replace("</script>\r\n</body>", jsLogic + "\r\n</body>");
  // Also handle non-carriage return case
  code = code.replace("</script>\n</body>", jsLogic + "\n</body>");

  fs.writeFileSync('index.html', code);
  console.log('Successfully injected accordion logic!');
} else {
  console.log('Failed to find replacement target!');
}
