const https = require('https');

https.get('https://sportsbook.draftkings.com//sites/US-SB/api/v5/eventgroups/84240/categories/460/subcategories/4536?format=json', {
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
      try {
          const json = JSON.parse(data);
          console.log("Keys:", Object.keys(json));
      } catch(e) {}
    } else {
        console.log("Failed data:", data.substring(0, 100));
    }
  });
});
