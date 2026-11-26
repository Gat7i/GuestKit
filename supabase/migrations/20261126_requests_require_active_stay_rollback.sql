-- Rollback : restauration de la politique requests_insert_own sans vérification du séjour actif
-- ⚠️ Permet à nouveau d'insérer des demandes avec un séjour terminé/à venir côté base

DROP POLICY IF EXISTS requests_insert_own ON customer_requests;
CREATE POLICY requests_insert_own ON customer_requests FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
  );
