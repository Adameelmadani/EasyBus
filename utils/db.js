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

  // ── Station Coordinates for Map ──
  async getStationCoords() {
    const coords = {};
    this.data.buses.forEach(bus => {
      bus.stations.forEach(s => {
        if (s.lat && s.lng && !coords[s.name]) {
          coords[s.name] = { lat: s.lat, lng: s.lng };
        }
      });
    });
    return coords;
  }

  // ── Map Data (buses with coordinates) ──
  async getMapData() {
    const buses = this.data.buses.map(bus => ({
      busId: bus.busId,
      name: bus.name,
      color: bus.color || '#10b981',
      stations: bus.stations.map(s => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        timeRemaining: s.timeRemaining[0]
      }))
    }));
    return buses;
  }

  async seedBuses() {
    if (this.data.buses.length > 0) return;

    console.log('Seeding initial buses data...');
    this.data.buses = [
      {
        busId: 'BUS001',
        name: 'Green Line Express',
        color: '#10b981',
        departureTimes: ['06:00', '07:30', '09:00', '10:30', '12:00', '14:00', '16:00', '18:00'],
        stations: [
          { name: 'Central Station', lat: 48.8566, lng: 2.3522, timeRemaining: ['00:00:00', '00:05:00', '00:10:00', '00:15:00'] },
          { name: 'Park Avenue', lat: 48.8620, lng: 2.3387, timeRemaining: ['00:08:00', '00:13:00', '00:18:00', '00:23:00'] },
          { name: 'University Campus', lat: 48.8472, lng: 2.3563, timeRemaining: ['00:18:00', '00:23:00', '00:28:00', '00:33:00'] },
          { name: 'City Mall', lat: 48.8530, lng: 2.3690, timeRemaining: ['00:28:00', '00:33:00', '00:38:00', '00:43:00'] },
        ],
      },
      {
        busId: 'BUS002',
        name: 'Downtown Shuttle',
        color: '#3b82f6',
        departureTimes: ['06:30', '08:00', '09:30', '11:00', '13:00', '15:00', '17:00', '19:00'],
        stations: [
          { name: 'Airport Terminal', lat: 48.8700, lng: 2.3195, timeRemaining: ['00:00:00', '00:10:00', '00:20:00', '00:30:00'] },
          { name: 'Central Station', lat: 48.8566, lng: 2.3522, timeRemaining: ['00:15:00', '00:25:00', '00:35:00', '00:45:00'] },
          { name: 'Business District', lat: 48.8686, lng: 2.3352, timeRemaining: ['00:25:00', '00:35:00', '00:45:00', '00:55:00'] },
          { name: 'Riverside', lat: 48.8600, lng: 2.3780, timeRemaining: ['00:35:00', '00:45:00', '00:55:00', '01:05:00'] },
        ],
      },
      {
        busId: 'BUS003',
        name: 'Harbor Connect',
        color: '#f59e0b',
        departureTimes: ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'],
        stations: [
          { name: 'Harbor Station', lat: 48.8416, lng: 2.3750, timeRemaining: ['00:00:00', '00:08:00', '00:16:00', '00:24:00'] },
          { name: 'Old Town', lat: 48.8505, lng: 2.3475, timeRemaining: ['00:12:00', '00:20:00', '00:28:00', '00:36:00'] },
          { name: 'Central Station', lat: 48.8566, lng: 2.3522, timeRemaining: ['00:22:00', '00:30:00', '00:38:00', '00:46:00'] },
          { name: 'University Campus', lat: 48.8472, lng: 2.3563, timeRemaining: ['00:32:00', '00:40:00', '00:48:00', '00:56:00'] },
        ],
      },
      {
        busId: 'BUS004',
        name: 'Suburban Ring',
        color: '#8b5cf6',
        departureTimes: ['06:15', '08:15', '10:15', '12:15', '14:15', '16:15', '18:15'],
        stations: [
          { name: 'Northgate', lat: 48.8750, lng: 2.3500, timeRemaining: ['00:00:00', '00:07:00', '00:14:00', '00:21:00'] },
          { name: 'Park Avenue', lat: 48.8620, lng: 2.3387, timeRemaining: ['00:10:00', '00:17:00', '00:24:00', '00:31:00'] },
          { name: 'City Mall', lat: 48.8530, lng: 2.3690, timeRemaining: ['00:20:00', '00:27:00', '00:34:00', '00:41:00'] },
          { name: 'Southpark', lat: 48.8390, lng: 2.3580, timeRemaining: ['00:30:00', '00:37:00', '00:44:00', '00:51:00'] },
          { name: 'Riverside', lat: 48.8600, lng: 2.3780, timeRemaining: ['00:40:00', '00:47:00', '00:54:00', '01:01:00'] },
        ],
      },
      {
        busId: 'BUS005',
        name: 'Night Owl',
        color: '#ec4899',
        departureTimes: ['20:00', '21:30', '23:00', '00:30'],
        stations: [
          { name: 'Central Station', lat: 48.8566, lng: 2.3522, timeRemaining: ['00:00:00', '00:12:00', '00:24:00', '00:36:00'] },
          { name: 'Business District', lat: 48.8686, lng: 2.3352, timeRemaining: ['00:10:00', '00:22:00', '00:34:00', '00:46:00'] },
          { name: 'Old Town', lat: 48.8505, lng: 2.3475, timeRemaining: ['00:20:00', '00:32:00', '00:44:00', '00:56:00'] },
          { name: 'Airport Terminal', lat: 48.8700, lng: 2.3195, timeRemaining: ['00:35:00', '00:47:00', '00:59:00', '01:11:00'] },
        ],
      },
      {
        busId: 'BUS006',
        name: 'Campus Circulator',
        color: '#06b6d4',
        departureTimes: ['07:30', '08:30', '09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00'],
        stations: [
          { name: 'University Campus', lat: 48.8472, lng: 2.3563, timeRemaining: ['00:00:00', '00:05:00', '00:10:00', '00:15:00'] },
          { name: 'Library Square', lat: 48.8450, lng: 2.3430, timeRemaining: ['00:06:00', '00:11:00', '00:16:00', '00:21:00'] },
          { name: 'Park Avenue', lat: 48.8620, lng: 2.3387, timeRemaining: ['00:14:00', '00:19:00', '00:24:00', '00:29:00'] },
          { name: 'Central Station', lat: 48.8566, lng: 2.3522, timeRemaining: ['00:22:00', '00:27:00', '00:32:00', '00:37:00'] },
        ],
      },
    ];
    this.save();
    console.log('Seeded 6 bus routes successfully.');
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
