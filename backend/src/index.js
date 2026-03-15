/**
 * ERP System - Express Backend Entry Point
 * Starts the HTTP server and background jobs
 */

require('dotenv').config();
const app = require('./app');
const { startReminderJob } = require('./services/reminderJob');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Start the HTTP server
const server = app.listen(PORT, () => {
  logger.info(`✅ ERP Backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// Start the cron job that checks and sends reminders
startReminderJob();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

module.exports = server;
