'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/Icons'

type NavItem = { name: string; href: string; NavIcon: React.FC<{ className?: string }> }
type NavGroup = { id: string; name: string; NavIcon: React.FC<{ className?: string }>; items: NavItem[] }
type NavEntry = ({ single: true } & NavItem) | ({ single: false } & NavGroup)

export default function AdminHeader() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createClient()
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
        setProfile(data)
      }
    }
    getUser()
  }, [supabase])

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fermer le dropdown quand on change de page
  useEffect(() => {
    setOpenDropdown(null)
    setIsMenuOpen(false)
  }, [pathname])

  if (pathname === '/admin/login') return null
  if (!user) return null

  const navEntries: NavEntry[] = [
    { single: true,  name: 'Dashboard',  href: '/admin',                      NavIcon: Icon.Dashboard    },
    { single: true,  name: 'Réception',  href: '/admin/reception',            NavIcon: Icon.Users        },
    { single: true,  name: 'Demandes',   href: '/admin/requests/maintenance', NavIcon: Icon.ClipboardList },
    {
      single: false, id: 'animation', name: 'Animation', NavIcon: Icon.Activity,
      items: [
        { name: 'Activités',  href: '/admin/activities', NavIcon: Icon.Activity },
        { name: 'Spectacles', href: '/admin/shows',      NavIcon: Icon.Show     },
      ]
    },
    {
      single: false, id: 'services', name: 'Services', NavIcon: Icon.Utensils,
      items: [
        { name: 'Restaurants', href: '/admin/restaurants', NavIcon: Icon.Utensils },
        { name: 'Découvertes', href: '/admin/suggestions', NavIcon: Icon.Compass  },
        { name: 'Contacts',    href: '/admin/contacts',    NavIcon: Icon.Phone    },
      ]
    },
    {
      single: false, id: 'config', name: 'Configuration', NavIcon: Icon.Hotel,
      items: [
        { name: 'Hôtel',       href: '/admin/hotel',        NavIcon: Icon.Hotel    },
        { name: 'Plan',        href: '/admin/map-editor',   NavIcon: Icon.Map      },
        { name: 'Emplacements',href: '/admin/locations',    NavIcon: Icon.Location },
        { name: 'Catégories',  href: '/admin/categories',   NavIcon: Icon.Tag      },
        { name: 'Types POI',   href: '/admin/poi-types',    NavIcon: Icon.Pin      },
      ]
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href
    return pathname?.startsWith(href)
  }

  const isGroupActive = (items: NavItem[]) => items.some(i => isActive(i.href))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 group flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-7 h-7 rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition">
              <Icon.Hotel className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-gray-800 hidden sm:inline text-sm">GuestKit</span>
          </Link>

          {/* Navigation Desktop */}
          <nav ref={navRef} className="hidden lg:flex items-center gap-0.5">
            {navEntries.map((entry) => {
              if (entry.single) {
                const active = isActive(entry.href)
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <entry.NavIcon className="w-4 h-4" />
                    <span>{entry.name}</span>
                  </Link>
                )
              }

              // Dropdown group
              const groupActive = isGroupActive(entry.items)
              const isOpen = openDropdown === entry.id

              return (
                <div key={entry.id} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : entry.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      groupActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <entry.NavIcon className="w-4 h-4" />
                    <span>{entry.name}</span>
                    <Icon.ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[180px] z-50">
                      {entry.items.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                              active ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <item.NavIcon className="w-4 h-4 flex-shrink-0" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User + mobile toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.first_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm text-gray-600 hidden xl:inline">{profile?.first_name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition ml-1"
                title="Déconnexion"
              >
                <Icon.LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              {isMenuOpen
                ? <Icon.X className="w-5 h-5 text-gray-700" />
                : <Icon.Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 space-y-4">

            {/* Direct links */}
            <div className="grid grid-cols-3 gap-2">
              {navEntries.filter(e => e.single).map((entry) => {
                if (!entry.single) return null
                const active = isActive(entry.href)
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition ${
                      active ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <entry.NavIcon className="w-5 h-5" />
                    <span>{entry.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Grouped sections */}
            {navEntries.filter(e => !e.single).map((entry) => {
              if (entry.single) return null
              return (
                <div key={entry.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">{entry.name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {entry.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition ${
                            active ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <item.NavIcon className="w-5 h-5" />
                          <span className="text-center leading-tight">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2 text-sm"
              >
                <Icon.LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
