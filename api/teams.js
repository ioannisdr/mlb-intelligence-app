// Maps MLB Stats API full team name to nickname used by getTeamName() in the frontend
function getTeamNick(fullName) {
  if (!fullName) return 'UNK';
  if (fullName.includes('Red Sox'))   return 'Red Sox';
  if (fullName.includes('White Sox')) return 'White Sox';
  if (fullName.includes('Blue Jays')) return 'Blue Jays';
  return fullName.split(' ').pop();
}

// Approximates wOBA based on OBP, SLG, and AVG (Standard FanGraphs formula weights)
function calcWOBA(obp, slg, avg) {
  return Math.round((0.72 * obp + 0.31 * (slg - avg) + 0.050) * 1000) / 1000;
}

// Parses a split object and returns key metrics
function parseSplit(split) {
  const s = split.stat ?? {};
  const obp  = parseFloat(s.obp)  || 0.318;
  const slg  = parseFloat(s.slg)  || 0.405;
  const avg  = parseFloat(s.avg)  || 0.250;
  
  const pa   = parseInt(s.plateAppearances) || 1;
  const so   = parseInt(s.strikeOuts) || 0;
  const bb   = parseInt(s.baseOnBalls) || 0;

  return {
    woba: parseFloat(s.woba) || parseFloat(s.wOBA) || calcWOBA(obp, slg, avg),
    obp, slg, avg,
    ops: parseFloat(s.ops) || (obp + slg),
    kpct: (so / pa) * 100 || 22.0,
    bbpct: (bb / pa) * 100 || 8.0,
    runs: parseInt(s.runs) || 0,
    hr: parseInt(s.homeRuns) || 0
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const today = new Date();
    const l14 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split('T')[0];
    const l14Str = l14.toISOString().split('T')[0];

    // Fetch 5 parallel requests
    const [batOverallRes, batLhpRes, batRhpRes, batL14Res, pitRes] = await Promise.all([
      fetch('https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=hitting&sportId=1&season=2026', { headers: { 'Accept': 'application/json' } }),
      fetch('https://statsapi.mlb.com/api/v1/teams/stats?stats=statSplits&group=hitting&sportId=1&season=2026&sitCodes=vl', { headers: { 'Accept': 'application/json' } }),
      fetch('https://statsapi.mlb.com/api/v1/teams/stats?stats=statSplits&group=hitting&sportId=1&season=2026&sitCodes=vr', { headers: { 'Accept': 'application/json' } }),
      fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=byDateRange&group=hitting&sportId=1&season=2026&startDate=${l14Str}&endDate=${todayStr}`, { headers: { 'Accept': 'application/json' } }),
      fetch('https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=pitching&sportId=1&season=2026', { headers: { 'Accept': 'application/json' } })
    ]);

    if (!batOverallRes.ok) throw new Error(`MLB batting API error ${batOverallRes.status}`);

    const batOverall = await batOverallRes.json();
    const batLhp = batLhpRes.ok ? await batLhpRes.json() : { stats: [] };
    const batRhp = batRhpRes.ok ? await batRhpRes.json() : { stats: [] };
    const batL14 = batL14Res.ok ? await batL14Res.json() : { stats: [] };

    const teams = {};

    // 1. Overall Batting
    const overallSplits = batOverall?.stats?.[0]?.splits ?? [];
    overallSplits.forEach(split => {
      const nick = getTeamNick(split.team?.name);
      teams[nick] = parseSplit(split);
      // Initialize sub-objects
      teams[nick].vsLHP = { woba: teams[nick].woba };
      teams[nick].vsRHP = { woba: teams[nick].woba };
      teams[nick].l14   = { woba: teams[nick].woba };
    });

    // 2. vs LHP
    const lhpSplits = batLhp?.stats?.[0]?.splits ?? [];
    lhpSplits.forEach(split => {
      const nick = getTeamNick(split.team?.name);
      if (teams[nick]) teams[nick].vsLHP = parseSplit(split);
    });

    // 3. vs RHP
    const rhpSplits = batRhp?.stats?.[0]?.splits ?? [];
    rhpSplits.forEach(split => {
      const nick = getTeamNick(split.team?.name);
      if (teams[nick]) teams[nick].vsRHP = parseSplit(split);
    });

    // 4. Last 14 Days
    const l14Splits = batL14?.stats?.[0]?.splits ?? [];
    l14Splits.forEach(split => {
      const nick = getTeamNick(split.team?.name);
      if (teams[nick]) teams[nick].l14 = parseSplit(split);
    });

    // 5. Team Pitching ERA
    if (pitRes.ok) {
      const pitData = await pitRes.json();
      const pitSplits = pitData?.stats?.[0]?.splits ?? [];
      pitSplits.forEach(split => {
        const nick = getTeamNick(split.team?.name);
        if (teams[nick]) {
          teams[nick].teamEra  = parseFloat(split.stat?.era)  || 4.20;
          teams[nick].teamWhip = parseFloat(split.stat?.whip) || 1.30;
        }
      });
    }

    res.status(200).json(teams);
  } catch (error) {
    console.error('teams.js error:', error.message);
    res.status(200).json({}); // Fallback
  }
}
