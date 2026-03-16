/**
 * Seed minimal data for local testing.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@office.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
    const adminRegister = process.env.SEED_ADMIN_REGISTER_NUMBER || 'USR-0001';

    const password_hash = await bcrypt.hash(adminPassword, 10);

    const admin = await client.query(
      `INSERT INTO users (name, email, password_hash, role, register_number, is_active)
       VALUES ($1,$2,$3,$4,$5,TRUE)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         register_number = EXCLUDED.register_number,
         is_active = TRUE
       RETURNING id, email, role, register_number`,
      ['Admin', adminEmail, password_hash, 'admin', adminRegister]
    );

    const clientRegister = process.env.SEED_CLIENT_REGISTER_NUMBER || 'CLI-0001';
    const existingClient = await client.query(
      'SELECT id FROM clients WHERE register_number = $1',
      [clientRegister]
    );

    let seededClient;
    if (existingClient.rows.length) {
      seededClient = await client.query(
        `UPDATE clients
         SET name=$1, email=$2, status='active'
         WHERE id=$3
         RETURNING id, name, register_number`,
        ['Seed Client', 'client@example.com', existingClient.rows[0].id]
      );
    } else {
      seededClient = await client.query(
        `INSERT INTO clients (name, email, status, register_number, created_by)
         VALUES ($1,$2,'active',$3,$4)
         RETURNING id, name, register_number`,
        ['Seed Client', 'client@example.com', clientRegister, admin.rows[0].id]
      );
    }

    await client.query('COMMIT');

    console.log('Seed complete:');
    console.log('- Admin:', admin.rows[0]);
    console.log('- Client:', seededClient.rows[0]);
    console.log('Use these to test /api/auth/login-register');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err?.message || err);
  process.exit(1);
});

