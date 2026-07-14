const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

https.get('https://www.sportsbookreview.com/betting-odds/mlb-baseball/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const nextData = $('#__NEXT_DATA__').html();
    if(nextData) {
        try {
            let json = JSON.parse(nextData);
            fs.writeFileSync('sbr_dump.json', JSON.stringify(json.props.pageProps.oddsTables, null, 2));
            console.log("Dumped to sbr_dump.json");
        } catch(e) {
            console.log("Parse error");
        }
    }
  });
});
