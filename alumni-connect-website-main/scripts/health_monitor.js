const https = require('https');

const servers = [
  { name: 'Frontend', url: 'https://alumnex-connect.onrender.com', required: true },
  { name: 'Backend Backup (Active)', url: 'https://alumnex-backend-backup.onrender.com/', isBackend: true },
  { name: 'Backend Primary (Secondary)', url: 'https://alumnex-backend-9y5t.onrender.com/', isBackend: true }
];

console.log(`[${new Date().toISOString()}] Starting Production Health Check...`);

let completed = 0;
let frontendOk = false;
let onlineBackends = 0;
let totalBackends = 0;

servers.forEach(server => {
  if (server.isBackend) totalBackends++;

  const req = https.get(server.url, { timeout: 15000 }, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      console.log(`✅ [${server.name}] is ONLINE (Status: ${res.statusCode})`);
      if (server.required) frontendOk = true;
      if (server.isBackend) onlineBackends++;
    } else {
      console.warn(`⚠️ [${server.name}] returned status: ${res.statusCode}`);
    }
    checkDone();
  });

  req.on('error', (e) => {
    console.warn(`❌ [${server.name}] is unreachable: ${e.message}`);
    checkDone();
  });

  req.on('timeout', () => {
    req.destroy();
    console.warn(`⏳ [${server.name}] timed out.`);
    checkDone();
  });
});

function checkDone() {
  completed++;
  if (completed === servers.length) {
    console.log(`\nCluster Summary: ${onlineBackends}/${totalBackends} backend instances online. Frontend: ${frontendOk ? 'ONLINE' : 'DOWN'}`);
    
    if (!frontendOk) {
      console.error('❌ ALERT: Frontend is DOWN!');
      process.exit(1);
    }
    
    if (onlineBackends === 0) {
      console.error('❌ ALERT: ALL backend instances are DOWN! Zero servers available.');
      process.exit(1);
    }

    if (onlineBackends < totalBackends) {
      console.log('⚠️ High-Availability Active: Some backend instances are offline, but live failover instances are handling traffic seamlessly.');
    } else {
      console.log('🌟 ALL SYSTEMS ONLINE: All backend cluster instances are healthy.');
    }
    process.exit(0);
  }
}
