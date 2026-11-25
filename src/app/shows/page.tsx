import { getCurrentHotelServer } from '@/lib/hotel-server'
import { createClient } from '@/lib/supabase/server-client'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]
const DAYS_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default async function ShowsPage() {
  const hotel = await getCurrentHotelServer()
  const supabase = await createClient()

  const { data: shows, error } = await supabase
    .from('entertainments')
    .select(`
      *,
      location:locations(name),
      images:entertainment_images(
        is_principal,
        image:images(url, alt_text)
      ),
      schedules:night_schedules(
        id,
        show_date,
        start_time,
        duration_minutes,
        target_audience
      )
    `)
    .eq('hotel_id', hotel?.id)
    .eq('is_night_show', true)
    .eq('is_daily_activity', false)
    .order('title')

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-red-400">Impossible de charger les spectacles</p>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const showsWithSchedules = (shows || [])
    .filter(s => s.schedules?.length > 0)
    .map(s => ({ ...s, schedules: s.schedules.sort((a: any, b: any) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime()) }))

  const upcomingShows: any[] = []
  const pastShows: any[] = []

  showsWithSchedules.forEach(show => {
    const next = show.schedules.find((sc: any) => new Date(sc.show_date) >= today)
    if (next) upcomingShows.push({ ...show, nextSchedule: next })
    else pastShows.push({ ...show, lastSchedule: show.schedules[show.schedules.length - 1] })
  })

  upcomingShows.sort((a, b) =>
    new Date(a.nextSchedule.show_date).getTime() - new Date(b.nextSchedule.show_date).getTime()
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">

      {/* En-tête */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="absolute top-20 right-20 w-3 h-3 bg-white rounded-full animate-pulse" />
          <div className="absolute bottom-10 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 backdrop-blur rounded-full text-purple-300 text-sm font-medium mb-6 border border-purple-500/30">
            <Icon.Show className="w-4 h-4" /> Soirées & Spectacles
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

        {/* Aucun spectacle */}
        {upcomingShows.length === 0 && (
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-12 text-center border border-gray-700">
            <Icon.Show className="w-16 h-16 text-gray-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Aucun spectacle programmé pour le moment</h2>
            <p className="text-gray-400 text-lg mb-6">Notre équipe prépare de nouvelles soirées exceptionnelles</p>
            <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-400/10 px-6 py-3 rounded-full">
              Revenez nous voir bientôt
            </div>
          </div>
        )}

        {/* Grille des spectacles à venir */}
        {upcomingShows.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="bg-purple-600 w-1 h-8 rounded-full" />
              À venir
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingShows.map((show) => {
                const mainImage = show.images?.find((img: any) => img.is_principal)?.image || show.images?.[0]?.image
                const showDate = new Date(show.nextSchedule.show_date)
                const day = showDate.getDate()
                const month = MONTHS_FR[showDate.getMonth()].slice(0, 3)
                const dayName = DAYS_SHORT_FR[showDate.getDay()]

                return (
                  <div
                    key={show.id}
                    className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-52 bg-gradient-to-br from-purple-900 to-indigo-900 overflow-hidden flex-shrink-0">
                      {mainImage ? (
                        <Image
                          src={mainImage.url}
                          alt={mainImage.alt_text || show.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon.Show className="w-16 h-16 text-purple-400/30" />
                        </div>
                      )}
                      {/* Dégradé bas */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />

                      {/* Badge date */}
                      <div className="absolute top-3 left-3 bg-purple-700/90 backdrop-blur text-white rounded-xl px-3 py-2 text-center min-w-[52px]">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-80">{dayName}</p>
                        <p className="text-2xl font-bold leading-none">{day}</p>
                        <p className="text-xs font-medium mt-0.5">{month}</p>
                      </div>

                      {/* Heure */}
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white rounded-full px-3 py-1 text-sm font-medium">
                        {show.nextSchedule.start_time.slice(0, 5)}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition mb-2 line-clamp-1">
                        {show.title}
                      </h3>

                      {show.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                          {show.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-auto">
                        {show.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-300 bg-gray-700/60 px-2.5 py-1 rounded-full">
                            <Icon.Pin className="w-3 h-3 flex-shrink-0" />
                            {show.location.name}
                          </span>
                        )}
                        {show.nextSchedule.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-gray-300 bg-gray-700/60 px-2.5 py-1 rounded-full">
                            <Icon.Clock className="w-3 h-3 flex-shrink-0" />
                            {show.nextSchedule.duration_minutes} min
                          </span>
                        )}
                        {show.nextSchedule.target_audience && (
                          <span className="flex items-center gap-1 text-xs text-gray-300 bg-gray-700/60 px-2.5 py-1 rounded-full">
                            <Icon.User className="w-3 h-3 flex-shrink-0" />
                            {show.nextSchedule.target_audience}
                          </span>
                        )}
                        {show.schedules.length > 1 && (
                          <span className="text-xs text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full">
                            +{show.schedules.length - 1} date{show.schedules.length > 2 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Spectacles passés */}
        {pastShows.length > 0 && (
          <div className="mt-8 opacity-60">
            <details className="group">
              <summary className="text-gray-400 cursor-pointer hover:text-white transition flex items-center gap-2 text-sm select-none">
                <Icon.Show className="w-4 h-4" />
                Spectacles passés ({pastShows.length})
                <span className="group-open:rotate-90 transition inline-block">▶</span>
              </summary>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastShows.map((show) => {
                  const mainImage = show.images?.find((img: any) => img.is_principal)?.image || show.images?.[0]?.image
                  return (
                    <div key={show.id} className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 flex gap-3 p-3">
                      {mainImage && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={mainImage.url} alt={show.title} fill sizes="64px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{show.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(show.lastSchedule.show_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          </div>
        )}

        {/* Encart réservation */}
        <div className="mt-16 bg-purple-900/30 backdrop-blur border border-purple-700/50 rounded-xl p-6 text-center">
          <Icon.Star className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Réservation recommandée</h3>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto">
            Les places pour nos spectacles sont limitées. Rendez-vous à la réception ou contactez notre équipe d'animation.
          </p>
          {hotel?.phone && (
            <div className="mt-4 inline-flex items-center gap-2 text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full text-sm">
              <Icon.Phone className="w-4 h-4" />
              {hotel.phone}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
