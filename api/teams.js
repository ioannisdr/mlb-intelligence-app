// Maps MLB Stats API full team name to nickname used by getTeamName() in the frontend
function getTeamNick(fullName) {
  if (!fullName) return 'UNK';
  if (fullName.includes('Red Sox'))   return 'Red Sox';
  if (fullName.includes('White Sox')) return 'White Sox';
  if (fullName.includes('Blue Jays')) return 'Blue Jays';
  return fullName.split(' ').pop();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Fetch batting (advanced includes wOBA) and pitching stats in parallel
    const [batRes, pitRes] = await Promise.all([
      fetch('https://statsapi.mlb.com/api/v1/teams/stats?stats=seasonAdvanced&group=hitting&sportId=1&season=2026', {
        headers: { 'Accept': 'application/json' }
      }),
      fetch('https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=pitching&sportId=1&season=2026', {
        headers: { 'Accept': 'application/json' }
      })
    ]);

    if (!batRes.ok) throw new Error(`MLB batting API error ${batRes.status}`);
    const batData = await batRes.json();

    const teams = {};

    // Process batting stats
    const batSplits = batData?.stats?.[0]?.splits ?? [];
    batSplits.forEach(split => {
      const nick = getTeamNick(split.team?.name);
      const s = split.stat ?? {};

      const obp  = parseFloat(s.obp)  || 0.318;
      const slg  = parseFloat(s.slg)  || 0.405;
      const avg  = parseFloat(s.avg)  || 0.250;
      // wOBA from advanced stats; fall back to regression-based approximation
      const woba = parseFloat(s.woba) || parseFloat(s.wOBA) ||
                   Math.round((0.72 * obp + 0.31 * (slg - avg) + 0.050) * 1000) / 1000;

      teams[nick] = {
        woba,
        obp,
        slg,
        avg,
        ops:  parseFloat(s.ops) || (obp + slg),
        runs: parseInt(s.runs)  || 0,
        hr:   parseInt(s.homeRuns) || 0,
        so:   parseInt(s.strikeOuts) || 0,
        bb:   parseInt(s.baseOnBalls) || 0,
        gp:   parseInt(s.gamesPlayed) || 1
      };
    });

    // Augment with team pitching ERA
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
    // Return empty object so frontend falls back to defaults gracefully
    res.status(200).json({});
  }
}
