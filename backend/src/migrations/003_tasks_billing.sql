-- Create tasks table with billing fields (if not exists),
-- or safely add billing fields if it already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasks'
  ) THEN
    CREATE TABLE tasks (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title            TEXT NOT NULL,
      description      TEXT,
      client_id        UUID REFERENCES clients(id) ON DELETE CASCADE,
      assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
      amount           NUMERIC,
      is_paid          BOOLEAN DEFAULT FALSE,
      paid_at          TIMESTAMPTZ,
      status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
      priority         TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
      due_date         DATE,
      completed_at     TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS amount NUMERIC,
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tasks_client_status_paid_idx
  ON tasks (client_id, status, is_paid);

