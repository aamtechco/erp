-- ============================================================
-- ERP System for Small Accounting Office
-- PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- Stores admin, accountant, and regular users
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'accountant', 'user')),
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTS TABLE
-- Stores accounting office clients
-- ============================================================
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(50),
  company       VARCHAR(200),
  tax_id        VARCHAR(100),
  address       TEXT,
  notes         TEXT,
  status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS TABLE
-- Tasks assigned to clients, owned by users
-- ============================================================
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  client_id        UUID REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority         VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date         DATE,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REMINDERS TABLE
-- Notifications linked to tasks
-- ============================================================
CREATE TABLE reminders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300),
  message     TEXT,
  notify_at   TIMESTAMPTZ NOT NULL,
  sent        BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ,
  channel     VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'push', 'both')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTS TABLE
-- Financial/activity snapshots saved for reference
-- ============================================================
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(300) NOT NULL,
  type         VARCHAR(50) NOT NULL CHECK (type IN ('financial', 'task_summary', 'client_activity', 'custom')),
  data         JSONB,
  period_start DATE,
  period_end   DATE,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG TABLE
-- Tracks important actions for compliance
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(50),
  record_id   UUID,
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_tasks_client_id     ON tasks(client_id);
CREATE INDEX idx_tasks_assigned_to   ON tasks(assigned_to);
CREATE INDEX idx_tasks_status        ON tasks(status);
CREATE INDEX idx_tasks_due_date      ON tasks(due_date);
CREATE INDEX idx_reminders_notify_at ON reminders(notify_at) WHERE sent = FALSE;
CREATE INDEX idx_reminders_task_id   ON reminders(task_id);
CREATE INDEX idx_clients_status      ON clients(status);
CREATE INDEX idx_audit_log_user_id   ON audit_log(user_id);
CREATE INDEX idx_audit_log_created   ON audit_log(created_at);

-- ============================================================
-- TRIGGERS: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA: Default admin user (password: Admin@1234)
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@office.com', '$2b$10$rQZ3Y5VqKlPzJmXnYbWuiO1hQ2mK9sLdP3nXwEzA4tYvM8jRcFuGe', 'admin'),
  ('Jane Accountant', 'jane@office.com', '$2b$10$rQZ3Y5VqKlPzJmXnYbWuiO1hQ2mK9sLdP3nXwEzA4tYvM8jRcFuGe', 'accountant');

INSERT INTO clients (name, email, phone, company, tax_id, status) VALUES
  ('Acme Corp', 'contact@acme.com', '+1-555-0100', 'Acme Corporation', 'TAX-001', 'active'),
  ('John Smith', 'john.smith@email.com', '+1-555-0101', 'Smith Consulting', 'TAX-002', 'active'),
  ('Global Tech Ltd', 'info@globaltech.com', '+1-555-0102', 'Global Tech Ltd', 'TAX-003', 'prospect');
