const { createClient } = require('redis');
const crypto = require('crypto');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IN-MEMORY CACHE FOR DEV / TESTS / FALLBACK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const memoryStore = new Map();

function cleanExpiredMemoryKey(key) {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt && Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item;
}

const mockClient = {
  on: (event, cb) => {},
  connect: async () => console.log('Mock Redis Connected'),
  get: async (key) => {
    const item = cleanExpiredMemoryKey(key);
    return item ? item.value : null;
  },
  set: async (key, val, opts) => {
    const ttl = opts?.EX ? opts.EX * 1000 : null;
    if (opts?.NX) {
      if (cleanExpiredMemoryKey(key)) return null;
    }
    memoryStore.set(key, {
      value: val,
      expiresAt: ttl ? Date.now() + ttl : null
    });
    return 'OK';
  },
  del: async (key) => {
    const existed = memoryStore.has(key);
    memoryStore.delete(key);
    return existed ? 1 : 0;
  },
  flushAll: async () => {
    memoryStore.clear();
  },
  duplicate: function() { return this; },
  psubscribe: async () => {},
  punsubscribe: async () => {},
  subscribe: async () => {},
  unsubscribe: async () => {},
  publish: async () => 0,
  quit: async () => {}
};

const mockCache = {
  get: async (key) => {
    const item = cleanExpiredMemoryKey(key);
    if (!item) return undefined;
    try {
      return JSON.parse(item.value);
    } catch {
      return item.value;
    }
  },
  set: async (key, value, ttl = 1800) => {
    memoryStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttl ? Date.now() + ttl * 1000 : null
    });
    return true;
  },
  del: async (key) => {
    const existed = memoryStore.has(key);
    memoryStore.delete(key);
    return existed ? 1 : 0;
  },
  flushAll: async () => {
    memoryStore.clear();
  },
  setNX: async (key, value, ttlSeconds = 60) => {
    if (cleanExpiredMemoryKey(key)) {
      return false; // Key already exists and hasn't expired
    }
    memoryStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
    return true;
  },
  acquireLock: async (lockKey, ttlSeconds = 60, customValue = null) => {
    const lockValue = customValue || `${process.pid}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const acquired = await mockCache.setNX(lockKey, lockValue, ttlSeconds);
    return {
      acquired,
      lockValue: acquired ? lockValue : null
    };
  },
  releaseLock: async (lockKey, lockValue) => {
    const item = cleanExpiredMemoryKey(lockKey);
    if (!item) return false;
    let storedVal;
    try {
      storedVal = JSON.parse(item.value);
    } catch {
      storedVal = item.value;
    }
    if (storedVal === lockValue) {
      memoryStore.delete(lockKey);
      return true;
    }
    return false;
  },
  client: mockClient
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REAL REDIS CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // Lua script for atomic lock release (ensures worker only deletes its own lock)
  const RELEASE_LOCK_LUA = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

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
    /**
     * Atomically set key if not exists (SET key val NX EX ttl)
     * @param {string} key
     * @param {*} value
     * @param {number} ttlSeconds
     * @returns {Promise<boolean>} true if key was set, false if key already existed
     */
    setNX: async (key, value, ttlSeconds = 60) => {
      try {
        const result = await redisClient.set(key, JSON.stringify(value), {
          NX: true,
          EX: ttlSeconds
        });
        return result === 'OK';
      } catch (err) {
        console.warn(`[Cache] setNX error on key ${key}:`, err.message);
        return false;
      }
    },
    /**
     * Acquire an atomic distributed lock with safe expiration
     * @param {string} lockKey
     * @param {number} ttlSeconds
     * @param {string|null} customValue
     * @returns {Promise<{ acquired: boolean, lockValue: string|null }>}
     */
    acquireLock: async (lockKey, ttlSeconds = 60, customValue = null) => {
      const lockValue = customValue || `${process.pid}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      try {
        const result = await redisClient.set(lockKey, JSON.stringify(lockValue), {
          NX: true,
          EX: ttlSeconds
        });
        const acquired = result === 'OK';
        return {
          acquired,
          lockValue: acquired ? lockValue : null
        };
      } catch (err) {
        console.warn(`[Cache] acquireLock error on key ${lockKey}:`, err.message);
        return { acquired: false, lockValue: null };
      }
    },
    /**
     * Atomically release lock only if the current owner matches lockValue
     * @param {string} lockKey
     * @param {string} lockValue
     * @returns {Promise<boolean>}
     */
    releaseLock: async (lockKey, lockValue) => {
      try {
        const result = await redisClient.eval(RELEASE_LOCK_LUA, {
          keys: [lockKey],
          arguments: [JSON.stringify(lockValue)]
        });
        return result === 1;
      } catch (err) {
        console.warn(`[Cache] releaseLock error on key ${lockKey}:`, err.message);
        return false;
      }
    },
    client: redisClient
  };
};

// Use real Redis in production or if a REDIS_URL is explicitly set
const useRealRedis = process.env.NODE_ENV === 'production' || process.env.REDIS_URL;

module.exports = useRealRedis ? initRealRedis() : mockCache;
