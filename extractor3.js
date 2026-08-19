const fs = require('fs');

function extractLiteral(filename, startStr, endStr) {
    const html = fs.readFileSync(filename, 'utf-8');
    const startIdx = html.indexOf(startStr);
    const endIdx = html.indexOf(endStr, startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        return html.substring(startIdx, endIdx);
    }
    return null;
}

const oldCalc = extractLiteral('index_51f6acc.html', 'function calculateModel(', 'function getGrade(');
const oldApp = extractLiteral('index_51f6acc.html', 'function renderApp(', 'async function runBacktest()');
const oldBook = extractLiteral('index_51f6acc.html', 'function changeBook(', 'function formatDateStr(');

const newCalc = extractLiteral('index.html', 'function calculateModel(', 'function getGrade(');
const newApp = extractLiteral('index.html', 'function renderApp(', 'async function runBacktest()');
const newBook = extractLiteral('index.html', 'function changeBook(', 'function formatDateStr(');

let html = fs.readFileSync('index.html', 'utf-8');

if (newCalc && html.includes(newCalc)) {
    html = html.replace(newCalc, oldCalc);
    console.log('calculateModel replaced');
}
if (newApp && html.includes(newApp)) {
    html = html.replace(newApp, oldApp);
    console.log('renderApp replaced');
}
if (newBook && html.includes(newBook)) {
    html = html.replace(newBook, oldBook);
    console.log('changeBook replaced');
}

fs.writeFileSync('index.html', html, 'utf-8');

console.log("Replacement successful.");
