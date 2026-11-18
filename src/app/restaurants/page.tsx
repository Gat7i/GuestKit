import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

// Config extensible par type — ajouter café, snack, etc. ici
const SPOT_TYPE_CONFIG: Record<string, {
  label: string
  icon: React.ReactNode
  headerGradient: string
  badgeColor: string
  emptyLabel: string
}> = {
  restaurant: {
    label: 'Restaurants',
    icon: <Icon.Utensils className="w-6 h-6 text-white" />,
    headerGradient: 'from-amber-600 to-orange-600',
    badgeColor: 'bg-amber-100 text-amber-700',
    emptyLabel: 'Aucun restaurant disponible',
  },
  bar: {
    label: 'Bars',
    icon: <Icon.Wine className="w-6 h-6 text-white" />,
    headerGradient: 'from-purple-600 to-indigo-600',
    badgeColor: 'bg-purple-100 text-purple-700',
    emptyLabel: 'Aucun bar disponible',
  },
  café: {
    label: 'Cafés',
    icon: <Icon.Coffee className="w-6 h-6 text-white" />,
    headerGradient: 'from-yellow-700 to-amber-700',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    emptyLabel: 'Aucun café disponible',
  },
}

const DEFAULT_TYPE_CONFIG = {
  label: 'Autres',
  icon: <Icon.Utensils className="w-6 h-6 text-white" />,
  headerGradient: 'from-gray-600 to-gray-700',
  badgeColor: 'bg-gray-100 text-gray-700',
  emptyLabel: 'Aucun établissement disponible',
}

export default async function RestaurantsPage() {
  const hotel = await getCurrentHotelServer()
  const supabase = await createClient()

  const { data: foodSpots, error } = await supabase
    .from('food_spots')
    .select(`
      *,
      images:food_spot_images(
        is_principal,
        image:image_id(id, url, alt_text)
      )
    `)
    .eq('hotel_id', hotel?.id)
    .order('name')

  if (error) {
    console.error('Erreur Supabase:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les établissements</p>
        </div>
      </div>
    )
  }

  // Grouper par spot_type, dans un ordre déterminé
  const typeOrder = ['restaurant', 'bar', 'café']
  const grouped: Record<string, typeof foodSpots> = {}

  for (const spot of foodSpots || []) {
    if (!grouped[spot.spot_type]) grouped[spot.spot_type] = []
    grouped[spot.spot_type]!.push(spot)
  }

  // Types présents, triés par typeOrder puis alphabétiquement
  const presentTypes = Object.keys(grouped).sort((a, b) => {
    const ia = typeOrder.indexOf(a)
    const ib = typeOrder.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const getMainImage = (spot: any) => {
    if (!spot.images?.length) return null
    return spot.images.find((img: any) => img.is_principal) || spot.images[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* En-tête */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Icon.Utensils className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Restauration & Bars</h1>
              <p className="text-xl text-amber-100">
                Découvrez nos restaurants, bars et espaces de détente
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {presentTypes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Icon.Utensils className="w-16 h-16 text-amber-200 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Aucun établissement disponible</h2>
            <p className="text-gray-600 text-lg">Revenez nous voir bientôt !</p>
          </div>
        ) : (
          presentTypes.map((type) => {
            const config = SPOT_TYPE_CONFIG[type] ?? DEFAULT_TYPE_CONFIG
            const spots = grouped[type]!

            return (
              <section key={type}>
                {/* Titre de section */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.headerGradient} flex items-center justify-center`}>
                    {config.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{config.label}</h2>
                  <span className="text-sm text-gray-400 font-normal">{spots.length} établissement{spots.length > 1 ? 's' : ''}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spots.map((spot) => {
                    const mainImage = getMainImage(spot)
                    return (
                      <div
                        key={spot.id}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                      >
                        {/* Image */}
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          {mainImage ? (
                            <>
                              <img
                                src={mainImage.image.url}
                                alt={mainImage.image.alt_text || spot.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            </>
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${config.headerGradient} opacity-20`}>
                              <div className="opacity-100">
                                {config.icon}
                              </div>
                            </div>
                          )}

                          {/* Badge type */}
                          <div className="absolute top-3 left-3">
                            <span className={`${config.badgeColor} px-2.5 py-1 rounded-full text-xs font-medium`}>
                              {config.label.slice(0, -1)}
                            </span>
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition mb-1">
                            {spot.name}
                          </h3>

                          {spot.location && (
                            <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                              <Icon.Pin className="w-3 h-3 flex-shrink-0" />
                              <span>{spot.location}</span>
                            </div>
                          )}

                          {spot.opening_hours && (
                            <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                              <Icon.Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{spot.opening_hours}</span>
                            </div>
                          )}

                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {spot.description || 'Description à venir...'}
                          </p>

                          <div className="flex items-center gap-2">
                            {spot.menu_pdf_url && (
                              <a
                                href={spot.menu_pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
                              >
                                <Icon.ExternalLink className="w-3.5 h-3.5" />
                                Menu
                              </a>
                            )}
                            <Link
                              href={`/restaurants/${spot.id}`}
                              className="flex-1 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
                            >
                              <Icon.ChevronRight className="w-3.5 h-3.5" />
                              Voir détails
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}

        {/* Note réservation */}
        {presentTypes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <Icon.Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Réservation recommandée</h3>
                <p className="text-amber-700">
                  Pour les dîners et les grandes tables, contactez la réception au poste 0.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
