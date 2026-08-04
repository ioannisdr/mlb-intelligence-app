import fs from 'fs';

try {
  let orig = fs.readFileSync('index_original.html', 'utf16le');
  let curr = fs.readFileSync('index.html', 'utf8');

  let fnStart = orig.indexOf('function getWeatherString');
  let fnEnd = orig.indexOf('function formatTime', fnStart);
  let origWeatherFn = orig.substring(fnStart, fnEnd);

  let currStart = curr.indexOf('function getWeatherString');
  let currEnd = curr.indexOf('function formatTime', currStart);

  curr = curr.substring(0, currStart) + origWeatherFn + curr.substring(currEnd);

  let origLiveScoreMenu = orig.match(/<div class="tab" onclick="switchTab\('live'\)">(.*?)<\/div>/)[1];
  let origOddsMovementMenu = orig.match(/<div class="tab" onclick="switchTab\('odds'\)">(.*?)<\/div>/)[1];
  let origLiveScoreTitle = orig.match(/<div class="title" style="margin-bottom:2px">(.*?)<\/div>/)[1];
  let origOddsMovementTitle = orig.match(/<div class="title" style="margin-bottom:4px">(.*?)<\/div>/)[1];

  curr = curr.replace(/<div class="tab" onclick="switchTab\('live'\)">.*?<\/div>/, '<div class="tab" onclick="switchTab(\'live\')">' + origLiveScoreMenu + '</div>');
  curr = curr.replace(/<div class="tab" onclick="switchTab\('odds'\)">.*?<\/div>/, '<div class="tab" onclick="switchTab(\'odds\')">' + origOddsMovementMenu + '</div>');
  curr = curr.replace(/<div class="title" style="margin-bottom:2px">.*?<\/div>/, '<div class="title" style="margin-bottom:2px">' + origLiveScoreTitle + '</div>');
  curr = curr.replace(/<div class="title" style="margin-bottom:4px">.*?<\/div>/, '<div class="title" style="margin-bottom:4px">' + origOddsMovementTitle + '</div>');

  fs.writeFileSync('index.html', curr, 'utf8');
  console.log("SUCCESS");
} catch(e) {
  console.error(e);
}