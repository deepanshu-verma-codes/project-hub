const Redis = require('ioredis');

/**
 * Centralized Redis client configuration.
 * Acts as the caching layer and the Pub/Sub adapter engine for Socket.io.
 */
const redisClient = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379');

redisClient.on('connect', () => {
  console.log('Redis Client Connected Successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

module.exports = redisClient;
