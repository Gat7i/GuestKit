'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import ActivityImages from '@/components/activities/ActivityImages'
import ImageUploader from '@/components/admin/ImageUploader'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import { Icon } from '@/components/ui/Icons'
import Link from 'next/link'

export default function AdminActivitiesPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const { toast, toasts } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    duration_minutes: 60,
    is_daily_activity: true,
    is_night_show: false
  })

  const supabase = createClient()

  // Jours de la semaine
  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ]

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
      // Charger les activités
      const { data: activitiesData } = await supabase
        .from('entertainments')
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
          location:locations(name),
          schedules:daily_schedules(
            id,
            day_of_week,
            start_time,
            duration_minutes
          ),
          images:entertainment_images(
            is_principal,
            image:image_id(
              id,
              url,
              alt_text
            )
          )
        `)
        .eq('hotel_id', hotelId)
        .eq('is_daily_activity', true)
        .eq('is_night_show', false)
        .order('created_at', { ascending: false })

      setActivities(activitiesData || [])

      // Charger les catégories d'activités
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('category_type', 'activity')
        .eq('is_active', true)
        .order('sort_order')

      setCategories(categoriesData || [])

      // Charger les emplacements
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('location_type', 'activity')
        .order('name')

      setLocations(locationsData || [])
      
      if (activitiesData?.length && !selectedActivity) {
        setSelectedActivity(activitiesData[0])
        setFormData({
          title: activitiesData[0].title || '',
          description: activitiesData[0].description || '',
          category_id: activitiesData[0].category_id?.toString() || '',
          location_id: activitiesData[0].location_id?.toString() || '',
          duration_minutes: 60,
          is_daily_activity: true,
          is_night_show: false
        })
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // CRUD ACTIVITÉS
  // ============================================
  async function createActivity() {
    if (!formData.title.trim()) {
      toast('Veuillez saisir un titre', 'warning')
      return
    }
    if (!selectedHotelId) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('entertainments')
        .insert({
          hotel_id: selectedHotelId,
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          location_id: formData.location_id ? parseInt(formData.location_id) : null,
          is_daily_activity: true,
          is_night_show: false
        })
        .select()
        .single()

      if (error) throw error

      toast('Activité créée avec succès')
      setEditing(false)
      await loadData(selectedHotelId)
      setSelectedActivity(data)
    } catch (error) {
      console.error('Erreur création:', error)
      toast('Erreur lors de la création', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateActivity() {
    if (!selectedActivity || !selectedHotelId) return
    if (!formData.title.trim()) {
      toast('Veuillez saisir un titre', 'warning')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('entertainments')
        .update({
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          location_id: formData.location_id ? parseInt(formData.location_id) : null
        })
        .eq('id', selectedActivity.id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error

      toast('Activité mise à jour')
      setEditing(false)
      await loadData(selectedHotelId)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      toast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteActivity(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    if (!selectedHotelId) return
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      const { error } = await supabase
        .from('entertainments')
        .delete()
        .eq('id', id)
        .eq('hotel_id', selectedHotelId)

      if (error) throw error

      toast('Activité supprimée')
      await loadData(selectedHotelId)
      if (selectedActivity?.id === id) {
        setSelectedActivity(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast('Erreur lors de la suppression', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // ============================================
  // GESTION DES HORAIRES
  // ============================================
  async function addSchedule(activityId: number, dayOfWeek: number, startTime: string) {
    if (!selectedHotelId) return
    try {
      const { data: activity } = await supabase
        .from('entertainments')
        .select('hotel_id')
        .eq('id', activityId)
        .single()

      if (activity?.hotel_id !== selectedHotelId) {
        toast('Action non autorisée', 'error')
        return
      }

      const { error } = await supabase
        .from('daily_schedules')
        .insert({
          entertainment_id: activityId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          duration_minutes: 60
        })

      if (error) throw error

      toast('Horaire ajouté')
      await loadData(selectedHotelId)
    } catch (error) {
      console.error('Erreur ajout horaire:', error)
      toast("Erreur lors de l'ajout", 'error')
    }
  }

  async function deleteSchedule(scheduleId: number) {
    if (!selectedHotelId) return
    try {
      const { data: hotelActivities } = await supabase
        .from('entertainments')
        .select('id')
        .eq('hotel_id', selectedHotelId)

      if (!hotelActivities?.length) return

      const activityIds = hotelActivities.map(a => a.id)
      const { error } = await supabase
        .from('daily_schedules')
        .delete()
        .eq('id', scheduleId)
        .in('entertainment_id', activityIds)

      if (error) throw error

      toast('Horaire supprimé')
      await loadData(selectedHotelId)
    } catch (error) {
      console.error('Erreur suppression horaire:', error)
      toast('Erreur lors de la suppression', 'error')
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
      location_id: '',
      duration_minutes: 60,
      is_daily_activity: true,
      is_night_show: false
    })
  }

  function startEdit(activity?: any) {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        category_id: activity.category_id?.toString() || '',
        location_id: activity.location_id?.toString() || '',
        duration_minutes: 60,
        is_daily_activity: true,
        is_night_show: false
      })
      setSelectedActivity(activity)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedActivity) {
      setFormData({
        title: selectedActivity.title || '',
        description: selectedActivity.description || '',
        category_id: selectedActivity.category_id?.toString() || '',
        location_id: selectedActivity.location_id?.toString() || '',
        duration_minutes: 60,
        is_daily_activity: true,
        is_night_show: false
      })
    } else {
      resetForm()
    }
  }

  if (loading && !activities.length && selectedHotelId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Icon.Spinner className="w-10 h-10 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des activités...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer toasts={toasts} />
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Icon.Activity className="w-8 h-8 text-blue-600" />
              Gestion des activités
              {hotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel pour gérer ses activités'
                : 'Gérez les activités journalières et animations'}
            </p>
          </div>
          {selectedHotelId && (
            <button
              onClick={() => { resetForm(); setSelectedActivity(null); setEditing(true) }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
            >
              <Icon.Plus className="w-4 h-4" />
              Nouvelle activité
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
            {/* Colonne 1 : Liste des activités */}
            <div className="col-span-3 bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Icon.ClipboardList className="w-4 h-4 text-gray-500" />
                Activités
                <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {activities.length}
                </span>
              </h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    Aucune activité
                  </p>
                ) : (
                  activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => {
                        setSelectedActivity(activity)
                        setFormData({
                          title: activity.title || '',
                          description: activity.description || '',
                          category_id: activity.category_id?.toString() || '',
                          location_id: activity.location_id?.toString() || '',
                          duration_minutes: 60,
                          is_daily_activity: true,
                          is_night_show: false
                        })
                        setEditing(false)
                      }}
                      className={`
                        w-full text-left p-3 rounded-lg transition
                        ${selectedActivity?.id === activity.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs
                          ${selectedActivity?.id === activity.id
                            ? 'bg-white/20 text-white'
                            : activity.category?.bg_color || 'bg-gray-200'
                          }
                        `}>
                          {activity.category?.icon || '🎯'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {activity.title}
                          </div>
                          <div className={`text-xs ${
                            selectedActivity?.id === activity.id
                              ? 'text-white/80'
                              : 'text-gray-500'
                          }`}>
                            {activity.schedules?.length || 0} horaire(s)
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
                // ===== FORMULAIRE D'ÉDITION =====
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    {selectedActivity
                      ? <><Icon.Pencil className="w-5 h-5 text-blue-600" /> Modifier</>
                      : <><Icon.Plus className="w-5 h-5 text-blue-600" /> Nouvelle activité</>}
                  </h2>

                  <div className="space-y-4">
                    {/* Titre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre de l'activité <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="Ex: Aquagym matinale"
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
                        placeholder="Décrivez l'activité..."
                      />
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
                        onClick={selectedActivity ? updateActivity : createActivity}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {saving
                          ? <Icon.Spinner className="w-4 h-4" />
                          : <Icon.Save className="w-4 h-4" />}
                        {selectedActivity ? 'Mettre à jour' : 'Créer'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <Icon.X className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ===== AFFICHAGE DES DÉTAILS =====
                selectedActivity ? (
                  <>
                    {/* Détails de l'activité */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                            ${selectedActivity.category?.bg_color || 'bg-gray-100'}
                            ${selectedActivity.category?.text_color || 'text-gray-700'}
                          `}>
                            {selectedActivity.category?.icon || '🎯'}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                              {selectedActivity.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                {selectedActivity.category?.name || 'Non catégorisé'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(selectedActivity)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
                          >
                            <Icon.Pencil className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => deleteActivity(selectedActivity.id)}
                            disabled={deletingId === selectedActivity.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                              confirmDeleteId === selectedActivity.id
                                ? 'bg-red-700 text-white animate-pulse'
                                : 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600'
                            }`}
                          >
                            {deletingId === selectedActivity.id
                              ? <Icon.Spinner className="w-4 h-4" />
                              : <Icon.Trash className="w-4 h-4" />}
                            {confirmDeleteId === selectedActivity.id ? 'Confirmer ?' : 'Supprimer'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <p className="text-gray-800">
                            {selectedActivity.description || 'Aucune description'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Emplacement</p>
                          <p className="text-gray-800">
                            {selectedActivity.location?.name || 'Non défini'}
                          </p>
                        </div>
                      </div>

                      {/* Gestion des horaires */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Icon.Clock className="w-4 h-4 text-gray-500" />
                          Horaires hebdomadaires
                        </h3>

                        {/* Liste des horaires existants */}
                        <div className="space-y-2 mb-4">
                          {selectedActivity.schedules?.map((schedule: any) => (
                            <div key={schedule.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-700 w-24">
                                  {daysOfWeek[schedule.day_of_week]?.label}
                                </span>
                                <span className="text-gray-900">
                                  {schedule.start_time.slice(0,5)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  (durée: {schedule.duration_minutes} min)
                                </span>
                              </div>
                              <button
                                onClick={() => deleteSchedule(schedule.id)}
                                className="text-red-400 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                              >
                                <Icon.Trash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!selectedActivity.schedules || selectedActivity.schedules.length === 0) && (
                            <p className="text-gray-500 text-sm py-2">
                              Aucun horaire défini
                            </p>
                          )}
                        </div>

                        {/* Ajout d'un horaire */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-3">
                            Ajouter un horaire
                          </h4>
                          <div className="flex gap-3">
                            <select
                              id="day_select"
                              className="flex-1 rounded-lg border-gray-300 shadow-sm text-sm"
                              defaultValue=""
                            >
                              <option value="">Choisir un jour...</option>
                              {daysOfWeek.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              id="start_time"
                              className="rounded-lg border-gray-300 shadow-sm"
                              defaultValue="09:00"
                            />
                            <button
                              onClick={() => {
                                const select = document.getElementById('day_select') as HTMLSelectElement
                                const timeInput = document.getElementById('start_time') as HTMLInputElement
                                if (select.value && timeInput.value) {
                                  addSchedule(selectedActivity.id, parseInt(select.value), timeInput.value)
                                } else {
                                  toast('Veuillez sélectionner un jour et une heure', 'warning')
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ===== GESTION DES IMAGES ===== */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Icon.Globe className="w-5 h-5 text-gray-500" />
                          Photos de l'activité
                        </h3>

                        <ActivityImages
                          activityId={selectedActivity.id}
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
                            activityId={selectedActivity.id}
                            onImageUploaded={() => {
                              window.dispatchEvent(new CustomEvent('activityImageUpdate'))
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            ⚠️ La première image ajoutée sera automatiquement définie comme image principale.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Icon.Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      Aucune activité sélectionnée
                    </h3>
                    <p className="text-gray-600">
                      Sélectionnez une activité dans la liste.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <Icon.Hotel className="w-16 h-16 text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel pour gérer ses activités.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}