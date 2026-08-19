const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/else if \(g\.dateKey && typeof window !== 'undefined' && window\.HISTORICAL_ODDS && window\.HISTORICAL_ODDS\[g\.dateKey\] && window\.HISTORICAL_ODDS\[g\.dateKey\]\[g\.home\] && window\.HISTORICAL_ODDS\[g\.dateKey\]\[g\.home\]\[currentBook\]\)/, "else if (cDateStr && typeof window !== 'undefined' && window.HISTORICAL_ODDS && window.HISTORICAL_ODDS[cDateStr] && window.HISTORICAL_ODDS[cDateStr][g.home] && window.HISTORICAL_ODDS[cDateStr][g.home][currentBook])");

code = code.replace(/window\.HISTORICAL_ODDS\[g\.dateKey\]\[g\.home\]\[currentBook\]/g, "window.HISTORICAL_ODDS[cDateStr][g.home][currentBook]");

fs.writeFileSync('index.html', code);
console.log('Fixed cDateStr references.');
