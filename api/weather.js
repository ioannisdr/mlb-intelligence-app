import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Edge cache for 15 minutes since weather changes frequently
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://www.covers.com/sport/baseball/mlb/matchups', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Covers.com returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const weatherData = {};

    // Note: covers.com layout can change, but generally matchups are in a container
    // We'll scrape basic weather cards.
    $('.cmg_matchup_game_box').each((i, el) => {
      const homeTeamStr = $(el).find('.cmg_matchup_header_team_names').text();
      // Extract the home team abbreviation or name
      // And the weather info
      const weatherText = $(el).find('.cmg_weather_info').text() || '';
      
      // Simple parsing: "Wind: 10mph Out to CF, 75F"
      // This is a naive regex based parsing, robust parsing depends on exact DOM
      const windMatch = weatherText.match(/(\d+)mph\s+(in|out|cross)/i);
      const tempMatch = weatherText.match(/(\d+)°/);
      
      if (homeTeamStr) {
        // Map home team to our abbreviations or just send raw
        const abbr = homeTeamStr.trim().split(' ').pop(); // Just an example
        weatherData[abbr] = {
          raw: weatherText.trim(),
          windMph: windMatch ? parseInt(windMatch[1]) : 0,
          dir: windMatch ? windMatch[2].toLowerCase() : 'dome',
          temp: tempMatch ? parseInt(tempMatch[1]) : 72
        };
      }
    });

    res.status(200).json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
