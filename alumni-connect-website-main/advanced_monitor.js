const BACKEND_URL = 'https://alumnex-backend-9y5t.onrender.com/api';
// Optionally loop over multiple backends if needed, but we'll test the primary for deep API checks.

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

async function runAdvancedChecks() {
  console.log(`[${new Date().toISOString()}] Starting Comprehensive API Checks...`);
  let hasError = false;

  for (const endpoint of endpointsToVerify) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint.path}`);
      
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
