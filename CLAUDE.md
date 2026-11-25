# GuestKit — CLAUDE.md

Application SaaS de gestion de l'expérience client hôtelière.
Stack : Next.js 16.1.6 App Router, Supabase, Cloudinary, TailwindCSS 4, Vercel.
Langue de travail : **français**.

---

## Architecture

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

---

## Règle fondamentale : RLS

La plupart des tables ont le RLS activé avec uniquement une politique SELECT publique.
**Toutes les écritures admin (INSERT/UPDATE/DELETE) doivent passer par un server action** utilisant `createAdminClient()` — jamais le client browser.

Fichiers de server actions :
- `src/app/admin/entertainments-actions.ts` — entertainments, food_spots, suggestions
- `src/app/admin/image-actions.ts` — gestion images (bridge tables)
- `src/app/admin/hotel/actions.ts` — logo, createHotel, updateHotel
- `src/app/admin/map-editor/actions.ts` — saveMapPointPosition, addMapPoint, deleteMapPoint
- `src/app/admin/reception/actions.ts` — activateStay, checkInStay, checkOutStay, createStay, setCustomerActive
- `src/app/admin/requests/actions.ts` — updateRequestStatus, updateRequestPriority, sendRequestMessage

---

## Base de données (tables principales)

| Table | Description |
|-------|-------------|
| `hotels` | Hôtels (logo_url, primary_color, phone…) |
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
| `customer_requests` | Demandes clients |
| `request_types` | Types de demandes par catégorie |
| `plans` | Plans/étages de l'hôtel |
| `map_points` | Points d'intérêt sur les plans |
| `poi_types` | Types de POI |
| `locations` | Lieux dans l'hôtel |

**Bridge tables** : `entertainment_images`, `food_spot_images`, `suggestion_images` n'ont PAS de colonne `sort_order` (contrairement à `hotel_images`). Ne pas l'inclure dans les SELECT → retourne tableau vide silencieusement.

---

## Patterns importants

### Upload image
1. Upload direct vers Cloudinary (côté client, pas de clé Supabase nécessaire)
2. `uploadEntityImage(bridgeTable, entityId, cloudinaryUrl, altText, isFirst)` — server action

### Supprimer image
`deleteEntityImage(bridgeTable, entityId, imageId)` — supprime uniquement le lien bridge, pas l'image centrale.

### Supprimer une entité
Supprimer d'abord les enfants (cascade manuelle) :
- entertainment → `daily_schedules`, `night_schedules`, `entertainment_images`
- food_spot → `food_spot_images`
- suggestion → `suggestion_images`

### AdminImageGallery
Composant `src/components/admin/AdminImageGallery.tsx` — utilisé partout dans l'admin pour gérer les galeries. Passe `bridgeTable` en prop.

---

## Design (pages clients)

Style "éditorial" : **trait vertical coloré** (`w-1 h-8 rounded-full`) à la place des icônes carrées pour les en-têtes de section. Appliqué sur : restaurants, activities, suggestions, requests, map.

Page shows (`src/app/shows/page.tsx`) : fond sombre (`bg-gray-900`), ambiance nocturne — ne pas changer le thème.

---

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        ← Secret Vercel, jamais NEXT_PUBLIC_
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

---

## MCP configuré

`.mcp.json` (non commité) — serveur Supabase MCP pour exécuter du SQL directement.
Project ref : `ixbordaiiqjgnqpghyuo`
