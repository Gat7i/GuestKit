import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()

  if (!hotel) return notFound()

  const { data: show, error } = await supabase
    .from('entertainments')
    .select(`
      *,
      location:locations(id, name, description),
      images:entertainment_images(
        is_principal,
        image:images(id, url, alt_text)
      ),
      schedules:night_schedules(
        id, show_date, start_time, duration_minutes, target_audience
      )
    `)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .eq('is_night_show', true)
    .single()

  if (error || !show) return notFound()

  const mainImage = show.images?.find((img: any) => img.is_principal)?.image || show.images?.[0]?.image

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sortedSchedules = [...(show.schedules || [])].sort(
    (a: any, b: any) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime()
  )
  const upcomingSchedules = sortedSchedules.filter((s: any) => new Date(s.show_date) >= today)
  const nextSchedule = upcomingSchedules[0]

  const { data: otherShows } = await supabase
    .from('entertainments')
    .select(`
      id, title, description,
      images:entertainment_images(is_principal, image:images(url))
    `)
    .eq('hotel_id', hotel.id)
    .eq('is_night_show', true)
    .neq('id', show.id)
    .limit(3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">

      {/* Fil d'Ariane */}
      <div className="bg-gray-900/80 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition">Accueil</Link>
            <span className="text-gray-600">›</span>
            <Link href="/shows" className="text-gray-400 hover:text-white transition">Spectacles</Link>
            <span className="text-gray-600">›</span>
            <span className="text-white font-medium">{show.title}</span>
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative h-[45vh] min-h-[380px] bg-gray-900">
        {mainImage ? (
          <>
            <Image
              src={mainImage.url}
              alt={show.title}
              fill
              sizes="100vw"
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
            <Icon.Show className="w-24 h-24 text-purple-400/20" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/80 backdrop-blur rounded-full text-purple-100 text-sm font-medium mb-4 border border-purple-500/30">
              <Icon.Show className="w-4 h-4" /> Spectacle
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{show.title}</h1>
            {show.description && (
              <p className="text-xl text-gray-300 max-w-3xl">{show.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">

            {/* Galerie */}
            {show.images && show.images.length > 1 && (
              <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Galerie photos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {show.images.map((img: any) => (
                    <div key={img.image.id} className="aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={img.image.url}
                        alt={img.image.alt_text || show.title}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* À propos */}
            <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">À propos</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                {show.description || 'Aucune description disponible pour le moment.'}
              </p>
              {show.location?.description && (
                <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-700/30">
                  <h3 className="font-semibold text-purple-300 mb-1">Lieu</h3>
                  <p className="text-gray-300">{show.location.description}</p>
                </div>
              )}
            </section>

            {/* Toutes les dates */}
            {sortedSchedules.length > 0 && (
              <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="bg-purple-600 w-1 h-6 rounded-full" />
                  Toutes les dates
                </h2>
                <div className="space-y-3">
                  {sortedSchedules.map((sc: any) => {
                    const d = new Date(sc.show_date)
                    const isPast = d < today
                    return (
                      <div
                        key={sc.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          isPast
                            ? 'border-gray-700 bg-gray-700/20 opacity-50'
                            : 'border-purple-700/40 bg-purple-900/20'
                        }`}
                      >
                        {/* Badge date */}
                        <div className="bg-purple-700/80 text-white rounded-xl px-3 py-2 text-center min-w-[52px] flex-shrink-0">
                          <p className="text-xs uppercase tracking-wider opacity-80">{DAYS_SHORT_FR[d.getDay()]}</p>
                          <p className="text-2xl font-bold leading-none">{d.getDate()}</p>
                          <p className="text-xs mt-0.5">{MONTHS_FR[d.getMonth()].slice(0, 3)}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">
                            {DAYS_FR[d.getDay()]} {d.getDate()} {MONTHS_FR[d.getMonth()]} {d.getFullYear()}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1">
                            {sc.start_time && (
                              <span className="text-sm text-gray-300 flex items-center gap-1">
                                <Icon.Clock className="w-3.5 h-3.5" />
                                {sc.start_time.slice(0, 5)}
                              </span>
                            )}
                            {sc.duration_minutes && (
                              <span className="text-sm text-gray-400">{sc.duration_minutes} min</span>
                            )}
                            {sc.target_audience && (
                              <span className="text-sm text-gray-400 flex items-center gap-1">
                                <Icon.User className="w-3.5 h-3.5" />
                                {sc.target_audience}
                              </span>
                            )}
                          </div>
                        </div>

                        {isPast && (
                          <span className="text-xs text-gray-500 flex-shrink-0">Passé</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 sticky top-24 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon.Bell className="w-5 h-5 text-purple-400" />
                Informations
              </h2>

              {nextSchedule && (
                <div className="bg-purple-900/30 border border-purple-700/40 rounded-xl p-4">
                  <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Prochaine date</p>
                  <p className="text-white font-semibold">
                    {DAYS_FR[new Date(nextSchedule.show_date).getDay()]} {new Date(nextSchedule.show_date).getDate()} {MONTHS_FR[new Date(nextSchedule.show_date).getMonth()]}
                  </p>
                  <p className="text-purple-300 text-sm mt-1">{nextSchedule.start_time?.slice(0, 5)}</p>
                </div>
              )}

              {!nextSchedule && (
                <p className="text-gray-400 text-sm">Aucune date à venir pour le moment.</p>
              )}

              {show.location && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-900/50 rounded-lg flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Icon.Pin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lieu</p>
                    <p className="text-white font-medium">{show.location.name}</p>
                  </div>
                </div>
              )}

              {nextSchedule?.duration_minutes && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-900/50 rounded-lg flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Icon.Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="text-white font-medium">{nextSchedule.duration_minutes} min</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                  <Icon.Star className="w-3.5 h-3.5 text-purple-400" />
                  Places limitées — réservation recommandée
                </p>
                {hotel?.phone && (
                  <a
                    href={`tel:${hotel.phone}`}
                    className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition"
                  >
                    <Icon.Phone className="w-4 h-4" />
                    Réserver par téléphone
                  </a>
                )}
                <Link
                  href="/shows"
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-xl text-sm transition"
                >
                  ← Tous les spectacles
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Autres spectacles */}
        {otherShows && otherShows.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="bg-purple-600 w-1 h-8 rounded-full" />
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherShows.map((s: any) => {
                const img = s.images?.find((i: any) => i.is_principal)?.image || s.images?.[0]?.image
                return (
                  <Link
                    key={s.id}
                    href={`/shows/${s.id}`}
                    className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition"
                  >
                    <div className="h-32 bg-gray-700 relative overflow-hidden">
                      {img ? (
                        <Image src={img.url} alt={s.title} fill sizes="300px" className="object-cover group-hover:scale-105 transition duration-300 opacity-80" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon.Show className="w-10 h-10 text-purple-400/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white group-hover:text-purple-400 transition line-clamp-1">{s.title}</h3>
                      {s.description && <p className="text-sm text-gray-400 line-clamp-2 mt-1">{s.description}</p>}
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
