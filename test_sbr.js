const https = require('https');
const cheerio = require('cheerio');

https.get('https://www.sportsbookreview.com/betting-odds/mlb-baseball/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    if(res.statusCode === 200) {
      console.log("Success! Data length:", data.length);
      const $ = cheerio.load(data);
      console.log("Teams found:", $('span.participant-name').length);
    }
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
