-- Expand clients table with required fields for each client.
-- Safe to run multiple times.

ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS client_number TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS median_name TEXT,
  ADD COLUMN IF NOT EXISTS median_mobile TEXT,
  ADD COLUMN IF NOT EXISTS agreed_payment NUMERIC,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_number TEXT,
  ADD COLUMN IF NOT EXISTS commercial_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS activity_field TEXT,
  ADD COLUMN IF NOT EXISTS commercial_reg_office TEXT,
  ADD COLUMN IF NOT EXISTS commercial_reg_renewal_date DATE,
  ADD COLUMN IF NOT EXISTS tax_office TEXT,
  ADD COLUMN IF NOT EXISTS vat_tax_office TEXT,
  ADD COLUMN IF NOT EXISTS ebill TEXT,
  ADD COLUMN IF NOT EXISTS capital_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS work_start_date DATE,
  ADD COLUMN IF NOT EXISTS work_end_date DATE,
  ADD COLUMN IF NOT EXISTS last_tax_examine_date DATE,
  ADD COLUMN IF NOT EXISTS last_vat_examine_date DATE,
  ADD COLUMN IF NOT EXISTS vat_start_date DATE,
  ADD COLUMN IF NOT EXISTS platform_subscription TEXT,
  ADD COLUMN IF NOT EXISTS platform_renewal_date DATE,
  ADD COLUMN IF NOT EXISTS gmail_email TEXT,
  ADD COLUMN IF NOT EXISTS gmail_password TEXT,
  ADD COLUMN IF NOT EXISTS tax_vat_email TEXT,
  ADD COLUMN IF NOT EXISTS tax_vat_password TEXT,
  ADD COLUMN IF NOT EXISTS ebill_email TEXT,
  ADD COLUMN IF NOT EXISTS ebill_password TEXT,
  ADD COLUMN IF NOT EXISTS portal_email TEXT,
  ADD COLUMN IF NOT EXISTS portal_password TEXT;

-- Since tax_id is your client "RegisterNumber", index it for fast login lookups.
CREATE INDEX IF NOT EXISTS clients_tax_id_idx ON clients(tax_id);

