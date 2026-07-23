// FanGraphs pitcher leaderboard — type=8 includes xERA, xFIP, BABIP, K%, BB%, SwStr%
const FG_URL = 'https://www.fangraphs.com/api/leaders/major-league/data' +
  '?age=0&pos=all&stats=pit&lg=all&qual=20&season=2026&season1=2026' +
  '&ind=0&team=0&pageitems=500&pagenum=1&rost=0&players=0&type=8';

// Map FanGraphs team abbreviation → app team nickname
const FG_TEAM = {
  'ARI':'Diamondbacks','ATL':'Braves','BAL':'Orioles','BOS':'Red Sox',
  'CHC':'Cubs','CWS':'White Sox','CIN':'Reds','CLE':'Guardians',
  'COL':'Rockies','DET':'Tigers','HOU':'Astros','KCR':'Royals',
  'LAA':'Angels','LAD':'Dodgers','MIA':'Marlins','MIL':'Brewers',
  'MIN':'Twins','NYM':'Mets','NYY':'Yankees','OAK':'Athletics',
  'PHI':'Phillies','PIT':'Pirates','SDP':'Padres','SFG':'Giants',
  'SEA':'Mariners','STL':'Cardinals','TBR':'Rays','TEX':'Rangers',
  'TOR':'Blue Jays','WSN':'Nationals'
};

function stripHtml(s) {
  if (!s) return '';
  const m = String(s).match(/>([^<]+)</);
  return m ? m[1].trim() : String(s).trim();
}

function parsePct(v) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(v);
  // FanGraphs sometimes sends already-multiplied (e.g. 25.3) or decimal (0.253)
  return n > 1 ? n : n * 100;
}

function buildPitcherObj(p) {
  const xera  = parseFloat(p.xERA)  || parseFloat(p.ERA)   || 4.20;
  const era   = parseFloat(p.ERA)   || xera;
  const fip   = parseFloat(p.FIP)   || (xera + 0.15);
  const xfip  = parseFloat(p.xFIP)  || fip;
  const babip = parseFloat(p.BABIP) || 0.292;
  const ip    = parseFloat(p.IP)    || 0;

  const kpct  = parsePct(p['K%'])     || 22.5;
  const bbpct = parsePct(p['BB%'])    || 7.5;
  const swstr = parsePct(p['SwStr%']) || 11.0;

  const tier = xera < 3.0 ? 'Elite' : xera < 3.8 ? 'Strong' : 'Mid';
  // Model score: higher is better. Uses xERA as primary signal.
  const score = ((4.50 - xera) * 1.5).toFixed(2);

  return { era, xera, fip, xFIP: xfip, babip, kpct, bbpct, swstr, ip, tier, score };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(FG_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.fangraphs.com/'
      }
    });

    if (!response.ok) throw new Error(`FanGraphs ${response.status}`);

    const json = await response.json();
    if (!json || !json.data || !json.data.length) throw new Error('FanGraphs returned empty data');

    const pitchers = {};
    json.data.forEach(p => {
      const name = stripHtml(p.Name);
      const abbr = stripHtml(p.Team);
      if (!name || name === 'Name') return; // skip header rows

      pitchers[name] = {
        ...buildPitcherObj(p),
        team: FG_TEAM[abbr] || abbr,
        hand: (p.Throws || p.Hand || 'R').toUpperCase().includes('L') ? 'LHP' : 'RHP',
        name
      };
    });

    res.status(200).json(pitchers);
  } catch (err) {
    console.error('pitchers.js primary failed:', err.message);
    // Fallback: Baseball Savant pitcher leaderboard (no CORS issues server-side)
    try {
      const svUrl = 'https://baseballsavant.mlb.com/leaderboard/custom?' +
        'year=2026&type=pitcher&filter=&sort=4&sortDir=asc&min=20&selections=' +
        'p_era,p_k_percent,p_bb_percent,xera,xfip,babip,woba,xwoba,hard_hit_percent,barrel_batted_rate&chart=false&x=xera&y=xera' +
        '&r=no&chartType=beeswarm&csv=true';
      const svRes = await fetch(svUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/csv' }
      });
      if (!svRes.ok) throw new Error(`Savant ${svRes.status}`);
      const csv = await svRes.text();
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      const get = (row, key) => {
        const i = headers.indexOf(key);
        return i >= 0 ? row[i]?.replace(/"/g, '').trim() : '';
      };

      const mlbTeams = {
        133: 'Athletics', 134: 'Pirates', 135: 'Padres', 136: 'Mariners', 137: 'Giants',
        138: 'Cardinals', 139: 'Rays', 140: 'Rangers', 141: 'Blue Jays', 142: 'Twins',
        143: 'Phillies', 144: 'Braves', 145: 'White Sox', 146: 'Marlins', 147: 'Yankees',
        158: 'Brewers', 108: 'Angels', 109: 'Diamondbacks', 110: 'Orioles', 111: 'Red Sox',
        112: 'Cubs', 113: 'Reds', 114: 'Guardians', 115: 'Rockies', 116: 'Tigers',
        117: 'Astros', 118: 'Royals', 119: 'Dodgers', 120: 'Nationals', 121: 'Mets'
      };
      
      let pTeamMap = {};
      try {
        const pRes = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players');
        if (pRes.ok) {
          const pData = await pRes.json();
          pData.people.forEach(p => {
            if (p.currentTeam && mlbTeams[p.currentTeam.id]) {
              pTeamMap[p.fullName] = mlbTeams[p.currentTeam.id];
            }
          });
        }
      } catch(e) {}

      const pitchers = {};
      lines.slice(1).forEach(line => {
        const row = line.split(',');
        const name = get(row, 'last_name') && get(row, 'first_name')
          ? `${get(row, 'first_name')} ${get(row, 'last_name')}`
          : get(row, 'player_name') || get(row, 'last_name, first_name');
        if (!name) return;

        const xera  = parseFloat(get(row, 'xera'))  || 4.20;
        const era   = parseFloat(get(row, 'p_era'))  || xera;
        const xfip  = parseFloat(get(row, 'xfip'))  || (xera + 0.1);
        const kpct  = parseFloat(get(row, 'p_k_percent'))  || 22.5;
        const bbpct = parseFloat(get(row, 'p_bb_percent')) || 7.5;
        const babip = parseFloat(get(row, 'babip')) || 0.292;

        const woba    = parseFloat(get(row, 'woba')) || 0.315;
        const xwoba   = parseFloat(get(row, 'xwoba')) || 0.315;
        const hardhit = parseFloat(get(row, 'hard_hit_percent')) || 38.0;
        const barrel  = parseFloat(get(row, 'barrel_batted_rate')) || 7.0;

        const team = pTeamMap[name] || 'UNK';

        pitchers[name] = {
          era, xera, fip: xfip, xFIP: xfip, babip, kpct, bbpct, swstr: 11.0,
          woba, xwoba, hardhit, barrel,
          ip: 0, team, hand: 'RHP',
          tier: xera < 3.0 ? 'Elite' : xera < 3.8 ? 'Strong' : 'Mid',
          score: ((4.50 - xera) * 1.5).toFixed(2),
          name
        };
      });

      return res.status(200).json(pitchers);
    } catch (svErr) {
      console.error('pitchers.js fallback also failed:', svErr.message);
      return res.status(200).json({}); // return empty rather than 500 so frontend handles gracefully
    }
  }
}
