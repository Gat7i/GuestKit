-- A3 : Remplacement des politiques *_admin_write (NOT customer → vérification de rôle)
-- Appliqué le 2026-11-26 via MCP Supabase
-- Problème : « NOT EXISTS (customers WHERE user_id = auth.uid()) » n'est pas une
--            vérification de rôle — tout utilisateur sans ligne dans customers pouvait écrire
-- Solution : vérification du rôle dans profiles JOIN roles (staff/hotel_admin/super_admin)
-- Tables : hotels, entertainments, food_spots, suggestions, contacts
-- Rollback : voir 20261126_fix_admin_write_policies_rollback.sql

DROP POLICY IF EXISTS hotels_admin_write ON hotels;
DROP POLICY IF EXISTS entertainments_admin_write ON entertainments;
DROP POLICY IF EXISTS food_spots_admin_write ON food_spots;
DROP POLICY IF EXISTS suggestions_admin_write ON suggestions;
DROP POLICY IF EXISTS contacts_admin_write ON contacts;

CREATE POLICY hotels_admin_write ON hotels FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ));

CREATE POLICY entertainments_admin_write ON entertainments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ));

CREATE POLICY food_spots_admin_write ON food_spots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ));

CREATE POLICY suggestions_admin_write ON suggestions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ));

CREATE POLICY contacts_admin_write ON contacts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid() AND r.name IN ('super_admin','hotel_admin','staff')
  ));
