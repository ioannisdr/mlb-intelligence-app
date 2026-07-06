export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&season=2026&season1=2026&ind=0&qual=0&type=8&month=0&pageitems=30&team=0,ts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`FanGraphs API returned ${response.status}`);
    }

    const json = await response.json();
    
    const teams = {};
    if (json && json.data) {
      json.data.forEach(t => {
        // Match FanGraphs abbreviation to app abbreviations if necessary
        const abbr = t.Team;
        teams[abbr] = {
          era: t.ERA,
          xfip: t.xFIP,
          xera: t.xERA || t.ERA, // Fallback if missing
          babip: t.BABIP,
          kpct: t['K%'] ? parseFloat(t['K%']) * 100 : null,
          bbpct: t['BB%'] ? parseFloat(t['BB%']) * 100 : null,
          swstr: t['SwStr%'] ? parseFloat(t['SwStr%']) * 100 : null,
          // Following stats need batting/overall data, we'll proxy placeholders for now
          // and fetch them if needed in another query, or keep static 2025 proxies for the rest
        };
      });
    }

    res.status(200).json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams data' });
  }
}
