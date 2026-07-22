const url = 'https://www.vsin.com/betting-splits/mlb/';
fetch(url)
  .then(r => r.text())
  .then(html => {
    const fs = require('fs');
    fs.writeFileSync('vsin.html', html);
    console.log('Saved vsin.html');
  });
