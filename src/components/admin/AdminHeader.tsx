'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*, roles(name)')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getUser()
  }, [supabase])

  // 🔴 NE PAS AFFICHER SUR LA PAGE DE LOGIN
  if (pathname === '/admin/login') {
    return null
  }

  // 🔴 NE PAS AFFICHER SI PAS CONNECTÉ
  if (!user) {
    return null
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Restaurants', href: '/admin/restaurants', icon: '🍽️' },
    { name: 'Activités', href: '/admin/activities', icon: '🎭' },
    { name: 'Spectacles', href: '/admin/shows', icon: '🌟' },
    { name: 'Découvertes', href: '/admin/suggestions', icon: '✨' },
    { name: 'Plan', href: '/admin/map-editor', icon: '🗺️' },
    { name: 'Contacts', href: '/admin/contacts', icon: '📞' },
    { name: 'Hôtel', href: '/admin/hotel', icon: '🏨' },
    { name: 'Catégories', href: '/admin/categories', icon: '🏷️' },
    { name: 'Types POI', href: '/admin/poi-types', icon: '📍' }
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition">
              🏨
            </div>
            <span className="font-bold text-gray-800 hidden sm:inline">GuestSkit Admin</span>
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
                    ? 'bg-blue-600 text-white shadow-sm'
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
                {profile?.first_name || 'Admin'}
              </span>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                {profile?.first_name?.[0] || 'A'}
              </div>
              
              {/* Bouton de déconnexion */}
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition flex items-center gap-1 ml-2"
              >
                <span>🚪</span>
                <span className="hidden xl:inline">Déconnexion</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-slideDown">
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
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
              >
                <span>🚪</span>
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}