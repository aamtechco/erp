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
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;

  // Support wildcard entries like "*.vercel.app"
  for (const entry of allowedOrigins) {
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1); // ".vercel.app"
      if (origin.endsWith(suffix)) return true;
    }
  }
  return false;
};

const corsOptions = {
  origin: (origin, cb) => {
    // Non-browser requests (no Origin header)
    if (!origin) return cb(null, true);
    if (isOriginAllowed(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
