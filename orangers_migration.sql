-- ============================================================
-- MIGRATION : One Resort Premium → The Orangers Beach Resort
-- Date       : 2026-11-18
-- Auteur     : GuestKit
-- ============================================================
-- Colonnes vérifiées dans le code source :
--   hotels          → name, slug, description, address, phone,
--                      email, website, check_in_time, check_out_time,
--                      primary_color, secondary_color, logo_url
--   entertainments  → title, description  (activités + spectacles)
--   food_spots      → name, description   (restaurants + bars)
--   locations       → name, description
--   suggestions     → title, description
--   contacts        → name, phone_number, department  (PAS de description)
-- ============================================================
-- SÉCURITÉ : tout est dans une transaction.
--   Si une requête échoue → ROLLBACK automatique, rien n'est appliqué.
-- ============================================================

-- ============================================================
-- 0. COLONNES MANQUANTES — à exécuter EN PREMIER, hors transaction
-- ============================================================

ALTER TABLE hotels     ADD COLUMN IF NOT EXISTS logo_url       text;
ALTER TABLE hotels     ADD COLUMN IF NOT EXISTS slug           text;
ALTER TABLE hotels     ADD COLUMN IF NOT EXISTS description    text;
ALTER TABLE hotels     ADD COLUMN IF NOT EXISTS address        text;
ALTER TABLE hotels     ADD COLUMN IF NOT EXISTS website        text;
ALTER TABLE hotels     ADD COLUMN IF NOT EXISTS secondary_color text;

ALTER TABLE food_spots ADD COLUMN IF NOT EXISTS opening_hours  text;
ALTER TABLE food_spots ADD COLUMN IF NOT EXISTS location       text;
ALTER TABLE food_spots ADD COLUMN IF NOT EXISTS menu_pdf_url   text;

ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS is_hotel_internal boolean DEFAULT false;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS location_type     text    DEFAULT 'internal';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS address            text;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS phone             text;


BEGIN;

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
-- 2. ACTIVITÉS & SPECTACLES (entertainments)
--    Colonnes : title, description
-- ============================================================

UPDATE entertainments SET
  title       = REPLACE(title,       'One Resort', 'The Orangers'),
  description = REPLACE(description, 'One Resort', 'The Orangers')
WHERE hotel_id = 1
  AND (
       title       ILIKE '%One Resort%'
    OR description ILIKE '%One Resort%'
  );


-- ============================================================
-- 3. EMPLACEMENTS (locations)
--    Colonnes : name, description
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
-- 4. RESTAURANTS & BARS (food_spots)
--    Remplacement complet par les établissements des Orangers
-- ============================================================

-- Ajout des colonnes si elles n'existent pas encore en DB
ALTER TABLE food_spots ADD COLUMN IF NOT EXISTS opening_hours text;
ALTER TABLE food_spots ADD COLUMN IF NOT EXISTS location      text;
ALTER TABLE food_spots ADD COLUMN IF NOT EXISTS menu_pdf_url  text;

DELETE FROM food_spots WHERE hotel_id = 1;

INSERT INTO food_spots (hotel_id, spot_type, name, description, opening_hours, location, menu_pdf_url) VALUES

  -- BARS
  (1, 'bar', 'Bar Jasmin',
   'Le Bar Jasmin propose une sélection de boissons alcoolisées et non alcoolisées locales (Vins, Bières, Liqueurs, Jus, Sodas, Cafés et Cocktails) en tout compris 24h/24. Capacité : 100 pax.',
   '00:00 - 00:00',
   'Hôtel principal', NULL),

  (1, 'bar', 'Bar Plage',
   'Le Bar Plage propose une sélection de boissons alcoolisées et non alcoolisées locales (Vins, Bières, Liqueurs, Jus, Sodas, Cafés et Cocktails) en tout compris. Capacité : 100 pax.',
   '08:00 - 22:00',
   'Plage', NULL),

  (1, 'bar', 'Bar Semiramis',
   'Le Bar Semiramis propose une sélection de boissons alcoolisées et non alcoolisées locales (Vins, Bières, Liqueurs, Jus, Sodas, Cafés et Cocktails) en tout compris. Capacité : 100 pax.',
   '08:00 - 00:00',
   'Jardin', NULL),

  -- RESTAURANTS
  (1, 'restaurant', 'Restaurant Principal',
   'Repas sous forme de buffet gastronomique avec boissons servies à table. Petit déjeuner tardif et dîner tardif jusqu''à minuit.',
   'Petit-déjeuner : 07:00 - 10:00 | Déjeuner : 12:00 - 14:00 | Dîner : 19:00 - 00:00',
   'Hôtel principal', NULL),

  (1, 'restaurant', 'Restaurant Plage',
   'Buffet international pour le déjeuner en bord de mer. Le soir, converti en 3 restaurants à la carte : cuisine Tunisienne, Italienne et Asiatique.',
   'Déjeuner : 12:00 - 18:00 | Dîner à la carte : 20:00 - 22:00',
   'Plage', NULL);


-- ============================================================
-- 5. SUGGESTIONS / SERVICES INTERNES (suggestions)
--    Remplacement des suggestions internes par les services
--    des Orangers. Les suggestions externes sont conservées.
-- ============================================================

DELETE FROM suggestions WHERE hotel_id = 1 AND is_hotel_internal = true;

-- Note : category_id = NULL — à assigner via l'admin si besoin

INSERT INTO suggestions (hotel_id, title, description, category_id, location_type, is_hotel_internal, address, phone) VALUES

  (1, 'Centre de Bien-être & Spa',
   'Hammam de style tunisien typique avec espace détente. Profitez d''un moment de relaxation au cœur du resort.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Salle de Fitness',
   'Salle de sport entièrement équipée pour garder la forme pendant votre séjour.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Sauna',
   'Sauna disponible pour votre détente et bien-être.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Massage Classique',
   'Massage classique de 15 minutes sur réservation. Horaires : 09:00-13:00 et 14:00-17:30.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Pédicure Poisson',
   'Pédicure de poisson sur réservation. Horaires : 09:00-13:00 et 14:00-17:30.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Mini-Club Enfants',
   'Mini-club répondant aux normes internationales avec monitrices professionnelles proposant des jeux divertissants. Service baby-sitting disponible sur demande.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Animation & Spectacles',
   'Programme d''animation, spectacles et soirées proposé chaque jour par l''équipe d''animation de l''hôtel.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Piscines',
   'Piscine extérieure non chauffée avec bassin séparé pour enfants. Piscine intérieure couverte et chauffée.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Sports & Loisirs',
   'Large programme d''activités sportives et de loisirs : tir à l''arc, water-polo, jet-skis, quad, cours d''initiation et bien plus encore.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Café Maure',
   'Café Maure avec narguilé offert. Profitez d''une pause authentique dans un cadre typiquement tunisien.',
   NULL, 'internal', true, NULL, NULL),

  (1, 'Snack Piscine & Plage',
   'Snack bar piscine et snack bar plage disponibles pendant la journée pour se restaurer sans quitter les espaces de loisirs.',
   NULL, 'internal', true, NULL, NULL);


-- ============================================================
-- 6. CONTACTS UTILES (contacts)
--    Remplacement complet par les contacts des Orangers
-- ============================================================

-- Supprimer les anciens contacts
DELETE FROM contacts WHERE hotel_id = 1;

-- Insérer les nouveaux contacts
-- Note : adresse et email sont affichés depuis la table hotels, pas ici
INSERT INTO contacts (hotel_id, name, phone_number, department) VALUES
  (1, 'Réception principale', '+216 72 280 144', 'Réception'),
  (1, 'Standard',             '+216 72 280 987', 'Réception');


-- ============================================================
-- 7. IMAGES CAROUSEL (hotel_images)
--    ⚠️ OPTIONNEL — décommenter pour vider le carousel
--    et uploader les photos des Orangers via l'admin
-- ============================================================

-- DELETE FROM hotel_images WHERE hotel_id = 1;


COMMIT;


-- ============================================================
-- VÉRIFICATIONS (à exécuter séparément après le COMMIT)
-- ============================================================

-- Vérifier l'hôtel mis à jour :
SELECT id, name, slug, primary_color, secondary_color, email, phone
FROM hotels
WHERE id = 1;

-- Vérifier les restaurants et bars insérés :
SELECT spot_type, name, opening_hours FROM food_spots WHERE hotel_id = 1 ORDER BY spot_type, name;

-- Vérifier les suggestions internes insérées :
SELECT title, location_type FROM suggestions WHERE hotel_id = 1 AND is_hotel_internal = true ORDER BY title;

-- Vérifier les contacts insérés :
SELECT name, phone_number, department FROM contacts WHERE hotel_id = 1 ORDER BY department, name;

-- Vérifier s'il reste des références à "One Resort" :
SELECT 'entertainments' AS table_name, id, title AS label
  FROM entertainments
  WHERE hotel_id = 1
    AND (title ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'locations', id, name
  FROM locations
  WHERE hotel_id = 1
    AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'food_spots', id, name
  FROM food_spots
  WHERE hotel_id = 1
    AND (name ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'suggestions', id, title
  FROM suggestions
  WHERE hotel_id = 1
    AND (title ILIKE '%One Resort%' OR description ILIKE '%One Resort%')
UNION ALL
SELECT 'contacts', id, name
  FROM contacts
  WHERE hotel_id = 1
    AND (name ILIKE '%One Resort%' OR department ILIKE '%One Resort%');

-- Résultat attendu : 0 lignes
