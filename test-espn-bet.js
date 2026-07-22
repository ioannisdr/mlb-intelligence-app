const url = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';
fetch(url)
  .then(r => r.json())
  .then(data => {
    let found = false;
    JSON.stringify(data, (key, value) => {
       if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('ticket') || key.toLowerCase().includes('money')) {
          console.log(`Found key: ${key} =`, value);
          found = true;
       }
       return value;
    });
    if (!found) console.log('No betting percentages found in ESPN API');
  });
