const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Self-invoking function to connect
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('Failed to connect to Redis initially:', err);
    }
  })();
}

// Wrapping redis in an interface similar to node-cache, but asynchronous
const cache = {
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return undefined;
    } catch (err) {
      console.error(`Redis GET error for key ${key}:`, err);
      return undefined;
    }
  },
  
  set: async (key, value, ttl = 1800) => {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (err) {
      console.error(`Redis SET error for key ${key}:`, err);
      return false;
    }
  },
  
  del: async (key) => {
    try {
      return await redisClient.del(key);
    } catch (err) {
      console.error(`Redis DEL error for key ${key}:`, err);
      return 0;
    }
  },

  flushAll: async () => {
    try {
      await redisClient.flushAll();
    } catch (err) {
      console.error(`Redis FLUSHALL error:`, err);
    }
  },

  // Export the raw client as well if needed
  client: redisClient
};

module.exports = cache;
