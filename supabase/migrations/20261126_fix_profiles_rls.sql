-- A2 : Correction des politiques RLS sur profiles
-- Appliqué le 2026-11-26 via MCP Supabase
-- Problème : others_all (qual=true) et profiles_all (qual=true) permettaient à tout utilisateur
--            authentifié de lire/écrire n'importe quel profil, y compris changer role_id
--            → escalade de privilèges possible (un client pouvait se donner le rôle staff)
-- Rollback : voir 20261126_fix_profiles_rls_rollback.sql

DROP POLICY IF EXISTS others_all ON profiles;
DROP POLICY IF EXISTS profiles_all ON profiles;
DROP POLICY IF EXISTS users_read_own ON profiles;

-- Lecture : uniquement sa propre ligne
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Mise à jour : sa propre ligne, sans pouvoir changer role_id
-- (le changement de rôle passe par service role / server action admin uniquement)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role_id = (SELECT role_id FROM profiles WHERE id = auth.uid())
  );
