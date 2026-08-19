const fs = require('fs');
const { execSync } = require('child_process');

function extractFunction(html, searchStr) {
  const startIdx = html.indexOf(searchStr);
  if (startIdx === -1) return null;
  
  const braceIdx = html.indexOf('{', startIdx);
  if (braceIdx === -1) return null;
  
  let braceCount = 1;
  let i = braceIdx + 1;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
  while (braceCount > 0 && i < html.length) {
    if (!inComment && !inString && html.slice(i, i+2) === '/*') {
      inComment = true;
      i += 2;
      continue;
    }
    if (inComment && html.slice(i, i+2) === '*/') {
      inComment = false;
      i += 2;
      continue;
    }
    if (!inComment && !inString && html.slice(i, i+2) === '//') {
      while(i < html.length && html[i] !== '\n') i++;
      continue;
    }
    
    if (!inComment) {
      if (!inString && (html[i] === '"' || html[i] === "'" || html[i] === '')) {
        inString = true;
        stringChar = html[i];
      } else if (inString && html[i] === stringChar && html[i-1] !== '\\') {
        inString = false;
      }
      
      if (!inString) {
        if (html[i] === '{') braceCount++;
        if (html[i] === '}') braceCount--;
      }
    }
    i++;
  }
  
  return html.substring(startIdx, i);
}

const oldHtml = execSync('git show 13dbc13:index.html').toString('utf8');
const newHtml = fs.readFileSync('index.html', 'utf-8');

const funcsToReplace = ['function changeBook(', 'function calculateModel(', 'function renderApp('];
let modifiedHtml = newHtml;

for (const searchStr of funcsToReplace) {
  const oldCode = extractFunction(oldHtml, searchStr);
  const newCode = extractFunction(newHtml, searchStr);
  
  if (oldCode && newCode) {
    modifiedHtml = modifiedHtml.replace(newCode, oldCode);
    console.log('Replaced', searchStr);
  } else {
    console.log('Could not find', searchStr, oldCode !== null, newCode !== null);
  }
}

fs.writeFileSync('index.html', modifiedHtml);
