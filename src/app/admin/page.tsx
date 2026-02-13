// src/app/admin/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server-client'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  // ============================================
  // STATISTIQUES POUR LE DASHBOARD
  // ============================================
  
  // Restaurants
  const { count: restaurantsCount } = await supabase
    .from('food_spots')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)
    .eq('spot_type', 'restaurant')

  // Activités
  const { count: activitiesCount } = await supabase
    .from('entertainments')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)
    .eq('is_daily_activity', true)

  // Spectacles
  const { count: showsCount } = await supabase
    .from('entertainments')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)
    .eq('is_night_show', true)

  // Suggestions
  const { count: suggestionsCount } = await supabase
    .from('suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)

  // Contacts
  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)

  // Plans (étages)
  const { count: plansCount } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)
    .eq('is_active', true)

  // Catégories
  const { count: categoriesCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)
    .eq('is_active', true)

  // Types de POI
  const { count: poiTypesCount } = await supabase
    .from('poi_types')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', 1)
    .eq('is_active', true)

  // ============================================
  // MODULES D'ADMINISTRATION
  // ============================================
  
  const adminModules = [
    {
      title: 'Restaurants & Bars',
      description: 'Gérer les restaurants, bars et leurs menus',
      icon: '🍽️',
      href: '/admin/restaurants',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      count: restaurantsCount || 0
    },
    {
      title: 'Activités',
      description: 'Gérer les activités journalières et animations',
      icon: '🎭',
      href: '/admin/activities',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      count: activitiesCount || 0
    },
    {
      title: 'Spectacles',
      description: 'Gérer les spectacles nocturnes et soirées',
      icon: '🌟',
      href: '/admin/shows',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      count: showsCount || 0
    },
    {
      title: 'Découvertes',
      description: 'Gérer les suggestions et activités externes',
      icon: '✨',
      href: '/admin/suggestions',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      count: suggestionsCount || 0
    },
    {
      title: 'Contacts',
      description: 'Gérer les numéros utiles et services',
      icon: '📞',
      href: '/admin/contacts',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      count: contactsCount || 0
    },
    {
      title: 'Plan de l\'hôtel',
      description: 'Gérer les étages et points d\'intérêt',
      icon: '🗺️',
      href: '/admin/map-editor',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      count: plansCount || 0
    }
  ]

  // ============================================
  // MODULES DE CONFIGURATION
  // ============================================
  
  const configModules = [
    {
      title: 'Catégories',
      description: 'Gérer les catégories pour activités et découvertes',
      icon: '🏷️',
      href: '/admin/categories',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      count: categoriesCount || 0
    },
    {
      title: 'Types de POI',
      description: 'Gérer les types de points d\'intérêt du plan',
      icon: '📍',
      href: '/admin/poi-types',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      count: poiTypesCount || 0
    },
    {
      title: 'Hôtel',
      description: 'Configurer les informations de l\'établissement',
      icon: '🏨',
      href: '/admin/hotel',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Utilisateurs',
      description: 'Gérer les administrateurs (bientôt)',
      icon: '👥',
      href: '/admin/users',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== EN-TÊTE ===== */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
              🏨
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Administration GuestKit
              </h1>
              <p className="text-xl text-blue-100">
                Hôtel Paradis • Gérez tout le contenu de votre application
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DASHBOARD ===== */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ===== STATISTIQUES RAPIDES ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🍽️</div>
            <div className="text-2xl font-bold text-gray-800">{restaurantsCount || 0}</div>
            <div className="text-xs text-gray-500">Restaurants</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🎭</div>
            <div className="text-2xl font-bold text-gray-800">{activitiesCount || 0}</div>
            <div className="text-xs text-gray-500">Activités</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🌟</div>
            <div className="text-2xl font-bold text-gray-800">{showsCount || 0}</div>
            <div className="text-xs text-gray-500">Spectacles</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-2xl font-bold text-gray-800">{suggestionsCount || 0}</div>
            <div className="text-xs text-gray-500">Découvertes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">📞</div>
            <div className="text-2xl font-bold text-gray-800">{contactsCount || 0}</div>
            <div className="text-xs text-gray-500">Contacts</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🗺️</div>
            <div className="text-2xl font-bold text-gray-800">{plansCount || 0}</div>
            <div className="text-xs text-gray-500">Étages</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🏷️</div>
            <div className="text-2xl font-bold text-gray-800">{categoriesCount || 0}</div>
            <div className="text-xs text-gray-500">Catégories</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">📍</div>
            <div className="text-2xl font-bold text-gray-800">{poiTypesCount || 0}</div>
            <div className="text-xs text-gray-500">Types POI</div>
          </div>
        </div>

        {/* ===== SECTION GESTION DE CONTENU ===== */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
          Gestion du contenu
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {adminModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} 
                    flex items-center justify-center text-white text-2xl
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    {module.icon}
                  </div>
                  {module.count > 0 && (
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {module.count} élément{module.count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                  {module.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>Gérer</span>
                  <span className="text-lg group-hover:translate-x-1 transition">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ===== SECTION CONFIGURATION ===== */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-gray-600 rounded-full"></span>
          Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {configModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className={`
                group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6
                ${module.href === '/admin/users' ? 'opacity-60 hover:opacity-100' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl ${module.bgColor} 
                  flex items-center justify-center text-2xl ${module.textColor}
                `}>
                  {module.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 group-hover:text-gray-600 transition">
                    {module.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {module.description}
                  </p>
                  {module.count !== undefined && (
                    <span className="text-xs font-medium text-gray-400 mt-1 block">
                      {module.count} élément{module.count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ===== ACTIONS RAPIDES ===== */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/restaurants?action=new"
              className="bg-white hover:bg-blue-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-blue-300"
            >
              <div className="text-3xl mb-2">➕</div>
              <div className="text-sm font-medium text-gray-700">Nouveau restaurant</div>
            </Link>
            <Link
              href="/admin/activities?action=new"
              className="bg-white hover:bg-blue-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-blue-300"
            >
              <div className="text-3xl mb-2">➕</div>
              <div className="text-sm font-medium text-gray-700">Nouvelle activité</div>
            </Link>
            <Link
              href="/admin/suggestions?action=new"
              className="bg-white hover:bg-blue-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-blue-300"
            >
              <div className="text-3xl mb-2">➕</div>
              <div className="text-sm font-medium text-gray-700">Nouvelle découverte</div>
            </Link>
            <Link
              href="/admin/map-editor"
              className="bg-white hover:bg-blue-50 rounded-xl p-4 text-center transition border border-gray-200 hover:border-blue-300"
            >
              <div className="text-3xl mb-2">📍</div>
              <div className="text-sm font-medium text-gray-700">Ajouter un point</div>
            </Link>
          </div>
        </div>

        {/* ===== INFORMATIONS SYSTÈME ===== */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium text-gray-700">Connecté en tant que Super Admin</span>
              <span className="text-gray-300">|</span>
              <Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline">
                Voir le site client
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                Version 1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}