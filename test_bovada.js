const https = require('https');

https.get('https://www.bovada.lv/services/sports/content/en-us/events/category/baseball/mlb', {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    if(res.statusCode === 200) {
      console.log("Success! Data length:", data.length);
    } else {
        console.log("Failed data:", data.substring(0, 100));
    }
  });
});
