/**
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const subjectType = decoded.type || 'user';

    if (subjectType === 'client') {
      const result = await query(
        'SELECT id, name, email, status FROM clients WHERE id = $1',
        [decoded.id]
      );

      if (!result.rows.length || result.rows[0].status !== 'active') {
        return res.status(401).json({ error: 'Client not found or inactive' });
      }

      req.user = { ...result.rows[0], role: 'client' };
      return next();
    }

    // Default: system user
    const result = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Role-based access control
 * Usage: requireRole('admin') or requireRole('admin', 'accountant')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireRole };
