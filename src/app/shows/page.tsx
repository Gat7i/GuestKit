import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'

// Mois en français
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

// Jours en français (abbréviés)
const DAYS_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default async function ShowsPage() {
  const hotel = await getCurrentHotelServer()
  const supabase = await createClient()
  
  // 1. Récupérer tous les spectacles de l'Hôtel
  const { data: shows, error } = await supabase
    .from('entertainments')
    .select(`
      *,
      location:locations(name),
      schedules:night_schedules(
        id,
        show_date,
        start_time,
        duration_minutes,
        target_audience
      )
    `)
    .eq('hotel_id', hotel?.id)
    .eq('is_night_show', true)        // Uniquement les spectacles nocturnes
    .eq('is_daily_activity', false)   // Pas les activités journalières
    .order('title')

  // 2. Filtrer pour garder uniquement les spectacles avec des schedules et les trier par date
  const showsWithSchedules = shows
    ?.filter(show => show.schedules && show.schedules.length > 0)
    .map(show => ({
      ...show,
      schedules: show.schedules.sort((a: any, b: any) => 
        new Date(a.show_date).getTime() - new Date(b.show_date).getTime()
      )
    }))

  // 3. Séparer les spectacles à venir et passés
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingShows: any[] = []
  const pastShows: any[] = []

  showsWithSchedules?.forEach(show => {
    // On prend la prochaine date du spectacle
    const nextSchedule = show.schedules.find((schedule: any) => 
      new Date(schedule.show_date) >= today
    )
    
    if (nextSchedule) {
      upcomingShows.push({
        ...show,
        nextSchedule
      })
    } else {
      // Si toutes les dates sont passées, on garde la dernière pour historique
      pastShows.push({
        ...show,
        lastSchedule: show.schedules[show.schedules.length - 1]
      })
    }
  })

  // 4. Trier les spectacles à venir par date
  upcomingShows.sort((a, b) => 
    new Date(a.nextSchedule.show_date).getTime() - new Date(b.nextSchedule.show_date).getTime()
  )

  // 5. Gestion des erreurs
  if (error) {
    console.error('Erreur Supabase:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les spectacles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* En-tête de la page */}
      <div className="relative overflow-hidden">
        {/* Étoiles en arrière-plan (effet visuel) */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-block p-2 px-4 bg-purple-600/20 backdrop-blur rounded-full text-purple-300 text-sm font-medium mb-6 border border-purple-500/30">
            ✨ Soirées & Spectacles
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Vivez la magie des <span className="text-purple-400">soirées</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Cabarets, concerts, shows magiques... Découvrez notre programmation nocturne
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Message si aucun spectacle */}
        {(!upcomingShows || upcomingShows.length === 0) && (
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-12 text-center border border-gray-700">
            <div className="text-7xl mb-6">🎭</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Aucun spectacle programmé pour le moment
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Notre équipe prépare de nouvelles soirées exceptionnelles
            </p>
            <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-400/10 px-6 py-3 rounded-full">
              <span>✨</span>
              Revenez nous voir bientôt
            </div>
          </div>
        )}

        {/* Spectacles à venir */}
        {upcomingShows.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="bg-purple-600 w-1 h-8 rounded-full"></span>
              À venir
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingShows.map((show) => {
                const showDate = new Date(show.nextSchedule.show_date)
                const dayOfWeek = showDate.getDay()
                const day = showDate.getDate()
                const month = showDate.getMonth()
                
                return (
                  <div
                    key={show.id}
                    className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Date block */}
                      <div className="md:w-32 bg-gradient-to-br from-purple-900 to-purple-700 p-6 flex flex-col items-center justify-center text-white">
                        <span className="text-sm font-medium uppercase tracking-wider opacity-80">
                          {DAYS_SHORT_FR[dayOfWeek]}
                        </span>
                        <span className="text-4xl font-bold my-1">
                          {day}
                        </span>
                        <span className="text-sm font-medium">
                          {MONTHS_FR[month].slice(0,3)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition">
                            {show.title}
                          </h3>
                          <span className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30">
                            {show.nextSchedule.start_time.slice(0,5)}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {show.description}
                        </p>

                        <div className="flex flex-wrap gap-3 text-sm">
                          {/* Lieu */}
                          {show.location && (
                            <div className="flex items-center text-gray-300 bg-gray-700/50 px-3 py-1.5 rounded-full">
                              <span className="mr-1">📍</span>
                              {show.location.name}
                            </div>
                          )}

                          {/* Public cible */}
                          {show.nextSchedule.target_audience && (
                            <div className="flex items-center text-gray-300 bg-gray-700/50 px-3 py-1.5 rounded-full">
                              <span className="mr-1">👥</span>
                              {show.nextSchedule.target_audience}
                            </div>
                          )}

                          {/* Durée */}
                          {show.nextSchedule.duration_minutes && (
                            <div className="flex items-center text-gray-300 bg-gray-700/50 px-3 py-1.5 rounded-full">
                              <span className="mr-1">⏱️</span>
                              {show.nextSchedule.duration_minutes} min
                            </div>
                          )}
                        </div>

                        {/* Date supplémentaire si plusieurs séances */}
                        {show.schedules.length > 1 && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <span className="text-xs text-gray-500">
                              + {show.schedules.length - 1} autre{show.schedules.length - 1 > 1 ? 's' : ''} date{show.schedules.length - 1 > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Spectacles passés (historique) */}
        {pastShows.length > 0 && (
          <div className="mt-16 opacity-75">
            <details className="group">
              <summary className="text-gray-400 cursor-pointer hover:text-white transition flex items-center gap-2">
                <span className="text-sm">🎭 Spectacles passés</span>
                <span className="group-open:rotate-90 transition">▶</span>
              </summary>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastShows.slice(0, 3).map((show) => {
                  const showDate = new Date(show.lastSchedule.show_date)
                  return (
                    <div key={show.id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🎭</div>
                        <div>
                          <h4 className="font-medium text-white">{show.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {showDate.toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {pastShows.length > 3 && (
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 flex items-center justify-center">
                    <span className="text-sm text-gray-400">
                      + {pastShows.length - 3} spectacles
                    </span>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Note d'information */}
        <div className="mt-16 bg-purple-900/30 backdrop-blur border border-purple-700/50 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl">🎟️</span>
            <h3 className="text-lg font-semibold text-white">
              Réservation recommandée
            </h3>
            <p className="text-gray-300 text-sm max-w-2xl">
              Les places pour nos spectacles sont limitées. 
              Rendez-vous à la réception ou contactez notre équipe d'animation pour réserver.
            </p>
            <div className="mt-2 inline-flex items-center gap-2 text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full text-sm">
              <span>📞</span>
              Poste 122 - Conciergerie
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}