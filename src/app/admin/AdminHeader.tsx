'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: '📊' },
        { name: 'Restaurants', href: '/admin/restaurants', icon: '🍽️' },
        { name: 'Activités', href: '/admin/activities', icon: '🎭' },
        { name: 'Spectacles', href: '/admin/shows', icon: '🌟' },
        { name: 'Découvertes', href: '/admin/suggestions', icon: '✨' },
        { name: 'Plan', href: '/admin/map-editor', icon: '🗺️' },
        { name: 'Contacts', href: '/admin/contacts', icon: '📞' },
        { name: 'Hôtel', href: '/admin/hotel', icon: '🏨' }, // ← AJOUTEZ CETTE LIGNE
    ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href
    return pathname?.startsWith(href)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white">
              🏨
            </div>
            <span className="font-bold text-gray-800">GuestsKit Admin</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">
              Hôtel Paradis
            </span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                  ${isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Super Admin
              </span>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                👤
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    p-3 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1
                    ${isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}