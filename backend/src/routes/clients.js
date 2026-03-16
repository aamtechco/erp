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
    const clientResult = await query(
      `SELECT c.*, u.name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (!clientResult.rows.length) {
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

    const poa = await query(
      `SELECT *
       FROM client_powers_of_attorney
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...clientResult.rows[0],
      recent_tasks: tasks.rows,
      powers_of_attorney: poa.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// ── POST /api/clients ─────────────────────────────────────────
router.post('/',
  requireRole('admin', 'accountant'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('tax_id')
    .optional()
    .matches(/^\d{9}$/).withMessage('Tax ID must be exactly 9 digits'),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let {
      name, email, phone, company, tax_id, address, notes, status,
      client_number, full_name, mobile, median_name, median_mobile,
      agreed_payment, id_number, tax_number, commercial_reg_number,
      activity_field, commercial_reg_office, commercial_reg_renewal_date,
      tax_office, vat_tax_office, ebill, capital_amount, work_start_date,
      work_end_date, last_tax_examine_date, last_vat_examine_date,
      vat_start_date, platform_subscription, platform_renewal_date,
      gmail_email, gmail_password, tax_vat_email, tax_vat_password,
      ebill_email, ebill_password, portal_email, portal_password,
    } = req.body;

    // Normalize numeric fields (empty string -> null)
    if (agreed_payment === '') agreed_payment = null;
    if (capital_amount === '') capital_amount = null;

    try {
      const result = await query(
        `INSERT INTO clients (
           name, email, phone, company, tax_id, address, notes, status, created_by,
           client_number, full_name, mobile, median_name, median_mobile,
           agreed_payment, id_number, tax_number, commercial_reg_number,
           activity_field, commercial_reg_office, commercial_reg_renewal_date,
           tax_office, vat_tax_office, ebill, capital_amount, work_start_date,
           work_end_date, last_tax_examine_date, last_vat_examine_date,
           vat_start_date, platform_subscription, platform_renewal_date,
           gmail_email, gmail_password, tax_vat_email, tax_vat_password,
           ebill_email, ebill_password, portal_email, portal_password
         )
         VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,
           $10,$11,$12,$13,$14,
           $15,$16,$17,$18,
           $19,$20,$21,
           $22,$23,$24,$25,$26,
           $27,$28,$29,
           $30,$31,$32,
           $33,$34,$35,$36,
           $37,$38,$39,$40
         )
         RETURNING *`,
        [
          name, email, phone, company, tax_id, address, notes, status || 'active', req.user.id,
          client_number, full_name, mobile, median_name, median_mobile,
          agreed_payment, id_number, tax_number, commercial_reg_number,
          activity_field, commercial_reg_office, commercial_reg_renewal_date || null,
          tax_office, vat_tax_office, ebill, capital_amount, work_start_date || null,
          work_end_date || null, last_tax_examine_date || null, last_vat_examine_date || null,
          vat_start_date || null, platform_subscription, platform_renewal_date || null,
          gmail_email, gmail_password, tax_vat_email, tax_vat_password,
          ebill_email, ebill_password, portal_email, portal_password,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
);

// ── CRUD for client powers of attorney ─────────────────────────
router.post(
  '/:id/powers',
  requireRole('admin', 'accountant'),
  body('title').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, document_number, issue_date, expiry_date, notes } = req.body;

    try {
      const result = await query(
        `INSERT INTO client_powers_of_attorney
           (client_id, title, document_number, issue_date, expiry_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [req.params.id, title, document_number, issue_date || null, expiry_date || null, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create power of attorney' });
    }
  }
);

router.delete(
  '/:id/powers/:powerId',
  requireRole('admin', 'accountant'),
  async (req, res) => {
    try {
      const result = await query(
        `DELETE FROM client_powers_of_attorney
         WHERE id = $1 AND client_id = $2
         RETURNING id`,
        [req.params.powerId, req.params.id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Power of attorney not found' });
      }

      res.json({ message: 'Power of attorney deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete power of attorney' });
    }
  }
);

// ── PUT /api/clients/:id ──────────────────────────────────────
router.put('/:id',
  requireRole('admin', 'accountant'),
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    let {
      name, email, phone, company, tax_id, address, notes, status,
      client_number, full_name, mobile, median_name, median_mobile,
      agreed_payment, id_number, tax_number, commercial_reg_number,
      activity_field, commercial_reg_office, commercial_reg_renewal_date,
      tax_office, vat_tax_office, ebill, capital_amount, work_start_date,
      work_end_date, last_tax_examine_date, last_vat_examine_date,
      vat_start_date, platform_subscription, platform_renewal_date,
      gmail_email, gmail_password, tax_vat_email, tax_vat_password,
      ebill_email, ebill_password, portal_email, portal_password,
    } = req.body;

    if (agreed_payment === '') agreed_payment = null;
    if (capital_amount === '') capital_amount = null;

    try {
      const result = await query(
        `UPDATE clients
         SET name=$1, email=$2, phone=$3, company=$4, tax_id=$5,
             address=$6, notes=$7, status=$8,
             client_number=$9, full_name=$10, mobile=$11, median_name=$12, median_mobile=$13,
             agreed_payment=$14, id_number=$15, tax_number=$16, commercial_reg_number=$17,
             activity_field=$18, commercial_reg_office=$19, commercial_reg_renewal_date=$20,
             tax_office=$21, vat_tax_office=$22, ebill=$23, capital_amount=$24,
             work_start_date=$25, work_end_date=$26, last_tax_examine_date=$27,
             last_vat_examine_date=$28, vat_start_date=$29, platform_subscription=$30,
             platform_renewal_date=$31, gmail_email=$32, gmail_password=$33,
             tax_vat_email=$34, tax_vat_password=$35, ebill_email=$36,
             ebill_password=$37, portal_email=$38, portal_password=$39
         WHERE id=$40
         RETURNING *`,
        [
          name, email, phone, company, tax_id, address, notes, status,
          client_number, full_name, mobile, median_name, median_mobile,
          agreed_payment, id_number, tax_number, commercial_reg_number,
          activity_field, commercial_reg_office, commercial_reg_renewal_date || null,
          tax_office, vat_tax_office, ebill, capital_amount,
          work_start_date || null, work_end_date || null, last_tax_examine_date || null,
          last_vat_examine_date || null, vat_start_date || null, platform_subscription,
          platform_renewal_date || null, gmail_email, gmail_password,
          tax_vat_email, tax_vat_password, ebill_email,
          ebill_password, portal_email, portal_password,
          req.params.id,
        ]
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
