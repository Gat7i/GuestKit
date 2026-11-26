-- ============================================================
-- GuestsKit — Script de corrections Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- PostgreSQL 15 compatible
-- ============================================================


-- ============================================================
-- 1. CONTRAINTE UNIQUE sur customers.user_id
--    Nécessaire pour que le upsert OAuth fonctionne sans doublons.
--    On utilise CREATE UNIQUE INDEX (ADD CONSTRAINT IF NOT EXISTS
--    n'existe pas en PG 15).
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_unique
  ON customers(user_id);


-- ============================================================
-- 2. COLONNES MANQUANTES sur customer_requests
--    rating + feedback pour l'évaluation guest après traitement.
-- ============================================================

ALTER TABLE customer_requests
  ADD COLUMN IF NOT EXISTS rating   integer CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS feedback text;


-- ============================================================
-- 3. COLONNE MANQUANTE sur suggestions
--    distance_minutes pour afficher le temps de trajet.
-- ============================================================

ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS distance_minutes integer;


-- ============================================================
-- 4. DONNÉES DE L'HÔTEL
--    Renseignez les vraies coordonnées (adresse, tel, email).
--    Ce UPDATE ne s'exécute que si les champs sont vides.
-- ============================================================

UPDATE hotels SET
  address     = 'Votre adresse complète',
  phone       = '+216 XX XXX XXX',
  email       = 'contact@votre-hotel.com',
  description = 'Description de votre hôtel'
WHERE id = 1
  AND (address IS NULL OR address = '');

-- Vérification :
-- SELECT id, name, address, phone, email FROM hotels WHERE id = 1;


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
--    Protection au niveau base de données.
--    On utilise DROP POLICY IF EXISTS + CREATE POLICY
--    car CREATE POLICY IF NOT EXISTS n'existe qu'en PG 16+.
-- ============================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_spots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts            ENABLE ROW LEVEL SECURITY;

-- ---- customers ----
DROP POLICY IF EXISTS "customers_select_own" ON customers;
CREATE POLICY "customers_select_own"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_insert_own" ON customers;
CREATE POLICY "customers_insert_own"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_update_own" ON customers;
CREATE POLICY "customers_update_own"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- stays ----
DROP POLICY IF EXISTS "stays_select_own" ON stays;
CREATE POLICY "stays_select_own"
  ON stays FOR SELECT
  USING (
    primary_customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "stays_insert_own" ON stays;
CREATE POLICY "stays_insert_own"
  ON stays FOR INSERT
  WITH CHECK (
    primary_customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
  );

-- ---- customer_requests ----
DROP POLICY IF EXISTS "requests_select_own" ON customer_requests;
CREATE POLICY "requests_select_own"
  ON customer_requests FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "requests_insert_own" ON customer_requests;
CREATE POLICY "requests_insert_own"
  ON customer_requests FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "requests_update_own" ON customer_requests;
CREATE POLICY "requests_update_own"
  ON customer_requests FOR UPDATE
  USING (
    customer_id IN (
      SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
    )
  );

-- ---- request_messages ----
-- Le guest ne voit que les messages non-internes de ses demandes
DROP POLICY IF EXISTS "messages_select_own" ON request_messages;
CREATE POLICY "messages_select_own"
  ON request_messages FOR SELECT
  USING (
    is_internal = false
    AND request_id IN (
      SELECT id FROM customer_requests
      WHERE customer_id IN (
        SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "messages_insert_own" ON request_messages;
CREATE POLICY "messages_insert_own"
  ON request_messages FOR INSERT
  WITH CHECK (
    sender_type = 'customer'
    AND request_id IN (
      SELECT id FROM customer_requests
      WHERE customer_id IN (
        SELECT customer_uuid FROM customers WHERE user_id = auth.uid()
      )
    )
  );

-- ---- Tables publiques (lecture seule pour tout le monde) ----
DROP POLICY IF EXISTS "hotels_public_read"        ON hotels;
DROP POLICY IF EXISTS "request_types_public_read" ON request_types;
DROP POLICY IF EXISTS "food_spots_public_read"    ON food_spots;
DROP POLICY IF EXISTS "entertainments_public_read" ON entertainments;
DROP POLICY IF EXISTS "suggestions_public_read"   ON suggestions;
DROP POLICY IF EXISTS "contacts_public_read"      ON contacts;

CREATE POLICY "hotels_public_read"         ON hotels         FOR SELECT USING (true);
CREATE POLICY "request_types_public_read"  ON request_types  FOR SELECT USING (is_active = true);
CREATE POLICY "food_spots_public_read"     ON food_spots     FOR SELECT USING (true);
CREATE POLICY "entertainments_public_read" ON entertainments FOR SELECT USING (true);
CREATE POLICY "suggestions_public_read"    ON suggestions    FOR SELECT USING (true);
CREATE POLICY "contacts_public_read"       ON contacts       FOR SELECT USING (true);


-- ============================================================
-- 6. INDEX DE PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_customers_user_id    ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_hotel_id   ON customers(hotel_id);
CREATE INDEX IF NOT EXISTS idx_stays_customer_id    ON stays(primary_customer_id);
CREATE INDEX IF NOT EXISTS idx_stays_status         ON stays(status);
CREATE INDEX IF NOT EXISTS idx_requests_stay_id     ON customer_requests(stay_id);
CREATE INDEX IF NOT EXISTS idx_requests_customer_id ON customer_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_status      ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_request_id  ON request_messages(request_id);


-- ============================================================
-- FIN DU SCRIPT
-- Vérifications après exécution :
--   SELECT id, name, address, phone, email FROM hotels WHERE id = 1;
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'customer_requests'
--     AND column_name IN ('rating','feedback');
--   SELECT policyname, tablename FROM pg_policies ORDER BY tablename;
-- ============================================================
