/**
 * Email Service
 * Sends reminder emails and notifications using Nodemailer
 */

const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP credentials from .env
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a task reminder email
 * @param {Object} opts
 * @param {string} opts.to         - Recipient email
 * @param {string} opts.name       - Recipient name
 * @param {string} opts.taskTitle  - Task title
 * @param {string} opts.dueDate    - Task due date
 * @param {string} opts.clientName - Client name
 * @param {string} opts.message    - Custom message override
 */
const sendReminderEmail = async ({ to, name, taskTitle, dueDate, clientName, message }) => {
  const dueDateStr = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'No due date set';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #1a1a2e; color: white; padding: 28px 32px; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; opacity: 0.7; font-size: 13px; }
        .body { padding: 32px; }
        .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
        .task-card { background: #f8f9ff; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
        .task-card h2 { margin: 0 0 8px; font-size: 18px; color: #1a1a2e; }
        .task-card .meta { font-size: 13px; color: #666; }
        .task-card .meta span { display: block; margin-top: 4px; }
        .message { background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 14px 18px; font-size: 14px; color: #78350f; margin: 16px 0; }
        .footer { padding: 20px 32px; background: #f8f8f8; font-size: 12px; color: #999; border-top: 1px solid #eee; }
        .btn { display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Task Reminder</h1>
          <p>ERP Office Management System</p>
        </div>
        <div class="body">
          <p class="greeting">Hello <strong>${name}</strong>,</p>
          <p>This is a reminder about an upcoming task assigned to you:</p>

          <div class="task-card">
            <h2>${taskTitle}</h2>
            <div class="meta">
              ${clientName ? `<span>📁 Client: <strong>${clientName}</strong></span>` : ''}
              <span>📅 Due: <strong>${dueDateStr}</strong></span>
            </div>
          </div>

          ${message ? `<div class="message">💬 Note: ${message}</div>` : ''}

          <p>Please log in to the ERP system to view the full task details and update its status.</p>
        </div>
        <div class="footer">
          This is an automated reminder from your ERP system. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from:    process.env.EMAIL_FROM || '"ERP Office" <noreply@office.com>',
    to,
    subject: `Reminder: ${taskTitle} — Due ${dueDateStr}`,
    html,
  });
};

/**
 * Verify SMTP connection (useful for startup checks)
 */
const verifyConnection = () => transporter.verify();

module.exports = { sendReminderEmail, verifyConnection };
