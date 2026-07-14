const https = require('https');

https.get('https://sportsbook.draftkings.com//sites/US-SB/api/v5/eventgroups/84240/categories/460/subcategories/4536?format=json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Success, keys:', Object.keys(parsed));
      if(parsed.eventGroup) {
        console.log('Found event group:', parsed.eventGroup.name);
      }
    } catch(e) {
      console.log('Failed to parse json');
    }
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
