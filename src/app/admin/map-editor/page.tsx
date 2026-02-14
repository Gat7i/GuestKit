'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'

export default function MapEditorPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [points, setPoints] = useState<any[]>([])
  const [selectedPoint, setSelectedPoint] = useState<any>(null)
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const [poiTypes, setPoiTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const init = async () => {
      const hotelData = await getCurrentHotelClient()
      setHotel(hotelData)
      if (hotelData) {
        await loadData(hotelData.id)
      }
    }
    init()
  }, [])

  async function loadData(hotelId: number) {
    setLoading(true)
    try {
      // Charger les plans/étages
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('floor_level')
      
      setPlans(plansData || [])
      if (plansData?.length) {
        setSelectedPlan(plansData[0])
        await loadPoints(plansData[0].id)
      }

      // Charger les types de points d'intérêt
      const { data: typesData } = await supabase
        .from('poi_types')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('sort_order')
      
      setPoiTypes(typesData || [])
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPoints(planId: number) {
    const { data } = await supabase
      .from('map_points')
      .select(`
        *,
        poi_type:poi_type_id(
          id, type_key, name, icon, color, text_color, bg_color
        )
      `)
      .eq('plan_id', planId)
      .eq('is_active', true)
      .order('sort_order')
    
    setPoints(data || [])
  }

  // ============================================
  // GESTION DES CLICS SUR L'IMAGE
  // ============================================
  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    setPosition({ 
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000
    })
  }

  // ============================================
  // CRUD POINTS D'INTÉRÊT
  // ============================================
async function savePosition() {
  if (!selectedPoint) {
    alert('Sélectionnez d\'abord un point à déplacer')
    return
  }
  if (!hotel) {
    alert('Hôtel non identifié')
    return
  }

  setLoading(true)
  try {
    // Vérifier que le point appartient bien à l'hôtel
    const { data: pointCheck } = await supabase
      .from('map_points')
      .select('plan_id')
      .eq('id', selectedPoint.id)
      .single()

    if (pointCheck) {
      const { data: planCheck } = await supabase
        .from('plans')
        .select('hotel_id')
        .eq('id', pointCheck.plan_id)
        .single()

      if (planCheck?.hotel_id !== hotel.id) {
        alert('Action non autorisée')
        return
      }
    }

    const { error } = await supabase
      .from('map_points')
      .update({ 
        coordinates_x: position.x,
        coordinates_y: position.y
      })
      .eq('id', selectedPoint.id)

    if (error) throw error
    
    alert('✅ Position mise à jour')
    if (selectedPlan) await loadPoints(selectedPlan.id)
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    alert('❌ Erreur lors de la mise à jour')
  } finally {
    setLoading(false)
  }
}

async function addPoint() {
  if (!selectedPlan) {
    alert('Sélectionnez d\'abord un étage')
    return
  }
  if (!hotel) {
    alert('Hôtel non identifié')
    return
  }

  const selectedType = poiTypes.find(t => t.id === selectedPoint?.poi_type_id)
  if (!selectedType) {
    alert('Sélectionnez d\'abord un type de point')
    return
  }

  setLoading(true)
  try {
    // Vérifier que le plan appartient à l'hôtel
    const { data: planCheck } = await supabase
      .from('plans')
      .select('hotel_id')
      .eq('id', selectedPlan.id)
      .single()

    if (planCheck?.hotel_id !== hotel.id) {
      alert('Action non autorisée')
      return
    }

    const { data, error } = await supabase
      .from('map_points')
      .insert({
        hotel_id: hotel.id,
        plan_id: selectedPlan.id,
        poi_type_id: selectedType.id,
        name: `Nouveau ${selectedType.name}`,
        coordinates_x: position.x,
        coordinates_y: position.y,
        sort_order: points.length + 1,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    
    alert('✅ Point ajouté')
    await loadPoints(selectedPlan.id)
    setSelectedPoint(data)
  } catch (error) {
    console.error('Erreur ajout:', error)
    alert('❌ Erreur lors de l\'ajout')
  } finally {
    setLoading(false)
  }
}

async function deletePoint(id: number) {
  if (!confirm('Supprimer ce point d\'intérêt ?')) return
  if (!hotel) return

  setLoading(true)
  try {
    // 1. Récupérer d'abord les IDs des plans de l'hôtel
    const { data: hotelPlans } = await supabase
      .from('plans')
      .select('id')
      .eq('hotel_id', hotel.id)

    if (!hotelPlans || hotelPlans.length === 0) {
      alert('Aucun plan trouvé pour cet hôtel')
      return
    }

    const planIds = hotelPlans.map(p => p.id)

    // 2. Supprimer le point si son plan_id est dans la liste
    const { error } = await supabase
      .from('map_points')
      .delete()
      .eq('id', id)
      .in('plan_id', planIds)

    if (error) throw error
    
    alert('✅ Point supprimé')
    if (selectedPlan) await loadPoints(selectedPlan.id)
    if (selectedPoint?.id === id) setSelectedPoint(null)
  } catch (error) {
    console.error('Erreur suppression:', error)
    alert('❌ Erreur lors de la suppression')
  } finally {
    setLoading(false)
  }
}

  // ============================================
  // RENDU
  // ============================================
  if (loading && !plans.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🗺️</div>
          <p className="text-gray-600">Chargement des plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===== EN-TÊTE ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span>🗺️</span> Éditeur de plan
            {hotel && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                - {hotel.name}
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Positionnez vos points d'intérêt sur chaque étage
          </p>
        </div>

        {/* ===== SÉLECTEUR D'ÉTAGE AU DESSUS DE L'IMAGE ===== */}
        <div className="bg-white rounded-t-xl p-4 border-b border-gray-200">
          <div className="flex items-center gap-4 overflow-x-auto pb-1">
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">
              Étage :
            </span>
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={async () => {
                  setSelectedPlan(plan)
                  await loadPoints(plan.id)
                  setSelectedPoint(null)
                }}
                className={`
                  flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition
                  ${selectedPlan?.id === plan.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* ===== ZONE PRINCIPALE : IMAGE À GAUCHE, LISTE À DROITE ===== */}
        <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            
            {/* ===== COLONNE GAUCHE : IMAGE (2/3) ===== */}
            <div className="lg:col-span-2 p-6">
              {selectedPlan ? (
                <div className="space-y-4">
                  {/* Nom de l'étage sélectionné */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedPlan.name}
                    </h2>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                      {points.length} point{points.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Image avec overlay et points */}
                  <div className="relative border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                    <img
                      src={selectedPlan.image_url}
                      alt={selectedPlan.name}
                      className="w-full h-auto max-h-[70vh] object-contain cursor-crosshair"
                      onClick={handleImageClick}
                      style={{
                        minHeight: '400px',
                        maxHeight: '70vh'
                      }}
                    />
                    
                    {/* Grille d'aide (10% x 10%) */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '10% 10%'
                      }}
                    />
                    
                    {/* Points d'intérêt existants */}
                    {points.map((point) => (
                      <button
                        key={point.id}
                        onClick={() => {
                          setSelectedPoint(point)
                          setPosition({
                            x: point.coordinates_x,
                            y: point.coordinates_y
                          })
                        }}
                        className="absolute w-8 h-8 -ml-4 -mt-4 group"
                        style={{
                          left: `${point.coordinates_x * 100}%`,
                          top: `${point.coordinates_y * 100}%`
                        }}
                      >
                        <div className={`
                          ${point.poi_type?.color || 'bg-gray-500'}
                          w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
                          border-2 border-white shadow-lg
                          transition-all duration-200
                          ${selectedPoint?.id === point.id 
                            ? 'ring-4 ring-yellow-400 scale-125' 
                            : 'group-hover:scale-110'
                          }
                        `}>
                          {point.poi_type?.icon || '📍'}
                        </div>
                        
                        {/* Tooltip au survol */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 
                                      bg-gray-900 text-white text-xs rounded px-2 py-1 
                                      whitespace-nowrap opacity-0 group-hover:opacity-100 
                                      transition-opacity pointer-events-none z-50">
                          {point.name}
                        </div>
                      </button>
                    ))}

                    {/* Curseur de position actuelle */}
                    <div
                      className="absolute w-10 h-10 -ml-5 -mt-5 pointer-events-none"
                      style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
                    >
                      <div className="w-10 h-10 bg-yellow-400 rounded-full opacity-50 animate-ping" />
                      <div className="absolute inset-0 w-10 h-10 bg-yellow-400 rounded-full opacity-75" />
                    </div>
                  </div>

                  {/* Contrôles de position */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position X ({position.x})
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.001"
                          value={position.x}
                          onChange={(e) => setPosition({ 
                            ...position, 
                            x: parseFloat(e.target.value) 
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position Y ({position.y})
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.001"
                          value={position.y}
                          onChange={(e) => setPosition({ 
                            ...position, 
                            y: parseFloat(e.target.value) 
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={savePosition}
                        disabled={!selectedPoint || loading}
                        className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                      >
                        {loading ? '⏳' : '📍'} Mettre à jour
                      </button>
                      <button
                        onClick={addPoint}
                        disabled={!selectedPoint || loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                      >
                        {loading ? '⏳' : '➕'} Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p>Aucun étage disponible</p>
                </div>
              )}
            </div>

            {/* ===== COLONNE DROITE : LISTE DES POINTS (1/3) ===== */}
            <div className="p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">📍</span>
                Points d'intérêt
                {selectedPlan && (
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {points.length}
                  </span>
                )}
              </h3>
              
              {/* Sélecteur de type de point */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Ajouter un nouveau point
                </label>
                <select
                  onChange={(e) => {
                    const typeId = parseInt(e.target.value)
                    const type = poiTypes.find(t => t.id === typeId)
                    if (type) {
                      setSelectedPoint({
                        poi_type_id: type.id,
                        poi_type: type,
                        name: `Nouveau ${type.name}`
                      })
                    }
                  }}
                  value={selectedPoint?.poi_type_id || ''}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">Choisir un type...</option>
                  {poiTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Liste des points */}
              {!selectedPlan ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Sélectionnez un étage
                </p>
              ) : points.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-gray-500 text-sm mb-1">Aucun point</p>
                  <p className="text-xs text-gray-400">
                    Cliquez sur l'image puis ajoutez
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {points.map((point) => (
                    <div
                      key={point.id}
                      className={`
                        relative group rounded-lg transition
                        ${selectedPoint?.id === point.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <button
                        onClick={() => {
                          setSelectedPoint(point)
                          setPosition({
                            x: point.coordinates_x,
                            y: point.coordinates_y
                          })
                        }}
                        className="w-full text-left p-3 pr-10"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`
                            ${point.poi_type?.color || 'bg-gray-500'}
                            w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5
                          `}>
                            {point.poi_type?.icon || '📍'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {point.name}
                            </div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 mt-0.5">
                              <span>{point.poi_type?.name}</span>
                              <span>•</span>
                              <span className="font-mono">
                                ({point.coordinates_x}, {point.coordinates_y})
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Bouton supprimer */}
                      <button
                        onClick={() => deletePoint(point.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 
                                 text-red-600 hover:text-red-800 
                                 opacity-0 group-hover:opacity-100 transition
                                 bg-white rounded-full p-1 shadow-sm hover:bg-red-50"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Comment faire :</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Cliquez sur l'image pour positionner</li>
                      <li>Choisissez un type de point</li>
                      <li>Cliquez sur "Ajouter"</li>
                      <li>Ou déplacez un point existant</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}