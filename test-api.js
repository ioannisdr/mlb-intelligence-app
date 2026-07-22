const teamId = 134; // Pirates
const season = 2026;
const start = '2026-06-01';
const end = '2026-07-22';
const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&season=${season}&gameType=R&hydrate=linescore&startDate=${start}&endDate=${end}`;

fetch(url)
  .then(r => r.json())
  .then(data => {
    const games = [];
    data.dates.forEach(d => {
      d.games.forEach(g => {
        if (g.status?.abstractGameState !== 'Final') return;
        const isHome = g.teams.home.team.id === teamId;
        const myScore  = isHome ? (g.teams.home.score ?? 0) : (g.teams.away.score ?? 0);
        const oppScore = isHome ? (g.teams.away.score ?? 0) : (g.teams.home.score ?? 0);
        
        let altMyScore = 0, altOppScore = 0;
        if (g.linescore && g.linescore.teams) {
            altMyScore = isHome ? (g.linescore.teams.home.runs ?? 0) : (g.linescore.teams.away.runs ?? 0);
            altOppScore = isHome ? (g.linescore.teams.away.runs ?? 0) : (g.linescore.teams.home.runs ?? 0);
        }

        const opp = isHome ? g.teams.away.team.name : g.teams.home.team.name;
        games.push({ 
           date: d.date, opp, isHome, 
           myScore, oppScore, 
           altMyScore, altOppScore,
           status: g.status.detailedState, gamePk: g.gamePk 
        });
      });
    });
    console.log(JSON.stringify(games.slice(-8), null, 2));
  });
