const BACKEND_CANDIDATES = [
  process.env.BACKEND_URL,
  'https://alumnex-backend-backup.onrender.com/api',
  'https://alumnex-backend-9y5t.onrender.com/api'
].filter(Boolean);

const endpointsToVerify = [
  {
    path: '/jobs',
    validate: (data) => Array.isArray(data) || (data.jobs && Array.isArray(data.jobs)),
    name: 'Jobs Feed'
  },
  {
    path: '/forum',
    validate: (data) => Array.isArray(data) || (data.posts && Array.isArray(data.posts)),
    name: 'Forum Posts'
  },
  {
    path: '/events',
    validate: (data) => Array.isArray(data) || (data.events && Array.isArray(data.events)),
    name: 'Events List'
  },
  {
    path: '/projects',
    validate: (data) => Array.isArray(data) || (data.projects && Array.isArray(data.projects)),
    name: 'Projects Showcase'
  }
];

async function findLiveBackend() {
  for (const url of BACKEND_CANDIDATES) {
    try {
      const root = url.replace(/\/api\/?$/, '');
      const res = await fetch(`${root}/`, { method: 'GET' });
      if (res.status >= 200 && res.status < 400) {
        return url;
      }
    } catch (e) {}
  }
  return BACKEND_CANDIDATES[0];
}

async function runAdvancedChecks() {
  console.log(`[${new Date().toISOString()}] Starting Comprehensive API Checks...`);
  const activeBackendUrl = await findLiveBackend();
  console.log(`Using active backend instance: ${activeBackendUrl}`);

  let hasError = false;

  for (const endpoint of endpointsToVerify) {
    try {
      const response = await fetch(`${activeBackendUrl}${endpoint.path}`);
      
      if (response.ok) {
        const data = await response.json();
        if (endpoint.validate(data)) {
          console.log(`✅ [${endpoint.name}] Response is valid JSON and structurally correct.`);
        } else {
          console.error(`❌ [${endpoint.name}] Validation failed! Data structure is incorrect.`);
          hasError = true;
        }
      } else {
        console.error(`❌ [${endpoint.name}] Fetch failed with status: ${response.status}`);
        hasError = true;
      }
    } catch (error) {
      console.error(`❌ [${endpoint.name}] Fetch failed! Error: ${error.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\n⚠️ ALERT: One or more API endpoints are returning malformed data or errors!');
    process.exit(1);
  } else {
    console.log('\n🌟 ALL API CHECKS PASSED: Database connections and data models are intact.');
    process.exit(0);
  }
}

runAdvancedChecks();
