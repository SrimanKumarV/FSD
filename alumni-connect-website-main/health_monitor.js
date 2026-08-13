const https = require('https');

const servers = [
  { name: 'Frontend', url: 'https://alumnex-connect.onrender.com' },
  { name: 'Backend Primary', url: 'https://alumnex-backend-9y5t.onrender.com/' },
  { name: 'Backend Backup', url: 'https://alumnex-backend-backup.onrender.com/' }
];

console.log(`[${new Date().toISOString()}] Starting Production Health Check...`);

let failed = false;
let completed = 0;

servers.forEach(server => {
  https.get(server.url, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      console.log(`✅ [${server.name}] is ONLINE (Status: ${res.statusCode})`);
    } else {
      console.error(`❌ [${server.name}] returned error status (Status: ${res.statusCode})`);
      failed = true;
    }
    
    completed++;
    if (completed === servers.length) {
      if (failed) {
        console.error('\n⚠️ ALERT: One or more production servers are down or returning errors!');
        process.exit(1);
      } else {
        console.log('\n🌟 ALL SYSTEMS ONLINE: Production environment is stable.');
        process.exit(0);
      }
    }
  }).on('error', (e) => {
    console.error(`❌ [${server.name}] is DOWN! Error: ${e.message}`);
    failed = true;
    completed++;
    if (completed === servers.length) {
      console.error('\n⚠️ ALERT: One or more production servers are down or returning errors!');
      process.exit(1);
    }
  });
});
