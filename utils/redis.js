const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = false;

    this.client.on('error', (err) => {
      console.error('Redis client error:', err.message);
      this.connected = false;
    });

    this.client.on('connect', () => {
      this.connected = true;
    });

    this.client.connect().catch((err) => {
      console.error('Redis connection failed:', err.message);
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    if (!this.connected) return null;
    return this.client.get(key);
  }

  async set(key, value, duration) {
    if (!this.connected) return;
    await this.client.set(key, value, {
      EX: duration,
    });
  }

  async del(key) {
    if (!this.connected) return;
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
