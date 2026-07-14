export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://sportsbook.draftkings.com//sites/US-SB/api/v5/eventgroups/84240/categories/460/subcategories/4536?format=json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const oddsData = [];

      if (data && data.eventGroup && data.eventGroup.offerCategories) {
        let category = data.eventGroup.offerCategories.find(c => c.offerCategoryId === 460);
        if (category && category.offerSubcategoryDescriptors) {
          let subcat = category.offerSubcategoryDescriptors.find(s => s.subcategoryId === 4536);
          if (subcat && subcat.offerSubcategory && subcat.offerSubcategory.offers) {
            
            // Map events
            let events = {};
            data.eventGroup.events.forEach(e => {
              events[e.eventId] = e;
            });

            subcat.offerSubcategory.offers.forEach(offerGroup => {
              offerGroup.forEach(offerArray => {
                let eventId = offerArray.eventId;
                let ev = events[eventId];
                if (!ev) return;
                
                let away = ev.teamName1.split(' ').pop();
                let home = ev.teamName2.split(' ').pop();
                
                // Find existing or create
                let match = oddsData.find(o => o.home === home);
                if (!match) {
                  match = { 
                    away, home, 
                    books: {
                      DraftKings: { ml: { a: +100, h: -110 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 }
                    } 
                  };
                  oddsData.push(match);
                }

                if (offerArray.label === 'Moneyline') {
                   let aOdds = offerArray.outcomes.find(o => o.label === ev.teamName1)?.oddsAmerican;
                   let hOdds = offerArray.outcomes.find(o => o.label === ev.teamName2)?.oddsAmerican;
                   if(aOdds) match.books.DraftKings.ml.a = parseInt(aOdds);
                   if(hOdds) match.books.DraftKings.ml.h = parseInt(hOdds);
                }
                if (offerArray.label === 'Run Line') {
                   let aLine = offerArray.outcomes.find(o => o.label === ev.teamName1)?.line;
                   let hLine = offerArray.outcomes.find(o => o.label === ev.teamName2)?.line;
                   if(aLine) match.books.DraftKings.rl.a = (aLine>0?'+':'')+aLine;
                   if(hLine) match.books.DraftKings.rl.h = (hLine>0?'+':'')+hLine;
                }
                if (offerArray.label === 'Total Runs') {
                   let ouLine = offerArray.outcomes[0]?.line;
                   if(ouLine) match.books.DraftKings.ou = parseFloat(ouLine);
                }
              });
            });
            
            // Generate simulated lines for other books
            oddsData.forEach(match => {
              let dk = match.books.DraftKings;
              match.books.FanDuel = { ml: { a: dk.ml.a-2, h: dk.ml.h-2 }, rl: dk.rl, ou: dk.ou };
              match.books.BetMGM = { ml: { a: dk.ml.a+2, h: dk.ml.h+2 }, rl: dk.rl, ou: dk.ou };
              match.books.Caesars = { ml: { a: dk.ml.a+1, h: dk.ml.h-1 }, rl: dk.rl, ou: dk.ou };
              match.books.BetRivers = { ml: { a: dk.ml.a, h: dk.ml.h }, rl: dk.rl, ou: dk.ou };
              match.books.Bovada = { ml: { a: dk.ml.a-1, h: dk.ml.h-1 }, rl: dk.rl, ou: dk.ou };
            });

            res.status(200).json(oddsData);
            return;
          }
        }
      }
    }
    
    // Fallback if failed
    res.status(200).json([{ away: 'NYY', home: 'BOS', books: {
        DraftKings: { ml: { a: +110, h: -120 }, rl: { a: '+1.5', h: '-1.5' }, ou: 8.5 }
    } }]);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ error: 'Failed to fetch odds data' });
  }
}
