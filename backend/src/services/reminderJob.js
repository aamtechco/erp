/**
 * Reminder Job Service
 * Runs every minute to check for due reminders and send email notifications
 */

const cron = require('node-cron');
const { query } = require('../utils/db');
const { sendReminderEmail } = require('./emailService');
const logger = require('../utils/logger');

/**
 * Process all unsent reminders that are due
 * Called by the cron job every minute
 */
const processReminders = async () => {
  try {
    // Fetch all unsent reminders whose notify_at has passed
    const result = await query(
      `SELECT r.*, r.id AS reminder_id,
              t.title AS task_title, t.due_date,
              c.name AS client_name,
              u.email AS user_email, u.name AS user_name
       FROM reminders r
       JOIN tasks t ON t.id = r.task_id
       LEFT JOIN clients c ON c.id = t.client_id
       JOIN users u ON u.id = r.user_id
       WHERE r.sent = FALSE
         AND r.notify_at <= NOW()
       ORDER BY r.notify_at ASC
       LIMIT 50` // Process max 50 at a time to avoid overload
    );

    if (!result.rows.length) return;

    logger.info(`📬 Processing ${result.rows.length} pending reminder(s)...`);

    for (const reminder of result.rows) {
      try {
        // Send the email
        await sendReminderEmail({
          to:         reminder.user_email,
          name:       reminder.user_name,
          taskTitle:  reminder.task_title,
          dueDate:    reminder.due_date,
          clientName: reminder.client_name,
          message:    reminder.message,
        });

        // Mark reminder as sent
        await query(
          'UPDATE reminders SET sent=TRUE, sent_at=NOW() WHERE id=$1',
          [reminder.reminder_id]
        );

        logger.info(`✅ Reminder sent to ${reminder.user_email} for task "${reminder.task_title}"`);
      } catch (emailErr) {
        // Log but don't crash — try again next cycle
        logger.error(`❌ Failed to send reminder ${reminder.reminder_id}: ${emailErr.message}`);
      }
    }
  } catch (err) {
    logger.error(`Reminder job error: ${err.message}`);
  }
};

/**
 * Start the cron job
 * Runs every minute: '* * * * *'
 */
const startReminderJob = () => {
  logger.info('⏰ Reminder cron job started (runs every minute)');
  cron.schedule('* * * * *', processReminders);
};

module.exports = { startReminderJob, processReminders };
