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

// Health & DB Connection Check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
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

