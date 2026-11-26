-- Rollback : restauration des anciennes politiques profiles (état avant correction)
-- ⚠️ Réintroduit la faille d'escalade de privilèges — à n'utiliser qu'en urgence

DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;

CREATE POLICY others_all ON profiles FOR ALL USING (true);
CREATE POLICY profiles_all ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY users_read_own ON profiles FOR SELECT USING (auth.uid() = id);
