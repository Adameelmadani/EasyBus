const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class BusesController {
  static async getBuses(request, response) {
    try {
      const buses = await dbClient.buses.find().toArray();
      return response.status(200).send(buses);
    } catch (error) {
      return response.status(500).send({ error: 'Failed to fetch buses' });
    }
  }

  static async getBusId(request, response) {
    try {
      const busId = request.params.id || '';
      const bus = await dbClient.buses.findOne({ busId });
      if (!bus) return response.status(404).send({ error: 'Bus not found' });
      return response.status(200).send(bus);
    } catch (error) {
      return response.status(500).send({ error: 'Failed to fetch bus' });
    }
  }

  static async getStation(request, response) {
    try {
      const stationName = request.params.name || '';
      const buses = await dbClient.buses.find().toArray();
      const busesPassing = [];
      for (let i = 0; i < buses.length; i++) {
        const busStation = buses[i].stations.find(station => station.name === stationName);
        if (busStation !== undefined) {
          busesPassing.push({
            busId: buses[i].busId,
            name: buses[i].name,
            timeRemaining: busStation.timeRemaining,
            departureTimes: buses[i].departureTimes
          });
        }
      }
      if (busesPassing.length === 0) {
        return response.status(404).send({ error: `No buses found for station "${stationName}"` });
      }
      return response.status(200).send(busesPassing);
    } catch (error) {
      return response.status(500).send({ error: 'Failed to search station' });
    }
  }

  static async getStationClosest(request, response) {
    try {
      const stationName = request.params.name || '';
      const buses = await dbClient.buses.find().toArray();
      const busesPassing = [];
      for (let i = 0; i < buses.length; i++) {
        const busStation = buses[i].stations.find(station => station.name === stationName);
        if (busStation !== undefined) {
          busesPassing.push({
            busId: buses[i].busId,
            name: buses[i].name,
            timeRemaining: busStation.timeRemaining[0]
          });
        }
      }
      if (busesPassing.length === 0) {
        return response.status(404).send({ error: `No buses found for station "${stationName}"` });
      }
      const timeToSeconds = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      };
      let closestBus = null;
      let minTimeRemaining = Infinity;
      busesPassing.forEach(bus => {
        const timeRemainingInSeconds = timeToSeconds(bus.timeRemaining);
        if (timeRemainingInSeconds < minTimeRemaining) {
          closestBus = bus;
          minTimeRemaining = timeRemainingInSeconds;
        }
      });
      return response.status(200).send(closestBus);
    } catch (error) {
      return response.status(500).send({ error: 'Failed to find closest bus' });
    }
  }

  // Find route between two stations (including connecting buses)
  static async getRoute(request, response) {
    try {
      const from = request.params.from || '';
      const to = request.params.to || '';
      const buses = await dbClient.buses.find().toArray();

      // Direct routes
      const directRoutes = [];
      buses.forEach(bus => {
        const depIdx = bus.stations.findIndex(s => s.name === from);
        const destIdx = bus.stations.findIndex(s => s.name === to);
        if (depIdx !== -1 && destIdx !== -1 && depIdx < destIdx) {
          const depTime = bus.stations[depIdx].timeRemaining[0];
          const destTime = bus.stations[destIdx].timeRemaining[0];
          const timeToSeconds = (t) => {
            const [h, m, s] = t.split(':').map(Number);
            return h * 3600 + m * 60 + s;
          };
          const travelSeconds = timeToSeconds(destTime) - timeToSeconds(depTime);
          const travelMins = Math.round(travelSeconds / 60);
          directRoutes.push({
            type: 'direct',
            busId: bus.busId,
            busName: bus.name,
            from,
            to,
            travelTime: `${travelMins} min`,
            stops: destIdx - depIdx,
            stations: bus.stations.slice(depIdx, destIdx + 1),
            departureTimes: bus.departureTimes
          });
        }
      });

      if (directRoutes.length === 0) {
        return response.status(404).send({ error: `No routes found from "${from}" to "${to}"` });
      }

      // Sort by travel time
      directRoutes.sort((a, b) => a.stops - b.stops);
      return response.status(200).send(directRoutes);
    } catch (error) {
      return response.status(500).send({ error: 'Failed to find route' });
    }
  }

  // Get all station names
  static async getStations(request, response) {
    try {
      const stations = await dbClient.getAllStations();
      return response.status(200).send(stations);
    } catch (error) {
      return response.status(500).send({ error: 'Failed to fetch stations' });
    }
  }
}

module.exports = BusesController;
