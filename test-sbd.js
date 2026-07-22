const SBD_URL = 'https://www.sportsbettingdime.com/mlb/public-betting-trends/';
fetch(SBD_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(r => r.text())
.then(html => {
  console.log('HTML size:', html.length);
  if (html.includes('Cloudflare') || html.includes('captcha')) {
     console.log('BLOCKED BY CLOUDFLARE');
  } else {
     console.log('Not blocked.');
     console.log(html.substring(0, 500));
  }
});
