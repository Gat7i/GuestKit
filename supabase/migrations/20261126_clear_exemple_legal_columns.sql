-- Efface les valeurs provisoires "(exemple)" des colonnes légales (hotel id=1).
-- country conservé (= 'Tunisie', valeur réelle).
-- Rollback : remettre les valeurs manuellement dans l'admin /admin/hotel onglet Mentions légales.
UPDATE hotels
SET
  legal_name              = NULL,
  legal_form              = NULL,
  registration_number     = NULL,
  legal_representative    = NULL,
  data_protection_officer = NULL,
  data_protection_email   = NULL,
  legal_jurisdiction      = NULL
WHERE id = 1
  AND (
    legal_name              LIKE '(exemple)%'
    OR legal_form           LIKE '(exemple)%'
    OR registration_number  LIKE '(exemple)%'
    OR legal_representative LIKE '(exemple)%'
    OR data_protection_officer LIKE '(exemple)%'
    OR data_protection_email LIKE '(exemple)%'
    OR legal_jurisdiction   LIKE '(exemple)%'
  );
