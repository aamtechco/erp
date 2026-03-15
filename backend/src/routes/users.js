/**
 * Users Routes: /api/users
 * Admin management of system users
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/users ────────────────────────────────────────────
router.get('/', requireRole('admin', 'accountant'), async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, is_active, created_at FROM users ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── POST /api/users ───────────────────────────────────────────
router.post('/',
  requireRole('admin'),
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
      const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
      if (exists.rows.length) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1,$2,$3,$4)
         RETURNING id, name, email, role, is_active, created_at`,
        [name, email, password_hash, role]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// ── PUT /api/users/:id ────────────────────────────────────────
router.put('/:id', requireRole('admin'), async (req, res) => {
  const { name, role, is_active } = req.body;

  try {
    const result = await query(
      `UPDATE users SET name=$1, role=$2, is_active=$3
       WHERE id=$4
       RETURNING id, name, email, role, is_active`,
      [name, role, is_active, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── PATCH /api/users/me/password ──────────────────────────────
router.patch('/me/password',
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    try {
      const result = await query('SELECT * FROM users WHERE id=$1', [req.user.id]);
      const user = result.rows[0];

      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const password_hash = await bcrypt.hash(new_password, 10);
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [password_hash, req.user.id]);

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

module.exports = router;
