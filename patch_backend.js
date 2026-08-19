const fs = require('fs');
let code = fs.readFileSync('api/odds.js', 'utf8');

// Replace team extraction:
const teamRegex = /const homeTeam = comp\.competitors\.find\(c => c\.homeAway === 'home'\)\?\.team\?\.name \|\| '';\s*const awayTeam = comp\.competitors\.find\(c => c\.homeAway === 'away'\)\?\.team\?\.name \|\| '';/g;
const replacement = `const homeComp = comp.competitors.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors.find(c => c.homeAway === 'away');
        const homeTeam = homeComp?.team?.name || '';
        const awayTeam = awayComp?.team?.name || '';
        const homeP = homeComp?.probables?.[0]?.athlete?.fullName || 'TBD';
        const awayP = awayComp?.probables?.[0]?.athlete?.fullName || 'TBD';`;

code = code.replace(teamRegex, replacement);

// Replace match object:
const matchRegex = /const match = \{\s*away: getTeamName\(awayTeam\),\s*home: getTeamName\(homeTeam\),\s*books: \{/g;
const matchReplacement = `const match = {
          away: getTeamName(awayTeam),
          home: getTeamName(homeTeam),
          awayP: awayP,
          homeP: homeP,
          books: {`;

code = code.replace(matchRegex, matchReplacement);

fs.writeFileSync('api/odds.js', code, 'utf8');
console.log('Fixed api/odds.js');
