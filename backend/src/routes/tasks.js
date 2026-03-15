/**
 * Tasks Routes: /api/tasks
 * Manage tasks assigned to clients and users
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/tasks ────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { status, priority, client_id, assigned_to, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let conditions = [];
    let params = [];

    // Non-admin users only see their own tasks
    if (req.user.role === 'user') {
      params.push(req.user.id);
      conditions.push(`t.assigned_to = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (priority) {
      params.push(priority);
      conditions.push(`t.priority = $${params.length}`);
    }
    if (client_id) {
      params.push(client_id);
      conditions.push(`t.client_id = $${params.length}`);
    }
    if (assigned_to) {
      params.push(assigned_to);
      conditions.push(`t.assigned_to = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM tasks t ${where}`, params
    );

    params.push(limit, offset);
    const result = await query(
      `SELECT t.*,
              c.name AS client_name,
              u.name AS assigned_to_name,
              cb.name AS created_by_name
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN users cb ON cb.id = t.created_by
       ${where}
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         t.due_date ASC NULLS LAST
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
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ── GET /api/tasks/:id ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*,
              c.name AS client_name,
              u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Fetch related reminders
    const reminders = await query(
      'SELECT * FROM reminders WHERE task_id=$1 ORDER BY notify_at',
      [req.params.id]
    );

    res.json({ ...result.rows[0], reminders: reminders.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// ── POST /api/tasks ───────────────────────────────────────────
router.post('/',
  requireRole('admin', 'accountant'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('due_date').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, client_id, assigned_to, due_date, priority, status } = req.body;

    try {
      const result = await query(
        `INSERT INTO tasks (title, description, client_id, assigned_to, created_by, due_date, priority, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [title, description, client_id, assigned_to, req.user.id,
         due_date || null, priority || 'medium', status || 'pending']
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// ── PUT /api/tasks/:id ────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { title, description, client_id, assigned_to, due_date, priority, status } = req.body;

  try {
    // If marking as complete, record the timestamp
    const completed_at = status === 'completed' ? 'NOW()' : 'NULL';

    const result = await query(
      `UPDATE tasks
       SET title=$1, description=$2, client_id=$3, assigned_to=$4,
           due_date=$5, priority=$6, status=$7,
           completed_at = CASE WHEN $7='completed' THEN NOW() ELSE NULL END
       WHERE id=$8
       RETURNING *`,
      [title, description, client_id, assigned_to, due_date, priority, status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ── PATCH /api/tasks/:id/status ───────────────────────────────
// Quick status update endpoint
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await query(
      `UPDATE tasks
       SET status=$1,
           completed_at = CASE WHEN $1='completed' THEN NOW() ELSE NULL END
       WHERE id=$2
       RETURNING *`,
      [status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────
router.delete('/:id', requireRole('admin', 'accountant'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM tasks WHERE id=$1 RETURNING id',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
