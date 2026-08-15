const axios = require('axios');
const { fetchDuolingoStats } = require('./backend/utils/devStatsFetcher.js');

async function test() {
  const result = await fetchDuolingoStats('srimankumar');
  console.log(result);
}
test();
