-- ============================================================
-- MIGRATION : One Resort Premium → The Orangers Beach Resort
-- Date       : 2026-11-18
-- Auteur     : GuestKit
-- ============================================================
-- INSTRUCTIONS :
--   1. Exécuter ce script dans Supabase > SQL Editor
--   2. Vérifier les résultats avec les SELECT de contrôle
--   3. Les activités, emplacements et spectacles sans mention
--      de "One Resort" ne sont PAS modifiés
-- ============================================================


-- ============================================================
-- 1. MISE À JOUR PRINCIPALE DE L'HÔTEL
-- ============================================================

UPDATE hotels SET
  name             = 'The Orangers Beach Resort & Bungalows',
  slug             = 'orangers',
  description      = 'Resort 4 étoiles situé en bord de mer à Hammamet, Tunisie. Niché dans un parc de 12 hectares planté d''orangers et de jasmins, avec une magnifique plage de sable fin sécurisée pour les familles.',
  address          = 'Rue de Never, Hammamet 8050, Tunisie',
  phone            = '+216 72 280 144',
  email            = 'contact@orangershotel.com',
  website          = 'https://orangershotel.com',
  check_in_time    = '14:00:00',
  check_out_time   = '12:00:00',
  primary_color    = '#746865',
  secondary_color  = '#C4823C'
WHERE id = 1;


-- ============================================================
-- 2. ACTIVITÉS — uniquement celles qui mentionnent "One Resort"
-- ============================================================

UPDATE activities SET
  name        = REPLACE(name,        'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
    name        ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );


-- ============================================================
-- 3. SPECTACLES / ENTERTAINMENTS — idem
-- ============================================================

UPDATE entertainments SET
  name        = REPLACE(name,        'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
    name        ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );


-- ============================================================
-- 4. EMPLACEMENTS (LOCATIONS) — idem
-- ============================================================

UPDATE locations SET
  name        = REPLACE(name,        'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
    name        ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );


-- ============================================================
-- 5. RESTAURANTS — idem
-- ============================================================

UPDATE restaurants SET
  name        = REPLACE(name,        'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
    name        ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );


-- ============================================================
-- 6. SUGGESTIONS / DÉCOUVERTES — idem
-- ============================================================

UPDATE suggestions SET
  name        = REPLACE(name,        'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
    name        ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );


-- ============================================================
-- 7. CONTACTS UTILES — idem + mise à jour du numéro de tel
-- ============================================================

UPDATE contacts SET
  name        = REPLACE(name,        'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
    name        ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );

-- Mettre à jour les numéros de téléphone génériques si nécessaire :
-- UPDATE contacts SET phone = '+216 72 280 144'
-- WHERE hotel_id = 1 AND name ILIKE '%réception%';


-- ============================================================
-- 8. IMAGES DE L'HÔTEL — supprimer les anciennes images carousel
--    (les nouvelles seront uploadées via l'admin)
-- ============================================================

-- ⚠️  OPTIONNEL — décommenter uniquement si tu veux repartir
--     d'un carousel vide pour ajouter les photos des Orangers

-- DELETE FROM hotel_images WHERE hotel_id = 1;


-- ============================================================
-- VÉRIFICATIONS — exécuter après le script pour contrôler
-- ============================================================

-- Vérifier l'hôtel mis à jour :
SELECT id, name, slug, primary_color, secondary_color, email, phone
FROM hotels
WHERE id = 1;

-- Vérifier s'il reste des références à "One Resort" :
SELECT 'activities' AS table_name, id, name FROM activities
  WHERE hotel_id = 1 AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'entertainments', id, name FROM entertainments
  WHERE hotel_id = 1 AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'locations', id, name FROM locations
  WHERE hotel_id = 1 AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'restaurants', id, name FROM restaurants
  WHERE hotel_id = 1 AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'suggestions', id, name FROM suggestions
  WHERE hotel_id = 1 AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'contacts', id, name FROM contacts
  WHERE hotel_id = 1 AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%');
-- Résultat attendu : 0 lignes
