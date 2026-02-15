'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'

export default function MapEditorPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [points, setPoints] = useState<any[]>([])
  const [selectedPoint, setSelectedPoint] = useState<any>(null)
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const [poiTypes, setPoiTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        
        if (!hotelData) {
          setIsSuperAdmin(true)
          setSelectedHotelId(null)
          setLoading(false)
        } else {
          setIsSuperAdmin(false)
          setSelectedHotelId(hotelData.id)
          await loadData(hotelData.id)
        }
      } catch (error) {
        console.error('Erreur initialisation:', error)
        setLoading(false)
      }
    }
    init()
  }, [])

  // ============================================
  // CHARGEMENT QUAND UN HÔTEL EST SÉLECTIONNÉ
  // ============================================
  useEffect(() => {
    if (selectedHotelId) {
      loadData(selectedHotelId)
    }
  }, [selectedHotelId])

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

  // ... (garder les autres fonctions handleImageClick, savePosition, addPoint, deletePoint)

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span>🗺️</span> Éditeur de plan
            {hotel && !isSuperAdmin && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                - {hotel.name}
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            {isSuperAdmin 
              ? 'Mode Super Admin : sélectionnez un hôtel pour modifier son plan'
              : 'Positionnez vos points d\'intérêt sur chaque étage'}
          </p>
        </div>

        {/* Sélecteur d'hôtel pour super_admin */}
        {isSuperAdmin && (
          <HotelSelector
            onSelect={(hotelId) => setSelectedHotelId(hotelId)}
            selectedId={selectedHotelId}
            className="mb-6"
          />
        )}

        {/* Contenu principal */}
        {selectedHotelId ? (
          <>
            {/* Sélecteur d'étage */}
            {plans.length > 0 && (
              <div className="bg-white rounded-t-xl p-4 border-b border-gray-200">
                {/* ... contenu existant ... */}
              </div>
            )}

            {/* Zone principale */}
            <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
              {/* ... contenu existant ... */}
            </div>
          </>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <div className="text-7xl mb-4">🏨</div>
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel pour modifier son plan.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}