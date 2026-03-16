-- ============================================================
-- ERP System for Small Accounting Office
-- PostgreSQL Schema (+ register_number for user/client login)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- Stores admin, accountant, and regular users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  register_number VARCHAR(100) UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'accountant', 'user')),
  avatar_url      VARCHAR(500),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTS TABLE
-- Stores accounting office clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  client_number   VARCHAR(100),
  full_name       VARCHAR(200),
  mobile          VARCHAR(50),
  median_name     VARCHAR(200),
  median_mobile   VARCHAR(50),
  agreed_payment  NUMERIC,
  id_number       VARCHAR(100),
  tax_number      VARCHAR(100),
  commercial_reg_number VARCHAR(150),
  activity_field  TEXT,
  commercial_reg_office VARCHAR(200),
  commercial_reg_renewal_date DATE,
  tax_office      VARCHAR(200),
  vat_tax_office  VARCHAR(200),
  ebill           VARCHAR(50),
  capital_amount  NUMERIC,
  work_start_date DATE,
  work_end_date   DATE,
  last_tax_examine_date DATE,
  last_vat_examine_date DATE,
  vat_start_date  DATE,
  platform_subscription TEXT,
  platform_renewal_date DATE,
  subscription_amount NUMERIC,
  subscription_renewal_date DATE,
  subscription_last_charged_at DATE,
  gmail_email     VARCHAR(255),
  gmail_password  TEXT,
  tax_vat_email   VARCHAR(255),
  tax_vat_password TEXT,
  ebill_email     VARCHAR(255),
  ebill_password  TEXT,
  portal_email    VARCHAR(255),
  portal_password TEXT,
  email           VARCHAR(255),
  phone           VARCHAR(50),
  company         VARCHAR(200),
  tax_id          VARCHAR(100) UNIQUE,
  address         TEXT,
  notes           TEXT,
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS TABLE
-- Tasks assigned to clients, owned by users
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  client_id        UUID REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  amount           NUMERIC,
  is_paid          BOOLEAN DEFAULT FALSE,
  paid_at          TIMESTAMPTZ,
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority         VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date         DATE,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Task notes
CREATE TABLE IF NOT EXISTS task_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_type VARCHAR(10) NOT NULL CHECK (author_type IN ('client','user')),
  author_id   UUID NOT NULL,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REMINDERS TABLE
-- Notifications linked to tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
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
CREATE TABLE IF NOT EXISTS reports (
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
CREATE TABLE IF NOT EXISTS audit_log (
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
CREATE INDEX IF NOT EXISTS idx_tasks_client_id     ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to   ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_notify_at ON reminders(notify_at) WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_task_id   ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_clients_status      ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tax_id      ON clients(tax_id);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_renewal ON clients(subscription_renewal_date);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id   ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created   ON audit_log(created_at);

-- ============================================================
-- TRIGGERS: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clients_updated_at') THEN
    CREATE TRIGGER trg_clients_updated_at
      BEFORE UPDATE ON clients
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_updated_at') THEN
    CREATE TRIGGER trg_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- ============================================================
-- OPTIONAL SEED (example)
-- NOTE: You must set register_number values if you want register-number login.
-- ============================================================
-- INSERT INTO users (name, email, register_number, password_hash, role) VALUES
--   ('Admin User', 'admin@office.com', 'USR-0001', '<bcrypt_hash>', 'admin');
-- INSERT INTO clients (name, email, register_number, status) VALUES
--   ('Acme Corp', 'contact@acme.com', 'CLI-0001', 'active');

