const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const injectedBlock = `  fetch(\`/api/history?gId=\${gId}\`)
    .then(res => res.json())
    .then(historyData => {
      if (!historyData || historyData.length === 0) return;
      const activeBooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers', 'ESPNBet', 'Fanatics', 'bet365', 'HardRock', 'PointsBet'];
      const recentHistory = historyData.slice(-60);
      const timeLabels = [];
      const consensusData = [];
      const selData = [];

      recentHistory.forEach(snapshot => {
        console.log('Raw API snapshot:', snapshot);
        
        const dateObj = new Date(snapshot.timestamp);
        timeLabels.push(dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        let sum = 0, count = 0;
        activeBooks.forEach(b => {
          if (snapshot.books && snapshot.books[b] && snapshot.books[b].ml && snapshot.books[b].ml.h) {
            sum += parseInt(snapshot.books[b].ml.h);
            count++;
          }
        });
        consensusData.push(count > 0 ? Math.round(sum / count) : null);

        const selML = snapshot.books && snapshot.books[selectedBook] && snapshot.books[selectedBook].ml;
        selData.push(selML ? parseInt(selML.h) : null);
      });

      console.log('Consensus Array:', consensusData);

      if (trendsCharts[gId]) {
        trendsCharts[gId].data.labels = timeLabels;
        trendsCharts[gId].data.datasets[0].data = Array(timeLabels.length).fill(homeFV);
        trendsCharts[gId].data.datasets[1].data = consensusData;
        trendsCharts[gId].data.datasets[2].data = selData;
        trendsCharts[gId].update();
      }
    })
    .catch(err => console.error("Failed to fetch historical odds:", err));`;

// 1. Remove the injected block completely
if (code.includes(injectedBlock)) {
  code = code.replace(injectedBlock, '');
  console.log('Removed from wrong location (LF)');
} else if (code.includes(injectedBlock.replace(/\n/g, '\r\n'))) {
  code = code.replace(injectedBlock.replace(/\n/g, '\r\n'), '');
  console.log('Removed from wrong location (CRLF)');
} else {
  console.log('Could not find injected block');
}

// 2. Add it back to the correct location (renderTrendsChart)
const correctEndStr = `      },
      scales: {
        x: { ticks: { color: '#888', font: { size: 10 }, autoSkip: false, maxRotation: 0 }, grid: { color: '#333' } },
        y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: '#333' } }
      }
    }
  });`;

const correctEndReplacement = correctEndStr + '\n\n' + injectedBlock;

if (code.includes(correctEndStr)) {
  code = code.replace(correctEndStr, correctEndReplacement);
  console.log('Injected at correct location (LF)');
} else if (code.includes(correctEndStr.replace(/\n/g, '\r\n'))) {
  code = code.replace(correctEndStr.replace(/\n/g, '\r\n'), correctEndReplacement.replace(/\n/g, '\r\n'));
  console.log('Injected at correct location (CRLF)');
} else {
  console.log('Could not find correct end string');
}

fs.writeFileSync('index.html', code);
