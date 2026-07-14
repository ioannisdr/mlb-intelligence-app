const fs = require('fs');

const inPath = 'C:\\Users\\jdros\\.gemini\\antigravity\\scratch\\mlb-intelligence\\first_input.json';
const outPath = 'C:\\Users\\jdros\\.gemini\\antigravity\\scratch\\mlb-intelligence\\index_original.html';

const entry = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const content = entry.content;

const startIdx = content.indexOf('<!DOCTYPE html>');

if (startIdx !== -1) {
  const code = content.substring(startIdx);
  fs.writeFileSync(outPath, code, 'utf8');
  console.log('Successfully extracted HTML to index_original.html');
} else {
  console.log('HTML tags not found in the JSON content');
}
