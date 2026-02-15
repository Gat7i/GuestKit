'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import ImageUploader from '@/components/admin/ImageUploader'
import RestaurantImages from '@/components/restaurants/RestaurantImages'
import Link from 'next/link'

export default function AdminRestaurantsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const supabase = createClient()

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        
        // Déterminer si c'est un super_admin (pas d'hôtel assigné)
        if (!hotelData) {
          setIsSuperAdmin(true)
          setSelectedHotelId(null)
          // Pour super_admin, on ne charge pas les données tout de suite
          // On attend la sélection d'un hôtel
          setLoading(false)
        } else {
          setIsSuperAdmin(false)
          setSelectedHotelId(hotelData.id)
          await loadRestaurants(hotelData.id)
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
      loadRestaurants(selectedHotelId)
    }
  }, [selectedHotelId])

  async function loadRestaurants(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('food_spots')
        .select(`
          *,
          images:food_spot_images(
            is_principal,
            image:image_id(
              url,
              alt_text
            )
          )
        `)
        .eq('hotel_id', hotelId)
        .eq('spot_type', 'restaurant')
        .order('name')
      
      setRestaurants(data || [])
      if (data?.length && !selectedRestaurant) {
        setSelectedRestaurant(data[0])
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateRestaurant() {
    if (!selectedRestaurant || !selectedHotelId) return

    try {
      const { error } = await supabase
        .from('food_spots')
        .update({
          name: selectedRestaurant.name,
          description: selectedRestaurant.description,
          opening_hours: selectedRestaurant.opening_hours,
          location: selectedRestaurant.location,
          menu_pdf_url: selectedRestaurant.menu_pdf_url
        })
        .eq('id', selectedRestaurant.id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error
      
      alert('✅ Restaurant mis à jour')
      setEditing(false)
      await loadRestaurants(selectedHotelId)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🍽️</div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🍽️</span> Gestion des restaurants
          {hotel && !isSuperAdmin && (
            <span className="text-lg font-normal text-gray-500 ml-2">
              - {hotel.name}
            </span>
          )}
        </h1>
        <p className="text-gray-600 mb-6">
          {isSuperAdmin 
            ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses restaurants'
            : 'Gérez les restaurants et leurs photos'}
        </p>

        {/* ===== SÉLECTEUR D'HÔTEL POUR SUPER ADMIN ===== */}
        {isSuperAdmin && (
          <HotelSelector
            onSelect={(hotelId) => setSelectedHotelId(hotelId)}
            selectedId={selectedHotelId}
            className="mb-6"
          />
        )}

        {/* ===== CONTENU PRINCIPAL (visible seulement si un hôtel est sélectionné) ===== */}
        {selectedHotelId ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Colonne 1 : Liste des restaurants */}
            <div className="col-span-3 bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 mb-4">Restaurants</h2>
              <div className="space-y-2">
                {restaurants.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Aucun restaurant
                  </p>
                ) : (
                  restaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setEditing(false)
                      }}
                      className={`
                        w-full text-left p-3 rounded-lg transition
                        ${selectedRestaurant?.id === restaurant.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div className="font-medium">{restaurant.name}</div>
                      <div className={`text-xs ${
                        selectedRestaurant?.id === restaurant.id
                          ? 'text-blue-200'
                          : 'text-gray-500'
                      }`}>
                        {restaurant.location || 'Emplacement non défini'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Colonne 2 : Édition et images */}
            <div className="col-span-9 space-y-6">
              {selectedRestaurant ? (
                <>
                  {/* Fiche restaurant (identique à avant) */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* ... contenu existant ... */}
                  </div>

                  {/* Gestion des images */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🖼️</span>
                      Photos du restaurant
                    </h3>

                    <RestaurantImages
                      foodSpotId={selectedRestaurant.id}
                      editable={true}
                      onImageUpdate={() => {
                        // Rafraîchir les images
                      }}
                    />

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Ajouter une photo
                      </h4>
                      <ImageUploader
                        hotelId={selectedHotelId}
                        foodSpotId={selectedRestaurant.id}
                        onImageUploaded={() => {
                          window.dispatchEvent(new CustomEvent('restaurantImageUpdate'))
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <p className="text-gray-500">
                    Sélectionnez un restaurant dans la liste
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Message si aucun hôtel sélectionné (pour super_admin)
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <div className="text-7xl mb-4">🏨</div>
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel dans la liste ci-dessus pour commencer à gérer ses restaurants.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}