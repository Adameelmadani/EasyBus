// script.js - EasyBus Frontend Logic

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

async function searchRoute() {
    const departure = document.getElementById("departure").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const resultsContainer = document.getElementById("results");

    if (!departure || !destination) {
        resultsContainer.innerHTML = "<p style='color: red; text-align: center;'>Please enter both departure and destination.</p>";
        return;
    }

    resultsContainer.innerHTML = "<p style='text-align: center;'>Searching...</p>";

    const buses = await getBuses();
    
    const departurePassing = buses.filter(bus => 
        bus.stations.some(s => s.name.toLowerCase() === departure.toLowerCase())
    );
    
    const destinationPassing = buses.filter(bus => 
        bus.stations.some(s => s.name.toLowerCase() === destination.toLowerCase())
    );

    const busesPass = departurePassing.filter(b1 => 
        destinationPassing.some(b2 => b1.busId === b2.busId)
    );

    displayResults2(busesPass);
}

function displayResults2(data) {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (data.length === 0) {
        resultsContainer.innerHTML = "<p style='text-align: center;'>No routes found between these stations.</p>";
    } else {
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            
            let stationsHtml = item.stations.map(s => `
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                    <span>${s.name}</span>
                    <span style="color: var(--primary-color); font-weight: 600;">${s.timeRemaining[0]}</span>
                </div>
            `).join('');

            card.innerHTML = `
                <h3 style="color: var(--primary-color); margin-bottom: 10px;">Bus ${item.busId}</h3>
                <div>${stationsHtml}</div>
            `;
            resultsContainer.appendChild(card);
        });
    }
}

async function searchStations_flasename() {
    const stationName = document.getElementById("stationSearch").value.trim();
    const resultsContainer = document.getElementById("results");

    if (!stationName) {
        resultsContainer.innerHTML = "<p style='color: red; text-align: center;'>Please enter a station name.</p>";
        return;
    }

    resultsContainer.innerHTML = "<p style='text-align: center;'>Searching...</p>";

    try {
        const response = await fetch(`/api/stations/${stationName}`);
        if (!response.ok) throw new Error('Station not found');
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        resultsContainer.innerHTML = `<p style='text-align: center;'>No buses found for "${stationName}".</p>`;
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (data.length === 0) {
        resultsContainer.innerHTML = "<p style='text-align: center;'>No buses found for this station.</p>";
    } else {
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: var(--primary-color);">Bus ${item.busId}</h3>
                    <span style="background: var(--secondary-color); padding: 5px 10px; border-radius: 20px; font-size: 0.9rem;">
                        Arriving in: ${item.timeRemaining[0]}
                    </span>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
    }
}

// Ensure tabs work if script.js is loaded
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = './login.html';
        };
    }
});