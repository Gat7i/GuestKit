'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import Link from 'next/link'

// Types
type CategoryType = {
  id: number
  name: string
  category_type: string
  icon: string
  color: string
  bg_color: string
  text_color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

type CategoriesByType = Record<string, CategoryType[]>

export default function AdminCategoriesPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    category_type: 'suggestion',
    icon: '✨',
    color: 'from-purple-500 to-purple-600',
    bg_color: 'bg-purple-50',
    text_color: 'text-purple-700',
    sort_order: 0,
    is_active: true
  })

  const supabase = createClient()

  // Types de catégories disponibles
  const categoryTypes = [
    { value: 'suggestion', label: 'Découvertes', icon: '✨' },
    { value: 'activity', label: 'Activités', icon: '🎭' },
    { value: 'show', label: 'Spectacles', icon: '🌟' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' }
  ]

  // ... (garder les palettes de couleurs et icônes)

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
          await loadCategories(hotelData.id)
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
      loadCategories(selectedHotelId)
    }
  }, [selectedHotelId])

  async function loadCategories(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('category_type')
        .order('sort_order')
        .order('name')

      setCategories(data || [])
      
      if (data?.length && !selectedCategory) {
        setSelectedCategory(data[0])
        setFormData({
          name: data[0].name || '',
          category_type: data[0].category_type || 'suggestion',
          icon: data[0].icon || '✨',
          color: data[0].color || 'from-purple-500 to-purple-600',
          bg_color: data[0].bg_color || 'bg-purple-50',
          text_color: data[0].text_color || 'text-purple-700',
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
              <span>🏷️</span> Gestion des catégories
              {hotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses catégories'
                : 'Créez et personnalisez les catégories'}
            </p>
          </div>
          {selectedHotelId && (
            <button
              onClick={() => {
                resetForm()
                setSelectedCategory(null)
                setEditing(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
            >
              <span>➕</span>
              Nouvelle catégorie
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
          <>
            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              {/* ... */}
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Colonne 1 : Liste des catégories */}
              <div className="col-span-4 bg-white rounded-xl shadow-sm p-4">
                {/* ... */}
              </div>

              {/* Colonne 2 : Édition */}
              <div className="col-span-8">
                {/* ... */}
              </div>
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
                Veuillez sélectionner un hôtel pour gérer ses catégories.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}