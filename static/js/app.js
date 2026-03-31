/**
 * EasyBus - Main Application Script
 *
 * Connects the frontend to the Express backend API:
 * - Station search: GET /api/stations/:name
 * - Route search:   GET /api/buses (filter client-side)
 * - Sign up:        POST /api/users
 * - Log in:         GET /api/connect (Basic Auth)
 * - Profile:        GET /api/users/me (X-Token header)
 *
 * Also handles: nav toggle, tab switching, form validation.
 */

/* ============================================
   Initialization
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  checkAuthAndProtectRoutes();
  initNavToggle();
  initTabs();
  initStationSearch();
  initRouteSearch();
  initLoginForm();
  initSignupForm();
  initProfile();
  initLogout();
});

/* ============================================
   Route Protection & Auth Check
   ============================================ */

function checkAuthAndProtectRoutes() {
  var protectedPages = ["work_page.html", "profile.html"];
  var currentPage = window.location.pathname.split("/").pop();

  if (protectedPages.includes(currentPage)) {
    var token = localStorage.getItem("easybus_token");
    if (!token) {
      // Redirect to login if no token is found
      window.location.href = "./login.html";
    } else {
      // Verify token validity with backend
      fetch("/api/users/me", {
        headers: { "X-Token": token }
      })
      .then(function (res) {
        if (!res.ok) {
          // Token is invalid or expired
          localStorage.removeItem("easybus_token");
          window.location.href = "./login.html";
        }
      })
      .catch(function () {
        // Network error, maybe allow or redirect. Let's redirect for safety.
        window.location.href = "./login.html";
      });
    }
  }
}

/* ============================================
   Logout functionality
   ============================================ */

function initLogout() {
  var disconnectBtns = document.querySelectorAll("a[href='./index.html'][style*='color: var(--color-error)']");
  
  disconnectBtns.forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      var token = localStorage.getItem("easybus_token");
      
      if (token) {
        // Try to disconnect on backend
        fetch("/api/disconnect", {
          headers: { "X-Token": token }
        }).finally(function() {
          // Always clear local token and redirect
          localStorage.removeItem("easybus_token");
          window.location.href = "./index.html";
        });
      } else {
        window.location.href = "./index.html";
      }
    });
  });
}

/* ============================================
   Mobile Navigation Toggle
   ============================================ */

function initNavToggle() {
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  if (!toggle || !links) return;

  toggle.addEventListener("click", function () {
    links.classList.toggle("navbar__links--open");
  });
}

/* ============================================
   Tab Switching (Dashboard)
   ============================================ */

function initTabs() {
  var tabButtons = document.querySelectorAll("[data-tab]");
  var stationsForm = document.getElementById("stationsForm");
  var routeForm = document.getElementById("routeForm");
  var results = document.getElementById("results");

  if (tabButtons.length === 0) return;

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var tab = btn.getAttribute("data-tab");

      if (tab === "stations") {
        stationsForm.classList.remove("hidden");
        routeForm.classList.add("hidden");
      } else {
        routeForm.classList.remove("hidden");
        stationsForm.classList.add("hidden");
      }

      results.innerHTML = "";
    });
  });
}

/* ============================================
   Station Search (calls backend API)
   ============================================ */

function initStationSearch() {
  var btn = document.getElementById("searchStationsBtn");
  if (!btn) return;

  btn.addEventListener("click", searchStations);

  var input = document.getElementById("stationSearch");
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchStations();
      }
    });
  }
}

function searchStations() {
  var input = document.getElementById("stationSearch");
  var stationName = input.value.trim();

  if (!stationName) {
    displayEmpty("Enter a station name to search.");
    return;
  }

  fetch("/api/stations/" + encodeURIComponent(stationName))
    .then(function (res) { return res.json(); })
    .then(function (data) {
      displayStationResults(data, stationName);
    })
    .catch(function (err) {
      console.error("Station search error:", err);
      displayEmpty("Failed to fetch station data. Is the server running?");
    });
}

function displayStationResults(data, stationName) {
  var container = document.getElementById("results");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    displayEmpty('No buses found passing through "' + stationName + '".');
    return;
  }

  var heading = document.createElement("h3");
  heading.className = "section-header__label";
  heading.style.textAlign = "left";
  heading.style.display = "block";
  heading.style.marginBottom = "16px";
  heading.textContent = data.length + " bus" + (data.length > 1 ? "es" : "") +
    ' passing through "' + stationName + '"';
  container.appendChild(heading);

  data.forEach(function (item) {
    var card = document.createElement("div");
    card.className = "result-card";

    var busLabel = document.createElement("span");
    busLabel.className = "result-card__bus-id";
    busLabel.textContent = item.busId;

    var timesWrapper = document.createElement("div");
    timesWrapper.className = "result-card__times";

    if (Array.isArray(item.timeRemaining)) {
      item.timeRemaining.forEach(function (time) {
        var badge = document.createElement("span");
        badge.className = "time-badge";
        badge.textContent = formatTime(time);
        timesWrapper.appendChild(badge);
      });
    }

    card.appendChild(busLabel);
    card.appendChild(timesWrapper);
    container.appendChild(card);
  });
}

/* ============================================
   Route Search (calls backend API)
   ============================================ */

function initRouteSearch() {
  var btn = document.getElementById("searchRouteBtn");
  if (!btn) return;

  btn.addEventListener("click", searchRoute);
}

function searchRoute() {
  var departureInput = document.getElementById("departure");
  var destinationInput = document.getElementById("destination");
  var departure = departureInput.value.trim();
  var destination = destinationInput.value.trim();

  if (!departure || !destination) {
    displayEmpty("Enter both a departure and destination station.");
    return;
  }

  // Fetch all buses, then filter for ones that pass through both stations
  fetch("/api/buses")
    .then(function (res) { return res.json(); })
    .then(function (allBuses) {
      var matchingBuses = allBuses.filter(function (bus) {
        var hasDeparture = bus.stations.some(function (s) {
          return s.name.toLowerCase() === departure.toLowerCase();
        });
        var hasDestination = bus.stations.some(function (s) {
          return s.name.toLowerCase() === destination.toLowerCase();
        });
        return hasDeparture && hasDestination;
      });

      displayRouteResults(matchingBuses, departure, destination);
    })
    .catch(function (err) {
      console.error("Route search error:", err);
      displayEmpty("Failed to fetch bus data. Is the server running?");
    });
}

function displayRouteResults(data, from, to) {
  var container = document.getElementById("results");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    displayEmpty('No buses found for the route "' + from + '" to "' + to + '".');
    return;
  }

  var heading = document.createElement("h3");
  heading.className = "section-header__label";
  heading.style.textAlign = "left";
  heading.style.display = "block";
  heading.style.marginBottom = "16px";
  heading.textContent = data.length + " bus" + (data.length > 1 ? "es" : "") +
    " found on this route";
  container.appendChild(heading);

  data.forEach(function (bus) {
    var card = document.createElement("div");
    card.className = "route-card";

    var header = document.createElement("div");
    header.className = "route-card__header";
    header.textContent = bus.busId;
    card.appendChild(header);

    var stops = document.createElement("div");
    stops.className = "route-card__stops";

    bus.stations.forEach(function (station) {
      var stop = document.createElement("div");
      stop.className = "route-stop";

      var name = document.createElement("span");
      name.className = "route-stop__name";
      name.textContent = station.name;

      var times = document.createElement("span");
      times.textContent = "Next: " + formatTime(station.timeRemaining[0]);

      stop.appendChild(name);
      stop.appendChild(times);
      stops.appendChild(stop);
    });

    card.appendChild(stops);
    container.appendChild(card);
  });
}

/* ============================================
   Display Helpers
   ============================================ */

function displayEmpty(message) {
  var container = document.getElementById("results");
  container.innerHTML = "";

  var empty = document.createElement("div");
  empty.className = "results-empty";

  var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");

  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z");
  icon.appendChild(path);

  var text = document.createElement("p");
  text.textContent = message;

  empty.appendChild(icon);
  empty.appendChild(text);
  container.appendChild(empty);
}

/**
 * Format a time string like "00:10:00" to a more readable form "10 min".
 */
function formatTime(timeString) {
  if (!timeString) return "--";

  var parts = timeString.split(":").map(Number);
  var hours = parts[0] || 0;
  var minutes = parts[1] || 0;

  if (hours === 0 && minutes === 0) {
    return "Now";
  }

  if (hours > 0) {
    return hours + "h " + minutes + "min";
  }

  return minutes + " min";
}

/* ============================================
   Login Form (calls backend API)
   ============================================ */

function initLoginForm() {
  var form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;

    var email = document.getElementById("loginEmail");
    var password = document.getElementById("loginPassword");

    valid = validateField(email, "loginEmailError", isValidEmail(email.value)) && valid;
    valid = validateField(password, "loginPasswordError", password.value.length > 0) && valid;

    if (!valid) return;

    // Call backend auth endpoint
    var credentials = btoa(email.value + ":" + password.value);

    fetch("/api/connect", {
      headers: { "Authorization": "Basic " + credentials }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Invalid credentials");
        return res.json();
      })
      .then(function (data) {
        // Store token and redirect to dashboard
        localStorage.setItem("easybus_token", data.token);
        window.location.href = "./work_page.html";
      })
      .catch(function () {
        // Show error on the password field
        var errEl = document.getElementById("loginPasswordError");
        errEl.textContent = "Invalid email or password.";
        errEl.classList.add("form-error--visible");
        password.classList.add("form-input--error");
      });
  });
}

/* ============================================
   Signup Form (calls backend API)
   ============================================ */

function initSignupForm() {
  var form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;

    var username = document.getElementById("signupUsername");
    var email = document.getElementById("signupEmail");
    var password = document.getElementById("signupPassword");
    var confirmPassword = document.getElementById("signupConfirmPassword");

    valid = validateField(username, "signupUsernameError", username.value.trim().length > 0) && valid;
    valid = validateField(email, "signupEmailError", isValidEmail(email.value)) && valid;
    valid = validateField(password, "signupPasswordError", password.value.length >= 6) && valid;
    valid = validateField(
      confirmPassword,
      "signupConfirmPasswordError",
      confirmPassword.value === password.value && confirmPassword.value.length > 0
    ) && valid;

    if (!valid) return;

    // Call backend user creation endpoint
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.value.trim(),
        email: email.value.trim(),
        password: password.value
      })
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (d) { throw new Error(d.error); });
        return res.json();
      })
      .then(function () {
        // Auto-login after signup
        var credentials = btoa(email.value.trim() + ":" + password.value);
        return fetch("/api/connect", {
          headers: { "Authorization": "Basic " + credentials }
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(function (data) {
        localStorage.setItem("easybus_token", data.token);
        window.location.href = "./work_page.html";
      })
      .catch(function (err) {
        var errEl = document.getElementById("signupEmailError");
        errEl.textContent = err.message || "Registration failed.";
        errEl.classList.add("form-error--visible");
        email.classList.add("form-input--error");
      });
  });
}

/* ============================================
   Profile (loads user data from API)
   ============================================ */

function initProfile() {
  var nameEl = document.querySelector(".profile-card__name");
  var emailEl = document.querySelector(".profile-card__email");

  if (!nameEl || !emailEl) return;

  var token = localStorage.getItem("easybus_token");
  if (!token) return;

  fetch("/api/users/me", {
    headers: { "X-Token": token }
  })
    .then(function (res) {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(function (user) {
      nameEl.textContent = user.username;
      emailEl.textContent = user.email;
    })
    .catch(function () {
      // Keep default data if not authenticated
    });
}

/* ============================================
   Validation Helpers
   ============================================ */

function validateField(input, errorId, isValid) {
  var errorEl = document.getElementById(errorId);

  if (isValid) {
    input.classList.remove("form-input--error");
    errorEl.classList.remove("form-error--visible");
    return true;
  }

  input.classList.add("form-input--error");
  errorEl.classList.add("form-error--visible");
  return false;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
