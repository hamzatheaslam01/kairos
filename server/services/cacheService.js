const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.client = null;
    this.isEnabled = process.env.ENABLE_AI_CACHING === 'true';
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (!this.isEnabled) {
      console.log('ℹ️  Redis caching is disabled');
      return false;
    }

    try {
      this.client = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      // Connect
      await this.client.connect();

      // Event handlers
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
      });

      this.client.on('connect', () => {
        console.log('✓ Redis cache connected');
      });

      this.client.on('ready', () => {
        console.log('✓ Redis cache ready');
      });

      this.client.on('close', () => {
        console.warn('⚠️  Redis connection closed');
      });

      // Test connection
      await this.client.ping();
      return true;
    } catch (error) {
      console.warn('⚠️  Redis connection failed:', error.message);
      console.warn('⚠️  Continuing without cache...');
      this.client = null;
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable() {
    return this.isEnabled && this.client !== null && this.client.status === 'ready';
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `kairos:${prefix}:${sortedParams}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        console.log(`✓ Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      console.log(`✗ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      console.log(`✓ Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    if (!this.isAvailable()) return false;

    try {
      await this.client.del(key);
      console.log(`✓ Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern) {
    if (!this.isAvailable()) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`✓ Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (!this.isAvailable()) return false;

    try {
      await this.client.flushdb();
      console.log('✓ Cache cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isAvailable()) {
      return {
        enabled: false,
        connected: false,
      };
    }

    try {
      const info = await this.client.info('stats');
      const keyspace = await this.client.info('keyspace');
      
      return {
        enabled: true,
        connected: true,
        info: info,
        keyspace: keyspace,
      };
    } catch (error) {
      console.error('Cache stats error:', error.message);
      return {
        enabled: true,
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Wrapper for caching function results
   */
  async wrap(key, fn, ttl = this.defaultTTL) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn();

    // Store in cache
    await this.set(key, result, ttl);

    return result;
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      console.log('✓ Redis connection closed');
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
