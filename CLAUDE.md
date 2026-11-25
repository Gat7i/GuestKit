# GuestKit — CLAUDE.md

Application SaaS de gestion de l'expérience client hôtelière.
Stack : Next.js 16.1.6 App Router, Supabase, Cloudinary, TailwindCSS 4, Vercel.
Langue de travail : **français**.

---

## Architecture — Single-tenant

**Chaque hôtel client a son propre déploiement :**
```
GuestKit (1 codebase)
  ├── Vercel A + Supabase A  →  Hôtel Les Orangers  (NEXT_PUBLIC_HOTEL_ID=1)
  ├── Vercel B + Supabase B  →  Hôtel Bellevue       (NEXT_PUBLIC_HOTEL_ID=1)
  └── Vercel C + Supabase C  →  Hôtel du Lac         (NEXT_PUBLIC_HOTEL_ID=1)
```

- La table `hotels` de chaque déploiement ne contient **qu'une seule ligne**.
- L'hôtel actif est déterminé par `NEXT_PUBLIC_HOTEL_ID` dans les variables Vercel.
- **HotelSelector supprimé** de toutes les pages admin — inutile en single-tenant.
- Ne jamais utiliser `.from('hotels').limit(1).single()` → utiliser `getCurrentHotelClient()` ou `getCurrentHotelServer()`.

```
src/app/                  Pages clients (guests)
src/app/admin/            Pages d'administration hôtel
src/components/           Composants réutilisables
src/lib/supabase/         Clients Supabase (browser / server / admin)
```

**Clients Supabase :**
- `src/lib/supabase/client-browser.ts` — anon key, côté client, soumis au RLS
- `src/lib/supabase/server-client.ts` — anon key, côté serveur (SSR)
- `src/lib/supabase/admin-client.ts` — **service role key**, bypass RLS complet

**Helpers hôtel :**
- `src/lib/hotel-client.ts` — `getCurrentHotelClient()` — utilise `NEXT_PUBLIC_HOTEL_ID`, côté client
- `src/lib/hotel-server.ts` — `getCurrentHotelServer()` — utilise `NEXT_PUBLIC_HOTEL_ID`, côté serveur

---

## Règle fondamentale : RLS

**Tables AVEC RLS** (SELECT public uniquement — toute écriture admin doit passer par server action) :

| Table | Politique write |
|-------|----------------|
| `hotels` | Aucune (service role only) |
| `customers` | Owner uniquement (`auth.uid() = user_id`) |
| `stays` | Owner uniquement |
| `customer_requests` | Owner uniquement |
| `request_messages` | Owner uniquement |
| `request_types` | Aucune (service role only) |
| `food_spots` | Aucune (service role only) |
| `entertainments` | Aucune (service role only) |
| `suggestions` | Aucune (service role only) |
| `contacts` | Aucune (service role only) |

**Tables SANS RLS** (browser client OK pour les écritures admin) :
`locations`, `poi_types`, `hotel_images`, `companions`, `images`,
`entertainment_images`, `food_spot_images`, `suggestion_images`,
`plans`, `map_points`, `rooms`, `categories`

**Fichiers de server actions :**
- `src/app/admin/entertainments-actions.ts` — entertainments, food_spots, suggestions (CRUD complet)
- `src/app/admin/image-actions.ts` — `uploadEntityImage`, `deleteEntityImage`, `setEntityImageAsPrincipal`
- `src/app/admin/hotel/actions.ts` — `createHotel`, `updateHotel`, `updateHotelLogo`
- `src/app/admin/map-editor/actions.ts` — `saveMapPointPosition`, `addMapPoint`, `deleteMapPoint`
- `src/app/admin/reception/actions.ts` — `activateStay`, `checkInStay`, `checkOutStay`, `createStay`, `setCustomerActive`
- `src/app/admin/requests/actions.ts` — `updateRequestStatus`, `updateRequestPriority`, `sendRequestMessage`

---

## Base de données (tables principales)

| Table | Description |
|-------|-------------|
| `hotels` | Hôtels (logo_url, primary_color, phone, email, address…) |
| `food_spots` | Restaurants/bars/cafés (`spot_type`: restaurant, bar, café) |
| `entertainments` | Activités (`is_daily_activity`) et spectacles (`is_night_show`) |
| `suggestions` | Découvertes internes/externes (`location_type`: internal/external) |
| `categories` | Catégories pour activities et suggestions |
| `daily_schedules` | Horaires activités (day_of_week 0-6) |
| `night_schedules` | Dates spectacles |
| `images` | Table centrale des images (url Cloudinary) |
| `entertainment_images` | Bridge entertainments ↔ images |
| `food_spot_images` | Bridge food_spots ↔ images |
| `suggestion_images` | Bridge suggestions ↔ images |
| `hotel_images` | Bridge hotels ↔ images (carousel, a `sort_order`) |
| `customers` | Clients hôtel |
| `stays` | Séjours (status: upcoming / active / completed) |
| `companions` | Accompagnants d'un séjour |
| `customer_requests` | Demandes clients |
| `request_types` | Types de demandes par catégorie |
| `request_messages` | Messages échangés sur une demande |
| `plans` | Plans/étages de l'hôtel |
| `map_points` | Points d'intérêt sur les plans |
| `poi_types` | Types de POI |
| `locations` | Lieux dans l'hôtel |
| `rooms` | Chambres |
| `contacts` | Contacts utiles de l'hôtel |

**Bridge tables** : `entertainment_images`, `food_spot_images`, `suggestion_images` n'ont PAS de colonne `sort_order` (contrairement à `hotel_images`). Ne pas l'inclure dans les SELECT → retourne tableau vide silencieusement.

---

## Patterns importants

### Upload image
1. Upload direct vers Cloudinary (côté client, pas de clé Supabase nécessaire)
2. `uploadEntityImage(bridgeTable, entityId, cloudinaryUrl, altText, isFirst)` — server action dans `image-actions.ts`

### Supprimer image
`deleteEntityImage(bridgeTable, entityId, imageId)` — supprime uniquement le lien bridge, pas l'image centrale.

### Supprimer une entité
Supprimer d'abord les enfants (cascade manuelle) :
- entertainment → `daily_schedules`, `night_schedules`, `entertainment_images`
- food_spot → `food_spot_images`
- suggestion → `suggestion_images`

### AdminImageGallery
Composant `src/components/admin/AdminImageGallery.tsx` — galeries images dans l'admin. Passe `bridgeTable` en prop. **C'est lui qu'il faut utiliser**, pas `ImageUploader.tsx` (legacy, non maintenu).

### Images dans les pages clients
Utiliser `next/image` (`import Image from 'next/image'`) pour toutes les images Cloudinary.
- Containers avec `fill` : le parent doit avoir `relative overflow-hidden`.
- **Exception** : avatars OAuth (Google, Facebook, etc.) → garder `<img>` avec `referrerPolicy="no-referrer"` et `onError` pour le fallback, car leurs domaines ne sont pas dans `remotePatterns`.
- `next.config.ts` autorise uniquement `res.cloudinary.com`.

---

## Design (pages clients)

Style "éditorial" : **trait vertical coloré** (`w-1 h-8 rounded-full`) à la place des icônes carrées pour les en-têtes de section. Appliqué sur : restaurants, activities, suggestions, requests, map.

Page shows (`src/app/shows/page.tsx`) : fond sombre (`bg-gray-900`), ambiance nocturne — ne pas changer le thème.

---

## Pages légales et SEO

- `src/app/politique-confidentialite/page.tsx` — politique RGPD (email/adresse depuis `hotels` DB)
- `src/app/cgu/page.tsx` — conditions générales d'utilisation
- `src/app/not-found.tsx` — page 404 globale
- `src/app/sitemap.ts` — génère `/sitemap.xml` (7 routes publiques)
- `src/app/robots.ts` — génère `/robots.txt` (bloque `/admin/`, `/api/`)
- `src/components/layout/CookieBanner.tsx` — bandeau consentement cookies (localStorage `cookie_consent`)
- `src/components/layout/Footer.tsx` — footer avec liens légaux (caché sur `/admin`)

OG image dans `layout.tsx` : actuellement `icon-512.png` (provisoire — remplacer par une photo 1200×630 quand disponible).

---

## Analytics

Vercel Analytics installé (`@vercel/analytics/next`). Le composant `<Analytics />` est dans `src/app/layout.tsx`. Dashboard disponible dans le projet Vercel → onglet Analytics.

---

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          ← Secret Vercel, jamais NEXT_PUBLIC_
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
NEXT_PUBLIC_HOTEL_ID               ← ID de l'hôtel dans la table hotels (ex: 1)
NEXT_PUBLIC_SITE_URL               ← URL du site pour le sitemap (optionnel, Vercel l'auto-détecte)
```

---

## MCP configuré

`.mcp.json` (non commité, dans `.gitignore`) — serveur Supabase MCP pour exécuter du SQL directement.
Project ref : `ixbordaiiqjgnqpghyuo`
