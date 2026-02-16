import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function ActivityDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()
  
  if (!hotel) {
    return notFound()
  }

  // 1. Récupérer les détails de l'activité
  const { data: activity, error } = await supabase
    .from('entertainments')
    .select(`
      *,
      category:categories!category_id(
        id,
        name,
        icon,
        color,
        bg_color,
        text_color
      ),
      location:locations(
        id,
        name,
        description
      ),
      schedules:daily_schedules(
        id,
        day_of_week,
        start_time,
        duration_minutes
      ),
      images:entertainment_images(
        is_principal,
        image:image_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .eq('is_daily_activity', true)
    .single()

  // 2. Si l'activité n'existe pas → page 404
  if (error || !activity) {
    notFound()
  }

  // 3. Organiser les horaires par jour
  const daysOfWeek = [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
  ]

  const sortedSchedules = activity.schedules?.sort((a: any, b: any) => 
    a.day_of_week - b.day_of_week
  ) || []

  // 4. Récupérer l'image principale
  const mainImage = activity.images?.find((img: any) => img.is_principal)?.image || 
                    activity.images?.[0]?.image

 // 5. Récupérer d'autres activités du même hôtel (sauf celle en cours)
const { data: otherActivities } = await supabase
  .from('entertainments')
  .select(`
    id,
    title,
    description,
    category:categories!category_id(
      icon
    ),
    images:entertainment_images(
      is_principal,
      image:image_id(
        url
      )
    )
  `)
  .eq('hotel_id', hotel.id)
  .eq('is_daily_activity', true)
  .neq('id', activity.id)  // Exclure l'activité courante
  .limit(3)
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
            <Link href="/activities" className="text-gray-500 hover:text-gray-700">
              Activités
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">
              {activity.title}
            </span>
          </div>
        </div>
      </div>

      {/* En-tête avec image */}
      <div className="relative h-[40vh] min-h-[400px] bg-gray-900">
        {/* Image de fond */}
        {mainImage ? (
          <>
            <img
              src={mainImage.url}
              alt={activity.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-800">
            <span className="text-8xl text-white/30">🎯</span>
          </div>
        )}

        {/* Informations principales */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 text-white/80 text-sm mb-2">
              {/* Badge catégorie */}
              {activity.category && (
                <span className={`${activity.category.bg_color} ${activity.category.text_color} px-3 py-1 rounded-full flex items-center gap-1`}>
                  <span>{activity.category.icon}</span>
                  {activity.category.name}
                </span>
              )}
              
              {/* Badge activité journalière */}
              <span className="bg-blue-600/80 backdrop-blur px-3 py-1 rounded-full text-white">
                🎭 Activité journalière
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {activity.title}
            </h1>
            
            <p className="text-xl text-white/90 max-w-3xl">
              {activity.description || 'Découvrez cette activité proposée par notre équipe d\'animation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale : Galerie et description */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Galerie photos (si plusieurs images) */}
            {activity.images && activity.images.length > 1 && (
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-3xl">🖼️</span>
                  Galerie photos
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {activity.images.map((img: any) => (
                    <div key={img.image.id} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={img.image.url}
                        alt={img.image.alt_text || activity.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description détaillée */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-3xl">📖</span>
                À propos
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">
                  {activity.description || 'Aucune description disponible pour le moment.'}
                </p>
                
                {activity.location?.description && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Emplacement</h3>
                    <p className="text-blue-700">{activity.location.description}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Colonne latérale : Informations pratiques */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Carte d'informations */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">ℹ️</span>
                Informations
              </h2>
              
              <div className="space-y-4">
                {/* Catégorie */}
                {activity.category && (
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${activity.category.bg_color} rounded-lg flex items-center justify-center ${activity.category.text_color} flex-shrink-0`}>
                      {activity.category.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Catégorie</p>
                      <p className="font-medium text-gray-800">{activity.category.name}</p>
                    </div>
                  </div>
                )}

                {/* Emplacement */}
                {activity.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                      📍
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Emplacement</p>
                      <p className="font-medium text-gray-800">{activity.location.name}</p>
                    </div>
                  </div>
                )}

                {/* Durée moyenne */}
                {sortedSchedules.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                      ⏱️
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Durée moyenne</p>
                      <p className="font-medium text-gray-800">
                        {sortedSchedules[0].duration_minutes} minutes
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Horaires détaillés */}
              {sortedSchedules.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🕐</span>
                    Horaires de la semaine
                  </h3>
                  <div className="space-y-2">
                    {sortedSchedules.map((schedule: any) => (
                      <div key={schedule.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {daysOfWeek[schedule.day_of_week]}
                        </span>
                        <span className="font-medium text-gray-900">
                          {schedule.start_time.slice(0,5)} - {
                            (() => {
                              const [h, m] = schedule.start_time.split(':')
                              const d = new Date()
                              d.setHours(parseInt(h), parseInt(m))
                              d.setMinutes(d.getMinutes() + schedule.duration_minutes)
                              return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
                            })()
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  <span>📅</span>
                  Je participe
                </button>
                <button className="w-full bg-white border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <span>📞</span>
                  Contacter l'animation
                </button>
              </div>
            </div>
          </div>
        </div>

       {/* Section "À découvrir aussi" */}
{otherActivities && otherActivities.length > 0 && (
  <section className="mt-16">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
      <span className="text-3xl">✨</span>
      Vous aimerez aussi
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {otherActivities.map((otherActivity: any) => {
        const activityImage = otherActivity.images?.find((img: any) => img.is_principal)?.image || 
                              otherActivity.images?.[0]?.image
        const categoryIcon = otherActivity.category?.icon || '🎯'
        
        return (
          <Link
            key={otherActivity.id}
            href={`/activities/${otherActivity.id}`}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100"
          >
            {/* Image miniature */}
            <div className="h-32 bg-gray-100 relative overflow-hidden">
              {activityImage ? (
                <img 
                  src={activityImage.url} 
                  alt={otherActivity.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                  <span className="text-4xl text-blue-300">{categoryIcon}</span>
                </div>
              )}
            </div>
            
            {/* Contenu */}
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition line-clamp-1">
                {otherActivity.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {otherActivity.description}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  </section>
)}
      </div>
    </div>
  )
}