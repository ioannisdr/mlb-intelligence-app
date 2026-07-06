export default async function handler(req, res) {
  // Set cache for 6 hours
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://www.fangraphs.com/api/leaders/major-league/data?age=0&pos=all&stats=pit&lg=all&qual=0&season=2026&season1=2026&ind=0&team=0&pageitems=50000&pagenum=1&ind=0&rost=0&players=0&type=8', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`FanGraphs API returned ${response.status}`);
    }

    const json = await response.json();
    
    // Transform into a pitcher dictionary keyed by name
    const pitchers = {};
    if (json && json.data) {
      json.data.forEach(p => {
        // Strip HTML from Name (e.g. "<a href=...>Jacob Misiorowski</a>" -> "Jacob Misiorowski")
        const nameMatch = p.Name ? p.Name.match(/>([^<]+)</) : null;
        const cleanName = nameMatch ? nameMatch[1] : p.Name;
        
        // Strip HTML from Team
        const teamMatch = p.Team ? p.Team.match(/>([^<]+)</) : null;
        const cleanTeam = teamMatch ? teamMatch[1] : p.Team;

        pitchers[cleanName] = {
          team: cleanTeam,
          hand: p.Throws || 'R',
          era: p.ERA,
          xera: p.xERA || p.ERA,
          fip: p.FIP,
          xfip: p.xFIP,
          babip: p.BABIP,
          kpct: p['K%'] ? parseFloat(p['K%']) * 100 : null,
          bbpct: p['BB%'] ? parseFloat(p['BB%']) * 100 : null,
          swstr: p['SwStr%'] ? parseFloat(p['SwStr%']) * 100 : null,
          ip: p.IP,
          tier: p.ERA < 3.0 ? 1 : p.ERA < 3.8 ? 2 : p.ERA < 4.5 ? 3 : 4
        };
      });
    }

    res.status(200).json(pitchers);
  } catch (error) {
    console.error('Error fetching pitchers:', error);
    res.status(500).json({ error: 'Failed to fetch pitchers data' });
  }
}
