import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'
import ImageCarousel from '@/components/home/ImageCarousel'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { Icon } from '@/components/ui/Icons'

export default async function HomePage() {
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()

  const { data: hotelImages } = await supabase
    .from('hotel_images')
    .select(`image_id, title, sort_order, image:image_id(url, alt_text)`)
    .eq('hotel_id', hotel?.id || 1)
    .eq('is_active', true)
    .order('sort_order')

  const carouselImages = hotelImages?.map((item: any) => ({
    id: item.image_id,
    url: item.image?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    alt_text: item.image?.alt_text || "Vue de l'hôtel",
  })) || []

  const { data: restaurants } = await supabase
    .from('food_spots')
    .select(`*, images:food_spot_images(is_principal, image:image_id(url, alt_text))`)
    .eq('hotel_id', hotel?.id || 1)
    .eq('spot_type', 'restaurant')
    .limit(3)

  const today = new Date().getDay()
  const { data: activities } = await supabase
    .from('entertainments')
    .select(`*, location:locations(name), schedules:daily_schedules!inner(day_of_week, start_time, duration_minutes), images:entertainment_images(is_principal, image:image_id(url, alt_text))`)
    .eq('hotel_id', hotel?.id || 1)
    .eq('is_daily_activity', true)
    .eq('schedules.day_of_week', today)
    .limit(3)

  const { data: suggestions } = await supabase
    .from('suggestions')
    .select(`*, category:categories!category_id(id, name, icon, color), images:suggestion_images(is_principal, image:image_id(url, alt_text))`)
    .eq('hotel_id', hotel?.id || 1)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const services = [
    { href: '/restaurants', label: 'Restaurants',  Icon: Icon.Utensils,     color: 'text-amber-600',  bg: 'bg-amber-50',   hover: 'hover:bg-amber-100' },
    { href: '/activities',  label: 'Activités',    Icon: Icon.Activity,     color: 'text-blue-600',   bg: 'bg-blue-50',    hover: 'hover:bg-blue-100' },
    { href: '/shows',       label: 'Spectacles',   Icon: Icon.Show,         color: 'text-purple-600', bg: 'bg-purple-50',  hover: 'hover:bg-purple-100' },
    { href: '/suggestions', label: 'Découvertes',  Icon: Icon.Compass,      color: 'text-emerald-600',bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100' },
    { href: '/map',         label: 'Plan',         Icon: Icon.Map,          color: 'text-teal-600',   bg: 'bg-teal-50',    hover: 'hover:bg-teal-100' },
    { href: '/contacts',    label: 'Contacts',     Icon: Icon.Phone,        color: 'text-gray-600',   bg: 'bg-gray-100',   hover: 'hover:bg-gray-200' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative h-[80vh] min-h-[600px]">
        <div className="absolute inset-0">
          <ImageCarousel images={carouselImages} autoPlayInterval={6000} />
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
          <div className="w-9 h-9 border-2 border-white/70 rounded-full flex items-center justify-center">
            <Icon.ChevronRight className="w-4 h-4 text-white rotate-90" />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Nos services
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10">
            Tout ce dont vous avez besoin pendant votre séjour
          </p>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {services.map(({ href, label, Icon: ServiceIcon, color, bg, hover }) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 ${hover} transition-all duration-200 hover:shadow-sm hover:border-transparent`}
              >
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <ServiceIcon className={`w-6 h-6 ${color}`} />
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANTS */}
      {restaurants && restaurants.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Nos restaurants</h2>
                <p className="text-sm text-gray-500 mt-1">Une expérience gastronomique unique</p>
              </div>
              <Link href="/restaurants" className="text-sm text-blue-600 hover:text-blue-800 font-medium hidden md:flex items-center gap-1">
                Voir tout <Icon.ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {restaurants.map((restaurant: any) => {
                const mainImage = restaurant.images?.find((img: any) => img.is_principal) || restaurant.images?.[0]
                return (
                  <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {mainImage ? (
                        <img src={mainImage.image.url} alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                          <Icon.Utensils className="w-10 h-10 text-amber-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition text-sm">
                        {restaurant.name}
                      </h3>
                      {restaurant.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{restaurant.description}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ACTIVITÉS DU JOUR */}
      {activities && activities.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Aujourd'hui à l'hôtel</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <Link href="/activities" className="text-sm text-blue-600 hover:text-blue-800 font-medium hidden md:flex items-center gap-1">
                Programme complet <Icon.ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activities.map((activity: any) => {
                const mainImage = activity.images?.find((img: any) => img.is_principal)?.image || activity.images?.[0]?.image
                return (
                  <Link key={activity.id} href="/activities"
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {mainImage ? (
                        <img src={mainImage.url} alt={activity.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <Icon.Activity className="w-10 h-10 text-blue-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      {activity.schedules?.[0]?.start_time && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Icon.Clock className="w-3 h-3" />
                            {activity.schedules[0].start_time.slice(0, 5)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-sm line-clamp-1">
                        {activity.title}
                      </h3>
                      {activity.location && (
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          <Icon.Pin className="w-3 h-3 flex-shrink-0" />
                          {activity.location.name}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* SUGGESTIONS */}
      {suggestions && suggestions.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">À découvrir</h2>
                <p className="text-sm text-gray-500 mt-1">Nos sélections pour agrémenter votre séjour</p>
              </div>
              <Link href="/suggestions" className="text-sm text-blue-600 hover:text-blue-800 font-medium hidden md:flex items-center gap-1">
                Voir tout <Icon.ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {suggestions.slice(0, 3).map((suggestion: any) => {
                const mainImage = suggestion.images?.find((img: any) => img.is_principal)?.image || suggestion.images?.[0]?.image
                const isInternal = suggestion.location_type === 'internal'
                return (
                  <Link key={suggestion.id} href={`/suggestions/${suggestion.id}`}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {mainImage ? (
                        <img src={mainImage.url} alt={suggestion.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
                          <Icon.Globe className="w-10 h-10 text-purple-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                          {isInternal ? <Icon.Hotel className="w-3 h-3" /> : <Icon.Compass className="w-3 h-3" />}
                          {isInternal ? 'Sur place' : 'Aux alentours'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition text-sm line-clamp-1">
                        {suggestion.title}
                      </h3>
                      {suggestion.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{suggestion.description}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">
            Votre séjour, simplifié
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Services, activités, demandes — tout en un seul endroit
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/suggestions"
              className="bg-white text-gray-900 px-7 py-3 rounded-lg font-medium hover:bg-gray-100 transition text-sm">
              Explorer l'hôtel
            </Link>
            <Link href="/contacts"
              className="border border-gray-600 text-white px-7 py-3 rounded-lg font-medium hover:bg-gray-800 transition text-sm">
              Contacts utiles
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-500 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs">
            © {new Date().getFullYear()} {hotel?.name || 'GuestsKit'} — Tous droits réservés
          </p>
          {hotel?.check_in_time && hotel?.check_out_time && (
            <p className="text-xs mt-1 text-gray-600">
              Arrivée {hotel.check_in_time.slice(0, 5)} · Départ {hotel.check_out_time.slice(0, 5)}
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}
