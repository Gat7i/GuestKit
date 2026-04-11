'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import { Icon } from '@/components/ui/Icons'

interface CategoryCount {
  maintenance: number
  'room-service': number
  housekeeping: number
  concierge: number
}

interface Stats {
  pending: number
  in_progress: number
  today: number
}

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [counts, setCounts] = useState<CategoryCount>({ maintenance: 0, 'room-service': 0, housekeeping: 0, concierge: 0 })
  const [stats, setStats] = useState<Stats>({ pending: 0, in_progress: 0, today: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const supabase = createClient()
        const hotel = await getCurrentHotelClient()
        if (!hotel?.id) return

        // Récupérer tous les types de demandes avec leur catégorie
        const { data: types } = await supabase
          .from('request_types')
          .select('id, category')

        if (!types) return

        // Requêtes actives (pending + in_progress) filtré par hôtel
        const { data: active } = await supabase
          .from('customer_requests')
          .select('id, status, request_type_id, created_at')
          .eq('hotel_id', hotel.id)
          .in('status', ['pending', 'in_progress'])

        if (!active) return

        const typeMap = new Map(types.map(t => [t.id, t.category]))
        const todayStr = new Date().toISOString().split('T')[0]

        const newCounts: CategoryCount = { maintenance: 0, 'room-service': 0, housekeeping: 0, concierge: 0 }
        let pendingCount = 0
        let inProgressCount = 0
        let todayCount = 0

        active.forEach(req => {
          const cat = typeMap.get(req.request_type_id)
          if (cat && cat in newCounts) {
            newCounts[cat as keyof CategoryCount]++
          }
          if (req.status === 'pending') pendingCount++
          if (req.status === 'in_progress') inProgressCount++
          if (req.created_at?.startsWith(todayStr)) todayCount++
        })

        setCounts(newCounts)
        setStats({ pending: pendingCount, in_progress: inProgressCount, today: todayCount })
      } catch (e) {
        console.error('Erreur chargement compteurs:', e)
      }
    }
    fetchCounts()
  }, [pathname]) // Recalcule quand on change d'onglet

  const categories = [
    {
      id: 'maintenance' as keyof CategoryCount,
      name: 'Maintenance',
      NavIcon: Icon.Wrench,
      color: 'from-orange-500 to-red-600',
      href: '/admin/requests/maintenance',
    },
    {
      id: 'room-service' as keyof CategoryCount,
      name: 'Room Service',
      NavIcon: Icon.Utensils,
      color: 'from-green-500 to-emerald-600',
      href: '/admin/requests/room-service',
    },
    {
      id: 'housekeeping' as keyof CategoryCount,
      name: 'Housekeeping',
      NavIcon: Icon.SparklesCleaning,
      color: 'from-blue-500 to-cyan-600',
      href: '/admin/requests/housekeeping',
    },
    {
      id: 'concierge' as keyof CategoryCount,
      name: 'Conciergerie',
      NavIcon: Icon.Concierge,
      color: 'from-purple-500 to-pink-600',
      href: '/admin/requests/concierge',
    },
  ]

  const statsItems = [
    { label: 'En attente',  count: stats.pending,     color: 'text-yellow-600' },
    { label: 'En cours',    count: stats.in_progress, color: 'text-blue-600' },
    { label: "Aujourd'hui", count: stats.today,       color: 'text-green-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0`}>
          {/* En-tête sidebar */}
          <div className="p-4 border-b flex items-center justify-between">
            {isSidebarOpen && (
              <h2 className="font-semibold text-gray-800 text-sm">Gestion des demandes</h2>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
              {isSidebarOpen
                ? <Icon.ChevronLeft className="w-4 h-4 text-gray-600" />
                : <Icon.ChevronRight className="w-4 h-4 text-gray-600" />}
            </button>
          </div>

          {/* Menu catégories */}
          <nav className="p-3 space-y-1">
            {categories.map(({ id, name, NavIcon, color, href }) => {
              const isActive = pathname === href
              const count = counts[id]
              return (
                <Link
                  key={id}
                  href={href}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition
                    ${isActive
                      ? `bg-gradient-to-r ${color} text-white shadow-md`
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <NavIcon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 font-medium text-sm">{name}</span>
                      {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isActive ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Statistiques rapides */}
          {isSidebarOpen && (
            <div className="p-4 border-t mt-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Aperçu
              </h3>
              <div className="space-y-2">
                {statsItems.map(({ label, count, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className={`font-semibold ${color}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
