/**
 * Client Routes: /api/clients
 * Full CRUD for accounting office clients
 */

const router = require('express').Router();
const { body, validationResult, param } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

// All client routes require authentication
router.use(authenticate);

// ── GET /api/clients ──────────────────────────────────────────
// List all clients with optional search and filter
router.get('/', async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let conditions = [];
    let params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.company ILIKE $${params.length})`);
    }
    if (status) {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM clients c ${where}`,
      params
    );

    // Get paginated results
    params.push(limit, offset);
    const result = await query(
      `SELECT c.*, u.name AS created_by_name,
              (SELECT COUNT(*) FROM tasks t WHERE t.client_id = c.id) AS task_count
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data:  result.rows,
      total: parseInt(countResult.rows[0].count),
      page:  parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ── GET /api/clients/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Also fetch recent tasks for this client
    const tasks = await query(
      `SELECT t.*, u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.client_id = $1
       ORDER BY t.due_date ASC
       LIMIT 10`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], recent_tasks: tasks.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// ── POST /api/clients ─────────────────────────────────────────
router.post('/',
  requireRole('admin', 'accountant'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, company, tax_id, address, notes, status } = req.body;

    try {
      const result = await query(
        `INSERT INTO clients (name, email, phone, company, tax_id, address, notes, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [name, email, phone, company, tax_id, address, notes, status || 'active', req.user.id]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
);

// ── PUT /api/clients/:id ──────────────────────────────────────
router.put('/:id',
  requireRole('admin', 'accountant'),
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    const { name, email, phone, company, tax_id, address, notes, status } = req.body;

    try {
      const result = await query(
        `UPDATE clients
         SET name=$1, email=$2, phone=$3, company=$4, tax_id=$5,
             address=$6, notes=$7, status=$8
         WHERE id=$9
         RETURNING *`,
        [name, email, phone, company, tax_id, address, notes, status, req.params.id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Client not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update client' });
    }
  }
);

// ── DELETE /api/clients/:id ───────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM clients WHERE id=$1 RETURNING id',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
