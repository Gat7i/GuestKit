-- Imposer qu'une demande client (customer_requests) ne peut être créée que
-- si le stay_id référence un séjour ACTIF (status = 'active') du client connecté.
-- Appliqué le 2026-11-26 via MCP Supabase.
-- Rollback : voir 20261126_requests_require_active_stay_rollback.sql

DROP POLICY IF EXISTS requests_insert_own ON customer_requests;
CREATE POLICY requests_insert_own ON customer_requests FOR INSERT
  WITH CHECK (
    -- le customer_id appartient bien au client connecté
    customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
    -- le stay_id correspond à un séjour ACTIF de ce même client
    -- (upcoming et completed sont refusés côté base, pas seulement côté interface)
    AND stay_id IN (
      SELECT s.id FROM stays s
      JOIN customers c ON c.customer_uuid = s.primary_customer_id
      WHERE c.user_id = auth.uid()
      AND s.status = 'active'
    )
  );
