import fs from 'fs';

let orig = fs.readFileSync('index_original.html', 'utf16le');
let curr = fs.readFileSync('index.html', 'utf8');

let liveMatch = orig.match(/(.{0,5})Live Scores/g);
let oddsMatch = orig.match(/(.{0,5})Odds Movement/g);

console.log("Live Scores original:", liveMatch);
console.log("Odds Movement original:", oddsMatch);

// Let's replace the weather function directly
let fnStart = orig.indexOf('function getWeatherString');
let fnEnd = orig.indexOf('function formatTime', fnStart);
let origWeatherFn = orig.substring(fnStart, fnEnd);

let currStart = curr.indexOf('function getWeatherString');
let currEnd = curr.indexOf('function formatTime', currStart);

curr = curr.substring(0, currStart) + origWeatherFn + curr.substring(currEnd);

// For the tabs, let's just look at what the original was
// Replace occurrences of ?? Live Scores and ?? Odds Movement
// Wait, the corrupted string is "\uFFFD?? Live Scores" or something?
// Let's just use regex to replace anything matching /.{0,5}Live Scores/ with the original match where appropriate