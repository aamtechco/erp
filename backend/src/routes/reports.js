/**
 * Reports Routes: /api/reports
 * Generate and fetch financial/activity reports
 */

const router = require('express').Router();
const { query } = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/reports/summary ──────────────────────────────────
// Main financial/activity summary
router.get('/summary', async (req, res) => {
  const { period_start, period_end } = req.query;
  const start = period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const end   = period_end   || new Date().toISOString();

  try {
    // Tasks by status
    const tasksByStatus = await query(
      `SELECT status, COUNT(*) AS count
       FROM tasks
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY status`,
      [start, end]
    );

    // Tasks by priority
    const tasksByPriority = await query(
      `SELECT priority, COUNT(*) AS count
       FROM tasks
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY priority`,
      [start, end]
    );

    // Clients by status
    const clientsByStatus = await query(
      `SELECT status, COUNT(*) AS count FROM clients GROUP BY status`
    );

    // Overdue tasks
    const overdue = await query(
      `SELECT COUNT(*) AS count
       FROM tasks
       WHERE due_date < NOW() AND status NOT IN ('completed','cancelled')`
    );

    // Tasks completed this period
    const completedThisPeriod = await query(
      `SELECT COUNT(*) AS count
       FROM tasks
       WHERE completed_at BETWEEN $1 AND $2`,
      [start, end]
    );

    // Most active users (by tasks completed)
    const topUsers = await query(
      `SELECT u.name, COUNT(t.id) AS completed_tasks
       FROM users u
       LEFT JOIN tasks t ON t.assigned_to = u.id
         AND t.status = 'completed'
         AND t.completed_at BETWEEN $1 AND $2
       GROUP BY u.id, u.name
       ORDER BY completed_tasks DESC
       LIMIT 5`,
      [start, end]
    );

    // Tasks created per day (last 30 days)
    const taskTrend = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM tasks
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    res.json({
      period: { start, end },
      tasks_by_status:    tasksByStatus.rows,
      tasks_by_priority:  tasksByPriority.rows,
      clients_by_status:  clientsByStatus.rows,
      overdue_tasks:      parseInt(overdue.rows[0].count),
      completed_this_period: parseInt(completedThisPeriod.rows[0].count),
      top_users:          topUsers.rows,
      task_trend:         taskTrend.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ── GET /api/reports ──────────────────────────────────────────
// List saved reports
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name AS created_by_name
       FROM reports r
       LEFT JOIN users u ON u.id = r.created_by
       ORDER BY r.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ── POST /api/reports ─────────────────────────────────────────
// Save a report snapshot
router.post('/', requireRole('admin', 'accountant'), async (req, res) => {
  const { title, type, data, period_start, period_end } = req.body;

  try {
    const result = await query(
      `INSERT INTO reports (title, type, data, period_start, period_end, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [title, type, JSON.stringify(data), period_start, period_end, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

module.exports = router;
