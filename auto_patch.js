const fs = require('fs');
const oldLines = fs.readFileSync('old_index.html', 'utf8').split('\n');
let newLines = fs.readFileSync('index.html', 'utf8').split('\n');
let changes = 0;

for(let i = 0; i < newLines.length; i++) {
    if(newLines[i].includes('??') || newLines[i].includes('? Prev') || newLines[i].includes('Next ?') || newLines[i].includes('? Refresh')) {
        let bestMatch = null;
        let bestScore = -1;
        let baseStr = newLines[i].replace(/\??/g, '').trim();
        if(baseStr.length < 5) continue; // Skip very short lines

        for(let j = Math.max(0, i - 150); j < Math.min(oldLines.length, i + 150); j++) {
            let oldBase = oldLines[j].replace(/[^\x00-\x7F]/g, '').trim(); // strip non-ascii
            let newBase = newLines[i].replace(/[^\x00-\x7F]/g, '').replace(/\?/g, '').trim();
            
            // simple match score based on common characters or just if they are identical after stripping
            if(oldBase === newBase && oldBase.length > 0) {
                bestMatch = oldLines[j];
                break;
            }
        }
        if(bestMatch) {
            console.log('REPLACING:\n  ' + newLines[i].trim() + '\nWITH:\n  ' + bestMatch.trim() + '\n');
            newLines[i] = bestMatch;
            changes++;
        }
    }
}
console.log('Total changes: ' + changes);
fs.writeFileSync('index.html', newLines.join('\n'), 'utf8');