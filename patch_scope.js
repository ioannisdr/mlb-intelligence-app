const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Use string replacement with exact matching
const origStr1 = `    const snap = oddsSnapshot[snapKey] || {};\r
\r
    // Calculate best lines across books`;
const newStr1 = `    const snap = oddsSnapshot[snapKey] || {};\r
    const gId = \`\${away}_\${home}\`;\r
    const mUp = \`\${away} @ \${home}\`;\r
\r
    // Calculate best lines across books`;

// If Windows CRLF matching fails, try LF
const origStr1LF = `    const snap = oddsSnapshot[snapKey] || {};\n\n    // Calculate best lines across books`;
const newStr1LF = `    const snap = oddsSnapshot[snapKey] || {};\n    const gId = \`\${away}_\${home}\`;\n    const mUp = \`\${away} @ \${home}\`;\n\n    // Calculate best lines across books`;

if (code.includes(origStr1)) {
    code = code.replace(origStr1, newStr1);
} else if (code.includes(origStr1LF)) {
    code = code.replace(origStr1LF, newStr1LF);
} else {
    console.log("Could not find origStr1");
}

const origStr2 = `      const ouBest  = ouV  <= lowestOU && ouOv >= bestOUOver;\r
\r
      const gId = \`\${away}_\${home}\`;\r
      const mUp = \`\${away} @ \${home}\`;\r
\r
      const isMlASel`;
const newStr2 = `      const ouBest  = ouV  <= lowestOU && ouOv >= bestOUOver;\r
\r
      const isMlASel`;

const origStr2LF = `      const ouBest  = ouV  <= lowestOU && ouOv >= bestOUOver;\n\n      const gId = \`\${away}_\${home}\`;\n      const mUp = \`\${away} @ \${home}\`;\n\n      const isMlASel`;
const newStr2LF = `      const ouBest  = ouV  <= lowestOU && ouOv >= bestOUOver;\n\n      const isMlASel`;

if (code.includes(origStr2)) {
    code = code.replace(origStr2, newStr2);
} else if (code.includes(origStr2LF)) {
    code = code.replace(origStr2LF, newStr2LF);
} else {
    console.log("Could not find origStr2");
}

fs.writeFileSync('index.html', code);
console.log('Patched scope successfully');
