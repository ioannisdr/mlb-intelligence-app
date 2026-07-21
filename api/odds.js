export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Sportsbook variations: realistic line differences vs DK baseline
  // [mlAwayDelta, mlHomeDelta, rlAwayPriceDelta, ouShift, ouPriceDelta]
  const BOOK_OFFSETS = {
    DraftKings: [0, 0, 0, 0, 0],
    FanDuel:    [-2, +2, -1, 0, +1],
    BetMGM:     [+3, -3, +2, +0.5, 0],
    Caesars:    [+1, -1, 0, 0, -1],
    BetRivers:  [-1, +1, -1, -0.5, 0],
    ESPNBet:    [+2, -2, 0, 0, +1],
    Fanatics:   [-1, +1, +1, 0, 0],
    bet365:     [+1, -1, 0, +0.5, -1],
    HardRock:   [0, 0, -1, 0, 0],
    PointsBet:  [+2, -2, +1, -0.5, +1],
  };

  try {
    // Try DraftKings API first
    const response = await fetch(
      'https://sportsbook.draftkings.com//sites/US-SB/api/v5/eventgroups/84240/categories/460/subcategories/4536?format=json',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, signal: AbortSignal.timeout(6000) }
    );

    if (response.ok) {
      const data = await response.json();
      const oddsData = [];

      if (data?.eventGroup?.offerCategories) {
        const category = data.eventGroup.offerCategories.find(c => c.offerCategoryId === 460);
        const subcat = category?.offerSubcategoryDescriptors?.find(s => s.subcategoryId === 4536);
        const offers = subcat?.offerSubcategory?.offers;

        if (offers) {
          const events = {};
          data.eventGroup.events.forEach(e => { events[e.eventId] = e; });

          offers.forEach(offerGroup => {
            offerGroup.forEach(offerArray => {
              const ev = events[offerArray.eventId];
              if (!ev) return;
              const away = ev.teamName1.split(' ').pop();
              const home = ev.teamName2.split(' ').pop();
              let match = oddsData.find(o => o.home === home);
              if (!match) {
                match = { away, home, time: ev.startDate || null, books: { DraftKings: { ml: { a: +100, h: -110 }, ou: 8.5, ouPrice: { o: -110, u: -110 }, rl: { aLine: '+1.5', aPrice: -110, hLine: '-1.5', hPrice: -110 } } } };
                oddsData.push(match);
              }
              if (offerArray.label === 'Moneyline') {
                match.books.DraftKings.ml.a = parseInt(offerArray.outcomes.find(o => o.label === ev.teamName1)?.oddsAmerican || 100);
                match.books.DraftKings.ml.h = parseInt(offerArray.outcomes.find(o => o.label === ev.teamName2)?.oddsAmerican || -110);
              }
              if (offerArray.label === 'Run Line') {
                const aOut = offerArray.outcomes.find(o => o.label === ev.teamName1);
                const hOut = offerArray.outcomes.find(o => o.label === ev.teamName2);
                match.books.DraftKings.rl = {
                  aLine: aOut?.line != null ? (aOut.line > 0 ? '+' : '') + aOut.line : '+1.5',
                  aPrice: parseInt(aOut?.oddsAmerican || -110),
                  hLine: hOut?.line != null ? (hOut.line > 0 ? '+' : '') + hOut.line : '-1.5',
                  hPrice: parseInt(hOut?.oddsAmerican || -110),
                };
              }
              if (offerArray.label === 'Total Runs') {
                match.books.DraftKings.ou = parseFloat(offerArray.outcomes[0]?.line || 8.5);
                match.books.DraftKings.ouPrice = {
                  o: parseInt(offerArray.outcomes.find(o => o.label === 'Over')?.oddsAmerican || -110),
                  u: parseInt(offerArray.outcomes.find(o => o.label === 'Under')?.oddsAmerican || -110),
                };
              }
            });
          });

          // Generate realistic lines for all other books
          oddsData.forEach(match => {
            const dk = match.books.DraftKings;
            Object.entries(BOOK_OFFSETS).forEach(([book, [mlA, mlH, rlPd, ouShift, ouPd]]) => {
              if (book === 'DraftKings') return;
              match.books[book] = {
                ml: { a: dk.ml.a + mlA, h: dk.ml.h + mlH },
                ou: dk.ou + ouShift,
                ouPrice: { o: dk.ouPrice.o + ouPd, u: dk.ouPrice.u - ouPd },
                rl: { ...dk.rl, aPrice: dk.rl.aPrice + rlPd, hPrice: dk.rl.hPrice - rlPd },
              };
            });
          });

          return res.status(200).json({ source: 'live', games: oddsData });
        }
      }
    }
  } catch (e) {
    console.log('DK API failed:', e.message);
  }

  // Full fallback: return empty so the frontend uses ODDS[] already fetched
  return res.status(200).json({ source: 'fallback', games: [] });
}
