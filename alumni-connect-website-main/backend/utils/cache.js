const NodeCache = require('node-cache');

// Standard TTL: 30 minutes (1800 seconds)
// checkperiod: 120 seconds (how often to delete expired keys)
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

module.exports = cache;
