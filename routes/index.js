const AppController = require('../controllers/AppController');
const AuthController = require('../controllers/AuthController');
const UsersController = require('../controllers/UsersController');
const BusesController = require('../controllers/BusesController');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const express = require('express');

const router = express.Router();

// API status
router.get('/api/status', AppController.getStatus);
router.get('/api/stats', AppController.getStats);

// Auth
router.get('/api/connect', AuthController.getConnect);
router.get('/api/disconnect', AuthController.getDisconnect);

// Users
router.post('/api/users', UsersController.postNew);
router.get('/api/users/me', UsersController.getMe);

// Buses
router.get('/api/buses', BusesController.getBuses);
router.get('/api/buses/:id', BusesController.getBusId);
router.get('/api/stations', BusesController.getStations);
router.get('/api/stations/:name', BusesController.getStation);
router.get('/api/stations/:name/closest', BusesController.getStationClosest);
router.get('/api/route/:from/:to', BusesController.getRoute);

// Favorites
router.get('/api/favorites', async (req, res) => {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const favorites = await dbClient.getFavorites(userId);
  res.status(200).send(favorites);
});

router.post('/api/favorites', async (req, res) => {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const { stationName } = req.body;
  if (!stationName) return res.status(400).send({ error: 'Missing stationName' });
  const fav = await dbClient.addFavorite(userId, stationName);
  if (!fav) return res.status(409).send({ error: 'Already favorited' });
  res.status(201).send(fav);
});

router.delete('/api/favorites', async (req, res) => {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const { stationName } = req.body;
  if (!stationName) return res.status(400).send({ error: 'Missing stationName' });
  const removed = await dbClient.removeFavorite(userId, stationName);
  if (!removed) return res.status(404).send({ error: 'Favorite not found' });
  res.status(204).end();
});

// Feedback
router.post('/api/feedback', async (req, res) => {
  const { rating, comment, page } = req.body;
  if (!rating) return res.status(400).send({ error: 'Missing rating' });
  const entry = await dbClient.addFeedback({ rating, comment: comment || '', page: page || 'unknown' });
  res.status(201).send(entry);
});

router.get('/api/feedback', async (req, res) => {
  const feedback = await dbClient.getFeedback();
  res.status(200).send(feedback);
});

module.exports = router;
