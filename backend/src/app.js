const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { errorResponse } = require('./utils/response');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  errorResponse(res, `Endpoint ${req.originalUrl} tidak ditemukan`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

