import { createClient } from '@/lib/supabase/server-client'
import Link from 'next/link'

export default async function MapPage() {
  const supabase = await createClient()
  
  // 1. Récupérer tous les types de points d'intérêt
  const { data: poiTypes } = await supabase
    .from('poi_types')
    .select('*')
    .eq('hotel_id', 1)
    .eq('is_active', true)
    .order('sort_order')

  // 2. Construire un map des POI types
  const poiTypesMap = new Map()
  poiTypes?.forEach(type => {
    poiTypesMap.set(type.type_key, {
      id: type.id,
      name: type.name,
      icon: type.icon || '📍',
      color: type.color || 'bg-gray-500',
      text: type.text_color || 'text-gray-700',
      bg: type.bg_color || 'bg-gray-50'
    })
  })

  // 3. Récupérer tous les plans/étages
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('hotel_id', 1)
    .eq('is_active', true)
    .order('sort_order')
    .order('floor_level')

  // 4. Récupérer tous les points d'intérêt
  const { data: points } = await supabase
    .from('map_points')
    .select(`
      *,
      poi_type:poi_type_id(
        type_key, name, icon, color, text_color, bg_color
      )
    `)
    .eq('hotel_id', 1)
    .eq('is_active', true)

  // 5. Grouper les points par plan
  const pointsByPlan = points?.reduce((acc, point) => {
    const planId = point.plan_id
    if (!acc[planId]) acc[planId] = []
    acc[planId].push(point)
    return acc
  }, {} as Record<number, any[]>)

  // 6. Étage actif par défaut (Rez-de-chaussée)
  const defaultPlan = plans?.find(p => p.floor_level === 0) || plans?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
              🗺️
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Plan de l'hôtel
              </h1>
              <p className="text-xl text-emerald-100">
                Repérez-vous facilement et découvrez tous nos services
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sélecteur d'étage - STICKY */}
        {plans && plans.length > 0 && (
          <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-xl shadow-sm p-2 mb-6 border border-gray-200">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300">
              {plans.map((plan) => {
                const isActive = defaultPlan?.id === plan.id
                const planPoints = pointsByPlan?.[plan.id] || []
                
                return (
                  <a
                    key={plan.id}
                    href={`#floor-${plan.floor_level}`}
                    className={`
                      flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition
                      ${isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {plan.name}
                      {planPoints.length > 0 && (
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${isActive ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'}
                        `}>
                          {planPoints.length}
                        </span>
                      )}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Légende des icônes */}
        {poiTypes && poiTypes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
              Légende
            </h3>
            <div className="flex flex-wrap gap-3">
              {poiTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-1.5 text-xs bg-gray-50 px-3 py-1.5 rounded-full">
                  <span className={`w-5 h-5 ${type.color} rounded-full flex items-center justify-center text-white text-[10px]`}>
                    {type.icon}
                  </span>
                  <span className="text-gray-700">{type.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans par étage */}
        {plans && plans.length > 0 ? (
          <div className="space-y-8">
            {plans.map((plan) => {
              const planPoints = pointsByPlan?.[plan.id] || []
              
              return (
                <section
                  key={plan.id}
                  id={`floor-${plan.floor_level}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden scroll-mt-24 border border-gray-200"
                >
                  {/* En-tête de l'étage */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xl">
                        🏨
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {plan.name}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {planPoints.length} point{planPoints.length > 1 ? 's' : ''} d'intérêt
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium">
                      Étage {plan.floor_level}
                    </span>
                  </div>

                  {/* Plan interactif - CORRIGÉ POUR OBJECT-CONTAIN */}
                  <div className="p-6 bg-gray-50">
                    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Image avec object-contain pour voir l'image en entier */}
                      <div className="relative flex items-center justify-center bg-gray-100" 
                           style={{ minHeight: '500px', maxHeight: '70vh' }}>
                        <img
                          src={plan.image_url}
                          alt={`Plan ${plan.name}`}
                          className="w-full h-auto max-h-[70vh] object-contain"
                          style={{ 
                            maxWidth: '100%',
                            display: 'block'
                          }}
                        />
                        
                        {/* Overlay léger pour meilleure lisibilité */}
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />

                        {/* Points d'intérêt */}
                        {planPoints.map((point: any) => {
                          const poiType = point.poi_type || {
                            icon: '📍',
                            color: 'bg-gray-500',
                            name: 'Point d\'intérêt'
                          }
                          
                          return (
                            <button
                              key={point.id}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                              style={{
                                left: `${point.coordinates_x * 100}%`,
                                top: `${point.coordinates_y * 100}%`
                              }}
                            >
                              {/* Point principal */}
                              <div className={`
                                ${poiType.color} w-10 h-10 md:w-12 md:h-12 
                                rounded-full flex items-center justify-center text-white text-xl md:text-2xl
                                shadow-lg border-2 border-white
                                group-hover:scale-110 transition-transform duration-200
                                cursor-pointer
                                relative z-10
                              `}>
                                {poiType.icon}
                              </div>

                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 
                                            bg-gray-900 text-white text-sm rounded-lg px-3 py-2 
                                            whitespace-nowrap opacity-0 group-hover:opacity-100 
                                            transition-opacity duration-200 pointer-events-none
                                            shadow-xl z-50 min-w-[150px]">
                                <div className="font-medium">{point.name}</div>
                                <div className="text-xs text-gray-300 mt-0.5">{poiType.name}</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1
                                              border-4 border-transparent border-t-gray-900" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Liste des points d'intérêt */}
                  {planPoints.length > 0 && (
                    <div className="px-6 pb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Points d'intérêt à cet étage :
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {planPoints.map((point: any) => {
                          const poiType = point.poi_type || {
                            icon: '📍',
                            color: 'bg-gray-500',
                            name: 'Point d\'intérêt'
                          }
                          
                          return (
                            <div
                              key={point.id}
                              className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm border border-gray-100 hover:border-emerald-200 transition"
                            >
                              <div className={`w-8 h-8 ${poiType.color} rounded-full flex items-center justify-center text-white text-sm flex-shrink-0`}>
                                {poiType.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {point.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {poiType.name}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Plan non disponible
            </h2>
            <p className="text-gray-600">
              Le plan de l'hôtel sera bientôt disponible.
            </p>
          </div>
        )}

        {/* Information accessible */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">♿</span>
            <div>
              <h3 className="font-medium mb-1">Accès pour personnes à mobilité réduite</h3>
              <p className="text-blue-700">
                L'ensemble de l'hôtel est accessible. Ascenseurs, rampes d'accès et toilettes adaptées 
                sont disponibles à tous les étages. N'hésitez pas à contacter la réception pour toute assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton d'aide */}
        <div className="mt-6 text-center">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md"
          >
            <span>🛎️</span>
            Besoin d'un renseignement ? Contactez la réception
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}