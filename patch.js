const fs = require("fs");
let html = fs.readFileSync("index.html", "utf8");

// We know the exact string, let"s use regex to handle \r\n vs \n
html = html.replace(/let mkt;[\r\n]+  if \(overrideMkt\)/, `const frontEndOddsGame = typeof oddsData !== "undefined" ? oddsData.find(od => od.home === g.home) : null;
  const currentFrontEndOdds = frontEndOddsGame && frontEndOddsGame.books ? frontEndOddsGame.books[currentBook] : null;

  let mkt;
  if (overrideMkt)`);

html = html.replace(/\} else if \(ODDS\[g.home\] \&\& ODDS\[g.home\]\[currentBook\]\) \{/, `} else if (currentFrontEndOdds) {
    mkt = JSON.parse(JSON.stringify(currentFrontEndOdds));
  } else if (ODDS[g.home] && ODDS[g.home][currentBook]) {`);

fs.writeFileSync("index.html", html, "utf8");
console.log("Patched correctly with regex!");

