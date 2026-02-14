import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'

export default async function RestaurantsPage() {
  const hotel = await getCurrentHotelServer()
  const supabase = await createClient()
  
  // 1. Récupération des restaurants de l'Hôtel
  const { data: restaurants, error } = await supabase
    .from('food_spots')
    .select(`
      *,
      location:locations(name),
      hours:opening_hours(day_of_week, open_time, close_time),
      images:food_spot_images(
        is_principal,
        image:image_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .eq('hotel_id', hotel?.id)
    .eq('spot_type', 'restaurant')
    .order('name')

  // 2. Gestion des erreurs
  if (error) {
    console.error('Erreur Supabase:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les restaurants</p>
        </div>
      </div>
    )
  }

  // 3. Fonction pour obtenir l'image principale d'un restaurant
  const getMainImage = (restaurant: any) => {
    if (!restaurant.images || restaurant.images.length === 0) {
      return null
    }
    const mainImage = restaurant.images.find((img: any) => img.is_principal)
    return mainImage || restaurant.images[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
              🍽️
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Nos Restaurants
              </h1>
              <p className="text-xl text-amber-100">
                Découvrez nos restaurants gastronomiques et bars d'exception
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des restaurants */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {(!restaurants || restaurants.length === 0) ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-7xl mb-6">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Aucun restaurant disponible
            </h2>
            <p className="text-gray-600 text-lg">
              Nos restaurants seront bientôt ouverts. Revenez nous voir !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => {
              const mainImage = getMainImage(restaurant)
              
              return (
                <div 
                  key={restaurant.id} 
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Image du restaurant */}
                  <div className="relative h-56 bg-gray-100 overflow-hidden">
                    {mainImage ? (
                      <>
                        <img
                          src={mainImage.image.url}
                          alt={mainImage.image.alt_text || restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                        <span className="text-6xl text-amber-300">🍽️</span>
                      </div>
                    )}
                    
                    {/* Badge type */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                        {restaurant.spot_type === 'restaurant' ? '🍽️ Restaurant' : '🍸 Bar'}
                      </span>
                    </div>

                    {/* Badge image principale */}
                    {mainImage?.is_principal && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                          <span>⭐</span> Principal
                        </span>
                      </div>
                    )}

                    {/* Galerie d'images (miniatures) */}
                    {restaurant.images && restaurant.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 flex gap-1">
                        {restaurant.images.slice(0, 3).map((img: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white"
                          >
                            <img
                              src={img.image.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {restaurant.images.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-800 text-white text-xs flex items-center justify-center">
                            +{restaurant.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition">
                        {restaurant.name}
                      </h2>
                      {restaurant.images && restaurant.images.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {restaurant.images.length} photo{restaurant.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Emplacement */}
                    {restaurant.location && (
                      <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                        <span className="text-gray-400">📍</span>
                        <span>{restaurant.location.name}</span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {restaurant.description || 'Description à venir...'}
                    </p>

                    {/* Horaires */}
                    {restaurant.hours && restaurant.hours.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <span>🕐</span> Horaires d'ouverture
                        </p>
                        <div className="space-y-1">
                          {restaurant.hours
                            .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                            .slice(0, 3)
                            .map((hour: any) => (
                              <div key={hour.day_of_week} className="flex justify-between text-xs">
                                <span className="text-gray-600">
                                  {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][hour.day_of_week]}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {hour.open_time.slice(0,5)} - {hour.close_time.slice(0,5)}
                                </span>
                              </div>
                            ))}
                          {restaurant.hours.length > 3 && (
                            <p className="text-xs text-gray-500 text-center mt-1">
                              +{restaurant.hours.length - 3} autres jours
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {restaurant.menu_pdf_url && (
                        <a
                          href={restaurant.menu_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                          <span>📄</span>
                          Menu
                        </a>
                      )}
                      {/* Dans la carte du restaurant, remplacer le bouton Détails par ceci : */}
                        <Link
                        href={`/restaurants/${restaurant.id}`}
                        className="flex-1 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                        <span>🔍</span>
                        Voir détails
                        </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Note d'information */}
        {restaurants && restaurants.length > 0 && (
          <div className="mt-12 bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-medium mb-1">Réservation recommandée</h3>
                <p className="text-amber-700">
                  Pour les dîners et les grandes tables, nous vous conseillons de réserver.
                  Contactez la réception au poste 0 ou le restaurant directement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}