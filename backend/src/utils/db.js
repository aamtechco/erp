/**
 * PostgreSQL Connection Pool
 * Optimized for Supabase + Railway deployment
 */

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

// Determine connection config
let poolConfig;

if (process.env.DATABASE_URL) {
  // Production (Railway + Supabase)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  // Local development fallback
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'erp_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
  };
}

const pool = new Pool(poolConfig);

/**
 * Test database connection on startup
 */
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', {
      message: err?.message,
      code: err?.code,
      address: err?.address,
      port: err?.port,
      stack: err?.stack,
    });
  }
})();

/**
 * Execute a parameterized query
 * @param {string} text
 * @param {Array} params
 */
const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Get a client for transactions
 */
const getClient = () => {
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  pool,
};