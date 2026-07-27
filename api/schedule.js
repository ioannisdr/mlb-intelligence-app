export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { date, startDate, endDate, gameType } = req.query;

  let url;
  if (startDate && endDate) {
    url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&gameType=${gameType || 'R'}&hydrate=probablePitcher`;
  } else {
    const targetDate = date || new Date().toISOString().split('T')[0];
    url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${targetDate}&hydrate=probablePitcher,linescore,team,lineups`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule data' });
  }
}
