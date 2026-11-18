'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import AdminImageGallery from '@/components/admin/AdminImageGallery'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import { Icon } from '@/components/ui/Icons'
import Link from 'next/link'
import { createFoodSpot, updateFoodSpot, deleteFoodSpot } from '@/app/admin/entertainments-actions'

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
  const [activeType, setActiveType] = useState<string>('restaurant')
  const { toast, toasts } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    opening_hours: '',
    location: '',
    menu_pdf_url: '',
  })

  const SPOT_TYPES = [
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { value: 'bar',        label: 'Bars',        icon: '🍷' },
    { value: 'café',       label: 'Cafés',        icon: '☕' },
  ]

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
        .order('spot_type')
        .order('name')
      setRestaurants(data || [])
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
      await updateFoodSpot(selectedRestaurant.id, selectedHotelId, {
        name: formData.name.trim(),
        description: formData.description,
        opening_hours: formData.opening_hours,
        location: formData.location,
        menu_pdf_url: formData.menu_pdf_url,
      })
      toast('Mise à jour effectuée')
      setEditing(false)
      await loadRestaurants(selectedHotelId)
    } catch (error: any) {
      toast(error.message || 'Erreur lors de la mise à jour', 'error')
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
      await deleteFoodSpot(id, selectedHotelId)
      toast('Supprimé')
      if (selectedRestaurant?.id === id) { setSelectedRestaurant(null); resetForm() }
      await loadRestaurants(selectedHotelId)
    } catch (error: any) {
      toast(error.message || 'Erreur lors de la suppression', 'error')
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
          <div className="space-y-4">

            {/* Tabs par type */}
            <div className="flex gap-2 flex-wrap">
              {SPOT_TYPES.map((t) => {
                const count = restaurants.filter(r => r.spot_type === t.value).length
                return (
                  <button
                    key={t.value}
                    onClick={() => { setActiveType(t.value); setSelectedRestaurant(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                      activeType === t.value
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeType === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

          <div className="grid grid-cols-12 gap-6">

            {/* Liste filtrée par type actif */}
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">
                  {SPOT_TYPES.find(t => t.value === activeType)?.label ?? activeType}
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {restaurants.filter(r => r.spot_type === activeType).length}
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                {restaurants.filter(r => r.spot_type === activeType).length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">Aucun élément</p>
                ) : (
                  restaurants.filter(r => r.spot_type === activeType).map((r) => (
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
                  <p className="text-gray-500 text-sm">Sélectionnez un élément dans la liste</p>
                </div>
              )}
            </div>
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
