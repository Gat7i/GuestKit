'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const categories = [
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: '🔧',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      href: '/admin/requests/maintenance'
    },
    {
      id: 'room-service',
      name: 'Room Service',
      icon: '🍽️',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      href: '/admin/requests/room-service'
    },
    {
      id: 'housekeeping',
      name: 'Housekeeping',
      icon: '🧹',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      href: '/admin/requests/housekeeping'
    },
    {
      id: 'concierge',
      name: 'Conciergerie',
      icon: '💎',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      href: '/admin/requests/concierge'
    }
  ]

  const stats = [
    { label: 'En attente', count: 0, color: 'text-yellow-600' },
    { label: 'En cours', count: 0, color: 'text-blue-600' },
    { label: 'Aujourd\'hui', count: 0, color: 'text-green-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
          {/* En-tête sidebar */}
          <div className="p-4 border-b flex items-center justify-between">
            {isSidebarOpen ? (
              <h2 className="font-semibold text-gray-800">Gestion des demandes</h2>
            ) : (
              <span className="text-xl mx-auto">📋</span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              {isSidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {/* Menu catégories */}
          <nav className="p-4 space-y-2">
            {categories.map((category) => {
              const isActive = pathname === category.href
              
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition
                    ${isActive
                      ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-xl">{category.icon}</span>
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 font-medium">{category.name}</span>
                      <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                        0
                      </span>
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Statistiques rapides */}
          {isSidebarOpen && (
            <div className="p-4 border-t mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Aperçu
              </h3>
              <div className="space-y-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{stat.label}</span>
                    <span className={`font-medium ${stat.color}`}>{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}