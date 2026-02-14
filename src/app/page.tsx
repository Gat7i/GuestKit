// src/app/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  
  // 1. Récupérer les informations de l'Hôtel Paradis (hotel_id = 1)
  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', 1)
    .single()

  // 2. Récupérer les restaurants avec leurs images principales
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
  .eq('hotel_id', 1)
  .eq('spot_type', 'restaurant')
  .limit(3)

  // 3. Récupérer les activités du jour pour les mettre en avant
  const today = new Date().getDay()
  const { data: activities } = await supabase
    .from('entertainments')
    .select(`
      *,
      schedules:daily_schedules!inner(
        day_of_week,
        start_time,
        duration_minutes
      )
    `)
    .eq('hotel_id', 1)
    .eq('is_daily_activity', true)
    .eq('schedules.day_of_week', today)
    .limit(3)

  return (
    <div className="min-h-screen">
      {/* === HERO SECTION === */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-white">
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600"
            alt="Hôtel Paradis"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Contenu Hero */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Bienvenue à l'
            <span className="text-blue-400">{hotel?.name || 'Hôtel Paradis'}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Votre séjour, simplifié. Tous les services de l'hôtel dans votre poche.
          </p>
          
          {/* QR Code simulation */}
          <div className="inline-flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="bg-white p-2 rounded-lg mb-4">
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-600">📱</span>
              </div>
            </div>
            <p className="text-sm text-gray-200">
              Scannez ce QR code à votre arrivée
            </p>
          </div>
        </div>

        {/* Flèche de scroll */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Carte Restaurant */}
            <Link href="/restaurants" 
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🍽️</div>
              <h3 className="font-semibold text-gray-900">Restaurants</h3>
              <p className="text-sm text-gray-600 mt-1">Découvrez nos chefs</p>
            </Link>

            {/* Carte Suggestions */}
            <Link href="/suggestions"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-purple-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">✨</div>
              <h3 className="font-semibold text-gray-900">Découvertes</h3>
              <p className="text-sm text-gray-600 mt-1">Spa, excursions, shopping</p>
            </Link>

            {/* Carte Activités */}
            <Link href="/activities"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🎭</div>
              <h3 className="font-semibold text-gray-900">Animations</h3>
              <p className="text-sm text-gray-600 mt-1">Programme du jour</p>
            </Link>

            {/* Carte Spectacles */}
            <Link href="/shows"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🌟</div>
              <h3 className="font-semibold text-gray-900">Spectacles</h3>
              <p className="text-sm text-gray-600 mt-1">Nos soirées</p>
            </Link>

            {/* Carte Plan */}
            <Link href="/map"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-emerald-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">🗺️</div>
              <h3 className="font-semibold text-gray-900">Plan de l'hôtel</h3>
              <p className="text-sm text-gray-600 mt-1">Repérez-vous facilement</p>
            </Link>

            {/* Carte Contacts */}
            <Link href="/contacts"
              className="group bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">📞</div>
              <h3 className="font-semibold text-gray-900">Contacts</h3>
              <p className="text-sm text-gray-600 mt-1">Numéros utiles, réception</p>
            </Link>
          </div>
        </div>
      </section>

{/* === RESTAURANTS À LA UNE === */}
{restaurants && restaurants.length > 0 && (
  <section className="py-16 bg-gray-50">
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Nos restaurants
          </h2>
          <p className="text-gray-600 mt-2">
            Une expérience gastronomique unique
          </p>
        </div>
        <Link 
          href="/restaurants"
          className="text-blue-600 hover:text-blue-800 font-medium hidden md:block"
        >
          Voir tout →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {restaurants.map((restaurant: any) => {
          // Trouver l'image principale
          const mainImage = restaurant.images?.find((img: any) => img.is_principal) || 
                            restaurant.images?.[0]
          
          return (
            <div key={restaurant.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                {/* Image du restaurant */}
                {mainImage ? (
                  <img
                    src={mainImage.image.url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                    <span className="text-5xl text-amber-400">🍽️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm">
                    {restaurant.spot_type === 'restaurant' ? '🍽️ Restaurant' : '🍸 Bar'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {restaurant.description || 'Cuisine raffinée dans un cadre exceptionnel'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Bouton mobile */}
      <div className="mt-6 text-center md:hidden">
        <Link 
          href="/restaurants"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Voir tous nos restaurants
        </Link>
      </div>
    </div>
  </section>
)}

      {/* === ACTIVITÉS DU JOUR === */}
      {activities && activities.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Aujourd'hui à l'hôtel
                </h2>
                <p className="text-gray-600 mt-2">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
              <Link 
                href="/activities"
                className="text-blue-600 hover:text-blue-800 font-medium hidden md:block"
              >
                Voir tout →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🎯</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600 font-medium">
                          {activity.schedules[0]?.start_time.slice(0,5)}
                        </span>
                        {activity.location && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">
                              {activity.location.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton mobile */}
            <div className="mt-6 text-center md:hidden">
              <Link 
                href="/activities"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Voir toutes les activités
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* === APPEL À L'ACTION === */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            GuestKit, votre compagnon de séjour
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Téléchargez notre application ou scannez le QR code à la réception
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              📱 Télécharger sur l'App Store
            </a>
            <a 
              href="#" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              📲 Version web
            </a>
          </div>
        </div>
      </section>

      {/* === FOOTER SIMPLE === */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} GuestKit. Tous droits réservés.
          </p>
          <p className="text-xs mt-2">
            {hotel?.name} • {hotel?.check_in_time?.slice(0,5)} - {hotel?.check_out_time?.slice(0,5)}
          </p>
        </div>
      </footer>
    </div>
  )
}