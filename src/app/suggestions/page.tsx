// src/app/suggestions/page.tsx
import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'

export default async function SuggestionsPage() {
  const supabase = await createClient()
  
  // 1. Récupérer les catégories de l'hôtel
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('hotel_id', 1)
    .eq('category_type', 'suggestion')
    .eq('is_active', true)
    .order('sort_order')

  // 2. Récupérer toutes les suggestions avec leurs catégories
  const { data: suggestions, error } = await supabase
    .from('suggestions')
    .select(`
      *,
      category:categories!category_id(
        id, name, icon, color, bg_color, text_color
      )
    `)
    .eq('hotel_id', 1)
    .order('location_type', { ascending: false })
    .order('created_at', { ascending: false })

  // 3. Construire un map des catégories pour un accès facile
  const categoriesMap = new Map()
  categories?.forEach(cat => {
    categoriesMap.set(cat.name, {
      icon: cat.icon || '✨',
      color: cat.color || 'from-purple-500 to-purple-600',
      bg: cat.bg_color || 'bg-purple-50',
      text: cat.text_color || 'text-purple-700'
    })
  })

  // 4. Séparer interne/externe
  const internalSuggestions = suggestions?.filter(s => s.location_type === 'internal') || []
  const externalSuggestions = suggestions?.filter(s => s.location_type === 'external') || []

  // 5. Grouper par catégorie (dynamique)
  const groupByCategory = (items: any[]) => {
    return items.reduce((acc, item) => {
      const categoryName = item.category?.name || 'Autres'
      if (!acc[categoryName]) acc[categoryName] = []
      acc[categoryName].push(item)
      return acc
    }, {} as Record<string, any[]>)
  }

  const internalByCategory = groupByCategory(internalSuggestions)
  const externalByCategory = groupByCategory(externalSuggestions)

  // 6. Gestion des erreurs
  if (error) {
    console.error('Erreur Supabase:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">Impossible de charger les suggestions</p>
        </div>
      </div>
    )
  }

  // Fonction pour obtenir le style d'une catégorie
  const getCategoryStyle = (categoryName: string) => {
    const style = categoriesMap.get(categoryName)
    return style || {
      icon: '✨',
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Découvrez & Expérimentez
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl">
            Que vous cherchiez à vous détendre, vivre des sensations fortes ou explorer les environs, 
            nous avons sélectionné pour vous les meilleures expériences.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Message si aucune suggestion */}
        {(!suggestions || suggestions.length === 0) && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-7xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Aucune suggestion pour le moment
            </h2>
            <p className="text-gray-600 text-lg">
              Notre équipe prépare de belles découvertes pour agrémenter votre séjour.
            </p>
          </div>
        )}

        {/* ===== SERVICES INTERNES (HÔTEL) ===== */}
        {internalSuggestions.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                🏨
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Dans notre hôtel
                </h2>
                <p className="text-gray-600">
                  Des services exclusifs pour agrémenter votre séjour
                </p>
              </div>
            </div>

            {/* Affichage par catégorie - DYNAMIQUE */}
            {Object.entries(internalByCategory).map(([categoryName, items]) => {
              const style = getCategoryStyle(categoryName)
              
              return (
                <div key={categoryName} className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{style.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-700">
                      {categoryName}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {items.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        {/* Image placeholder avec catégorie dynamique */}
                        <div className={`h-40 bg-gradient-to-br ${style.color} relative flex items-center justify-center`}>
                          <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
                            {style.icon}
                          </span>
                          <div className="absolute top-3 right-3">
                            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                              ⭐ Sur place
                            </span>
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-5">
                          <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                            {suggestion.title}
                          </h4>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {suggestion.description}
                          </p>

                          <div className="space-y-2 text-sm">
                            {suggestion.address && (
                              <div className="flex items-start gap-2 text-gray-600">
                                <span className="text-gray-400 mt-0.5">📍</span>
                                <span className="flex-1">{suggestion.address}</span>
                              </div>
                            )}
                            
                            {suggestion.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-gray-400">📞</span>
                                <a 
                                  href={`tel:${suggestion.phone}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {suggestion.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Service disponible
                            </span>
                            <Link
                                href={`/suggestions/${suggestion.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                Plus d'infos
                                <span className="text-lg">→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===== SERVICES EXTERNES (ALENTOURS) ===== */}
        {externalSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                🗺️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Aux alentours
                </h2>
                <p className="text-gray-600">
                  Explorez les richesses de la région
                </p>
              </div>
            </div>

            {/* Affichage par catégorie - DYNAMIQUE */}
            {Object.entries(externalByCategory).map(([categoryName, items]) => {
              const style = getCategoryStyle(categoryName)
              
              return (
                <div key={categoryName} className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{style.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-700">
                      {categoryName}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {items.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                      >
                        <div className={`h-36 bg-gradient-to-br ${style.color} bg-opacity-90 relative flex items-center justify-center`}>
                          <span className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                            {style.icon}
                          </span>
                          <div className="absolute top-3 right-3">
                            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                              🚗 {Math.floor(Math.random() * 20) + 5} min
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-600 transition">
                            {suggestion.title}
                          </h4>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {suggestion.description}
                          </p>

                          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                            {suggestion.address && (
                              <div className="flex items-start gap-2 text-gray-700">
                                <span className="text-gray-500 mt-0.5">📍</span>
                                <span className="flex-1 text-xs">{suggestion.address}</span>
                              </div>
                            )}
                            
                            {suggestion.phone && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-gray-500">📞</span>
                                <a 
                                  href={`tel:${suggestion.phone}`}
                                  className="text-amber-600 hover:underline text-xs"
                                >
                                  {suggestion.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="mt-4">
                            <Link
                                href={`/suggestions/${suggestion.id}`}
                                className="w-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                <span>🔍</span>
                                Voir détails
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Conseil de la conciergerie */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              💎
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Besoin d'un conseil personnalisé ?
              </h3>
              <p className="text-gray-600">
                Notre équipe de conciergerie est à votre disposition pour organiser vos sorties, 
                réserver vos activités ou vous recommander les meilleures adresses.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
                <span>📞</span>
                Poste 122
              </div>
              <span className="text-xs text-gray-500">24h/24 - 7j/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}