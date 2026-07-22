fetch('https://www.sportsbettingdime.com/app/plugins/sas-sports-wc/build/sports-web-components.js')
.then(r => r.text())
.then(js => {
   const matches = [...js.matchAll(/\/api\/[a-zA-Z0-9\-\/_]+/g)];
   const unique = [...new Set(matches.map(m => m[0]))];
   console.log(unique);
});
