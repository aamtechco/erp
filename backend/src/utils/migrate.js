/**
 * Simple migration runner.
 * Runs SQL files in src/migrations in filename order.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function main() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    console.log('No migrations found.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = await client.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.rows.map((r) => r.filename));

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      console.log(`Applying ${file}...`);
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    }

    await client.query('COMMIT');
    console.log('Migrations complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', {
    message: err?.message,
    code: err?.code,
    detail: err?.detail,
    hint: err?.hint,
    where: err?.where,
    stack: err?.stack,
  });
  process.exit(1);
});

