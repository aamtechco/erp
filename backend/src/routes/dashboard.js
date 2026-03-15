/**
 * Dashboard Routes: /api/dashboard
 * Returns aggregated stats for the main dashboard
 */

const router = require('express').Router();
const { query } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/dashboard ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = ['admin', 'accountant'].includes(req.user.role);

    // Total clients (admins see all, users see assigned)
    const totalClients = await query(
      'SELECT COUNT(*) AS count FROM clients WHERE status = $1',
      ['active']
    );

    // Tasks stats
    const taskFilter = isAdmin ? '' : `AND assigned_to = '${userId}'`;

    const taskStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending')     AS pending,
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'completed')   AS completed,
         COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed','cancelled')) AS overdue
       FROM tasks
       WHERE 1=1 ${taskFilter}`
    );

    // Upcoming tasks (next 7 days)
    const upcomingTasks = await query(
      `SELECT t.id, t.title, t.due_date, t.priority, t.status,
              c.name AS client_name, u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
         AND t.status NOT IN ('completed','cancelled')
         ${taskFilter}
       ORDER BY t.due_date ASC
       LIMIT 5`
    );

    // Pending reminders for this user
    const pendingReminders = await query(
      `SELECT r.*, t.title AS task_title
       FROM reminders r
       LEFT JOIN tasks t ON t.id = r.task_id
       WHERE r.user_id = $1 AND r.sent = FALSE AND r.notify_at > NOW()
       ORDER BY r.notify_at ASC
       LIMIT 5`,
      [userId]
    );

    // Recent activity (last 5 completed tasks)
    const recentActivity = await query(
      `SELECT t.id, t.title, t.completed_at, t.status,
              c.name AS client_name, u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.status = 'completed'
         ${taskFilter}
       ORDER BY t.completed_at DESC
       LIMIT 5`
    );

    res.json({
      stats: {
        total_clients: parseInt(totalClients.rows[0].count),
        tasks: taskStats.rows[0],
      },
      upcoming_tasks:    upcomingTasks.rows,
      pending_reminders: pendingReminders.rows,
      recent_activity:   recentActivity.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

module.exports = router;
