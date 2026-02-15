'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import Link from 'next/link'

export default function AdminPoiTypesPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [poiTypes, setPoiTypes] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    type_key: '',
    name: '',
    icon: '📍',
    color: 'bg-gray-500',
    text_color: 'text-gray-700',
    bg_color: 'bg-gray-50',
    sort_order: 0,
    is_active: true
  })

  const supabase = createClient()

  // Palettes de couleurs pour les POI
  const colorPalettes = [
    // ... (garder les palettes)
  ]

  // Icônes populaires pour les POI
  const popularIcons = [
    // ... (garder les icônes)
  ]

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
          await loadPoiTypes(hotelData.id)
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
      loadPoiTypes(selectedHotelId)
    }
  }, [selectedHotelId])

  async function loadPoiTypes(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('poi_types')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('sort_order')
        .order('name')

      setPoiTypes(data || [])
      
      if (data?.length && !selectedType) {
        setSelectedType(data[0])
        setFormData({
          type_key: data[0].type_key || '',
          name: data[0].name || '',
          icon: data[0].icon || '📍',
          color: data[0].color || 'bg-gray-500',
          text_color: data[0].text_color || 'text-gray-700',
          bg_color: data[0].bg_color || 'bg-gray-50',
          sort_order: data[0].sort_order || 0,
          is_active: data[0].is_active !== false
        })
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ... (garder les fonctions CRUD en remplaçant hotel.id par selectedHotelId)

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>📍</span> Types de points d'intérêt
              {hotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses types de POI'
                : 'Définissez les types de lieux affichés sur le plan'}
            </p>
          </div>
          {selectedHotelId && (
            <button
              onClick={() => {
                resetForm()
                setSelectedType(null)
                setEditing(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
            >
              <span>➕</span>
              Nouveau type
            </button>
          )}
        </div>

        {/* Sélecteur d'hôtel */}
        {isSuperAdmin && (
          <HotelSelector
            onSelect={(hotelId) => setSelectedHotelId(hotelId)}
            selectedId={selectedHotelId}
            className="mb-6"
          />
        )}

        {/* Contenu principal */}
        {selectedHotelId ? (
          <div className="grid grid-cols-12 gap-6">
            {/* ... (garder le contenu existant) */}
          </div>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <div className="text-7xl mb-4">🏨</div>
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel pour gérer ses types de points d'intérêt.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}