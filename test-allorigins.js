const fetch = require('node-fetch');
fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.sportsbettingdime.com/api/betting-trends/mlb/'))
.then(r => r.json())
.then(data => {
   if (data.contents.includes('Cloudflare') || data.contents.includes('Just a moment')) {
      console.log('AllOrigins was blocked by Cloudflare.');
   } else {
      console.log('AllOrigins SUCCESS:', data.contents.substring(0, 100));
   }
});
