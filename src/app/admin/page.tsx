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
    { count: pendingRequestsCount },
    { count: inProgressRequestsCount },
    { data: recentRequests },
    { count: activeStaysCount },
  ] = await Promise.all([
    supabase.from('food_spots').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('spot_type', 'restaurant'),
    supabase.from('entertainments').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('is_daily_activity', true),
    supabase.from('entertainments').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('is_night_show', true),
    supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('customer_requests').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'pending'),
    supabase.from('customer_requests').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'in_progress'),
    supabase.from('customer_requests').select('id, title, status, priority, created_at, request_type:request_types(name, category)').eq('hotel_id', hotelId).in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(5),
    supabase.from('stays').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'active'),
  ])

  const totalRequests = (pendingRequestsCount || 0) + (inProgressRequestsCount || 0)

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Système opérationnel
              </span>
              <Link href="/" target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Icon.ExternalLink className="w-3.5 h-3.5" />
                Site client
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* KPIs opérationnels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`bg-white rounded-xl border p-5 ${totalRequests > 0 ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Demandes actives</span>
              <Icon.ClipboardList className={`w-4 h-4 ${totalRequests > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${totalRequests > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {totalRequests}
            </div>
            <div className="text-xs text-gray-500">
              {pendingRequestsCount || 0} en attente · {inProgressRequestsCount || 0} en cours
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Séjours actifs</span>
              <Icon.Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{activeStaysCount || 0}</div>
            <div className="text-xs text-gray-500">Clients actuellement présents</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contenu</span>
              <Icon.ChartBar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {(restaurantsCount || 0) + (activitiesCount || 0) + (showsCount || 0) + (suggestionsCount || 0)}
            </div>
            <div className="text-xs text-gray-500">
              {restaurantsCount || 0} restau · {activitiesCount || 0} activ · {showsCount || 0} spectacles
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacts</span>
              <Icon.Phone className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{contactsCount || 0}</div>
            <div className="text-xs text-gray-500">Numéros utiles publiés</div>
          </div>
        </div>

        {/* Demandes récentes + Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Demandes en attente */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Icon.Bell className="w-4 h-4 text-amber-500" />
                Demandes récentes
              </h2>
              <Link href="/admin/requests/maintenance" className="text-xs text-blue-600 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentRequests && recentRequests.length > 0 ? (
                recentRequests.map((req: any) => (
                  <Link
                    key={req.id}
                    href={`/admin/requests/${(req.request_type as any)?.category || 'maintenance'}/${req.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
                        {req.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(req.request_type as any)?.name} · {timeAgo(req.created_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[req.status] || ''}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <Icon.Save className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune demande en cours</p>
                </div>
              )}
            </div>
          </div>

          {/* Modules principaux */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Gestion du contenu</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { title: 'Demandes', href: '/admin/requests/maintenance', Icon: Icon.ClipboardList, count: totalRequests, accent: totalRequests > 0 ? 'border-amber-200 bg-amber-50' : '' },
                { title: 'Restaurants', href: '/admin/restaurants', Icon: Icon.Utensils, count: restaurantsCount || 0, accent: '' },
                { title: 'Activités', href: '/admin/activities', Icon: Icon.Activity, count: activitiesCount || 0, accent: '' },
                { title: 'Spectacles', href: '/admin/shows', Icon: Icon.Show, count: showsCount || 0, accent: '' },
                { title: 'Découvertes', href: '/admin/suggestions', Icon: Icon.Compass, count: suggestionsCount || 0, accent: '' },
                { title: 'Réception', href: '/admin/reception', Icon: Icon.Users, count: activeStaysCount || 0, accent: '' },
              ].map((mod) => (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`bg-white rounded-xl border p-4 hover:shadow-md transition group ${mod.accent || 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <mod.Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition" />
                    {mod.count > 0 && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {mod.count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition">{mod.title}</p>
                  <Icon.ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-1 group-hover:translate-x-0.5 transition" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { title: 'Hôtel', href: '/admin/hotel', Icon: Icon.Hotel },
              { title: 'Emplacements', href: '/admin/locations', Icon: Icon.Location },
              { title: 'Catégories', href: '/admin/categories', Icon: Icon.Tag },
              { title: 'Types POI', href: '/admin/poi-types', Icon: Icon.Pin },
              { title: 'Plan', href: '/admin/map-editor', Icon: Icon.Map },
            ].map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-300 transition flex items-center gap-3 group"
              >
                <mod.Icon className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-blue-500 transition" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{mod.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Accès demandes par catégorie */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon.ClipboardList className="w-4 h-4 text-gray-500" />
              Demandes par service
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { label: 'Maintenance', href: '/admin/requests/maintenance', Icon: Icon.Wrench },
              { label: 'Room Service', href: '/admin/requests/room-service', Icon: Icon.Utensils },
              { label: 'Housekeeping', href: '/admin/requests/housekeeping', Icon: Icon.SparklesCleaning },
              { label: 'Conciergerie', href: '/admin/requests/concierge', Icon: Icon.Concierge },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex flex-col items-center gap-2 px-6 py-5 hover:bg-gray-50 transition group"
              >
                <cat.Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
