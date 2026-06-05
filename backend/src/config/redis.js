const Redis = require('ioredis');

/**
 * Centralized Redis client configuration.
 * Acts as the caching layer and the Pub/Sub adapter engine for Socket.io.
 */
const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://127.0.0.1:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected Successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

module.exports = redisClient;
