'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-browser'
import { useHotelData } from '@/hooks/useHotelData'
import { Icon } from '@/components/ui/Icons'

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
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
    setIsUserMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { name: 'Accueil', href: '/' },
    { name: 'Restaurants', href: '/restaurants' },
    { name: 'Carte', href: '/map' },
    { name: 'Contacts', href: '/contacts' },
  ]

  const animationItems = [
    { name: 'Activités', href: '/activities' },
    { name: 'Spectacles', href: '/shows' },
    { name: 'Découvertes', href: '/suggestions' },
  ]

  // Mobile nav — 4 items pour invités, 5 items pour client connecté
  const mobilePrimaryItems = [
    { name: 'Accueil', href: '/', icon: <HomeIcon /> },
    { name: 'Restaurants', href: '/restaurants', icon: <RestaurantIcon /> },
    { name: 'Animation', href: '/activities', icon: <AnimationIcon /> },
    ...(user && customer ? [{ name: 'Demandes', href: '/requests', icon: <RequestsIcon /> }] : []),
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

  // Nombre total de colonnes dans la barre mobile (items + bouton Plus)
  const mobileGridCols = mobilePrimaryItems.length + 1

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

  const avatarInitial = (customer?.full_name || user?.email || 'U')[0].toUpperCase()

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
              <div className="h-16 w-40 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition overflow-hidden relative">
                {hotel?.logo_url ? (
                  <Image src={hotel.logo_url} alt={hotel?.name ?? ''} fill sizes="160px" className="object-contain" />
                ) : (
                  <span className="text-5xl">🏨</span>
                )}
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-gray-700 text-sm">{hotel?.name || 'GuestsKit'}</span>
              </div>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${isActive(item.href) ? 'text-white shadow-md' : 'text-gray-700 hover:bg-[#F5EFED]'}
                  `}
                  style={isActive(item.href) ? { backgroundColor: '#E05947' } : undefined}
                >
                  {item.name}
                </Link>
              ))}

              {/* Dropdown Animation */}
              <div className="relative group">
                <button className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1
                  ${isAnimationActive ? 'text-white shadow-md' : 'text-gray-700 hover:bg-[#F5EFED]'}
                `}
                  style={isAnimationActive ? { backgroundColor: '#E05947' } : undefined}
                >
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
                      className="block px-4 py-2.5 text-sm transition font-medium"
                      style={isActive(item.href) ? { backgroundColor: '#FFF5F3', color: '#E05947' } : { color: '#374151' }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Zone utilisateur */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  {/* Demandes — desktop uniquement */}
                  {customer && (
                    <Link
                      href="/requests"
                      className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition border
                        ${isActive('/requests') ? 'text-white shadow-md border-transparent' : 'border-[#E8DEDA] hover:bg-[#F5EFED]'}
                      `}
                      style={isActive('/requests') ? { backgroundColor: '#E05947', color: 'white' } : { color: '#746865' }}
                    >
                      <RequestsIcon />
                      <span>Demandes</span>
                    </Link>
                  )}

                  {/* Déconnexion — desktop uniquement */}
                  <button
                    onClick={handleLogout}
                    aria-label="Se déconnecter"
                    className="hidden md:flex btn-secondary"
                  >
                    <Icon.LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>

                  {/* Avatar — click-controlled dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-label="Mon compte"
                      className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-[#E05947] transition-all duration-200 focus:outline-none"
                    >
                      {customer?.avatar_url && !avatarError ? (
                        <img
                          src={customer.avatar_url}
                          alt={customer.full_name || ''}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-sm font-semibold"
                          style={{ backgroundColor: '#E05947' }}
                        >
                          {avatarInitial}
                        </div>
                      )}
                    </button>

                    {/* Dropdown utilisateur */}
                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                          {/* Infos utilisateur */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">
                              {customer?.full_name || 'Administrateur'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            {customer && currentStay && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#16a34a' }}>
                                <Icon.Hotel className="w-3.5 h-3.5" />
                                Chambre {currentStay.room?.room_number || 'assignée'}
                                {currentStay.room?.room_type && (
                                  <span className="font-normal text-green-500 ml-1">{currentStay.room.room_type}</span>
                                )}
                              </div>
                            )}
                            {customer && !currentStay && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                                <Icon.Clock className="w-3.5 h-3.5" />
                                Séjour en attente
                              </div>
                            )}
                          </div>

                          {/* Liens */}
                          {customer && (
                            <Link
                              href="/requests"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-[#FFF5F3]"
                              style={{ color: '#1C1211' }}
                            >
                              <RequestsIcon />
                              Mes demandes
                            </Link>
                          )}
                          {customer && (
                            <Link
                              href="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                              Mon profil
                            </Link>
                          )}
                          {!customer && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition"
                            >
                              🔧 Administration
                            </Link>
                          )}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
                            >
                              <Icon.LogOut className="w-4 h-4" />
                              Déconnexion
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-primary">
                  <Icon.Key className="w-4 h-4" />
                  <span className="hidden sm:inline">Mon espace</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barre de navigation fixe — mobile uniquement */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div
          className="h-16"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${mobileGridCols}, minmax(0, 1fr))` }}
        >
          {mobilePrimaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
                ${isActive(item.href) || (item.href === '/activities' && isAnimationActive)
                  ? ''
                  : 'text-gray-400 hover:text-gray-700'
                }
              `}
              style={(isActive(item.href) || (item.href === '/activities' && isAnimationActive)) ? { color: '#E05947' } : undefined}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Bouton Plus */}
          <button
            onClick={() => setIsPlusOpen(!isPlusOpen)}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
              ${isPlusOpen ? '' : 'text-gray-400 hover:text-gray-700'}
            `}
            style={isPlusOpen ? { color: '#E05947' } : undefined}
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
                    ${isActive(item.href) ? '' : 'bg-[#F5EFED] text-gray-700 hover:bg-[#EDE7E5]'}
                  `}
                  style={isActive(item.href) ? { backgroundColor: '#FFF5F3', color: '#E05947' } : undefined}
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
