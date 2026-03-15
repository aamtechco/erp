/**
 * Reminders Routes: /api/reminders
 * Create and manage task reminders / notifications
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/reminders ────────────────────────────────────────
router.get('/', async (req, res) => {
  const { sent, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let conditions = [`r.user_id = $1`];
    let params = [req.user.id];

    if (sent !== undefined) {
      params.push(sent === 'true');
      conditions.push(`r.sent = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) FROM reminders r ${where}`, params
    );

    params.push(limit, offset);
    const result = await query(
      `SELECT r.*, t.title AS task_title, t.due_date,
              c.name AS client_name
       FROM reminders r
       LEFT JOIN tasks t ON t.id = r.task_id
       LEFT JOIN clients c ON c.id = t.client_id
       ${where}
       ORDER BY r.notify_at ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data:  result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// ── POST /api/reminders ───────────────────────────────────────
router.post('/',
  body('task_id').isUUID().withMessage('Valid task_id is required'),
  body('notify_at').isISO8601().withMessage('Valid notify_at date is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task_id, title, message, notify_at, channel } = req.body;

    try {
      // Verify task exists
      const taskCheck = await query('SELECT id FROM tasks WHERE id=$1', [task_id]);
      if (!taskCheck.rows.length) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const result = await query(
        `INSERT INTO reminders (task_id, user_id, title, message, notify_at, channel)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [task_id, req.user.id, title, message, notify_at, channel || 'email']
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create reminder' });
    }
  }
);

// ── DELETE /api/reminders/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM reminders WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;
