'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

export default function AdminShowsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [shows, setShows] = useState<any[]>([])
  const [selectedShow, setSelectedShow] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_id: '',
    is_daily_activity: false,
    is_night_show: true
  })

  const supabase = createClient()

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const init = async () => {
      const hotelData = await getCurrentHotelClient()
      setHotel(hotelData)
      if (hotelData) {
        await loadData(hotelData.id)
      }
    }
    init()
  }, [])

  async function loadData(hotelId: number) {
    setLoading(true)
    try {
      // Charger les spectacles
      const { data: showsData } = await supabase
        .from('entertainments')
        .select(`
          *,
          location:locations(name),
          schedules:night_schedules(
            id,
            show_date,
            start_time,
            duration_minutes,
            target_audience
          )
        `)
        .eq('hotel_id', hotelId)
        .eq('is_night_show', true)
        .order('created_at', { ascending: false })

      setShows(showsData || [])

      // Charger les emplacements
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('location_type', 'activity')
        .order('name')

      setLocations(locationsData || [])
      
      if (showsData?.length && !selectedShow) {
        setSelectedShow(showsData[0])
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // CRUD SPECTACLES
  // ============================================
  async function createShow() {
    try {
      if (!formData.title) {
        alert('Veuillez saisir un titre')
        return
      }
      if (!hotel) {
        alert('Hôtel non identifié')
        return
      }

      const { data, error } = await supabase
        .from('entertainments')
        .insert({
          hotel_id: hotel.id,
          title: formData.title,
          description: formData.description,
          location_id: formData.location_id ? parseInt(formData.location_id) : null,
          is_daily_activity: false,
          is_night_show: true
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Spectacle créé avec succès !')
      setEditing(false)
      await loadData(hotel.id)
      setSelectedShow(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updateShow() {
    if (!selectedShow || !hotel) return

    try {
      // Vérifier que le spectacle appartient à cet hôtel
      const { data: checkShow } = await supabase
        .from('entertainments')
        .select('hotel_id')
        .eq('id', selectedShow.id)
        .single()

      if (checkShow?.hotel_id !== hotel.id) {
        alert('Action non autorisée')
        return
      }

      const { error } = await supabase
        .from('entertainments')
        .update({
          title: formData.title,
          description: formData.description,
          location_id: formData.location_id ? parseInt(formData.location_id) : null
        })
        .eq('id', selectedShow.id)

      if (error) throw error

      alert('✅ Spectacle mis à jour')
      setEditing(false)
      await loadData(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

async function deleteShow(id: number) {
  if (!confirm('Supprimer définitivement ce spectacle ?')) return
  if (!hotel) return

  try {
    // Vérifier que le spectacle appartient à cet hôtel
    const { error } = await supabase
      .from('entertainments')
      .delete()
      .eq('id', id)
      .eq('hotel_id', hotel.id)

    if (error) throw error

    alert('✅ Spectacle supprimé')
    await loadData(hotel.id)
    if (selectedShow?.id === id) {
      setSelectedShow(null)
      resetForm()
    }
  } catch (error) {
    console.error('Erreur suppression:', error)
    alert('❌ Erreur lors de la suppression')
  }
}

  // ============================================
  // GESTION DES DATES
  // ============================================
async function addSchedule(showId: number, date: string, time: string, audience: string) {
  if (!hotel) return

  try {
    // Vérifier que le spectacle appartient à cet hôtel
    const { data: checkShow } = await supabase
      .from('entertainments')
      .select('hotel_id')
      .eq('id', showId)
      .single()

    if (checkShow?.hotel_id !== hotel.id) {
      alert('Action non autorisée')
      return
    }

    const { error } = await supabase
      .from('night_schedules')
      .insert({
        entertainment_id: showId,
        show_date: date,
        start_time: time,
        duration_minutes: 90,
        target_audience: audience
      })

    if (error) throw error

    alert('✅ Date ajoutée')
    await loadData(hotel.id)
  } catch (error) {
    console.error('Erreur ajout date:', error)
    alert('❌ Erreur lors de l\'ajout')
  }
}

async function deleteSchedule(scheduleId: number) {
  if (!hotel) return

  try {
    // 1. Récupérer d'abord les IDs des spectacles de l'hôtel
    const { data: hotelShows } = await supabase
      .from('entertainments')
      .select('id')
      .eq('hotel_id', hotel.id)
      .eq('is_night_show', true)

    if (!hotelShows || hotelShows.length === 0) {
      alert('Aucun spectacle trouvé pour cet hôtel')
      return
    }

    const showIds = hotelShows.map(s => s.id)

    // 2. Supprimer le schedule si son entertainment_id est dans la liste
    const { error } = await supabase
      .from('night_schedules')
      .delete()
      .eq('id', scheduleId)
      .in('entertainment_id', showIds)

    if (error) throw error

    alert('✅ Date supprimée')
    await loadData(hotel.id)
  } catch (error) {
    console.error('Erreur suppression date:', error)
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
      location_id: '',
      is_daily_activity: false,
      is_night_show: true
    })
  }

  function startEdit(show?: any) {
    if (show) {
      setFormData({
        title: show.title || '',
        description: show.description || '',
        location_id: show.location_id?.toString() || '',
        is_daily_activity: false,
        is_night_show: true
      })
      setSelectedShow(show)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedShow) {
      setFormData({
        title: selectedShow.title || '',
        description: selectedShow.description || '',
        location_id: selectedShow.location_id?.toString() || '',
        is_daily_activity: false,
        is_night_show: true
      })
    } else {
      resetForm()
    }
  }

  // Formater la date pour l'affichage
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading && !shows.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🌟</div>
          <p className="text-gray-600">Chargement des spectacles...</p>
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
              <span>🌟</span> Gestion des spectacles
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Gérez les spectacles nocturnes et soirées
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setSelectedShow(null)
              setEditing(true)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
          >
            <span>➕</span>
            Nouveau spectacle
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* ===== COLONNE 1 : LISTE DES SPECTACLES ===== */}
          <div className="col-span-3 bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Spectacles
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {shows.length}
              </span>
            </h2>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {shows.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Aucun spectacle
                </p>
              ) : (
                shows.map((show) => (
                  <button
                    key={show.id}
                    onClick={() => {
                      setSelectedShow(show)
                      setFormData({
                        title: show.title || '',
                        description: show.description || '',
                        location_id: show.location_id?.toString() || '',
                        is_daily_activity: false,
                        is_night_show: true
                      })
                      setEditing(false)
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg transition
                      ${selectedShow?.id === show.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎭</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {show.title}
                        </div>
                        <div className={`text-xs ${
                          selectedShow?.id === show.id
                            ? 'text-white/80'
                            : 'text-gray-500'
                        }`}>
                          {show.schedules?.length || 0} date(s)
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ===== COLONNE 2 : DÉTAILS / ÉDITION ===== */}
          <div className="col-span-9 space-y-6">
            {editing ? (
              // ===== FORMULAIRE D'ÉDITION =====
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {selectedShow ? '✏️ Modifier' : '➕ Nouveau spectacle'}
                </h2>

                <div className="space-y-4">
                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre du spectacle <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm"
                      placeholder="Ex: Cabaret Parisien"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border-gray-300 shadow-sm"
                      placeholder="Décrivez le spectacle..."
                    />
                  </div>

                  {/* Emplacement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emplacement
                    </label>
                    <select
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm"
                    >
                      <option value="">Sélectionner un emplacement...</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          📍 {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={selectedShow ? updateShow : createShow}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <span>💾</span>
                      {selectedShow ? 'Mettre à jour' : 'Créer'}
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
              selectedShow ? (
                <>
                  {/* Détails du spectacle */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl text-purple-700">
                          🌟
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            {selectedShow.title}
                          </h2>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(selectedShow)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                          <span>✏️</span>
                          Modifier
                        </button>
                        <button
                          onClick={() => deleteShow(selectedShow.id)}
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
                          {selectedShow.description || 'Aucune description'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Emplacement</p>
                        <p className="text-gray-800">
                          {selectedShow.location?.name || 'Non défini'}
                        </p>
                      </div>
                    </div>

                    {/* Gestion des dates */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📅</span>
                        Dates des représentations
                      </h3>

                      {/* Liste des dates existantes */}
                      <div className="space-y-2 mb-4">
                        {selectedShow.schedules?.map((schedule: any) => (
                          <div key={schedule.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-gray-700">
                                {formatDate(schedule.show_date)}
                              </span>
                              <span className="text-gray-900">
                                {schedule.start_time.slice(0,5)}
                              </span>
                              {schedule.target_audience && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  {schedule.target_audience}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        {(!selectedShow.schedules || selectedShow.schedules.length === 0) && (
                          <p className="text-gray-500 text-sm py-2">
                            Aucune date programmée
                          </p>
                        )}
                      </div>

                      {/* Ajout d'une date */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-800 mb-3">
                          Ajouter une date
                        </h4>
                        <div className="flex gap-3 flex-wrap">
                          <input
                            type="date"
                            id="show_date"
                            className="flex-1 rounded-lg border-gray-300 shadow-sm text-sm"
                            defaultValue={new Date().toISOString().split('T')[0]}
                          />
                          <input
                            type="time"
                            id="show_time"
                            className="rounded-lg border-gray-300 shadow-sm"
                            defaultValue="21:00"
                          />
                          <select
                            id="show_audience"
                            className="flex-1 rounded-lg border-gray-300 shadow-sm text-sm"
                            defaultValue="Tout public"
                          >
                            <option value="Tout public">👨‍👩‍👧‍👦 Tout public</option>
                            <option value="Adultes">👤 Adultes</option>
                            <option value="Famille">👪 Famille</option>
                            <option value="Enfants">🧸 Enfants</option>
                          </select>
                          <button
                            onClick={() => {
                              const dateInput = document.getElementById('show_date') as HTMLInputElement
                              const timeInput = document.getElementById('show_time') as HTMLInputElement
                              const audienceSelect = document.getElementById('show_audience') as HTMLSelectElement
                              if (dateInput.value && timeInput.value) {
                                addSchedule(
                                  selectedShow.id,
                                  dateInput.value,
                                  timeInput.value,
                                  audienceSelect.value
                                )
                              } else {
                                alert('Veuillez sélectionner une date et une heure')
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-7xl mb-4">🌟</div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    Aucun spectacle sélectionné
                  </h3>
                  <p className="text-gray-600">
                    Sélectionnez un spectacle dans la liste ou créez-en un nouveau.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}