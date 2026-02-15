// src/app/activities/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import Link from 'next/link'

// Jours de la semaine en français
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default async function ActivitiesPage() {
  const supabase = await createClient()
  
  // 1. Récupérer l'hôtel courant (basé sur le sous-domaine)
  const hotel = await getCurrentHotelServer()
  
  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Hôtel non trouvé</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les activités</p>
        </div>
      </div>
    )
  }

  // 2. Récupérer les catégories d'activités de l'hôtel
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('hotel_id', hotel.id)
    .eq('category_type', 'activity')
    .eq('is_active', true)
    .order('sort_order')

  // 3. Construire un map des catégories pour un accès facile
  const categoriesMap = new Map()
  categories?.forEach((cat: any) => {
    categoriesMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '🎯',
      color: cat.color || 'from-blue-500 to-blue-600',
      bg: cat.bg_color || 'bg-blue-50',
      text: cat.text_color || 'text-blue-700'
    })
  })

  // 4. Récupérer toutes les activités avec leurs catégories, images et horaires
  const { data: activities, error } = await supabase
    .from('entertainments')
    .select(`
      *,
      location:locations(name),
      category:categories!category_id(
        id, name, icon, color, bg_color, text_color
      ),
      schedules:daily_schedules(
        day_of_week,
        start_time,
        duration_minutes
      ),
      images:entertainment_images(
        is_principal,
        image:image_id(
          url,
          alt_text
        )
      )
    `)
    .eq('hotel_id', hotel.id)
    .eq('is_daily_activity', true)
    .eq('is_night_show', false)
    .order('title')

  // 5. Récupérer le jour actuel
  const today = new Date().getDay()

  // 6. Organiser les activités par jour et par catégorie
  const activitiesByDayAndCategory = activities?.reduce((acc: any, activity: any) => {
    activity.schedules?.forEach((schedule: any) => {
      const day = schedule.day_of_week
      const categoryId = activity.category_id || 'uncategorized'
      const category = activity.category || { 
        name: 'Autres', 
        icon: '🎯', 
        color: 'from-gray-500 to-gray-600',
        bg: 'bg-gray-50',
        text: 'text-gray-700'
      }
      
      if (!acc[day]) acc[day] = {}
      if (!acc[day][categoryId]) {
        acc[day][categoryId] = {
          category,
          activities: []
        }
      }
      
      acc[day][categoryId].activities.push({
        ...activity,
        schedule
      })
    })
    return acc
  }, {})

  // 7. Gestion des erreurs
  if (error) {
    console.error('Erreur Supabase:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les activités</p>
        </div>
      </div>
    )
  }

  // Fonction pour obtenir l'image principale d'une activité
  const getMainImage = (activity: any) => {
    if (!activity.images || activity.images.length === 0) {
      return null
    }
    const mainImage = activity.images.find((img: any) => img.is_principal)
    return mainImage || activity.images[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div 
        className="bg-gradient-to-r text-white"
        style={{ background: `linear-gradient(to right, ${hotel.primary_color}, ${hotel.primary_color}dd)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">
            Programme d'animations - {hotel.name}
          </h1>
          <p className="text-xl text-white/90">
            Découvrez toutes les activités proposées chaque jour par notre équipe d'animation
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message si aucune activité */}
        {(!activities || activities.length === 0) && (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Aucune activité programmée pour le moment
            </h2>
            <p className="text-gray-600">
              Revenez bientôt pour découvrir notre programme d'animations !
            </p>
          </div>
        )}

        {/* Liste des activités par jour */}
        <div className="space-y-8">
          {[0,1,2,3,4,5,6].map((day) => {
            const dayActivities = activitiesByDayAndCategory?.[day]
            if (!dayActivities) return null

            return (
              <section
                key={day}
                id={`day-${day}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-4"
              >
                {/* En-tête du jour */}
                <div className={`
                  px-6 py-4 border-b
                  ${day === today 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                  }
                `}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {DAYS_FR[day]}
                    </h2>
                    {day === today && (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                </div>

                {/* Activités par catégorie pour ce jour */}
                <div className="p-6">
                  {Object.entries(dayActivities).map(([categoryId, { category, activities }]: [string, any]) => (
                    <div key={categoryId} className="mb-6 last:mb-0">
                      {/* En-tête de catégorie */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm
                          ${category.bg} ${category.text}
                        `}>
                          <span>{category.icon}</span>
                        </div>
                        <h3 className="font-semibold text-gray-700">
                          {category.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {activities.length} activité{activities.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Liste des activités de cette catégorie */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activities
                          .sort((a: any, b: any) => 
                            a.schedule.start_time.localeCompare(b.schedule.start_time)
                          )
                          .map((item: any, index: number) => {
                            const mainImage = getMainImage(item)
                            
                            return (
                              <Link 
                                key={`${item.id}-${index}`} 
                                href={`/activities/${item.id}`}
                                className="flex flex-col md:flex-row gap-4 p-4 hover:bg-gray-50 rounded-lg transition group border border-gray-100 hover:border-blue-200"
                              >
                                {/* Image de l'activité */}
                                <div className="md:w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {mainImage ? (
                                    <img 
                                      src={mainImage.image.url} 
                                      alt={item.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                                      <span className="text-2xl text-blue-300">🎯</span>
                                    </div>
                                  )}
                                </div>

                                {/* Contenu */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                      {item.title}
                                    </h4>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                      {item.schedule.start_time.slice(0,5)}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-3 text-xs">
                                    {item.location && (
                                      <span className="flex items-center text-gray-600">
                                        <span className="mr-1">📍</span>
                                        {item.location.name}
                                      </span>
                                    )}
                                    <span className="flex items-center text-gray-600">
                                      <span className="mr-1">⏱️</span>
                                      {item.schedule.duration_minutes} min
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Note d'information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-medium mb-1">Inscription aux activités</p>
              <p>
                Pour participer aux activités, rendez-vous à la réception ou contactez notre équipe d'animation.
                Les places sont limitées, nous vous recommandons de vous inscrire à l'avance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}