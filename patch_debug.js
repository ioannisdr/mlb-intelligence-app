const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const oldFetchBlock = `      recentHistory.forEach(snapshot => {
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
      }`;

const newFetchBlock = `      recentHistory.forEach(snapshot => {
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
      }`;

if (code.includes(oldFetchBlock)) {
  code = code.replace(oldFetchBlock, newFetchBlock);
  console.log('Fetch block replaced');
} else if (code.includes(oldFetchBlock.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldFetchBlock.replace(/\n/g, '\r\n'), newFetchBlock.replace(/\n/g, '\r\n'));
  console.log('Fetch block replaced (CRLF)');
} else {
  console.log('Could not find fetch block');
}

fs.writeFileSync('index.html', code);
