import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

// Config extensible par type — ajouter café, snack, etc. ici
const SPOT_TYPE_CONFIG: Record<string, {
  label: string
  icon: React.ReactNode
  traitColor: string
  badgeBg: string
  badgeText: string
  emptyLabel: string
}> = {
  restaurant: {
    label: 'Restaurants',
    icon: <Icon.Utensils className="w-6 h-6 text-white" />,
    traitColor: '#E05947',
    badgeBg: '#FFF5F3',
    badgeText: '#E05947',
    emptyLabel: 'Aucun restaurant disponible',
  },
  bar: {
    label: 'Bars',
    icon: <Icon.Wine className="w-6 h-6 text-white" />,
    traitColor: '#746865',
    badgeBg: '#F5EFED',
    badgeText: '#746865',
    emptyLabel: 'Aucun bar disponible',
  },
  café: {
    label: 'Cafés',
    icon: <Icon.Coffee className="w-6 h-6 text-white" />,
    traitColor: '#C49A5A',
    badgeBg: '#FAF5EC',
    badgeText: '#C49A5A',
    emptyLabel: 'Aucun café disponible',
  },
}

const DEFAULT_TYPE_CONFIG = {
  label: 'Autres',
  icon: <Icon.Utensils className="w-6 h-6 text-white" />,
  traitColor: '#746865',
  badgeBg: '#F5EFED',
  badgeText: '#746865',
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
    <div className="min-h-screen" style={{ backgroundColor: '#FFFAF8' }}>

      {/* En-tête éditorial */}
      <div style={{ backgroundColor: '#1C1211' }}>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: '#C49A5A' }}>
            {/* hotel name shown via section below */}
            Gastronomie &amp; Détente
          </p>
          <h1
            className="text-4xl md:text-5xl font-light mb-3 leading-tight"
            style={{ fontFamily: "'Cormorant', Georgia, serif", color: '#FFFAF8' }}
          >
            Restauration &amp; Bars
          </h1>
          <p className="text-sm" style={{ color: '#746865' }}>
            Découvrez nos restaurants, bars et espaces de détente
          </p>
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: config.traitColor }} />
                  <h2 className="text-2xl font-bold" style={{ color: '#1C1211' }}>{config.label}</h2>
                  <span className="text-sm font-normal" style={{ color: '#746865' }}>{spots.length} établissement{spots.length > 1 ? 's' : ''}</span>
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
                            <div className="w-full h-full flex items-center justify-center opacity-20" style={{ backgroundColor: config.traitColor }}>
                              <div className="opacity-100">
                                {config.icon}
                              </div>
                            </div>
                          )}

                          {/* Badge type */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: config.badgeBg, color: config.badgeText }}>
                              {config.label.slice(0, -1)}
                            </span>
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold transition mb-1 group-hover:text-[#E05947]" style={{ color: '#1C1211' }}>
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
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 hover:opacity-80"
                                style={{ backgroundColor: '#FFF5F3', color: '#E05947' }}
                              >
                                <Icon.ExternalLink className="w-3.5 h-3.5" />
                                Menu
                              </a>
                            )}
                            <Link
                              href={`/restaurants/${spot.id}`}
                              className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 hover:bg-[#FFF5F3] hover:text-[#E05947]"
                              style={{ border: '1px solid #E8DEDA', color: '#746865' }}
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
          <div className="rounded-xl p-6 text-sm" style={{ backgroundColor: '#FFF5F3', border: '1px solid #E8DEDA' }}>
            <div className="flex items-start gap-3">
              <Icon.Bell className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#E05947]" />
              <div>
                <h3 className="font-medium mb-1" style={{ color: '#1C1211' }}>Réservation recommandée</h3>
                <p style={{ color: '#746865' }}>
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
