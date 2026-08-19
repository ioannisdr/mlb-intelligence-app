const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const tooltipOld = `            label: function(ctx) { 
              const homeVal = Math.round(ctx.raw);
              const oppOdds = homeVal > 0 ? -1 * (homeVal + 20) : Math.abs(homeVal) - 20;
              const fmt = v => (v > 0 ? '+' : '') + v;
              return \`\${ctx.dataset.label}: \${home} \${fmt(homeVal)} | \${away} \${fmt(oppOdds)}\`; 
            } `;
            
const tooltipNew = `            label: function(ctx) { 
              const homeVal = Math.round(ctx.raw);
              let oppOdds;
              if (homeVal >= 100) {
                oppOdds = -(homeVal + 20);
              } else if (homeVal <= -120) {
                oppOdds = Math.abs(homeVal) - 20;
              } else {
                oppOdds = -220 - homeVal;
              }
              const fmt = v => (v > 0 ? '+' : '') + Math.round(v);
              return \`\${ctx.dataset.label}: \${home} \${fmt(homeVal)} | \${away} \${fmt(oppOdds)}\`; 
            } `;

if (code.includes(tooltipOld)) {
  code = code.replace(tooltipOld, tooltipNew);
  console.log('Tooltip updated for proper American odds math.');
} else {
  const tooltipOldCRLF = tooltipOld.replace(/\n/g, '\r\n');
  if (code.includes(tooltipOldCRLF)) {
    code = code.replace(tooltipOldCRLF, tooltipNew.replace(/\n/g, '\r\n'));
    console.log('Tooltip updated for proper American odds math (CRLF).');
  } else {
    console.log('Could not find tooltip callback to update.');
  }
}

fs.writeFileSync('index.html', code);
