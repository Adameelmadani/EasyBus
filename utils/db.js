const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../easybus_db.json');

class DBClient {
  constructor() {
    this.data = {
      users: [],
      buses: [],
      favorites: []
    };
    this.load();
    this.seedBuses();
  }

  load() {
    if (fs.existsSync(dbPath)) {
      try {
        const content = fs.readFileSync(dbPath, 'utf8');
        const parsed = JSON.parse(content);
        this.data = {
          users: parsed.users || [],
          buses: parsed.buses || [],
          favorites: parsed.favorites || []
        };
      } catch (e) {
        console.error('Error loading DB:', e);
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Error saving DB:', e);
    }
  }

  isAlive() {
    return true;
  }

  async nbUsers() {
    return this.data.users.length;
  }

  async nbBuses() {
    return this.data.buses.length;
  }

  async getUser(query) {
    return this.data.users.find(user => {
      return Object.keys(query).every(key => {
        const val = query[key];
        return String(user[key]) === String(val);
      });
    }) || null;
  }

  async setUser(userData) {
    const newUser = {
      _id: Date.now().toString(),
      ...userData
    };
    this.data.users.push(newUser);
    this.save();
    return newUser._id;
  }

  get users() {
    return {
      findOne: async (query) => this.getUser(query),
      insertOne: async (doc) => {
        const id = await this.setUser(doc);
        return { insertedId: id };
      }
    };
  }

  get buses() {
    return {
      find: () => ({
        toArray: async () => this.data.buses
      }),
      findOne: async (query) => {
        return this.data.buses.find(bus => bus.busId === query.busId) || null;
      }
    };
  }

  // ── Favorites ──
  async getFavorites(userId) {
    return this.data.favorites.filter(f => f.userId === userId);
  }

  async addFavorite(userId, stationName) {
    const exists = this.data.favorites.find(
      f => f.userId === userId && f.stationName === stationName
    );
    if (exists) return null;
    const fav = {
      _id: Date.now().toString(),
      userId,
      stationName,
      createdAt: new Date().toISOString()
    };
    this.data.favorites.push(fav);
    this.save();
    return fav;
  }

  async removeFavorite(userId, stationName) {
    const idx = this.data.favorites.findIndex(
      f => f.userId === userId && f.stationName === stationName
    );
    if (idx === -1) return false;
    this.data.favorites.splice(idx, 1);
    this.save();
    return true;
  }

  // ── All Stations ──
  async getAllStations() {
    const stationSet = new Set();
    this.data.buses.forEach(bus => {
      bus.stations.forEach(s => stationSet.add(s.name));
    });
    return Array.from(stationSet).sort();
  }

  async seedBuses() {
    if (this.data.buses.length > 0) return;

    console.log('Seeding initial buses data...');
    this.data.buses = [
      {
        busId: 'BUS001',
        name: 'Green Line Express',
        departureTimes: ['06:00', '07:30', '09:00', '10:30', '12:00', '14:00', '16:00', '18:00'],
        stations: [
          { name: 'Central Station', timeRemaining: ['00:00:00', '00:05:00', '00:10:00', '00:15:00'] },
          { name: 'Park Avenue', timeRemaining: ['00:08:00', '00:13:00', '00:18:00', '00:23:00'] },
          { name: 'University Campus', timeRemaining: ['00:18:00', '00:23:00', '00:28:00', '00:33:00'] },
          { name: 'City Mall', timeRemaining: ['00:28:00', '00:33:00', '00:38:00', '00:43:00'] },
        ],
      },
      {
        busId: 'BUS002',
        name: 'Downtown Shuttle',
        departureTimes: ['06:30', '08:00', '09:30', '11:00', '13:00', '15:00', '17:00', '19:00'],
        stations: [
          { name: 'Airport Terminal', timeRemaining: ['00:00:00', '00:10:00', '00:20:00', '00:30:00'] },
          { name: 'Central Station', timeRemaining: ['00:15:00', '00:25:00', '00:35:00', '00:45:00'] },
          { name: 'Business District', timeRemaining: ['00:25:00', '00:35:00', '00:45:00', '00:55:00'] },
          { name: 'Riverside', timeRemaining: ['00:35:00', '00:45:00', '00:55:00', '01:05:00'] },
        ],
      },
      {
        busId: 'BUS003',
        name: 'Harbor Connect',
        departureTimes: ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'],
        stations: [
          { name: 'Harbor Station', timeRemaining: ['00:00:00', '00:08:00', '00:16:00', '00:24:00'] },
          { name: 'Old Town', timeRemaining: ['00:12:00', '00:20:00', '00:28:00', '00:36:00'] },
          { name: 'Central Station', timeRemaining: ['00:22:00', '00:30:00', '00:38:00', '00:46:00'] },
          { name: 'University Campus', timeRemaining: ['00:32:00', '00:40:00', '00:48:00', '00:56:00'] },
        ],
      },
      {
        busId: 'BUS004',
        name: 'Suburban Ring',
        departureTimes: ['06:15', '08:15', '10:15', '12:15', '14:15', '16:15', '18:15'],
        stations: [
          { name: 'Northgate', timeRemaining: ['00:00:00', '00:07:00', '00:14:00', '00:21:00'] },
          { name: 'Park Avenue', timeRemaining: ['00:10:00', '00:17:00', '00:24:00', '00:31:00'] },
          { name: 'City Mall', timeRemaining: ['00:20:00', '00:27:00', '00:34:00', '00:41:00'] },
          { name: 'Southpark', timeRemaining: ['00:30:00', '00:37:00', '00:44:00', '00:51:00'] },
          { name: 'Riverside', timeRemaining: ['00:40:00', '00:47:00', '00:54:00', '01:01:00'] },
        ],
      },
      {
        busId: 'BUS005',
        name: 'Night Owl',
        departureTimes: ['20:00', '21:30', '23:00', '00:30'],
        stations: [
          { name: 'Central Station', timeRemaining: ['00:00:00', '00:12:00', '00:24:00', '00:36:00'] },
          { name: 'Business District', timeRemaining: ['00:10:00', '00:22:00', '00:34:00', '00:46:00'] },
          { name: 'Old Town', timeRemaining: ['00:20:00', '00:32:00', '00:44:00', '00:56:00'] },
          { name: 'Airport Terminal', timeRemaining: ['00:35:00', '00:47:00', '00:59:00', '01:11:00'] },
        ],
      },
      {
        busId: 'BUS006',
        name: 'Campus Circulator',
        departureTimes: ['07:30', '08:30', '09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00'],
        stations: [
          { name: 'University Campus', timeRemaining: ['00:00:00', '00:05:00', '00:10:00', '00:15:00'] },
          { name: 'Library Square', timeRemaining: ['00:06:00', '00:11:00', '00:16:00', '00:21:00'] },
          { name: 'Park Avenue', timeRemaining: ['00:14:00', '00:19:00', '00:24:00', '00:29:00'] },
          { name: 'Central Station', timeRemaining: ['00:22:00', '00:27:00', '00:32:00', '00:37:00'] },
        ],
      },
    ];
    this.save();
    console.log('Seeded 6 bus routes successfully.');
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
