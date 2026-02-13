'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import ImageUploader from '@/components/admin/ImageUploader'
import RestaurantImages from '@/components/restaurants/RestaurantImages'

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadRestaurants()
  }, [])

  async function loadRestaurants() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('food_spots')
        .select('*')
        .eq('hotel_id', 1)
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
    if (!selectedRestaurant) return

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

      if (error) throw error
      
      alert('✅ Restaurant mis à jour')
      setEditing(false)
      await loadRestaurants()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🍽️ Gestion des restaurants
        </h1>

        <div className="grid grid-cols-12 gap-6">
          
          {/* Colonne 1 : Liste des restaurants */}
          <div className="col-span-3 bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Restaurants</h2>
            <div className="space-y-2">
              {restaurants.map((restaurant) => (
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
              ))}
            </div>
          </div>

          {/* Colonne 2 : Édition et images */}
          <div className="col-span-9 space-y-6">
            {selectedRestaurant && (
              <>
                {/* Fiche restaurant */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedRestaurant.name}
                    </h2>
                    <button
                      onClick={() => setEditing(!editing)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        editing
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {editing ? '✅ En cours...' : '✏️ Modifier'}
                    </button>
                  </div>

                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du restaurant
                        </label>
                        <input
                          type="text"
                          value={selectedRestaurant.name}
                          onChange={(e) => setSelectedRestaurant({
                            ...selectedRestaurant,
                            name: e.target.value
                          })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={selectedRestaurant.description || ''}
                          onChange={(e) => setSelectedRestaurant({
                            ...selectedRestaurant,
                            description: e.target.value
                          })}
                          rows={4}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emplacement
                        </label>
                        <input
                          type="text"
                          value={selectedRestaurant.location || ''}
                          onChange={(e) => setSelectedRestaurant({
                            ...selectedRestaurant,
                            location: e.target.value
                          })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Horaires
                        </label>
                        <input
                          type="text"
                          value={selectedRestaurant.opening_hours || ''}
                          onChange={(e) => setSelectedRestaurant({
                            ...selectedRestaurant,
                            opening_hours: e.target.value
                          })}
                          placeholder="ex: 19h-22h30"
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Menu PDF (URL)
                        </label>
                        <input
                          type="url"
                          value={selectedRestaurant.menu_pdf_url || ''}
                          onChange={(e) => setSelectedRestaurant({
                            ...selectedRestaurant,
                            menu_pdf_url: e.target.value
                          })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={updateRestaurant}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          💾 Enregistrer
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-600">{selectedRestaurant.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">📍 Emplacement :</span>
                          <span className="ml-2 text-gray-800">
                            {selectedRestaurant.location || 'Non défini'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">🕐 Horaires :</span>
                          <span className="ml-2 text-gray-800">
                            {selectedRestaurant.opening_hours || 'Non défini'}
                          </span>
                        </div>
                        {selectedRestaurant.menu_pdf_url && (
                          <div className="col-span-2">
                            <span className="text-gray-500">📄 Menu :</span>
                            <a
                              href={selectedRestaurant.menu_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:underline"
                            >
                              Voir le menu PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                      hotelId={1}
                      foodSpotId={selectedRestaurant.id}
                      onImageUploaded={() => {
                        // Forcer le rechargement des images
                        const event = new CustomEvent('restaurantImageUpdate')
                        window.dispatchEvent(event)
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ La première image ajoutée sera automatiquement définie comme image principale.
                      Vous pourrez ensuite changer ce choix en survolant les images.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}