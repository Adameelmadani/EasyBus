// Simple In-memory Store for Tokens (Previously Redis)
class InMemStore {
  constructor() {
    this.store = {};
    console.log('Using in-memory store for session management.');
  }

  isAlive() {
    return true;
  }

  async get(key) {
    const item = this.store[key];
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete this.store[key];
      return null;
    }
    return item.value;
  }

  async set(key, value, duration) {
    const expiresAt = duration ? Date.now() + (duration * 1000) : null;
    this.store[key] = { value, expiresAt };
  }

  async del(key) {
    delete this.store[key];
  }
}

const store = new InMemStore();
module.exports = store;
