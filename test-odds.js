async function testOdds() {
  console.log('Testing DK...');
  const DK_URL = 'https://sportsbook.draftkings.com//sites/US-SB/api/v5/eventgroups/84240/categories/460/subcategories/4536?format=json';
  try {
     const res = await fetch(DK_URL, { headers: { 'User-Agent': 'Mozilla/5.0' }});
     const data = await res.json();
     console.log('DK events:', data?.eventGroup?.events?.length || 0);
  } catch(e) { console.log('DK failed', e.message); }

  console.log('Testing FD...');
  const FD_URL = 'https://sbapi.fanduel.com/api/content-managed-page?page=SPORT&eventTypeId=1&_ak=FhMFpcPWXMeyZxOx&timezone=America%2FNew_York&includeMarkets=true&tab=today';
  try {
     const res = await fetch(FD_URL, { headers: { 'User-Agent': 'Mozilla/5.0' }});
     const data = await res.json();
     console.log('FD events:', Object.keys(data?.attachments?.events || {}).length);
  } catch(e) { console.log('FD failed', e.message); }
}
testOdds();
