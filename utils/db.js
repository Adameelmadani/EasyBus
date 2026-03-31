const { MongoClient } = require('mongodb');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'easybus';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.connected = false;
    this.db = null;

    this.client = new MongoClient(url);
    this.client.connect()
      .then(() => {
        this.db = this.client.db(DB_DATABASE);
        this.connected = true;
        this.seedBuses();
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        this.connected = false;
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.connected) return 0;
    return this.db.collection('users').countDocuments();
  }

  async nbBuses() {
    if (!this.connected) return 0;
    return this.db.collection('buses').countDocuments();
  }

  async getUser(query) {
    if (!this.connected) return null;
    return this.db.collection('users').findOne(query);
  }

  async setUser(userData) {
    if (!this.connected) return null;
    const result = await this.db.collection('users').insertOne(userData);
    return result.insertedId;
  }

  get users() {
    if (!this.connected) return { findOne: async () => null };
    return this.db.collection('users');
  }

  get buses() {
    if (!this.connected) return { find: () => ({ toArray: async () => [] }), findOne: async () => null };
    return this.db.collection('buses');
  }

  async seedBuses() {
    if (!this.connected) return;
    const count = await this.nbBuses();
    if (count > 0) return;

    console.log('Seeding initial buses data...');
    const busesData = [
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
    ];
    await this.db.collection('buses').insertMany(busesData);
    console.log('Seeded initial buses data successfully.');
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
