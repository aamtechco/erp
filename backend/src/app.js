/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const clientRoutes    = require('./routes/clients');
const taskRoutes      = require('./routes/tasks');
const reminderRoutes  = require('./routes/reminders');
const reportRoutes    = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const clientPortalRoutes = require('./routes/client');

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS: allow frontend origin ───────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting (100 req / 15 min per IP) ───────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/clients',    clientRoutes);
app.use('/api/tasks',      taskRoutes);
app.use('/api/reminders',  reminderRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/client',     clientPortalRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
