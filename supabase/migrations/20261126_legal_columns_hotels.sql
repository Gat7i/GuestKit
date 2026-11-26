-- A1 : Colonnes légales facultatives sur hotels
-- Appliqué le 2026-11-26 via MCP Supabase
-- Rollback : voir 20261126_legal_columns_hotels_rollback.sql

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_form TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS legal_representative TEXT,
  ADD COLUMN IF NOT EXISTS data_protection_officer TEXT,
  ADD COLUMN IF NOT EXISTS data_protection_email TEXT,
  ADD COLUMN IF NOT EXISTS legal_jurisdiction TEXT;
