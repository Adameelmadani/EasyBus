const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');

const app = express();
const port = process.env.PORT || 5000;

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'static' directory
app.use(express.static(path.join(__dirname, 'static')));

// API routes
app.use('/', indexRouter);

// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(port, () => {
  console.log(`EasyBus server running on http://localhost:${port}`);
});

module.exports = app;
