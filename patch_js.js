const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

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
</script>`;

if (!code.includes('toggleLineTrends')) {
  // It shouldn't be there because my previous script replaced `</script>\n</body>` which didn't match.
}

// But I already replaced the HTML block in the previous run. 
// I only need to inject the JS. 
const parts = code.split('</script>');
// Inject before the last </script>
parts[parts.length - 2] = parts[parts.length - 2] + '\n' + jsLogic;
code = parts.join('');

fs.writeFileSync('index.html', code);
console.log('Successfully injected JS logic!');
