const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const oldSelect = `<select id="book-select" onchange="changeBook(this.value)" style="background:var(--bg3);color:var(--tx);border:1px solid var(--bdr2);border-radius:4px;padding:3px 6px;font-size:10px;outline:none;cursor:pointer;">
      <option value="DraftKings">DraftKings</option>
      <option value="FanDuel">FanDuel</option>
      <option value="BetMGM">BetMGM</option>
      <option value="Caesars">Caesars</option>
      <option value="BetRivers">BetRivers</option>
      <option value="Bovada">Bovada</option>
    </select>`;

const newSelect = `<select id="book-select" onchange="changeBook(this.value)" style="background:var(--bg3);color:var(--tx);border:1px solid var(--bdr2);border-radius:4px;padding:3px 6px;font-size:10px;outline:none;cursor:pointer;">
      <option value="DraftKings">DraftKings</option>
      <option value="FanDuel">FanDuel</option>
      <option value="BetMGM">BetMGM</option>
      <option value="Caesars">Caesars</option>
      <option value="BetRivers">BetRivers</option>
      <option value="ESPNBet">ESPNBet</option>
      <option value="Fanatics">Fanatics</option>
      <option value="bet365">bet365</option>
      <option value="HardRock">HardRock</option>
      <option value="PointsBet">PointsBet</option>
    </select>`;

if (code.includes(oldSelect)) {
  code = code.replace(oldSelect, newSelect);
  console.log('Select replaced');
} else {
  const oldSelectCRLF = oldSelect.replace(/\n/g, '\r\n');
  if (code.includes(oldSelectCRLF)) {
    code = code.replace(oldSelectCRLF, newSelect.replace(/\n/g, '\r\n'));
    console.log('Select replaced (CRLF)');
  } else {
    console.log('Could not find select');
  }
}

fs.writeFileSync('index.html', code);
