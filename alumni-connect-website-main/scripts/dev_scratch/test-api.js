const https = require('https');

https.get('https://codeforces.com/api/contest.list?gym=false', (res) => {
  console.log('Codeforces status:', res.statusCode);
});

https.get('https://kontests.net/api/v1/all', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Kontests status:', res.statusCode, data.substring(0, 100)));
}).on('error', (e) => {
  console.error('Kontests error:', e.message);
});
