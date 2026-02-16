'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hotel, setHotel] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createClient()
  
  // 🔴 NE PAS AFFICHER SUR LES PAGES ADMIN
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // ============================================
  // CHARGER LES INFORMATIONS DE L'HÔTEL - DYNAMIQUE
  // ============================================
  useEffect(() => {
    const getHotel = async () => {
      // Pour l'instant on prend l'hôtel par défaut (ID 1)
      // Plus tard, on détectera le sous-domaine
      const hotelId = 1
      
      const { data } = await supabase
        .from('hotels')
        .select('name, slug, logo_url, primary_color, secondary_color')
        .eq('id', hotelId)
        .single()
      
      setHotel(data)
    }
    getHotel()
  }, [supabase])

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

  const navItems = [
    { name: 'Accueil', href: '/', icon: '🏠' },
    { name: 'Restaurants', href: '/restaurants', icon: '🍽️' },
    { name: 'Activités', href: '/activities', icon: '🎭' },
    { name: 'Spectacles', href: '/shows', icon: '🌟' },
    { name: 'Découvertes', href: '/suggestions', icon: '✨' },
    { name: 'Plan', href: '/map', icon: '🗺️' },
    { name: 'Contacts', href: '/contacts', icon: '📞' }
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === href
    return pathname?.startsWith(href)
  }

  return (
    <header className={`
      sticky top-0 z-50 w-full transition-all duration-300
      ${isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' 
        : 'bg-white shadow-sm py-4'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo et nom de l'hôtel - DYNAMIQUE */}
<Link href="/" className="flex items-center gap-3 group">
  <div 
    className="w-40 h-20 rounded-xl flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-105 transition"
    style={{ backgroundColor: 'transparent' }}
  >
    {hotel?.logo_url ? (
      <img src={hotel.logo_url} alt={hotel?.name} className="w-40 h-20 object-contain" />
    ) : (
      <span className="text-3xl">🏨</span>
    )}
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
          </nav>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
              📱
            </button>
            <button className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium">
              <span>🇫🇷</span>
              <span className="hidden xl:inline">FR</span>
            </button>
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                👤
              </div>
              <span className="text-sm font-medium text-gray-700 hidden xl:block">Chambre 101</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
          >
            <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
            <span className="text-sm font-medium text-gray-700">Menu</span>
          </button>
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
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    👤
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {hotel?.name || 'Hôtel Paradis'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {hotel?.slug ? `${hotel.slug}.guestskit.app` : 'Chambre 101'}
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-600 hover:text-blue-600">
                  📱 QR Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}