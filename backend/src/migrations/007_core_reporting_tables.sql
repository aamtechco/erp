-- Core reporting tables: reminders, reports, audit_log

CREATE TABLE IF NOT EXISTS reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(300) NOT NULL,
  type         VARCHAR(50) NOT NULL CHECK (type IN ('financial', 'task_summary', 'client_activity', 'custom')),
  data         JSONB,
  period_start DATE,
  period_end   DATE,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(50),
  record_id   UUID,
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_notify_at ON reminders(notify_at) WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_task_id   ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id   ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created   ON audit_log(created_at);

