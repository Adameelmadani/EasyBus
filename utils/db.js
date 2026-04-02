const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../easybus_db.json');

class DBClient {
  constructor() {
    this.data = {
      users: [],
      buses: []
    };
    this.load();
    this.seedBuses();
  }

  load() {
    if (fs.existsSync(dbPath)) {
      try {
        const content = fs.readFileSync(dbPath, 'utf8');
        this.data = JSON.parse(content);
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

  async seedBuses() {
    if (this.data.buses.length > 0) return;

    console.log('Seeding initial buses data (JSON DB)...');
    this.data.buses = [
      {
        busId: 'BUS001',
        departureTimes: ['08:00', '08:10', '08:15', '08:20'],
        stations: [
          { name: 'Station A', timeRemaining: ['00:00:00', '00:10:00', '00:15:00', '00:20:00'] },
          { name: 'Station B', timeRemaining: ['00:10:00', '00:20:00', '00:25:00', '00:30:00'] },
          { name: 'Station C', timeRemaining: ['00:20:00', '00:30:00', '00:35:00', '00:40:00'] },
        ],
      },
      {
        busId: 'BUS002',
        departureTimes: ['08:00', '08:10', '08:15', '08:20'],
        stations: [
          { name: 'Station X', timeRemaining: ['00:00:00', '00:10:00', '00:15:00', '00:20:00'] },
          { name: 'Station A', timeRemaining: ['00:10:00', '00:20:00', '00:25:00', '00:30:00'] },
          { name: 'Station Z', timeRemaining: ['00:20:00', '00:30:00', '00:35:00', '00:40:00'] },
        ],
      },
      {
        busId: 'BUS003',
        departureTimes: ['09:00', '09:10', '09:15', '09:20'],
        stations: [
          { name: 'Station X', timeRemaining: ['00:00:00', '00:10:00', '00:15:00', '00:20:00'] },
          { name: 'Station Q', timeRemaining: ['00:10:00', '00:20:00', '00:25:00', '00:30:00'] },
          { name: 'Station R', timeRemaining: ['00:20:00', '00:30:00', '00:35:00', '00:40:00'] },
        ],
      },
    ];
    this.save();
    console.log('Seeded initial buses data (JSON DB) successfully.');
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
