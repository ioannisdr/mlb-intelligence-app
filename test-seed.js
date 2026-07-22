function seedRand(seedStr) {
  let h = 0;
  for(let i=0; i<seedStr.length; i++) h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }();
}

function rand(seed) {
  return seedRand(seed) / 4294967296;
}

const g = { away: 'Giants', home: 'Royals', dateKey: '2026-07-22' };
const seed = g.away + g.home + g.dateKey;
const aB = Math.round(15 + (rand(seed+"m1")*70));
const aM = Math.round(15 + (rand(seed+"m2")*70));
const hB = 100 - aB;
const hM = 100 - aM;

console.log('Away Bet:', aB, 'Away Money:', aM);
console.log('Home Bet:', hB, 'Home Money:', hM);
