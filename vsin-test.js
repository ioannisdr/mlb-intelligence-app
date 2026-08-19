const https = require('https');

https.get('https://vsin.com/mlb/odds/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const apiRegex = /https?:\/\/[a-zA-Z0-9.-]+\/api\/[a-zA-Z0-9.\/-]+/gi;
    const apis = data.match(apiRegex) || [];
    console.log("Found APIs:");
    const uniqueApis = [...new Set(apis)];
    console.log(uniqueApis);
    
    // Look for iframe
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const iframes = data.match(iframeRegex) || [];
    console.log("\nFound IFRAMEs:");
    console.log(iframes);
    
    // Look for data- attributes
    const oddsDataRegex = /vsin-odds-widget|data-odds/gi;
    const hasWidget = data.match(oddsDataRegex) || [];
    console.log("\nFound Odds Widgets keywords: ", hasWidget.length);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
