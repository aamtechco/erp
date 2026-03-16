/**
 * PostgreSQL Connection Pool
 * Uses the pg library with connection pooling for efficiency
 */

const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'erp_db',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      }
);

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint,
      where: err?.where,
      stack: err?.stack,
    });
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

/**
 * Execute a parameterized query
 * @param {string} text   - SQL query string
 * @param {Array}  params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (for transactions)
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
