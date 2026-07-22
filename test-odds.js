const url = 'https://sportsbook.draftkings.com/sites/US-SB/api/v5/eventgroups?sportId=9';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  .then(r => r.json())
  .then(data => {
     const mlb = data?.eventGroups?.find(eg => eg.name === 'MLB');
     console.log('MLB Event Group ID:', mlb?.eventGroupId);
     if (!mlb) return;
     
     const oddsUrl = `https://sportsbook.draftkings.com//sites/US-SB/api/v5/eventgroups/${mlb.eventGroupId}/categories/460/subcategories/4536?format=json`;
     return fetch(oddsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json());
  })
  .then(odds => {
      console.log('Odds fetched successfully:', !!odds);
      if (odds && odds.eventGroup && odds.eventGroup.offerCategories) {
          console.log(JSON.stringify(odds.eventGroup.offerCategories[0].subcategories[0].offers[0][0], null, 2));
      }
  })
  .catch(e => console.error('Fetch error:', e.message));
