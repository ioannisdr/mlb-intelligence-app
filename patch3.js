const fs = require("fs");
let html = fs.readFileSync("index.html", "utf8");

html = html.replace(/const isRealOdds \= \!\!\(ODDS\[home\] \&\& ODDS\[home\]\[currentBook\]\) \|\|/g, `const isRealOdds = !!currentFrontEndOdds || !!(ODDS[home] && ODDS[home][currentBook]) ||`);

fs.writeFileSync("index.html", html, "utf8");
console.log("Patched isRealOdds!");

