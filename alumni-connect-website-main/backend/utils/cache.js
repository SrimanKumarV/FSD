const { createClient } = require('redis');

// MOCK REDIS FOR LOCAL DEV WITHOUT REDIS SERVER
const mockClient = {
  on: (event, cb) => {},
  connect: async () => console.log('Mock Redis Connected'),
  get: async (key) => null,
  set: async (key, val, opts) => true,
  del: async (key) => 1,
  flushAll: async () => {},
  duplicate: function() { return this; },
  psubscribe: async () => {},
  punsubscribe: async () => {},
  subscribe: async () => {},
  unsubscribe: async () => {},
  publish: async () => 0,
  quit: async () => {}
};

const mockCache = {
  get: async (key) => undefined,
  set: async (key, value, ttl = 1800) => true,
  del: async (key) => 0,
  flushAll: async () => {},
  client: mockClient
};

// REAL REDIS
const initRealRedis = () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err.message));
  redisClient.on('connect', () => console.log('Connected to Redis'));

  if (process.env.NODE_ENV !== 'test') {
    (async () => {
      try {
        await redisClient.connect();
      } catch (err) {
        console.error('Failed to connect to Redis initially:', err.message);
      }
    })();
  }

  return {
    get: async (key) => {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : undefined;
      } catch (err) {
        return undefined;
      }
    },
    set: async (key, value, ttl = 1800) => {
      try {
        await redisClient.set(key, JSON.stringify(value), { EX: ttl });
        return true;
      } catch (err) {
        return false;
      }
    },
    del: async (key) => {
      try {
        return await redisClient.del(key);
      } catch (err) {
        return 0;
      }
    },
    flushAll: async () => {
      try { await redisClient.flushAll(); } catch (err) {}
    },
    client: redisClient
  };
};

// Use real Redis in production or if a REDIS_URL is explicitly set
const useRealRedis = process.env.NODE_ENV === 'production' || process.env.REDIS_URL;

module.exports = useRealRedis ? initRealRedis() : mockCache;

