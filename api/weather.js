// Park factors, stadium coordinates, and CF bearing for all 30 MLB stadiums.
// Returned so the frontend can: (1) display park factor labels, (2) call Open-Meteo directly.
// Wind direction math in frontend: wind "blows out" when wind comes FROM (cfBearing+180)°±60°

const STADIUMS = {
  'Diamondbacks': { lat: 33.4529, lon: -112.0387, pf: 101, dome: true,  cfBearing: 15 },
  'Braves':       { lat: 33.7469, lon: -84.3912,  pf: 100, dome: false, cfBearing: 10 },
  'Orioles':      { lat: 39.2852, lon: -76.6201,  pf: 103, dome: false, cfBearing: 60 },
  'Red Sox':      { lat: 42.3466, lon: -71.0988,  pf: 106, dome: false, cfBearing: 30 },
  'Cubs':         { lat: 41.9472, lon: -87.6564,  pf: 103, dome: false, cfBearing: 20 },
  'White Sox':    { lat: 41.8309, lon: -87.6351,  pf: 97,  dome: false, cfBearing: 355},
  'Reds':         { lat: 39.1072, lon: -84.5077,  pf: 108, dome: false, cfBearing: 30 },
  'Guardians':    { lat: 41.4951, lon: -81.6871,  pf: 97,  dome: false, cfBearing: 30 },
  'Rockies':      { lat: 39.7570, lon: -104.9653, pf: 117, dome: false, cfBearing: 15 },
  'Tigers':       { lat: 42.3464, lon: -83.0596,  pf: 97,  dome: false, cfBearing: 10 },
  'Astros':       { lat: 29.7605, lon: -95.3698,  pf: 100, dome: true,  cfBearing: 20 },
  'Royals':       { lat: 39.1022, lon: -94.5836,  pf: 101, dome: false, cfBearing: 5  },
  'Angels':       { lat: 33.7996, lon: -117.8890, pf: 101, dome: false, cfBearing: 10 },
  'Dodgers':      { lat: 34.0724, lon: -118.2469, pf: 99,  dome: false, cfBearing: 0  },
  'Marlins':      { lat: 25.9544, lon: -80.2382,  pf: 94,  dome: true,  cfBearing: 5  },
  'Brewers':      { lat: 43.0421, lon: -87.9056,  pf: 101, dome: true,  cfBearing: 20 },
  'Twins':        { lat: 44.9817, lon: -93.2776,  pf: 98,  dome: false, cfBearing: 345},
  'Mets':         { lat: 40.7571, lon: -73.8458,  pf: 100, dome: false, cfBearing: 10 },
  'Yankees':      { lat: 40.8296, lon: -73.9265,  pf: 101, dome: false, cfBearing: 320},
  'Athletics':    { lat: 38.5858, lon: -121.5085, pf: 93,  dome: false, cfBearing: 40 },
  'Phillies':     { lat: 39.9061, lon: -75.1665,  pf: 105, dome: false, cfBearing: 10 },
  'Pirates':      { lat: 40.4469, lon: -80.0057,  pf: 97,  dome: false, cfBearing: 355},
  'Padres':       { lat: 32.7073, lon: -117.1569, pf: 92,  dome: false, cfBearing: 310},
  'Giants':       { lat: 37.7785, lon: -122.3893, pf: 94,  dome: false, cfBearing: 30 },
  'Mariners':     { lat: 47.5914, lon: -122.3325, pf: 95,  dome: true,  cfBearing: 15 },
  'Cardinals':    { lat: 38.6226, lon: -90.1928,  pf: 100, dome: false, cfBearing: 15 },
  'Rays':         { lat: 27.7682, lon: -82.6534,  pf: 95,  dome: true,  cfBearing: 5  },
  'Rangers':      { lat: 32.7473, lon: -97.0825,  pf: 103, dome: true,  cfBearing: 25 },
  'Blue Jays':    { lat: 43.6414, lon: -79.3894,  pf: 101, dome: true,  cfBearing: 0  },
  'Nationals':    { lat: 38.8732, lon: -77.0075,  pf: 100, dome: false, cfBearing: 10 },
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Return the stadium metadata — browser fetches Open-Meteo directly for live weather
  res.status(200).json(STADIUMS);
}
