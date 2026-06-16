const https = require('https');

// Test CodeChef
https.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=premium', (res) => {
  console.log('CodeChef status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('CodeChef data:', data.substring(0, 100)));
}).on('error', (e) => {
  console.error('CodeChef error:', e.message);
});

// Test GFG (they might not have an easy API, but let's test a known one if exists, otherwise we'll skip GFG or try to scrape)
// Actually GeeksForGeeks has: https://practiceapi.geeksforgeeks.org/api/vr/events/?page_number=1&sub_type=all&type=contest
https.get('https://practiceapi.geeksforgeeks.org/api/vr/events/?page_number=1&sub_type=all&type=contest', (res) => {
  console.log('GFG status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('GFG data:', data.substring(0, 100)));
}).on('error', (e) => {
  console.error('GFG error:', e.message);
});
