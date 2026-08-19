const fs = require("fs");
let html = fs.readFileSync("index.html", "utf8");

html = html.replace(/let realMkt \= null;\s*const isTodaySlate = TODAY.some\(tg \=\> tg\.home === home \&\& tg\.away === away\);\s*if \(isTodaySlate \&\& ODDS\[home\] \&\& ODDS\[home\]\[currentBook\]\) \{/, `let realMkt = null;
            const isTodaySlate = TODAY.some(tg => tg.home === home && tg.away === away);
            const frontEndOddsGame = typeof oddsData !== "undefined" ? oddsData.find(od => od.home === home) : null;
            const currentFrontEndOdds = frontEndOddsGame && frontEndOddsGame.books ? frontEndOddsGame.books[currentBook] : null;
            
            if (isTodaySlate && currentFrontEndOdds) {
               realMkt = currentFrontEndOdds;
            } else if (isTodaySlate && ODDS[home] && ODDS[home][currentBook]) {`);

fs.writeFileSync("index.html", html, "utf8");
console.log("Patched runBacktest!");

