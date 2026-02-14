// src/app/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'
import ImageCarousel from '@/components/home/ImageCarousel'
import { getCurrentHotelServer } from '@/lib/hotel-server'

export default async function HomePage() {
  const supabase = await createClient()
  
  // 1. Récupérer les informations de l'hôtel
const hotel = await getCurrentHotelServer()

// 2. Récupérer les images de l'hôtel pour le carrousel
const { data: hotelImages } = await supabase
  .from('hotel_images')
  .select(`
    image_id,
    title,
    sort_order,
    image:image_id(
      url,
      alt_text
    )
  `)
  .eq('hotel_id', hotel?.id || 1)
  .eq('is_active', true)
  .order('sort_order')

// Formater les images pour le carrousel - AVEC CORRECTION
const carouselImages = hotelImages?.map((item: any) => ({
  id: item.image_id,
  url: item.image?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
  title: item.title || 'Hôtel Paradis',
  alt_text: item.image?.alt_text || 'Image de l\'hôtel'
})) || []

  // 3. Récupérer les restaurants avec leurs images
  const { data: restaurants } = await supabase
    .from('food_spots')
    .select(`
      *,
      images:food_spot_images(
        is_principal,
        image:image_id(
          url,
          alt_text
        )
      )
    `)
    .eq('hotel_id', hotel?.id || 1)
    .eq('spot_type', 'restaurant')
    .limit(3)

  // 4. Récupérer les activités du jour
  const today = new Date().getDay()
  const { data: activities } = await supabase
    .from('entertainments')
    .select(`
      *,
      location:locations(name),
      schedules:daily_schedules!inner(
        day_of_week,
        start_time,
        duration_minutes
      )
    `)
    .eq('hotel_id', hotel?.id || 1)
    .eq('is_daily_activity', true)
    .eq('schedules.day_of_week', today)
    .limit(3)

  return (
    <div className="min-h-screen">
      {/* === HERO SECTION AVEC CARROUSEL === */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-white">
        {/* Carrousel d'images en arrière-plan */}
        <div className="absolute inset-0 z-0">
          <ImageCarousel images={carouselImages} autoPlayInterval={6000} />
        </div>

        {/* Contenu Hero */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
            Bienvenue à l'
            <span className="text-blue-400">{hotel?.name || 'Hôtel Paradis'}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 drop-shadow-lg">
            Votre séjour, simplifié. Tous les services de l'hôtel dans votre poche.
          </p>
          
          {/* Bouton de découverte (remplace le QR code) */}
          <Link
            href="/suggestions"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
          >
            <span>✨</span>
            Découvrir l'hôtel
          </Link>
        </div>

        {/* Flèche de scroll */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <div className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
            <span className="text-white">↓</span>
          </div>
        </div>
      </section>

      {/* === SERVICES RAPIDES === */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Découvrez nos services
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {/* Carte Restaurant */}
            <Link href="/restaurants" 
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🍽️</div>
              <h3 className="font-semibold text-gray-900">Restaurants</h3>
            </Link>

            {/* Carte Activités */}
            <Link href="/activities"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🎭</div>
              <h3 className="font-semibold text-gray-900">Activités</h3>
            </Link>

            {/* Carte Spectacles */}
            <Link href="/shows"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-purple-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🌟</div>
              <h3 className="font-semibold text-gray-900">Spectacles</h3>
            </Link>

            {/* Carte Découvertes */}
            <Link href="/suggestions"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-pink-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">✨</div>
              <h3 className="font-semibold text-gray-900">Découvertes</h3>
            </Link>

            {/* Carte Plan */}
            <Link href="/map"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-emerald-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🗺️</div>
              <h3 className="font-semibold text-gray-900">Plan</h3>
            </Link>

            {/* Carte Contacts */}
            <Link href="/contacts"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-green-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">📞</div>
              <h3 className="font-semibold text-gray-900">Contacts</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* === RESTAURANTS À LA UNE (inchangé) === */}
      {restaurants && restaurants.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Nos restaurants</h2>
                <p className="text-gray-600 mt-2">Une expérience gastronomique unique</p>
              </div>
              <Link href="/restaurants" className="text-blue-600 hover:text-blue-800 font-medium hidden md:block">
                Voir tout →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restaurants.map((restaurant: any) => {
                const mainImage = restaurant.images?.find((img: any) => img.is_principal) || 
                                 restaurant.images?.[0]
                return (
                  <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`} 
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group">
                    <div className="h-48 bg-gray-200 relative">
                      {mainImage ? (
                        <img src={mainImage.image.url} alt={restaurant.name} 
                             className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                          <span className="text-5xl text-amber-400">🍽️</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm">
                          🍽️ Restaurant
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                        {restaurant.name}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* === ACTIVITÉS DU JOUR (inchangé) === */}
      {activities && activities.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Aujourd'hui à l'hôtel</h2>
                <p className="text-gray-600 mt-2">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <Link href="/activities" className="text-blue-600 hover:text-blue-800 font-medium hidden md:block">
                Voir tout →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.map((activity: any) => (
                <Link key={activity.id} href="/activities" 
                      className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition group">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🎯</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600 font-medium">
                          {activity.schedules[0]?.start_time.slice(0,5)}
                        </span>
                        {activity.location && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{activity.location.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === APPEL À L'ACTION === */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            GuestsKit, votre compagnon de séjour
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Toutes les informations de l'hôtel directement sur votre téléphone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/suggestions"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              ✨ Explorer l'hôtel
            </Link>
            <Link 
              href="/contacts"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              📞 Contacts utiles
            </Link>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} GuestsKit. Tous droits réservés.
          </p>
          <p className="text-xs mt-2">
            {hotel?.name} • {hotel?.check_in_time?.slice(0,5)} - {hotel?.check_out_time?.slice(0,5)}
          </p>
        </div>
      </footer>
    </div>
  )
}