'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import ImageUploader from '@/components/admin/ImageUploader'
import SuggestionImages from '@/components/suggestions/SuggestionImages'

export default function AdminSuggestionsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location_type: 'internal',
    address: '',
    phone: '',
    is_hotel_internal: true
  })

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
      // Charger les suggestions
      const { data: suggestionsData } = await supabase
        .from('suggestions')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            icon,
            color,
            text_color,
            bg_color
          ),
          images:suggestion_images(
            is_principal,
            image:image_id(
              url,
              alt_text
            )
          )
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })

      setSuggestions(suggestionsData || [])

      // Charger les catégories de suggestions
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('category_type', 'suggestion')
        .eq('is_active', true)
        .order('sort_order')

      setCategories(categoriesData || [])
      
      if (suggestionsData?.length && !selectedSuggestion) {
        setSelectedSuggestion(suggestionsData[0])
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ... (garder les fonctions CRUD existantes en remplaçant hotel.id par selectedHotelId)

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec le même pattern */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>✨</span> Gestion des découvertes
              {hotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses suggestions'
                : 'Gérez les activités, services et lieux à découvrir'}
            </p>
          </div>
          {selectedHotelId && (
            <button
              onClick={() => {
                resetForm()
                setSelectedSuggestion(null)
                setEditing(true)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
            >
              <span>➕</span>
              Nouvelle suggestion
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

        {/* Contenu conditionnel */}
        {selectedHotelId ? (
          // Afficher le contenu normal
          <div className="grid grid-cols-12 gap-6">
            {/* ... */}
          </div>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <div className="text-7xl mb-4">🏨</div>
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel pour gérer ses suggestions.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}