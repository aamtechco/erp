/**
 * Winston Logger
 * Centralized logging for the backend
 */

const { createLogger, format, transports } = require('winston');

const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'warn' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize(),
    format.printf(({ timestamp, level, message }) =>
      `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [
    new transports.Console(),
    ...(isServerless
      ? []
      : [
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' }),
        ]),
  ],
});

module.exports = logger;
