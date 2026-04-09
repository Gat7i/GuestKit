// src/app/restaurants/[id]/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RestaurantGallery from '@/components/restaurants/RestaurantGallery'
import { Icon } from '@/components/ui/Icons'

export default async function RestaurantDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  // 1. Récupérer les détails du restaurant
  const { data: restaurant, error } = await supabase
    .from('food_spots')
    .select(`
      *,
      location:locations(
        id,
        name,
        description
      ),
      hours:opening_hours(
        day_of_week,
        open_time,
        close_time,
        is_closed
      ),
      images:food_spot_images(
        is_principal,
        image:image_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .eq('id', id)
    .eq('spot_type', 'restaurant')
    .single()

  // 2. Si le restaurant n'existe pas → page 404
  if (error || !restaurant) {
    notFound()
  }

  // 3. Organiser les horaires par jour
  const daysOrder = [1, 2, 3, 4, 5, 6, 0] // Lundi → Dimanche
  const sortedHours = restaurant.hours?.sort((a: any, b: any) => 
    daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
  )

  // 4. Jours en français
  const daysFrench = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Fil d'Ariane */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Accueil
            </Link>
            <span className="text-gray-400">›</span>
            <Link href="/restaurants" className="text-gray-500 hover:text-gray-700">
              Restaurants
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">
              {restaurant.name}
            </span>
          </div>
        </div>
      </div>

      {/* En-tête avec image */}
      <div className="relative h-[40vh] min-h-[400px] bg-gray-900">
        {/* Image de fond */}
        {restaurant.images && restaurant.images.length > 0 ? (
          <>
            <img
              src={restaurant.images.find((img: any) => img.is_principal)?.image.url || 
                   restaurant.images[0].image.url}
              alt={restaurant.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-700 to-orange-800">
            <Icon.Utensils className="w-24 h-24 text-white/20" />
          </div>
        )}

        {/* Informations principales */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 text-white/80 text-sm mb-2">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
                <Icon.Utensils className="w-3 h-3" />
                {restaurant.spot_type === 'restaurant' ? 'Restaurant' : 'Bar'}
              </span>
              {restaurant.location && (
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
                  <Icon.Pin className="w-3 h-3" />
                  {restaurant.location.name}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {restaurant.name}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl">
              {restaurant.description || 'Découvrez notre cuisine raffinée dans un cadre exceptionnel.'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale : Galerie et infos */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Galerie photos */}
            {restaurant.images && restaurant.images.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Galerie photos
                </h2>
                <RestaurantGallery images={restaurant.images} />
              </section>
            )}

            {/* Description détaillée */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                À propos
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">
                  {restaurant.description || 'Aucune description disponible pour le moment.'}
                </p>
                {restaurant.location?.description && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Emplacement</h3>
                    <p className="text-gray-600">{restaurant.location.description}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Menu (si disponible) */}
            {restaurant.menu_pdf_url && (
              <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Icon.ClipboardList className="w-6 h-6 text-amber-600" />
                      Notre carte
                    </h2>
                    <p className="text-gray-600">
                      Découvrez notre sélection de plats et notre carte des vins
                    </p>
                  </div>
                  <a
                    href={restaurant.menu_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-amber-600 text-amber-700 hover:text-white px-6 py-3 rounded-lg font-medium transition shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <Icon.ExternalLink className="w-4 h-4" />
                    Voir le menu PDF
                  </a>
                </div>
              </section>
            )}
          </div>

          {/* Colonne latérale : Informations pratiques */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Carte d'informations */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Icon.Bell className="w-5 h-5 text-gray-400" />
                Informations
              </h2>
              
              <div className="space-y-4">
                {/* Type */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Icon.Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-800">
                      {restaurant.spot_type === 'restaurant' ? 'Restaurant gastronomique' : 'Bar & Lounge'}
                    </p>
                  </div>
                </div>

                {/* Emplacement */}
                {restaurant.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Icon.Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Emplacement</p>
                      <p className="font-medium text-gray-800">{restaurant.location.name}</p>
                    </div>
                  </div>
                )}

                {/* Capacité (exemple) */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Icon.User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capacité</p>
                    <p className="font-medium text-gray-800">80 couverts • 20 places au bar</p>
                  </div>
                </div>

                {/* Dress code */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Icon.Star className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Code vestimentaire</p>
                    <p className="font-medium text-gray-800">Tenue correcte exigée</p>
                  </div>
                </div>
              </div>

              {/* Horaires détaillés */}
              {sortedHours && sortedHours.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Icon.Clock className="w-4 h-4 text-gray-400" />
                    Horaires d'ouverture
                  </h3>
                  <div className="space-y-2">
                    {sortedHours.map((hour: any) => (
                      <div key={hour.day_of_week} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {daysFrench[hour.day_of_week]}
                        </span>
                        {hour.is_closed ? (
                          <span className="text-red-600 font-medium">Fermé</span>
                        ) : (
                          <span className="font-medium text-gray-900">
                            {hour.open_time.slice(0,5)} - {hour.close_time.slice(0,5)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <button className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  <Icon.Clock className="w-4 h-4" />
                  Réserver une table
                </button>
                <button className="w-full bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <Icon.Phone className="w-4 h-4" />
                  Contacter le restaurant
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section "À découvrir aussi" */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            À découvrir aussi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/restaurants"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 transition">
                <Icon.Utensils className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Bar "Le Ciel"</h3>
              <p className="text-sm text-gray-600">Cocktails signatures et vue panoramique</p>
            </Link>
            <Link
              href="/suggestions"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
                <Icon.Compass className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Dégustation de vins</h3>
              <p className="text-sm text-gray-600">Atelier découverte des crus locaux</p>
            </Link>
            <Link
              href="/activities"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition">
                <Icon.Activity className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Cours de cuisine</h3>
              <p className="text-sm text-gray-600">Apprenez les secrets de notre chef</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}