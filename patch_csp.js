const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Replace the inline onclick for the toggle button
const toggleInlineStr = `onclick="toggleLineTrends('\${gId}', '\${away}', '\${home}', '\${time || ''}')"`;
const toggleSafeStr = `class="trends-toggle-btn" data-gid="\${gId}" data-away="\${away}" data-home="\${home}" data-time="\${time || ''}"`;
code = code.replace(toggleInlineStr, toggleSafeStr);

// 2. Replace the inline onchange for the select dropdown
const selectInlineStr = `onchange="renderTrendsChart('\${gId}', '\${away}', '\${home}')"`;
const selectSafeStr = `class="trends-book-select" data-gid="\${gId}" data-away="\${away}" data-home="\${home}"`;
code = code.replace(selectInlineStr, selectSafeStr);

// 3. Inject the event listeners at the end of the renderOddsTab function
const renderEndStr = `content.innerHTML = html || '<div class="odds-empty">No odds available. Click Refresh to try again.</div>';\n}`;
const renderEndSafeStr = `content.innerHTML = html || '<div class="odds-empty">No odds available. Click Refresh to try again.</div>';
  
  // Attach safe event listeners for CSP compliance
  document.querySelectorAll('.trends-toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      toggleLineTrends(this.dataset.gid, this.dataset.away, this.dataset.home, this.dataset.time);
    });
  });
  
  document.querySelectorAll('.trends-book-select').forEach(sel => {
    sel.addEventListener('change', function() {
      renderTrendsChart(this.dataset.gid, this.dataset.away, this.dataset.home);
    });
  });
}`;
if (code.includes(renderEndStr)) {
    code = code.replace(renderEndStr, renderEndSafeStr);
} else {
    // try with \r\n
    const renderEndStrCR = `content.innerHTML = html || '<div class="odds-empty">No odds available. Click Refresh to try again.</div>';\r\n}`;
    if (code.includes(renderEndStrCR)) {
        code = code.replace(renderEndStrCR, renderEndSafeStr);
    } else {
        console.log("Could not find the end of renderOddsTab!");
    }
}

// 4. Remove the extra </script> that was accidentally appended last time if it exists
if (code.includes('</script>\n</script>')) {
    code = code.replace('</script>\n</script>', '</script>');
}
if (code.includes('</script>\r\n</script>')) {
    code = code.replace('</script>\r\n</script>', '</script>');
}

fs.writeFileSync('index.html', code);
console.log('Successfully patched index.html to be CSP compliant!');
