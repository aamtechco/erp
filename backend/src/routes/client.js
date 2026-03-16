/**
 * Client Portal Routes: /api/client
 * Used by clients (role=client) after logging in with tax_id.
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query, getClient } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

// All routes here require an authenticated client
router.use(authenticate);

const requireClient = (req, res, next) => {
  if (req.user?.role !== 'client') {
    return res.status(403).json({ error: 'هذه الواجهة مخصصة للعميل فقط' });
  }
  next();
};

router.use(requireClient);

// ── GET /api/client/me ──────────────────────────────────────────
// Returns client profile + balance (tasks due + subscription if due)
router.get('/me', async (req, res) => {
  const clientId = req.user.id;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const clientResult = await client.query(
      `SELECT id, name, tax_id, email, phone, company,
              subscription_amount, subscription_renewal_date,
              subscription_last_charged_at
       FROM clients
       WHERE id = $1`,
      [clientId]
    );

    if (!clientResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const c = clientResult.rows[0];

    // Tasks due: completed but not paid
    const tasksDueResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM tasks
       WHERE client_id = $1
         AND status = 'completed'
         AND COALESCE(is_paid, FALSE) = FALSE`,
      [clientId]
    );

    const tasksDue = Number(tasksDueResult.rows[0].total || 0);

    // Subscription due (simple one-time charge per renewal cycle)
    let subscriptionDue = 0;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (c.subscription_amount && c.subscription_renewal_date) {
      const renewal = c.subscription_renewal_date.toISOString().slice(0, 10);
      const lastCharged = c.subscription_last_charged_at
        ? c.subscription_last_charged_at.toISOString().slice(0, 10)
        : null;

      if (renewal <= today && (!lastCharged || lastCharged < renewal)) {
        subscriptionDue = Number(c.subscription_amount || 0);
        await client.query(
          `UPDATE clients
           SET subscription_last_charged_at = subscription_renewal_date
           WHERE id = $1`,
          [clientId]
        );
      }
    }

    await client.query('COMMIT');

    const totalDue = tasksDue + subscriptionDue;

    res.json({
      client: {
        id: c.id,
        name: c.name,
        taxId: c.tax_id,
        email: c.email,
        phone: c.phone,
        company: c.company,
        subscriptionAmount: c.subscription_amount,
        subscriptionRenewalDate: c.subscription_renewal_date,
      },
      balance: {
        tasksDue,
        subscriptionDue,
        totalDue,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'فشل في تحميل بيانات العميل' });
  } finally {
    client.release();
  }
});

// ── GET /api/client/tasks ───────────────────────────────────────
router.get('/tasks', async (req, res) => {
  const clientId = req.user.id;
  const { status } = req.query;

  try {
    let conditions = ['t.client_id = $1'];
    const params = [clientId];

    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT t.*
       FROM tasks t
       ${where}
       ORDER BY
         CASE t.status WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'completed' THEN 3 ELSE 4 END,
         t.due_date ASC NULLS LAST`,
      params
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل في جلب المهام' });
  }
});

// ── POST /api/client/tasks ──────────────────────────────────────
// Client can request a new task for himself
router.post(
  '/tasks',
  body('title').trim().notEmpty().withMessage('عنوان المهمة مطلوب'),
  body('amount').optional().isNumeric().withMessage('قيمة المهمة يجب أن تكون رقمًا'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clientId = req.user.id;
    const { title, description, amount } = req.body;

    try {
      const result = await query(
        `INSERT INTO tasks (title, description, client_id, created_by, amount, status, priority)
         VALUES ($1,$2,$3,$4,$5,'pending','medium')
         RETURNING *`,
        [title, description || null, clientId, null, amount || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'فشل في إنشاء المهمة' });
    }
  }
);

// ── POST /api/client/tasks/:id/notes ────────────────────────────
router.post(
  '/tasks/:id/notes',
  body('note').trim().notEmpty().withMessage('النص مطلوب'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clientId = req.user.id;
    const { note } = req.body;

    try {
      const taskResult = await query(
        `SELECT id, client_id, status
         FROM tasks
         WHERE id = $1`,
        [req.params.id]
      );

      if (!taskResult.rows.length || taskResult.rows[0].client_id !== clientId) {
        return res.status(404).json({ error: 'المهمة غير موجودة لهذا العميل' });
      }

      if (taskResult.rows[0].status === 'completed') {
        return res.status(400).json({ error: 'لا يمكن إضافة ملاحظات لمهمة مكتملة' });
      }

      const result = await query(
        `INSERT INTO task_notes (task_id, author_type, author_id, note)
         VALUES ($1,'client',$2,$3)
         RETURNING *`,
        [req.params.id, clientId, note]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'فشل في إضافة الملاحظة' });
    }
  }
);

module.exports = router;

