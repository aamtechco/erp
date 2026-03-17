/**
 * PostgreSQL Connection Pool
 * Fully optimized for Supabase + Railway deployment
 */

const { Pool } = require('pg');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Connection configuration
const poolConfig = process.env.DATABASE_URL
  ? {
      // Production (Railway + Supabase)
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Supabase requires SSL
      },
    }
  : {
      // Local development fallback
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'erp_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: false,
    };

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
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (for transactions)
 */
const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool,
};