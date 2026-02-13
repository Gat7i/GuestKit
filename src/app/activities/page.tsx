// src/app/activities/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'

// Jours de la semaine en français
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default async function ActivitiesPage() {
  const supabase = await createClient()
  
  // 1. Récupérer les catégories d'activités
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('hotel_id', 1)
    .eq('category_type', 'activity')
    .eq('is_active', true)
    .order('sort_order')

  // 2. Construire un map des catégories
  const categoriesMap = new Map()
  categories?.forEach(cat => {
    categoriesMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '🎯',
      color: cat.color || 'from-blue-500 to-blue-600',
      bg: cat.bg_color || 'bg-blue-50',
      text: cat.text_color || 'text-blue-700'
    })
  })

  // 3. Récupérer toutes les activités
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
      )
    `)
    .eq('hotel_id', 1)
    .eq('is_daily_activity', true)
    .eq('is_night_show', false)
    .order('title')

  // 4. Récupérer le jour actuel
  const today = new Date().getDay()

  // 5. Organiser les activités par jour
  const activitiesByDay = activities?.reduce((acc, activity) => {
    activity.schedules?.forEach(schedule => {
      const day = schedule.day_of_week
      if (!acc[day]) acc[day] = []
      acc[day].push({
        ...activity,
        schedule
      })
    })
    return acc
  }, {} as Record<number, any[]>)

  // 6. Gestion des erreurs
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">
            Programme d'animations
          </h1>
          <p className="text-xl text-blue-100">
            Découvrez toutes les activités proposées chaque jour
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {(!activities || activities.length === 0) && (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Aucune activité programmée
            </h2>
            <p className="text-gray-600">Revenez bientôt !</p>
          </div>
        )}

        <div className="space-y-8">
          {[0,1,2,3,4,5,6].map((day) => {
            const dayActivities = activitiesByDay?.[day] || []
            if (dayActivities.length === 0) return null

            return (
              <section key={day} id={`day-${day}`} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* En-tête du jour */}
                <div className={`px-6 py-4 border-b ${day === today ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{DAYS_FR[day]}</h2>
                    {day === today && <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">Aujourd'hui</span>}
                  </div>
                </div>

                {/* Liste des activités */}
                <div className="divide-y divide-gray-100">
                  {dayActivities
                    .sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time))
                    .map((item, index) => (
                      <div key={`${item.id}-${index}`} className="p-6 hover:bg-gray-50 transition">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Heure */}
                          <div className="md:w-32">
                            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                              <span className="text-lg font-bold">{item.schedule.start_time.slice(0,5)}</span>
                              <span className="mx-1">-</span>
                              <span className="text-sm">
                                {(() => {
                                  const [h, m] = item.schedule.start_time.split(':')
                                  const d = new Date()
                                  d.setHours(parseInt(h), parseInt(m))
                                  d.setMinutes(d.getMinutes() + item.schedule.duration_minutes)
                                  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
                                })()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{item.schedule.duration_minutes} min</div>
                          </div>

                          {/* Contenu */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-600 mb-3">{item.description}</p>
                            <div className="flex gap-4 text-sm">
                              {item.location && (
                                <div className="flex items-center text-gray-700">
                                  <span className="mr-1">📍</span>{item.location.name}
                                </div>
                              )}
                              <div className="flex items-center text-gray-700">
                                <span className="mr-1">👥</span> Places limitées
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}