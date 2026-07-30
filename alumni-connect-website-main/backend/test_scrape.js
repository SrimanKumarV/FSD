const axios = require('axios');
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function test() {
  try {
    const res = await axios.get('https://www.hackerrank.com/rest/hackers/ashishgup/badges', { headers: { 'User-Agent': BROWSER_UA } });
    console.log(JSON.stringify(res.data.models, null, 2));
  } catch(e) {
    console.log('Error:', e.message);
  }
}
test();
