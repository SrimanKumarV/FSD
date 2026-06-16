const https = require('https');

https.get('https://cphof.org/api/v2/contests', (res) => {
  console.log('CPHOF status:', res.statusCode);
}).on('error', (e) => {
  console.error('CPHOF error:', e.message);
});

// Test LeetCode GraphQL
const postData = JSON.stringify({
  query: `
    query {
      allContests {
        title
        startTime
        duration
      }
    }
  `
});

const options = {
  hostname: 'leetcode.com',
  port: 443,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log('LeetCode status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('LeetCode data:', data.substring(0, 100)));
});
req.on('error', (e) => console.error('LeetCode error:', e.message));
req.write(postData);
req.end();

