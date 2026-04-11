'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import { Icon } from '@/components/ui/Icons'

type Location = {
  id: number
  hotel_id: number
  name: string
  location_type: string
  description: string | null
  created_at: string
}

const LOCATION_TYPES = [
  { value: 'activity', label: 'Activités & Spectacles' },
  { value: 'restaurant', label: 'Restauration' },
  { value: 'amenity', label: 'Espace & Équipement' },
  { value: 'other', label: 'Autre' },
]

export default function AdminLocationsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const { toast, toasts } = useToast()
  const [form, setForm] = useState({ name: '', location_type: 'activity', description: '' })

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const hotelData = await getCurrentHotelClient()
      setHotel(hotelData)
      if (!hotelData) {
        setIsSuperAdmin(true)
        setLoading(false)
      } else {
        setIsSuperAdmin(false)
        setSelectedHotelId(hotelData.id)
        await loadLocations(hotelData.id)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedHotelId) loadLocations(selectedHotelId)
  }, [selectedHotelId])

  async function loadLocations(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('location_type')
        .order('name')
      setLocations(data || [])
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createLocation() {
    if (!form.name.trim()) { toast('Le nom est obligatoire', 'warning'); return }
    if (!selectedHotelId) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({ hotel_id: selectedHotelId, name: form.name.trim(), location_type: form.location_type, description: form.description || null })
        .select()
        .single()
      if (error) throw error
      toast('Emplacement créé')
      setEditing(false)
      setSelectedLocation(data)
      resetForm()
      await loadLocations(selectedHotelId)
    } catch {
      toast('Erreur lors de la création', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateLocation() {
    if (!selectedLocation || !selectedHotelId) return
    if (!form.name.trim()) { toast('Le nom est obligatoire', 'warning'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('locations')
        .update({ name: form.name.trim(), location_type: form.location_type, description: form.description || null })
        .eq('id', selectedLocation.id)
        .eq('hotel_id', selectedHotelId)
      if (error) throw error
      toast('Emplacement mis à jour')
      setEditing(false)
      await loadLocations(selectedHotelId)
    } catch {
      toast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLocation(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    if (!selectedHotelId) return
    setConfirmDeleteId(null)
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id).eq('hotel_id', selectedHotelId)
      if (error) throw error
      toast('Emplacement supprimé')
      if (selectedLocation?.id === id) { setSelectedLocation(null); resetForm() }
      await loadLocations(selectedHotelId)
    } catch {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  function resetForm() {
    setForm({ name: '', location_type: 'activity', description: '' })
  }

  function startEdit(loc?: Location) {
    if (loc) {
      setForm({ name: loc.name, location_type: loc.location_type, description: loc.description || '' })
      setSelectedLocation(loc)
    } else {
      resetForm()
      setSelectedLocation(null)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedLocation) {
      setForm({ name: selectedLocation.name, location_type: selectedLocation.location_type, description: selectedLocation.description || '' })
    }
  }

  const grouped = LOCATION_TYPES.reduce((acc, t) => {
    acc[t.value] = locations.filter(l => l.location_type === t.value)
    return acc
  }, {} as Record<string, Location[]>)

  if (loading && selectedHotelId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Icon.Spinner className="w-8 h-8 text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer toasts={toasts} />
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Icon.Location className="w-6 h-6 text-blue-600" />
              Emplacements
              {hotel && !isSuperAdmin && <span className="text-base font-normal text-gray-400 ml-2">— {hotel.name}</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isSuperAdmin
                ? 'Mode Super Admin — sélectionnez un hôtel'
                : 'Gérez les salles, espaces et lieux utilisés pour les activités et spectacles'}
            </p>
          </div>
          {selectedHotelId && (
            <button
              onClick={() => startEdit()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Icon.Plus className="w-4 h-4" />
              Nouvel emplacement
            </button>
          )}
        </div>

        {isSuperAdmin && (
          <HotelSelector onSelect={(id) => setSelectedHotelId(id)} selectedId={selectedHotelId} className="mb-6" />
        )}

        {selectedHotelId ? (
          <div className="grid grid-cols-12 gap-6">

            {/* Liste */}
            <div className="col-span-4 space-y-4">
              {LOCATION_TYPES.map((type) => {
                const items = grouped[type.value] || []
                if (items.length === 0) return null
                return (
                  <div key={type.value} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{type.label}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {items.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => { setSelectedLocation(loc); setEditing(false) }}
                          className={`w-full text-left px-4 py-3 transition border-l-2 ${
                            selectedLocation?.id === loc.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon.Location className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-800 truncate">{loc.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {locations.length === 0 && (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <Icon.Location className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">Aucun emplacement</p>
                  <button
                    onClick={() => startEdit()}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Créer le premier emplacement
                  </button>
                </div>
              )}
            </div>

            {/* Détail / Formulaire */}
            <div className="col-span-8">
              {editing ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">
                      {selectedLocation ? 'Modifier l\'emplacement' : 'Nouvel emplacement'}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={selectedLocation ? updateLocation : createLocation}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {saving ? <Icon.Spinner className="w-4 h-4" /> : <Icon.Save className="w-4 h-4" />}
                        {selectedLocation ? 'Mettre à jour' : 'Créer'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                        placeholder="Ex: Salle des fêtes, Amphithéâtre, Piscine..."
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={form.location_type}
                        onChange={(e) => setForm({ ...form, location_type: e.target.value })}
                        className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                      >
                        {LOCATION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                        placeholder="Capacité, équipements, accès..."
                      />
                    </div>
                  </div>
                </div>
              ) : selectedLocation ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">{selectedLocation.name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(selectedLocation)}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        <Icon.Pencil className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteLocation(selectedLocation.id)}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition ${
                          confirmDeleteId === selectedLocation.id
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Icon.Trash className="w-4 h-4" />
                        {confirmDeleteId === selectedLocation.id ? 'Confirmer ?' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm font-medium text-gray-800">
                          {LOCATION_TYPES.find(t => t.value === selectedLocation.location_type)?.label || selectedLocation.location_type}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Créé le</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(selectedLocation.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {selectedLocation.description && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700">{selectedLocation.description}</p>
                      </div>
                    )}
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                      Cet emplacement peut être assigné aux <strong>activités</strong> et aux <strong>spectacles</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                  <Icon.Location className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Sélectionnez un emplacement ou créez-en un</p>
                  <button
                    onClick={() => startEdit()}
                    className="mt-4 text-sm text-blue-600 hover:underline"
                  >
                    Créer un emplacement
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <Icon.Hotel className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sélectionnez un hôtel pour gérer ses emplacements.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
