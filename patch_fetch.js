const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const oldMockBlock = `  const numPts = 60;
  const LABELS = Array.from({length: numPts}, (_, i) => {
    if (i === 0) return 'Open';
    if (i === 12) return 'T-8h';
    if (i === 24) return 'T-4h';
    if (i === 36) return 'T-2h';
    if (i === 48) return 'T-1h';
    if (i === numPts - 1) return 'Close';
    return '';
  });
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
  
  const modelPts = Array(numPts).fill(homeFV);`;

const newMockBlock = `  const numPts = 60;
  const LABELS = Array(numPts).fill('');
  const dStr = new Date().toISOString().split('T')[0];
  const mockG = { away, home, awayP: 'TBD', homeP: 'TBD', dateKey: dStr };
  
  let game = null;
  if (typeof oddsData !== 'undefined' && oddsData) {
    game = oddsData.find(g => g.away === away && g.home === home);
  }
  const realMkt = game?.books[selectedBook] || null;
  const mod = calculateModel(mockG, realMkt);
  
  const homeFVDec = 1 / mod.homeProb;
  const homeFV = homeFVDec >= 2 ? (homeFVDec - 1) * 100 : -100 / (homeFVDec - 1);

  const modelPts = Array(numPts).fill(homeFV);
  const consensusPts = Array(numPts).fill(null);
  const selPts = Array(numPts).fill(null);`;

if (code.includes(oldMockBlock)) {
  code = code.replace(oldMockBlock, newMockBlock);
  console.log('Mock block replaced');
} else if (code.includes(oldMockBlock.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldMockBlock.replace(/\n/g, '\r\n'), newMockBlock.replace(/\n/g, '\r\n'));
  console.log('Mock block replaced (CRLF)');
} else {
  console.log('Could not find mock block');
}

const endChartStr = `      }
    }
  });`;

const fetchInjection = `      }
    }
  });

  fetch(\`/api/history?gId=\${gId}\`)
    .then(res => res.json())
    .then(historyData => {
      if (!historyData || historyData.length === 0) return;
      const activeBooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers', 'ESPNBet', 'Fanatics', 'bet365', 'HardRock', 'PointsBet'];
      const recentHistory = historyData.slice(-60);
      const timeLabels = [];
      const consensusData = [];
      const selData = [];

      recentHistory.forEach(snapshot => {
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

      if (trendsCharts[gId]) {
        trendsCharts[gId].data.labels = timeLabels;
        trendsCharts[gId].data.datasets[0].data = Array(timeLabels.length).fill(homeFV);
        trendsCharts[gId].data.datasets[1].data = consensusData;
        trendsCharts[gId].data.datasets[2].data = selData;
        trendsCharts[gId].update();
      }
    })
    .catch(err => console.error("Failed to fetch historical odds:", err));`;

if (code.includes(endChartStr)) {
  code = code.replace(endChartStr, fetchInjection);
  console.log('Fetch block injected');
} else if (code.includes(endChartStr.replace(/\n/g, '\r\n'))) {
  code = code.replace(endChartStr.replace(/\n/g, '\r\n'), fetchInjection.replace(/\n/g, '\r\n'));
  console.log('Fetch block injected (CRLF)');
} else {
  console.log('Could not find end of chart instantiation');
}

fs.writeFileSync('index.html', code);
