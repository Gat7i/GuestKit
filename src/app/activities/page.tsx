'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

export default function AdminActivitiesPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
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
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setHotel(hotelData)
        if (hotelData && hotelData.id) {
          await loadData(hotelData.id)
        }
      } catch (error) {
        console.error('Erreur initialisation:', error)
        setLoading(false)
      }
    }
    init()
  }, [])

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
    try {
      if (!formData.title) {
        alert('Veuillez saisir un titre')
        return
      }
      if (!hotel || !hotel.id) {
        alert('Hôtel non identifié')
        return
      }

      const { data, error } = await supabase
        .from('entertainments')
        .insert({
          hotel_id: hotel.id,
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

      alert('✅ Activité créée avec succès !')
      setEditing(false)
      await loadData(hotel.id)
      setSelectedActivity(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updateActivity() {
    if (!selectedActivity || !hotel || !hotel.id) return

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
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Activité mise à jour')
      setEditing(false)
      await loadData(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  async function deleteActivity(id: number) {
    if (!confirm('Supprimer définitivement cette activité ?')) return
    if (!hotel || !hotel.id) return

    try {
      const { error } = await supabase
        .from('entertainments')
        .delete()
        .eq('id', id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Activité supprimée')
      await loadData(hotel.id)
      if (selectedActivity?.id === id) {
        setSelectedActivity(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  // ============================================
  // GESTION DES HORAIRES
  // ============================================
  async function addSchedule(activityId: number, dayOfWeek: number, startTime: string) {
    if (!hotel || !hotel.id) return
    
    try {
      // Vérifier d'abord que l'activité appartient bien à cet hôtel
      const { data: activity } = await supabase
        .from('entertainments')
        .select('hotel_id')
        .eq('id', activityId)
        .single()
      
      if (activity?.hotel_id !== hotel.id) {
        alert('Action non autorisée')
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

      alert('✅ Horaire ajouté')
      await loadData(hotel.id)
    } catch (error) {
      console.error('Erreur ajout horaire:', error)
      alert('❌ Erreur lors de l\'ajout')
    }
  }

  async function deleteSchedule(scheduleId: number) {
    if (!hotel || !hotel.id) return
    
    try {
      // 1. Récupérer d'abord les IDs des activités de l'hôtel
      const { data: hotelActivities } = await supabase
        .from('entertainments')
        .select('id')
        .eq('hotel_id', hotel.id)

      if (!hotelActivities || hotelActivities.length === 0) {
        alert('Aucune activité trouvée pour cet hôtel')
        return
      }

      const activityIds = hotelActivities.map(a => a.id)

      // 2. Supprimer le schedule si son entertainment_id est dans la liste
      const { error } = await supabase
        .from('daily_schedules')
        .delete()
        .eq('id', scheduleId)
        .in('entertainment_id', activityIds)

      if (error) throw error

      alert('✅ Horaire supprimé')
      await loadData(hotel.id)
    } catch (error) {
      console.error('Erreur suppression horaire:', error)
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

  if (loading && !activities.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎭</div>
          <p className="text-gray-600">Chargement des activités...</p>
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
              <span>🎭</span> Gestion des activités
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Gérez les activités journalières et animations
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setSelectedActivity(null)
              setEditing(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
          >
            <span>➕</span>
            Nouvelle activité
          </button>
        </div>

        {/* Le reste du JSX reste identique - je ne le répète pas pour garder la réponse concise */}
        
      </div>
    </div>
  )
}