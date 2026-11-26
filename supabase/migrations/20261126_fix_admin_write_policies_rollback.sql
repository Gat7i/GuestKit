-- Rollback : restauration des anciennes politiques *_admin_write (NOT customer)
-- ⚠️ Réintroduit la faiblesse d'autorisation — à n'utiliser qu'en urgence

DROP POLICY IF EXISTS hotels_admin_write ON hotels;
DROP POLICY IF EXISTS entertainments_admin_write ON entertainments;
DROP POLICY IF EXISTS food_spots_admin_write ON food_spots;
DROP POLICY IF EXISTS suggestions_admin_write ON suggestions;
DROP POLICY IF EXISTS contacts_admin_write ON contacts;

CREATE POLICY hotels_admin_write ON hotels FOR ALL
  USING ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))));

CREATE POLICY entertainments_admin_write ON entertainments FOR ALL
  USING ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))));

CREATE POLICY food_spots_admin_write ON food_spots FOR ALL
  USING ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))));

CREATE POLICY suggestions_admin_write ON suggestions FOR ALL
  USING ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))));

CREATE POLICY contacts_admin_write ON contacts FOR ALL
  USING ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))))
  WITH CHECK ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (SELECT 1 FROM customers WHERE customers.user_id = auth.uid()))));
