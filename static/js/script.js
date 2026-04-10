// script.js — EasyBus Dashboard Logic (Station Search, Route Finder, Favorites, Countdown, Autocomplete)

let allStations = [];
let countdownIntervals = [];

// ── Fetch all stations for autocomplete ──
async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    if (response.ok) {
      allStations = await response.json();
    }
  } catch (e) {
    console.error('Could not load stations:', e);
  }
}

// ── Station Autocomplete ──
function setupAutocomplete(inputId, dropdownId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (val.length < 1) {
      dropdown.classList.add('hidden');
      return;
    }
    const matches = allStations.filter(s => s.toLowerCase().includes(val));
    if (matches.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }
    dropdown.innerHTML = matches.map(s => 
      `<div class="suggestion-item" data-value="${s}">${s}</div>`
    ).join('');
    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.value;
        dropdown.classList.add('hidden');
      });
    });
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 200);
  });
}

// ── Get Buses ──
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

// ── Station Search (fixed typo) ──
async function searchStation() {
  const stationName = document.getElementById("stationSearch").value.trim();
  const resultsContainer = document.getElementById("results");

  if (!stationName) {
    if (typeof showToast === 'function') showToast("Please enter a station name.", "error");
    return;
  }

  resultsContainer.innerHTML = '<div class="spinner"></div>';
  clearCountdowns();

  try {
    const response = await fetch(`/api/stations/${encodeURIComponent(stationName)}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Station not found');
    }
    const data = await response.json();
    displayStationResults(data, stationName);
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="result-placeholder">
        <p>${error.message || `No buses found for "${stationName}".`}</p>
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

  const isFav = getFavorites().includes(stationName);

  data.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.animationDelay = `${i * 0.08}s`;

    const countdownId = `countdown-${i}`;
    
    card.innerHTML = `
      <div class="result-card-header">
        <div>
          <h3>Bus ${item.busId}</h3>
          <div class="bus-name">${item.name || ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="countdown-badge" id="${countdownId}">Next: ${item.timeRemaining[0]}</span>
          <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite('${stationName}')" title="Add to favorites">★</button>
        </div>
      </div>
      <div class="result-stations">
        ${item.departureTimes ? `<div class="result-station-row"><span style="color:var(--gray-500);font-size:.82rem">Departures</span><span style="font-size:.82rem">${item.departureTimes.join(', ')}</span></div>` : ''}
        ${item.timeRemaining.map((t, idx) => `
          <div class="result-station-row">
            <span>Arrival ${idx + 1}</span>
            <span>${t}</span>
          </div>
        `).join('')}
      </div>
    `;
    resultsContainer.appendChild(card);

    // Start countdown for first arrival
    startCountdown(countdownId, item.timeRemaining[0]);
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
  clearCountdowns();

  try {
    const response = await fetch(`/api/route/${encodeURIComponent(departure)}/${encodeURIComponent(destination)}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'No route found');
    }
    const routes = await response.json();
    displayRouteResults(routes, departure, destination);
  } catch (error) {
    // Fallback to client-side search
    const buses = await getBuses();
    const directBuses = buses.filter(bus => {
      const depStation = bus.stations.find(s => s.name.toLowerCase() === departure.toLowerCase());
      const destStation = bus.stations.find(s => s.name.toLowerCase() === destination.toLowerCase());
      return depStation && destStation;
    });
    displayRouteResultsFallback(directBuses, departure, destination);
  }
}

function displayRouteResults(routes, from, to) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  if (!routes || routes.length === 0) {
    resultsContainer.innerHTML = `
      <div class="result-placeholder">
        <p>No direct routes found from "${from}" to "${to}".</p>
      </div>`;
    return;
  }

  routes.forEach((route, i) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.animationDelay = `${i * 0.08}s`;

    // Build timeline
    const timelineHtml = route.stations.map(s => `
      <div class="timeline-stop">
        <div class="timeline-dot"></div>
        <span class="station-name">${s.name}</span>
        <span class="station-time">${s.timeRemaining[0]}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="result-card-header">
        <div>
          <h3>Bus ${route.busId}</h3>
          <div class="bus-name">${route.busName || ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="countdown-badge">${route.travelTime}</span>
          <span class="result-badge">${route.stops} stop${route.stops !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="timeline-container">
        <div class="timeline-line"></div>
        ${timelineHtml}
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

function displayRouteResultsFallback(data, from, to) {
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

    const timelineHtml = bus.stations.map(s => `
      <div class="timeline-stop">
        <div class="timeline-dot"></div>
        <span class="station-name">${s.name}</span>
        <span class="station-time">${s.timeRemaining[0]}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="result-card-header">
        <div>
          <h3>Bus ${bus.busId}</h3>
          <div class="bus-name">${bus.name || ''}</div>
        </div>
        <span class="result-badge">${bus.stations.length} stops</span>
      </div>
      <div class="timeline-container">
        <div class="timeline-line"></div>
        ${timelineHtml}
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

// ── Live Countdown Timer ──
function startCountdown(elementId, timeString) {
  const [h, m, s] = timeString.split(':').map(Number);
  let totalSeconds = h * 3600 + m * 60 + s;

  const interval = setInterval(() => {
    totalSeconds--;
    if (totalSeconds <= 0) {
      clearInterval(interval);
      const el = document.getElementById(elementId);
      if (el) el.textContent = 'Arrived!';
      return;
    }
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const display = hrs > 0
      ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${mins}:${String(secs).padStart(2, '0')}`;
    const el = document.getElementById(elementId);
    if (el) el.textContent = `⏱ ${display}`;
  }, 1000);

  countdownIntervals.push(interval);
}

function clearCountdowns() {
  countdownIntervals.forEach(id => clearInterval(id));
  countdownIntervals = [];
}

// ── Favorites (localStorage) ──
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('easybus_favorites') || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem('easybus_favorites', JSON.stringify(favs));
}

function toggleFavorite(stationName) {
  let favs = getFavorites();
  const idx = favs.indexOf(stationName);
  if (idx === -1) {
    favs.push(stationName);
    if (typeof showToast === 'function') showToast(`★ Added "${stationName}" to favorites`, "success");
  } else {
    favs.splice(idx, 1);
    if (typeof showToast === 'function') showToast(`Removed "${stationName}" from favorites`, "info");
  }
  saveFavorites(favs);
  renderFavorites();

  // Update button states
  document.querySelectorAll('.btn-fav').forEach(btn => {
    btn.classList.toggle('active', favs.includes(stationName));
  });
}

function renderFavorites() {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  const favs = getFavorites();
  if (favs.length === 0) {
    container.innerHTML = '<span class="fav-empty">No favorites yet. Search a station and click ★ to save!</span>';
    return;
  }
  container.innerHTML = favs.map(name => `
    <div class="fav-chip" onclick="quickSearchStation('${name}')">
      <span>★ ${name}</span>
      <span class="remove-fav" onclick="event.stopPropagation(); toggleFavorite('${name}')">✕</span>
    </div>
  `).join('');
}

function quickSearchStation(name) {
  const input = document.getElementById('stationSearch');
  if (input) {
    input.value = name;
    // Switch to stations tab if needed
    switchTab('stations');
    searchStation();
  }
}

// ── Tab Switch ──
function switchTab(tab) {
  const stationsTab = document.getElementById('stationsTab');
  const targetTab = document.getElementById('targetTab');
  const stationsForm = document.getElementById('stationsForm');
  const targetForm = document.getElementById('targetForm');
  
  clearCountdowns();
  document.getElementById('results').innerHTML = `
    <div class="result-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <p>Enter a station name or plan a route to see live results.</p>
    </div>`;

  if (tab === 'stations') {
    stationsTab.classList.add('active');
    targetTab.classList.remove('active');
    stationsForm.classList.remove('hidden');
    targetForm.classList.add('hidden');
  } else {
    targetTab.classList.add('active');
    stationsTab.classList.remove('active');
    targetForm.classList.remove('hidden');
    stationsForm.classList.add('hidden');
  }
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  // Load stations for autocomplete
  loadStations();

  // Setup autocomplete
  setupAutocomplete('stationSearch', 'station-suggestions');
  setupAutocomplete('departure', 'departure-suggestions');
  setupAutocomplete('destination', 'destination-suggestions');

  // Render favorites
  renderFavorites();

  // Enter key handlers
  const stationInput = document.getElementById('stationSearch');
  if (stationInput) {
    stationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchStation();
    });
  }
  const depInput = document.getElementById('departure');
  if (depInput) {
    depInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const destInput = document.getElementById('destination');
        if (destInput) destInput.focus();
      }
    });
  }
  const destInput = document.getElementById('destination');
  if (destInput) {
    destInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchRoute();
    });
  }
});