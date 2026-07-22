const SBD_URL = 'https://www.sportsbettingdime.com/mlb/public-betting-trends/';
fetch(SBD_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(r => r.text())
.then(html => {
  const fs = require('fs');
  fs.writeFileSync('sbd.html', html);
  console.log('Saved to sbd.html');
});
