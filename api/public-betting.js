export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://www.sportsbettingdime.com/mlb/public-betting-trends/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const html = await response.text();
      const games = parsePublicBettingHtml(html);
      if (games && games.length > 0) {
        return res.status(200).json({ source: 'live', games });
      }
    }
  } catch (e) {
    console.log('SBD fetch failed:', e.message);
  }

  // Fallback: return empty so client generates realistic simulated data
  return res.status(200).json({ source: 'simulated', games: [] });
}

function parsePublicBettingHtml(html) {
  const games = [];
  try {
    // Look for JSON-LD or embedded data blobs
    const jsonLdMatch = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        try {
          const json = JSON.parse(block.replace(/<[^>]+>/g, ''));
          if (Array.isArray(json)) {
            // Try to extract betting data from JSON
            json.forEach(item => {
              if (item.away && item.home) games.push(item);
            });
          }
        } catch (_) {}
      }
    }

    // HTML table row parsing — look for rows with team names + betting %
    // Pattern: <td>TeamName</td>...<td>XX%</td>
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const row = rowMatch[1];
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
        m[1].replace(/<[^>]+>/g, '').trim()
      );
      if (cells.length >= 4) {
        const pctCells = cells.filter(c => /^\d{1,3}%$/.test(c));
        const teamCells = cells.filter(c => c.length > 2 && !/^\d/.test(c) && c !== 'vs' && c !== '@');
        if (pctCells.length >= 2 && teamCells.length >= 1) {
          games.push({
            team: teamCells[0],
            mlPct: parseInt(pctCells[0]) || 50,
            rlPct: parseInt(pctCells[1]) || 50,
            ouPct: parseInt(pctCells[2]) || 50,
          });
        }
      }
    }
  } catch (e) {
    console.log('Parse error:', e.message);
  }
  return games;
}
