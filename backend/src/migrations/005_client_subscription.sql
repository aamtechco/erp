-- Subscription fields for clients (for recurring fees).

ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS subscription_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE,
  ADD COLUMN IF NOT EXISTS subscription_last_charged_at DATE;

CREATE INDEX IF NOT EXISTS clients_subscription_renewal_idx
  ON clients (subscription_renewal_date);

