'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import ImageUploader from '@/components/admin/ImageUploader'
import SuggestionImages from '@/components/suggestions/SuggestionImages'
import Link from 'next/link'

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
              id,
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
        setFormData({
          title: suggestionsData[0].title || '',
          description: suggestionsData[0].description || '',
          category_id: suggestionsData[0].category_id?.toString() || '',
          location_type: suggestionsData[0].location_type || 'internal',
          address: suggestionsData[0].address || '',
          phone: suggestionsData[0].phone || '',
          is_hotel_internal: suggestionsData[0].is_hotel_internal
        })
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // CRUD SUGGESTIONS
  // ============================================
  async function createSuggestion() {
    try {
      if (!formData.title || !formData.category_id) {
        alert('Veuillez remplir le titre et la catégorie')
        return
      }
      if (!selectedHotelId) {
        alert('Aucun hôtel sélectionné')
        return
      }

      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          hotel_id: selectedHotelId,
          title: formData.title,
          description: formData.description,
          category_id: parseInt(formData.category_id),
          location_type: formData.location_type,
          is_hotel_internal: formData.location_type === 'internal',
          address: formData.address || null,
          phone: formData.phone || null
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Suggestion créée avec succès !')
      setEditing(false)
      resetForm()
      await loadData(selectedHotelId)
      setSelectedSuggestion(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updateSuggestion() {
    if (!selectedSuggestion || !selectedHotelId) return

    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          title: formData.title,
          description: formData.description,
          category_id: parseInt(formData.category_id),
          location_type: formData.location_type,
          is_hotel_internal: formData.location_type === 'internal',
          address: formData.address || null,
          phone: formData.phone || null
        })
        .eq('id', selectedSuggestion.id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error

      alert('✅ Suggestion mise à jour')
      setEditing(false)
      await loadData(selectedHotelId)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  async function deleteSuggestion(id: number) {
    if (!confirm('Supprimer définitivement cette suggestion ?')) return
    if (!selectedHotelId) return

    try {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error

      alert('✅ Suggestion supprimée')
      await loadData(selectedHotelId)
      if (selectedSuggestion?.id === id) {
        setSelectedSuggestion(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  // ============================================
  // UTILS
  // ============================================
  function resetForm() {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      location_type: 'internal',
      address: '',
      phone: '',
      is_hotel_internal: true
    })
  }

  function startEdit(suggestion?: any) {
    if (suggestion) {
      setFormData({
        title: suggestion.title || '',
        description: suggestion.description || '',
        category_id: suggestion.category_id?.toString() || '',
        location_type: suggestion.location_type || 'internal',
        address: suggestion.address || '',
        phone: suggestion.phone || '',
        is_hotel_internal: suggestion.is_hotel_internal
      })
      setSelectedSuggestion(suggestion)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedSuggestion) {
      setFormData({
        title: selectedSuggestion.title || '',
        description: selectedSuggestion.description || '',
        category_id: selectedSuggestion.category_id?.toString() || '',
        location_type: selectedSuggestion.location_type || 'internal',
        address: selectedSuggestion.address || '',
        phone: selectedSuggestion.phone || '',
        is_hotel_internal: selectedSuggestion.is_hotel_internal
      })
    } else {
      resetForm()
    }
  }

  if (loading && !suggestions.length && selectedHotelId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">✨</div>
          <p className="text-gray-600">Chargement des suggestions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
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
          <div className="grid grid-cols-12 gap-6">
            
            {/* ===== COLONNE 1 : LISTE DES SUGGESTIONS ===== */}
            <div className="col-span-3 bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span>
                Suggestions
                <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {suggestions.length}
                </span>
              </h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {suggestions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    Aucune suggestion
                  </p>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        setSelectedSuggestion(suggestion)
                        setFormData({
                          title: suggestion.title || '',
                          description: suggestion.description || '',
                          category_id: suggestion.category_id?.toString() || '',
                          location_type: suggestion.location_type || 'internal',
                          address: suggestion.address || '',
                          phone: suggestion.phone || '',
                          is_hotel_internal: suggestion.is_hotel_internal
                        })
                        setEditing(false)
                      }}
                      className={`
                        w-full text-left p-3 rounded-lg transition
                        ${selectedSuggestion?.id === suggestion.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs
                          ${selectedSuggestion?.id === suggestion.id
                            ? 'bg-white/20 text-white'
                            : suggestion.category?.bg_color || 'bg-gray-200'
                          }
                        `}>
                          {suggestion.category?.icon || '✨'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {suggestion.title}
                          </div>
                          <div className={`text-xs ${
                            selectedSuggestion?.id === suggestion.id
                              ? 'text-white/80'
                              : 'text-gray-500'
                          }`}>
                            {suggestion.location_type === 'internal' ? '🏨 Hôtel' : '🗺️ Extérieur'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ===== COLONNE 2 : ÉDITION / DÉTAILS ===== */}
            <div className="col-span-9 space-y-6">
              {editing ? (
                // ===== FORMULAIRE D'ÉDITION =====
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    {selectedSuggestion ? '✏️ Modifier' : '➕ Nouvelle suggestion'}
                  </h2>

                  <div className="space-y-4">
                    {/* Type (interne/externe) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de service
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="location_type"
                            value="internal"
                            checked={formData.location_type === 'internal'}
                            onChange={(e) => setFormData({
                              ...formData,
                              location_type: e.target.value,
                              is_hotel_internal: true
                            })}
                            className="text-purple-600"
                          />
                          <span>🏨 Dans l'hôtel</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="location_type"
                            value="external"
                            checked={formData.location_type === 'external'}
                            onChange={(e) => setFormData({
                              ...formData,
                              location_type: e.target.value,
                              is_hotel_internal: false
                            })}
                            className="text-purple-600"
                          />
                          <span>🗺️ Aux alentours</span>
                        </label>
                      </div>
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({
                          ...formData,
                          category_id: e.target.value
                        })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                      >
                        <option value="">Sélectionner une catégorie...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Titre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({
                          ...formData,
                          title: e.target.value
                        })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="Ex: Spa L'Oasis"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          description: e.target.value
                        })}
                        rows={4}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="Décrivez cette activité/service..."
                      />
                    </div>

                    {/* Adresse (pour externe) */}
                    {formData.location_type === 'external' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: e.target.value
                          })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="123 rue Exemple, 06000 Nice"
                        />
                      </div>
                    )}

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          phone: e.target.value
                        })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="+33 4 93 12 34 56"
                      />
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={selectedSuggestion ? updateSuggestion : createSuggestion}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <span>💾</span>
                        {selectedSuggestion ? 'Mettre à jour' : 'Créer'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <span>✕</span>
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ===== AFFICHAGE DES DÉTAILS =====
                selectedSuggestion ? (
                  <>
                    {/* Détails de la suggestion */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                            ${selectedSuggestion.category?.bg_color || 'bg-gray-100'}
                            ${selectedSuggestion.category?.text_color || 'text-gray-700'}
                          `}>
                            {selectedSuggestion.category?.icon || '✨'}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                              {selectedSuggestion.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`
                                px-2 py-0.5 rounded-full text-xs
                                ${selectedSuggestion.location_type === 'internal'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                                }
                              `}>
                                {selectedSuggestion.location_type === 'internal' 
                                  ? '🏨 Dans l\'hôtel' 
                                  : '🗺️ Aux alentours'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {selectedSuggestion.category?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(selectedSuggestion)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
                          >
                            <span>✏️</span>
                            Modifier
                          </button>
                          <button
                            onClick={() => deleteSuggestion(selectedSuggestion.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            Supprimer
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <p className="text-gray-800">
                            {selectedSuggestion.description || 'Aucune description'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Contact</p>
                          {selectedSuggestion.phone ? (
                            <a 
                              href={`tel:${selectedSuggestion.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedSuggestion.phone}
                            </a>
                          ) : (
                            <p className="text-gray-500">Non renseigné</p>
                          )}
                          {selectedSuggestion.address && (
                            <>
                              <p className="text-xs text-gray-500 mt-2 mb-1">Adresse</p>
                              <p className="text-gray-800">{selectedSuggestion.address}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gestion des images */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🖼️</span>
                        Photos de la suggestion
                      </h3>

                      <SuggestionImages
                        suggestionId={selectedSuggestion.id}
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
                          suggestionId={selectedSuggestion.id}
                          onImageUploaded={() => {
                            window.dispatchEvent(new CustomEvent('suggestionImageUpdate'))
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="text-7xl mb-4">✨</div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      Aucune suggestion sélectionnée
                    </h3>
                    <p className="text-gray-600">
                      Sélectionnez une suggestion dans la liste ou créez-en une nouvelle.
                    </p>
                  </div>
                )
              )}
            </div>
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