'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-browser'
import { useHotelData } from '@/hooks/useHotelData'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  
  // ✅ Utilisation du hook client
  const { hotel, user, customer, currentStay, loading } = useHotelData()
  
  // 🔴 NE PAS AFFICHER SUR LES PAGES ADMIN
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le menu mobile
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { name: 'Accueil', href: '/', icon: '🏠' },
    { name: 'Restaurants', href: '/restaurants', icon: '🍽️' },
    { name: 'Demandes', href: '/requests', icon: '📋' },
    { name: 'Carte', href: '/map', icon: '🗺️' },
    { name: 'Contacts', href: '/contacts', icon: '📞' }
  ]

  const animationItems = [
    { name: 'Activités', href: '/activities', icon: '🎭' },
    { name: 'Spectacles', href: '/shows', icon: '🌟' },
    { name: 'Découvertes', href: '/suggestions', icon: '✨' },
  ]


  const isActive = (href: string) => {
    if (href === '/') return pathname === href
    return pathname?.startsWith(href)
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="hidden sm:block">
                <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`
      sticky top-0 z-50 w-full transition-all duration-300
      ${isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
        : 'bg-white shadow-sm py-3'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo et nom de l'hôtel - DYNAMIQUE */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
                className="h-16 w-40 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition overflow-hidden"
              >
                {hotel?.logo_url ? (
                  <img
                    src={hotel.logo_url}
                    alt={hotel?.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-5xl">🏨</span>
                )}
              </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-gray-700 text-sm">
                {hotel?.name || 'GuestSkit'}
              </span>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  flex items-center gap-2
                  ${isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {isActive(item.href) && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full ml-1" />
                )}
              </Link>
            ))}

            {/* Dropdown Animation */}
            <div className="relative group">
              <button className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                flex items-center gap-2
                ${animationItems.some(i => pathname?.startsWith(i.href))
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}>
                <span>🎭</span>
                <span>Animation</span>
                <span className="text-xs">▾</span>
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                {animationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Zone utilisateur */}
          <div className="flex items-center gap-3">
            {user ? (
              // Utilisateur connecté (admin OU client)
              <div className="flex items-center gap-3">
                {/* Statut du séjour - UNIQUEMENT pour les clients avec séjour */}
                {customer && currentStay && (
                  <div className="hidden md:block">
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                      <span className="text-green-600 text-sm font-medium">
                        🏨 Chambre {currentStay.room?.room_number || 'assignée'}
                      </span>
                      <span className="text-xs text-green-500">
                        {currentStay.room?.room_type || ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Statut "en attente" - UNIQUEMENT pour les clients sans séjour */}
                {customer && !currentStay && (
                  <div className="hidden md:block">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <span className="text-amber-600 text-sm font-medium animate-pulse">
                        ⏳ Séjour en attente
                      </span>
                      <span className="text-xs text-amber-500">
                        Présentez-vous à la réception
                      </span>
                    </div>
                  </div>
                )}

                {/* Bouton de déconnexion - TOUJOURS visible pour tout utilisateur connecté */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span className="hidden md:inline">Déconnexion</span>
                </button>

                {/* Avatar et menu utilisateur */}
                <div className="relative group">
                  <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition">
                    {customer?.avatar_url ? (
                      <img 
                        src={customer.avatar_url} 
                        alt={customer.full_name || ''}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                        {(customer?.full_name || user?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                      {customer?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Compte'}
                    </span>
                  </button>

                  {/* Menu déroulant */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {customer?.full_name || 'Administrateur'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    
                    {/* Statut du séjour en mobile - uniquement pour clients */}
                    {customer && (
                      <div className="md:hidden px-4 py-2 border-b">
                        {currentStay ? (
                          <p className="text-sm text-green-600">
                            🏨 Chambre {currentStay.room?.room_number}
                          </p>
                        ) : (
                          <p className="text-sm text-amber-600">
                            ⏳ Séjour en attente
                          </p>
                        )}
                      </div>
                    )}

                    {/* Liens pour les clients */}
                    {customer && (
                      <>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          Mon profil
                        </Link>
                        
                        {currentStay && (
                          <Link
                            href={`/stays/${currentStay.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                          >
                            Mon séjour
                          </Link>
                        )}
                        
                        <Link
                          href="/requests"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          Mes demandes
                        </Link>
                      </>
                    )}

                    {/* Lien vers admin pour les admins */}
                    {!customer && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition"
                      >
                        🔧 Administration
                      </Link>
                    )}

                    {/* Bouton déconnexion dans le menu mobile */}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition md:hidden"
                    >
                      🚪 Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Utilisateur non connecté
              <Link
                href="/login"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <span>🔑</span>
                <span>Mon espace</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
              <span className="text-sm font-medium text-gray-700">Menu</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 animate-slideDown">
            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    p-3 rounded-lg text-sm font-medium transition
                    flex flex-col items-center justify-center gap-1
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
            
            {/* Statut du séjour en mobile - uniquement pour clients */}
            {user && customer && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3">
                  {currentStay ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Chambre {currentStay.room?.room_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentStay.room?.room_type}
                        </p>
                      </div>
                      <Link
                        href={`/stays/${currentStay.id}`}
                        className="text-blue-600 text-sm"
                      >
                        Voir
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 text-center">
                      ⏳ Séjour en attente - Présentez-vous à la réception
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}