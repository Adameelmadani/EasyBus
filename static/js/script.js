// script.js — EasyBus Dashboard Logic (Station Search + Route Finder)

async function getBuses() {
  try {
    const response = await fetch('/api/buses');
    if (!response.ok) throw new Error('Failed to fetch buses');
    return await response.json();
  } catch (error) {
    console.error('Error fetching buses:', error);
    return [];
  }
}

// ── Station Search ──
async function searchStations_flasename() {
  const stationName = document.getElementById("stationSearch").value.trim();
  const resultsContainer = document.getElementById("results");

  if (!stationName) {
    if (typeof showToast === 'function') showToast("Please enter a station name.", "error");
    return;
  }

  resultsContainer.innerHTML = '<div class="spinner"></div>';

  try {
    const response = await fetch(`/api/stations/${encodeURIComponent(stationName)}`);
    if (!response.ok) throw new Error('Station not found');
    const data = await response.json();
    displayStationResults(data, stationName);
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="result-placeholder">
        <p>No buses found for "${stationName}".</p>
      </div>`;
  }
}

function displayStationResults(data, stationName) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  if (!data || data.length === 0) {
    resultsContainer.innerHTML = `
      <div class="result-placeholder">
        <p>No buses currently pass through "${stationName}".</p>
      </div>`;
    return;
  }

  data.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <div class="result-card-header">
        <h3>Bus ${item.busId}</h3>
        <span class="result-badge">Next: ${item.timeRemaining[0]}</span>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

// ── Route Search ──
async function searchRoute() {
  const departure = document.getElementById("departure").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const resultsContainer = document.getElementById("results");

  if (!departure || !destination) {
    if (typeof showToast === 'function') showToast("Please enter both departure and destination.", "error");
    return;
  }

  resultsContainer.innerHTML = '<div class="spinner"></div>';

  const buses = await getBuses();

  const directBuses = buses.filter(bus => {
    const depStation = bus.stations.find(s => s.name.toLowerCase() === departure.toLowerCase());
    const destStation = bus.stations.find(s => s.name.toLowerCase() === destination.toLowerCase());
    return depStation && destStation;
  });

  displayRouteResults(directBuses, departure, destination);
}

function displayRouteResults(data, from, to) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  if (!data || data.length === 0) {
    resultsContainer.innerHTML = `
      <div class="result-placeholder">
        <p>No direct routes found from "${from}" to "${to}".</p>
      </div>`;
    return;
  }

  data.forEach((bus, i) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.animationDelay = `${i * 0.08}s`;

    const stationsHtml = bus.stations.map(s => `
      <div class="result-station-row">
        <span>${s.name}</span>
        <span>${s.timeRemaining[0]}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="result-card-header">
        <h3>Bus ${bus.busId}</h3>
        <span class="result-badge">${bus.stations.length} stops</span>
      </div>
      <div class="result-stations">${stationsHtml}</div>
    `;
    resultsContainer.appendChild(card);
  });
}

// ── Logout ──
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('/api/disconnect', {
            headers: { 'x-token': token }
          });
        } catch (_) {}
      }
      localStorage.removeItem('token');
      if (typeof showToast === 'function') showToast("Logged out successfully.", "info");
      setTimeout(() => window.location.href = './login.html', 800);
    };
  }

  // Allow Enter key to trigger search
  const stationInput = document.getElementById('stationSearch');
  if (stationInput) {
    stationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchStations_flasename();
    });
  }
  const destInput = document.getElementById('destination');
  if (destInput) {
    destInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchRoute();
    });
  }
});