'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import Link from 'next/link'

export default function AdminShowsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
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
      if (!selectedHotelId) {
        alert('Aucun hôtel sélectionné')
        return
      }

      const { data, error } = await supabase
        .from('entertainments')
        .insert({
          hotel_id: selectedHotelId,
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
      await loadData(selectedHotelId)
      setSelectedShow(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updateShow() {
    if (!selectedShow || !selectedHotelId) return

    try {
      const { error } = await supabase
        .from('entertainments')
        .update({
          title: formData.title,
          description: formData.description,
          location_id: formData.location_id ? parseInt(formData.location_id) : null
        })
        .eq('id', selectedShow.id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error

      alert('✅ Spectacle mis à jour')
      setEditing(false)
      await loadData(selectedHotelId)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  async function deleteShow(id: number) {
    if (!confirm('Supprimer définitivement ce spectacle ?')) return
    if (!selectedHotelId) return

    try {
      const { error } = await supabase
        .from('entertainments')
        .delete()
        .eq('id', id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error

      alert('✅ Spectacle supprimé')
      await loadData(selectedHotelId)
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
    if (!selectedHotelId) return

    try {
      const { data: checkShow } = await supabase
        .from('entertainments')
        .select('hotel_id')
        .eq('id', showId)
        .single()

      if (checkShow?.hotel_id !== selectedHotelId) {
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
      await loadData(selectedHotelId)
    } catch (error) {
      console.error('Erreur ajout date:', error)
      alert('❌ Erreur lors de l\'ajout')
    }
  }

  async function deleteSchedule(scheduleId: number) {
    if (!selectedHotelId) return

    try {
      const { data: hotelShows } = await supabase
        .from('entertainments')
        .select('id')
        .eq('hotel_id', selectedHotelId)
        .eq('is_night_show', true)

      if (!hotelShows || hotelShows.length === 0) return

      const showIds = hotelShows.map(s => s.id)

      const { error } = await supabase
        .from('night_schedules')
        .delete()
        .eq('id', scheduleId)
        .in('entertainment_id', showIds)

      if (error) throw error

      alert('✅ Date supprimée')
      await loadData(selectedHotelId)
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🌟</span> Gestion des spectacles
              {hotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses spectacles'
                : 'Gérez les spectacles nocturnes et soirées'}
            </p>
          </div>
          {selectedHotelId && (
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
            {/* Colonne 1 : Liste des spectacles */}
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

            {/* Colonne 2 : Détails / Édition */}
            <div className="col-span-9 space-y-6">
              {editing ? (
                // Formulaire d'édition (garder le code existant)
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {/* ... */}
                </div>
              ) : (
                selectedShow ? (
                  // Détails du spectacle (garder le code existant)
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* ... */}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="text-7xl mb-4">🌟</div>
                    <p className="text-gray-500">
                      Sélectionnez un spectacle dans la liste
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
                Veuillez sélectionner un hôtel pour gérer ses spectacles.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}