const AppController = require('../controllers/AppController');
const AuthController = require('../controllers/AuthController');
const UsersController = require('../controllers/UsersController');
const BusesController = require('../controllers/BusesController');

const express = require('express');

const router = express.Router();
//api:
router.get('/api/status', AppController.getStatus);
router.get('/api/stats', AppController.getStats);

router.get('/api/connect', AuthController.getConnect);
router.get('/api/disconnect', AuthController.getDisconnect);

router.post('/api/users', UsersController.postNew);
router.get('/api/users/me', UsersController.getMe);

router.get('/api/buses', BusesController.getBuses);
router.get('/api/buses/:id', BusesController.getBusId);
router.get('/api/stations/:name', BusesController.getStation);
router.get('/api/stations/:name/closest', BusesController.getStationClosest);

module.exports = router;
