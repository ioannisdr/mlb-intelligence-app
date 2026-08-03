const fs = require('fs');
const data = require('./sbr_dump.json');
const histOdds = {};

data.forEach(dateObj => {
  if (!dateObj.oddsTableModel || !dateObj.oddsTableModel.gameRows) return;
  dateObj.oddsTableModel.gameRows.forEach(row => {
    const gv = row.gameView;
    if (!gv || !gv.startDate) return;
    const dateStr = gv.startDate.split('T')[0];
    const home = gv.homeTeam.nickname;
    
    if (!histOdds[dateStr]) histOdds[dateStr] = {};
    if (!histOdds[dateStr][home]) histOdds[dateStr][home] = {};
    
    if (row.oddsViews && Array.isArray(row.oddsViews)) {
       row.oddsViews.forEach(ov => {
         if (!ov || !ov.sportsbook) return;
         const sbMap = {
           'draftkings': 'DraftKings',
           'fanduel': 'FanDuel',
           'betmgm': 'BetMGM',
           'caesars': 'Caesars',
           'betrivers': 'BetRivers',
           'bovada': 'Bovada'
         };
         const sb = sbMap[ov.sportsbook];
         if (sb && ov.currentLine && ov.currentLine.homeOdds && ov.currentLine.awayOdds) {
           histOdds[dateStr][home][sb] = {
             ml: { h: ov.currentLine.homeOdds, a: ov.currentLine.awayOdds },
             ou: ov.currentLine.total || 8.5,
             rl: { hLine: '-1.5', aLine: '+1.5' } // stub
           };
         }
       });
    }
  });
});

fs.writeFileSync('historical_odds.js', 'window.HISTORICAL_ODDS = ' + JSON.stringify(histOdds) + ';');
console.log('Generated historical_odds.js');
