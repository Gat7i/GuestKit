-- Rollback : suppression des colonnes légales sur hotels
-- À exécuter uniquement pour annuler 20261126_legal_columns_hotels.sql
-- ⚠️ Perd les données saisies dans ces colonnes

ALTER TABLE hotels
  DROP COLUMN IF EXISTS legal_name,
  DROP COLUMN IF EXISTS legal_form,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS registration_number,
  DROP COLUMN IF EXISTS legal_representative,
  DROP COLUMN IF EXISTS data_protection_officer,
  DROP COLUMN IF EXISTS data_protection_email,
  DROP COLUMN IF EXISTS legal_jurisdiction;
