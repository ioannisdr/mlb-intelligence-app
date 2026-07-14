import handler from './api/odds.js';

const req = {};
const res = {
  setHeader: () => {},
  status: function(code) {
    return {
      json: function(data) {
        console.log("Status:", code);
        console.log("Data:", JSON.stringify(data).substring(0, 500));
      }
    }
  }
};

handler(req, res);
