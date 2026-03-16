/**
 * Auth Routes: /api/auth
 * Handles login, registration, and token refresh
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const hasColumn = async (tableName, columnName) => {
  const result = await query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return result.rows.length > 0;
};

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
        [email]
      );

      if (!result.rows.length) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Sign JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id:   user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── POST /api/auth/login-register ──────────────────────────────
// Supports:
// - Client: registerNumber only (no password)
// - User: registerNumber + password
router.post(
  '/login-register',
  body('accountType').isIn(['client', 'user']),
  body('registerNumber').trim().notEmpty(),
  body('password').optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountType, registerNumber, password } = req.body;

    try {
      if (accountType === 'client') {
        const ok = await hasColumn('clients', 'register_number');
        if (!ok) {
          return res.status(501).json({
            error: 'Client register-number login is not configured yet',
            hint: "Add a 'register_number' column to the 'clients' table, then retry.",
          });
        }

        const result = await query(
          'SELECT id, name, email, status, register_number FROM clients WHERE register_number = $1',
          [registerNumber]
        );

        if (!result.rows.length || result.rows[0].status !== 'active') {
          return res.status(401).json({ error: 'Invalid register number' });
        }

        const client = result.rows[0];
        const token = jwt.sign(
          { id: client.id, type: 'client', role: 'client' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.json({
          token,
          user: {
            id: client.id,
            name: client.name,
            email: client.email,
            role: 'client',
            registerNumber: client.register_number,
          },
        });
      }

      // accountType === 'user'
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const ok = await hasColumn('users', 'register_number');
      if (!ok) {
        return res.status(501).json({
          error: 'User register-number login is not configured yet',
          hint: "Add a 'register_number' column to the 'users' table, then retry.",
        });
      }

      const result = await query(
        'SELECT * FROM users WHERE register_number = $1 AND is_active = TRUE',
        [registerNumber]
      );

      if (!result.rows.length) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, type: 'user', role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          registerNumber: user.register_number,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── POST /api/auth/register (admin only after first setup) ────
router.post('/register',
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['admin', 'accountant', 'user']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      // Check if email already exists
      const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const result = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [name, email, password_hash, role]
      );

      res.status(201).json({ user: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
