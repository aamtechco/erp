-- Adds register_number columns used by /api/auth/login-register
-- Safe to run multiple times.

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS register_number TEXT;

ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS register_number TEXT;

-- Uniqueness (allows NULL; but enforces uniqueness for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS users_register_number_ux
  ON users (register_number)
  WHERE register_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clients_register_number_ux
  ON clients (register_number)
  WHERE register_number IS NOT NULL;

