# EasyBus

<img src="https://img.shields.io/badge/Language-JavaScript-yellow">
<img src="https://img.shields.io/badge/Runtime-Node.js-green">
<img src="https://img.shields.io/badge/License-ISC-blue">

**EasyBus** is a modern, responsive web application designed to provide users with real-time information about nearby bus routes, timings, and stops. With a user-friendly interface powered by clean glassmorphism design, users can easily plan their trips, find the closest bus stops with an interactive map, and track the arrival times of buses seamlessly.

> Built by **Adam El Madani** &amp; **Ghita Bouzrbay**

---

## Features

- **Interactive Map** — Track routes and stops directly from the built-in Leaflet-powered map
- **Real-time Tracking** — Predict and get accurate estimates of bus arrivals
- **Route Planning** — Find the fastest route between any two stations
- **Closest Station Finder** — Locate the nearest bus stop based on your position
- **User Management** — Create accounts and manage preferences securely
- **Favorites** — Save and manage your frequently used stations
- **Responsive Interface** — Modern glassmorphism UI adaptable to all device sizes

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Backend    | Node.js, Express.js                             |
| Database   | JSON-based local storage (`easybus_db.json`)    |
| Auth       | Token-based authentication (SHA1 + UUID)        |
| Frontend   | HTML5, Vanilla CSS, Vanilla JavaScript          |
| Maps       | Leaflet.js                                      |

---

## Prerequisites

- **Node.js 14+** — [Download](https://nodejs.org/)
- **npm** — Comes bundled with Node.js
- **Git** (optional) — For cloning the repo

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Adameelmadani/EasyBus.git
cd EasyBus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm start
```

The app starts at **http://localhost:5000**

### 4. Open in Browser

Navigate to `http://localhost:5000` — you'll see the landing page. Sign up, log in, and start exploring bus routes!

> For development with auto-reload:
> ```bash
> npm run dev
> ```

---

## Project Structure

```
EasyBus/
├── server.js               # Express entry point
├── package.json            # Node.js dependencies and scripts
├── easybus_db.json         # JSON database (buses, stations, users)
├── routes/
│   └── index.js            # All API route definitions
├── controllers/
│   ├── AppController.js    # Status and stats endpoints
│   ├── AuthController.js   # Login / logout
│   ├── UsersController.js  # User registration and profile
│   └── BusesController.js  # Bus and station data
├── utils/                  # Database and Redis client helpers
└── static/
    ├── index.html          # Landing page
    ├── home.html           # Home / dashboard
    ├── map.html            # Interactive map page
    ├── login.html          # Login page
    ├── about.html          # About page
    ├── work_page.html      # Work page
    ├── css/                # Stylesheets
    ├── js/                 # Client-side scripts
    └── assets/             # Images and static assets
```

---

## API Reference

All protected routes require an `x-token` header obtained from `/api/connect`.

| Method   | Endpoint                          | Auth | Description                        |
|----------|-----------------------------------|------|------------------------------------|
| `GET`    | `/api/status`                     |      | Check API and DB status            |
| `GET`    | `/api/stats`                      |      | Get general statistics             |
| `GET`    | `/api/connect`                    |      | Log in and receive auth token      |
| `GET`    | `/api/disconnect`                 | ✓    | Log out and invalidate token       |
| `POST`   | `/api/users`                      |      | Register a new user                |
| `GET`    | `/api/users/me`                   | ✓    | Get current user profile           |
| `GET`    | `/api/buses`                      |      | List all buses                     |
| `GET`    | `/api/buses/:id`                  |      | Get a bus by ID                    |
| `GET`    | `/api/stations`                   |      | List all stations                  |
| `GET`    | `/api/stations/:name`             |      | Get a station by name              |
| `GET`    | `/api/stations/:name/closest`     |      | Get the closest station            |
| `GET`    | `/api/route/:from/:to`            |      | Get route between two stations     |
| `GET`    | `/api/favorites`                  | ✓    | List user's favorite stations      |
| `POST`   | `/api/favorites`                  | ✓    | Add a station to favorites         |
| `DELETE` | `/api/favorites`                  | ✓    | Remove a station from favorites    |
| `GET`    | `/api/map`                        |      | Get full map data                  |

---

## License

This project is licensed under the ISC License.
