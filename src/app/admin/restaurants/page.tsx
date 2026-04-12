'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import AdminImageGallery from '@/components/admin/AdminImageGallery'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import { Icon } from '@/components/ui/Icons'
import Link from 'next/link'

type Restaurant = {
  id: number
  hotel_id: number
  name: string
  description: string | null
  opening_hours: string | null
  location: string | null
  menu_pdf_url: string | null
  spot_type: string
}

export default function AdminRestaurantsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const { toast, toasts } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    opening_hours: '',
    location: '',
    menu_pdf_url: '',
  })

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        if (!hotelData) {
          setIsSuperAdmin(true)
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

  useEffect(() => {
    if (selectedHotelId) loadRestaurants(selectedHotelId)
  }, [selectedHotelId])

  async function loadRestaurants(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('food_spots')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('spot_type', 'restaurant')
        .order('name')
      setRestaurants(data || [])
      if (data?.length && !selectedRestaurant) {
        selectRestaurant(data[0])
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  function selectRestaurant(r: Restaurant) {
    setSelectedRestaurant(r)
    setFormData({
      name: r.name || '',
      description: r.description || '',
      opening_hours: r.opening_hours || '',
      location: r.location || '',
      menu_pdf_url: r.menu_pdf_url || '',
    })
    setEditing(false)
  }

  async function saveRestaurant() {
    if (!selectedRestaurant || !selectedHotelId) return
    if (!formData.name.trim()) { toast('Le nom est obligatoire', 'warning'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('food_spots')
        .update({
          name: formData.name.trim(),
          description: formData.description,
          opening_hours: formData.opening_hours,
          location: formData.location,
          menu_pdf_url: formData.menu_pdf_url,
        })
        .eq('id', selectedRestaurant.id)
        .eq('hotel_id', selectedHotelId)
      if (error) throw error
      toast('Restaurant mis à jour')
      setEditing(false)
      await loadRestaurants(selectedHotelId)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      toast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRestaurant(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    if (!selectedHotelId) return
    setConfirmDeleteId(null)
    try {
      const { error } = await supabase
        .from('food_spots')
        .delete()
        .eq('id', id)
        .eq('hotel_id', selectedHotelId)
      if (error) throw error
      toast('Restaurant supprimé')
      if (selectedRestaurant?.id === id) { setSelectedRestaurant(null); resetForm() }
      await loadRestaurants(selectedHotelId)
    } catch (error) {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  function resetForm() {
    setFormData({ name: '', description: '', opening_hours: '', location: '', menu_pdf_url: '' })
  }

  if (loading && !restaurants.length && selectedHotelId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Icon.Spinner className="w-8 h-8 text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer toasts={toasts} />
      <div className="max-w-7xl mx-auto">

        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Icon.Utensils className="w-6 h-6 text-amber-600" />
              Restaurants & Bars
              {hotel && !isSuperAdmin && (
                <span className="text-base font-normal text-gray-500 ml-2">— {hotel.name}</span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isSuperAdmin ? 'Mode Super Admin — sélectionnez un hôtel' : 'Gérez les restaurants, horaires et photos'}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <HotelSelector onSelect={(id) => setSelectedHotelId(id)} selectedId={selectedHotelId} className="mb-6" />
        )}

        {selectedHotelId ? (
          <div className="grid grid-cols-12 gap-6">

            {/* Liste */}
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  Restaurants
                  <span className="ml-2 text-xs text-gray-400 font-normal">{restaurants.length}</span>
                </h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                {restaurants.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">Aucun restaurant</p>
                ) : (
                  restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectRestaurant(r)}
                      className={`w-full text-left px-4 py-3 transition ${
                        selectedRestaurant?.id === r.id
                          ? 'bg-amber-50 border-l-2 border-amber-500'
                          : 'hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-800 truncate">{r.name}</div>
                      {r.location && (
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Icon.Location className="w-3 h-3" />
                          {r.location}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Détail */}
            <div className="col-span-9 space-y-4">
              {selectedRestaurant ? (
                <>
                  {/* Fiche */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                      <h2 className="font-semibold text-gray-800">
                        {editing ? 'Modifier' : selectedRestaurant.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        {!editing ? (
                          <>
                            <button
                              onClick={() => setEditing(true)}
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                            >
                              <Icon.Pencil className="w-4 h-4" />
                              Modifier
                            </button>
                            <button
                              onClick={() => deleteRestaurant(selectedRestaurant.id)}
                              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition ${
                                confirmDeleteId === selectedRestaurant.id
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Icon.Trash className="w-4 h-4" />
                              {confirmDeleteId === selectedRestaurant.id ? 'Confirmer ?' : 'Supprimer'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={saveRestaurant}
                              disabled={saving}
                              className="flex items-center gap-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {saving ? <Icon.Spinner className="w-4 h-4" /> : <Icon.Save className="w-4 h-4" />}
                              Enregistrer
                            </button>
                            <button
                              onClick={() => { setEditing(false); selectRestaurant(selectedRestaurant) }}
                              className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
                            >
                              <Icon.X className="w-4 h-4" />
                              Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {editing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nom <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                              placeholder="Nom du restaurant"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                              className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                              placeholder="Ambiance, spécialités, style culinaire..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Horaires</label>
                              <input
                                type="text"
                                value={formData.opening_hours}
                                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                                placeholder="Ex: 12h-14h · 19h-22h"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
                              <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                                placeholder="Ex: Niveau 1, Piscine..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lien PDF menu</label>
                            <input
                              type="url"
                              value={formData.menu_pdf_url}
                              onChange={(e) => setFormData({ ...formData, menu_pdf_url: e.target.value })}
                              className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedRestaurant.description && (
                            <p className="text-sm text-gray-600">{selectedRestaurant.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Icon.Clock className="w-3 h-3" /> Horaires
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {selectedRestaurant.opening_hours || '—'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Icon.Location className="w-3 h-3" /> Emplacement
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {selectedRestaurant.location || '—'}
                              </p>
                            </div>
                          </div>
                          {selectedRestaurant.menu_pdf_url && (
                            <a
                              href={selectedRestaurant.menu_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                            >
                              <Icon.ExternalLink className="w-3.5 h-3.5" />
                              Voir la carte PDF
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Icon.Image className="w-4 h-4 text-gray-500" />
                        Photos
                      </h3>
                    </div>
                    <div className="p-6">
                      <AdminImageGallery
                        entityType="restaurant"
                        entityId={selectedRestaurant.id}
                        hotelId={selectedHotelId!}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                  <Icon.Utensils className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Sélectionnez un restaurant dans la liste</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <Icon.Hotel className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sélectionnez un hôtel pour gérer ses restaurants.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
