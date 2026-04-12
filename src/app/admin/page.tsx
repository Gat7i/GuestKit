// src/app/admin/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server-client'
import { Icon } from '@/components/ui/Icons'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const hotelId = parseInt(process.env.NEXT_PUBLIC_HOTEL_ID || '0')

  const [
    { count: restaurantsCount },
    { count: activitiesCount },
    { count: showsCount },
    { count: suggestionsCount },
    { count: contactsCount },
    { count: pendingCount },
    { count: inProgressCount },
    { data: recentRequests },
    { count: activeStaysCount },
    { count: todayCheckinsCount },
  ] = await Promise.all([
    supabase.from('food_spots').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('spot_type', 'restaurant'),
    supabase.from('entertainments').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('is_daily_activity', true),
    supabase.from('entertainments').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('is_night_show', true),
    supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('customer_requests').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'pending'),
    supabase.from('customer_requests').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'in_progress'),
    supabase.from('customer_requests').select('id, title, status, priority, created_at, request_type:request_types(name, category)').eq('hotel_id', hotelId).in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(6),
    supabase.from('stays').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'active'),
    supabase.from('stays').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_in_date', new Date().toISOString().split('T')[0]),
  ])

  const totalRequests = (pendingCount || 0) + (inProgressCount || 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
  }
  const statusLabels: Record<string, string> = {
    pending: 'Attente',
    in_progress: 'En cours',
  }
  const priorityDot: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-400',
    normal: 'bg-blue-400',
    low: 'bg-gray-300',
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}min`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}j`
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Opérationnel
              </span>
              <Link href="/" target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Icon.ExternalLink className="w-3.5 h-3.5" />
                Site client
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ===== ZONE OPÉRATIONNELLE ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* RÉCEPTION */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Icon.Users className="w-4 h-4 text-blue-500" />
                Réception
              </h2>
              <Link href="/admin/reception" className="text-xs text-blue-600 hover:underline font-medium">
                Ouvrir →
              </Link>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Séjours actifs</p>
                  <p className="text-3xl font-bold text-blue-700">{activeStaysCount || 0}</p>
                  <p className="text-xs text-blue-500 mt-1">clients présents</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Arrivées aujourd'hui</p>
                  <p className="text-3xl font-bold text-gray-700">{todayCheckinsCount || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">check-ins prévus</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Link href="/admin/reception" className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                  <Icon.Users className="w-3.5 h-3.5" />
                  Accueil
                </Link>
                <Link href="/admin/reception/check-in" className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                  <Icon.Plus className="w-3.5 h-3.5" />
                  Check-in
                </Link>
                <Link href="/admin/reception/stays" className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                  <Icon.BookOpen className="w-3.5 h-3.5" />
                  Séjours
                </Link>
              </div>
            </div>
          </div>

          {/* DEMANDES */}
          <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${totalRequests > 0 ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Icon.Bell className={`w-4 h-4 ${totalRequests > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                Demandes
                {totalRequests > 0 && (
                  <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    {totalRequests}
                  </span>
                )}
              </h2>
              <div className="text-xs text-gray-400">
                {pendingCount || 0} attente · {inProgressCount || 0} en cours
              </div>
            </div>

            {/* Catégories */}
            <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'Maintenance', href: '/admin/requests/maintenance', Icon: Icon.Wrench },
                { label: 'Room service', href: '/admin/requests/room-service', Icon: Icon.Utensils },
                { label: 'Ménage', href: '/admin/requests/housekeeping', Icon: Icon.SparklesCleaning },
                { label: 'Conciergerie', href: '/admin/requests/concierge', Icon: Icon.Concierge },
              ].map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex flex-col items-center gap-1 px-2 py-3 hover:bg-amber-50 transition group"
                >
                  <cat.Icon className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition" />
                  <span className="text-xs text-gray-500 group-hover:text-amber-700 text-center leading-tight">{cat.label}</span>
                </Link>
              ))}
            </div>

            {/* Dernières demandes */}
            <div className="divide-y divide-gray-50 max-h-[180px] overflow-y-auto">
              {recentRequests && recentRequests.length > 0 ? (
                recentRequests.map((req: any) => (
                  <Link
                    key={req.id}
                    href={`/admin/requests/${(req.request_type as any)?.category || 'maintenance'}/${req.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition group"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[req.priority] || 'bg-gray-300'}`} />
                    <p className="text-sm text-gray-700 truncate flex-1 group-hover:text-blue-600">{req.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status] || ''}`}>
                        {statusLabels[req.status] || req.status}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-gray-400">Aucune demande en attente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== ANIMATION ===== */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Animation</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/activities" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon.Activity className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Activités</p>
                <p className="text-sm text-gray-400">{activitiesCount || 0} activité{(activitiesCount || 0) !== 1 ? 's' : ''} programmée{(activitiesCount || 0) !== 1 ? 's' : ''}</p>
              </div>
              <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
            </Link>
            <Link href="/admin/shows" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon.Show className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Spectacles</p>
                <p className="text-sm text-gray-400">{showsCount || 0} spectacle{(showsCount || 0) !== 1 ? 's' : ''} au catalogue</p>
              </div>
              <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* ===== CONTENU & SERVICES ===== */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contenu & Services</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/admin/restaurants" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon.Utensils className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Restaurants</p>
                <p className="text-sm text-gray-400">{restaurantsCount || 0} établissement{(restaurantsCount || 0) !== 1 ? 's' : ''}</p>
              </div>
              <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
            </Link>
            <Link href="/admin/suggestions" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon.Compass className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Découvertes</p>
                <p className="text-sm text-gray-400">{suggestionsCount || 0} suggestion{(suggestionsCount || 0) !== 1 ? 's' : ''}</p>
              </div>
              <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
            </Link>
            <Link href="/admin/contacts" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon.Phone className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Contacts</p>
                <p className="text-sm text-gray-400">{contactsCount || 0} numéro{(contactsCount || 0) !== 1 ? 's' : ''} utile{(contactsCount || 0) !== 1 ? 's' : ''}</p>
              </div>
              <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* ===== CONFIGURATION ===== */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Configuration</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { title: 'Hôtel', href: '/admin/hotel', Icon: Icon.Hotel },
              { title: 'Plan interactif', href: '/admin/map-editor', Icon: Icon.Map },
              { title: 'Emplacements', href: '/admin/locations', Icon: Icon.Location },
              { title: 'Catégories', href: '/admin/categories', Icon: Icon.Tag },
              { title: 'Types POI', href: '/admin/poi-types', Icon: Icon.Pin },
            ].map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-lg px-4 py-2.5 flex items-center gap-2 transition group"
              >
                <mod.Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition" />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{mod.title}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
