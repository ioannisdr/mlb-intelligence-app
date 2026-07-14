const https = require('https');

https.get('https://liveodds.covers.com/api/linecomparison/baseball/mlb/moneyline', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      console.log('Got response. length:', data.length);
      console.log(data.substring(0, 500));
    } catch(e) {
      console.log('Error parsing');
    }
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
