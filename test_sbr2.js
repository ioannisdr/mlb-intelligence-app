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
    const $ = cheerio.load(data);
    const nextData = $('#__NEXT_DATA__').html();
    if(nextData) {
        console.log("NEXT_DATA found");
        try {
            let json = JSON.parse(nextData);
            console.log(Object.keys(json.props.pageProps));
        } catch(e) {
            console.log("Parse error");
        }
    } else {
        console.log("No NEXT_DATA");
    }
  });
});
