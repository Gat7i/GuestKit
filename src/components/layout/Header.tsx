'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-browser'
import { useHotelData } from '@/hooks/useHotelData'

// SVG icons for mobile bottom nav
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
  </svg>
)
const RestaurantIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
  </svg>
)
const AnimationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const RequestsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)
const DotsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
  </svg>
)

export default function Header() {
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const { hotel, user, customer, currentStay, loading } = useHotelData()

  if (pathname?.startsWith('/admin')) return null

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsPlusOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { name: 'Accueil', href: '/' },
    { name: 'Restaurants', href: '/restaurants' },
    { name: 'Demandes', href: '/requests' },
    { name: 'Carte', href: '/map' },
    { name: 'Contacts', href: '/contacts' },
  ]

  const animationItems = [
    { name: 'Activités', href: '/activities' },
    { name: 'Spectacles', href: '/shows' },
    { name: 'Découvertes', href: '/suggestions' },
  ]

  const mobilePrimaryItems = [
    { name: 'Accueil', href: '/', icon: <HomeIcon /> },
    { name: 'Restaurants', href: '/restaurants', icon: <RestaurantIcon /> },
    { name: 'Animation', href: '/activities', icon: <AnimationIcon /> },
    { name: 'Demandes', href: '/requests', icon: <RequestsIcon /> },
  ]

  const mobilePlusItems = [
    { name: 'Spectacles', href: '/shows', emoji: '🌟' },
    { name: 'Découvertes', href: '/suggestions', emoji: '✨' },
    { name: 'Carte', href: '/map', emoji: '🗺️' },
    { name: 'Contacts', href: '/contacts', emoji: '📞' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === href
    return pathname?.startsWith(href)
  }

  const isAnimationActive = animationItems.some(i => pathname?.startsWith(i.href))

  if (loading) {
    return (
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-16 w-40 bg-gray-200 rounded-xl animate-pulse" />
              <div className="hidden sm:block w-28 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className={`
        sticky top-0 z-50 w-full transition-all duration-300
        ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-white shadow-sm py-3'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-16 w-40 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition overflow-hidden">
                {hotel?.logo_url ? (
                  <img src={hotel.logo_url} alt={hotel?.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-5xl">🏨</span>
                )}
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-gray-700 text-sm">{hotel?.name || 'GuestKit'}</span>
              </div>
            </Link>

            {/* Navigation Desktop — texte seul */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.href) ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  {item.name}
                </Link>
              ))}

              {/* Dropdown Animation — texte seul */}
              <div className="relative group">
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1
                  ${isAnimationActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                `}>
                  Animation
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                  {animationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2.5 text-sm transition
                        ${isActive(item.href) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Zone utilisateur */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {customer && currentStay && (
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                        <span className="text-green-600 text-sm font-medium">
                          🏨 Chambre {currentStay.room?.room_number || 'assignée'}
                        </span>
                        <span className="text-xs text-green-500">{currentStay.room?.room_type || ''}</span>
                      </div>
                    </div>
                  )}
                  {customer && !currentStay && (
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <span className="text-amber-600 text-sm font-medium animate-pulse">⏳ Séjour en attente</span>
                        <span className="text-xs text-amber-500">Présentez-vous à la réception</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2"
                  >
                    <span>🚪</span>
                    <span className="hidden md:inline">Déconnexion</span>
                  </button>
                  <div className="relative group">
                    <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition">
                      {customer?.avatar_url ? (
                        <img src={customer.avatar_url} alt={customer.full_name || ''} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                          {(customer?.full_name || user?.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 hidden md:block">
                        {customer?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Compte'}
                      </span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{customer?.full_name || 'Administrateur'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      {customer && (
                        <>
                          <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">Mon profil</Link>
                          <Link href="/requests" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">Mes demandes</Link>
                        </>
                      )}
                      {!customer && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition">🔧 Administration</Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                >
                  <span>🔑</span>
                  <span className="hidden sm:inline">Mon espace</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barre de navigation fixe — mobile uniquement */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 h-16">
          {mobilePrimaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
                ${isActive(item.href) || (item.href === '/activities' && isAnimationActive)
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-700'
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Bouton Plus */}
          <button
            onClick={() => setIsPlusOpen(!isPlusOpen)}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
              ${isPlusOpen ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'}
            `}
          >
            <DotsIcon />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      {/* Panneau Plus */}
      {isPlusOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            onClick={() => setIsPlusOpen(false)}
          />
          <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 z-40 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-4 gap-3">
              {mobilePlusItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsPlusOpen(false)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition
                    ${isActive(item.href) ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
