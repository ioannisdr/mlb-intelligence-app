const fs = require('fs');

function extract(filename, startStr, endStr) {
    const html = fs.readFileSync(filename, 'utf-8');
    const lines = html.split(/\r?\n/);
    
    let startIdx = -1;
    let endIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(startStr) && startIdx === -1) {
            startIdx = i;
        } else if (lines[i].includes(endStr) && startIdx !== -1 && endIdx === -1) {
            endIdx = i;
        }
    }
    
    if (startIdx !== -1 && endIdx !== -1) {
        return lines.slice(startIdx, endIdx).join('\n') + '\n';
    }
    return null;
}

const oldCalc = extract('index_13dbc13.html', 'function calculateModel(', 'function getGrade(');
const oldApp = extract('index_13dbc13.html', 'function renderApp(', 'async function runBacktest()');
const oldBook = extract('index_13dbc13.html', 'function changeBook(', 'function formatDateStr(');

const newCalc = extract('index.html', 'function calculateModel(', 'function getGrade(');
const newApp = extract('index.html', 'function renderApp(', 'async function runBacktest()');
const newBook = extract('index.html', 'function changeBook(', 'function formatDateStr(');

console.log('Old App lines:', oldApp ? oldApp.split('\n').length : 0);
console.log('New App lines:', newApp ? newApp.split('\n').length : 0);

let html = fs.readFileSync('index.html', 'utf-8');

// Replace using literal string replacement
html = html.replace(newCalc, oldCalc);
html = html.replace(newApp, oldApp);
html = html.replace(newBook, oldBook);

fs.writeFileSync('index.html', html, 'utf-8');

console.log("Replacement successful.");
