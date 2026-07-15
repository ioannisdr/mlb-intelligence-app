export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=probablePitcher,linescore,team,lineups`, {
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
