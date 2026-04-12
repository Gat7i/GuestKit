'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import AdminImageGallery from '@/components/admin/AdminImageGallery'
import { Icon } from '@/components/ui/Icons'

type Show = {
  id: number
  hotel_id: number
  title: string
  description: string | null
  location_id: number | null
  location?: { name: string } | null
  schedules?: Schedule[]
}

type Schedule = {
  id: number
  entertainment_id: number
  show_date: string
  start_time: string
  duration_minutes: number
  target_audience: string | null
}

type Location = { id: number; name: string }

export default function AdminShowsPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [shows, setShows] = useState<Show[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [confirmDeleteScheduleId, setConfirmDeleteScheduleId] = useState<number | null>(null)
  const { toast, toasts } = useToast()

  // Tabs: 'catalogue' | 'calendrier'
  const [tab, setTab] = useState<'catalogue' | 'calendrier'>('catalogue')

  // Catalogue state
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState({ title: '', description: '', location_id: '' })

  // Calendrier state — add a date to an existing show
  const [addDateForm, setAddDateForm] = useState({ show_id: '', show_date: '', start_time: '20:00', duration_minutes: '90', target_audience: '' })
  const [addingDate, setAddingDate] = useState(false)

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
        await loadData(hotelData.id)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedHotelId) loadData(selectedHotelId)
  }, [selectedHotelId])

  async function loadData(hotelId: number) {
    setLoading(true)
    try {
      const [{ data: showsData }, { data: locsData }] = await Promise.all([
        supabase
          .from('entertainments')
          .select('*, location:locations(name), schedules:night_schedules(id, show_date, start_time, duration_minutes, target_audience)')
          .eq('hotel_id', hotelId)
          .eq('is_night_show', true)
          .order('title'),
        supabase.from('locations').select('id, name').eq('hotel_id', hotelId).order('name'),
      ])
      setShows(showsData || [])
      setLocations(locsData || [])
      if (showsData?.length && !selectedShow) setSelectedShow(showsData[0])
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // CRUD Shows (catalogue)
  // ============================================================
  async function createShow() {
    if (!showForm.title.trim()) { toast('Titre obligatoire', 'warning'); return }
    if (!selectedHotelId) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('entertainments')
        .insert({
          hotel_id: selectedHotelId,
          title: showForm.title.trim(),
          description: showForm.description,
          location_id: showForm.location_id ? parseInt(showForm.location_id) : null,
          is_daily_activity: false,
          is_night_show: true,
        })
        .select()
        .single()
      if (error) throw error
      toast('Spectacle créé')
      setEditing(false)
      await loadData(selectedHotelId)
      setSelectedShow(data)
    } catch {
      toast('Erreur lors de la création', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateShow() {
    if (!selectedShow || !selectedHotelId) return
    if (!showForm.title.trim()) { toast('Titre obligatoire', 'warning'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('entertainments')
        .update({
          title: showForm.title.trim(),
          description: showForm.description,
          location_id: showForm.location_id ? parseInt(showForm.location_id) : null,
        })
        .eq('id', selectedShow.id)
        .eq('hotel_id', selectedHotelId)
      if (error) throw error
      toast('Spectacle mis à jour')
      setEditing(false)
      await loadData(selectedHotelId)
    } catch {
      toast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteShow(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    if (!selectedHotelId) return
    setConfirmDeleteId(null)
    try {
      const { error } = await supabase.from('entertainments').delete().eq('id', id).eq('hotel_id', selectedHotelId)
      if (error) throw error
      toast('Spectacle supprimé')
      if (selectedShow?.id === id) setSelectedShow(null)
      await loadData(selectedHotelId)
    } catch {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  // ============================================================
  // Dates (calendrier)
  // ============================================================
  async function addDate() {
    if (!addDateForm.show_id || !addDateForm.show_date || !addDateForm.start_time) {
      toast('Spectacle, date et heure sont obligatoires', 'warning')
      return
    }
    if (!selectedHotelId) return
    setAddingDate(true)
    try {
      const { error } = await supabase.from('night_schedules').insert({
        entertainment_id: parseInt(addDateForm.show_id),
        show_date: addDateForm.show_date,
        start_time: addDateForm.start_time,
        duration_minutes: parseInt(addDateForm.duration_minutes) || 90,
        target_audience: addDateForm.target_audience || null,
      })
      if (error) throw error
      toast('Date ajoutée au calendrier')
      setAddDateForm(f => ({ ...f, show_date: '', target_audience: '' }))
      await loadData(selectedHotelId)
    } catch {
      toast("Erreur lors de l'ajout", 'error')
    } finally {
      setAddingDate(false)
    }
  }

  async function deleteSchedule(scheduleId: number) {
    if (confirmDeleteScheduleId !== scheduleId) {
      setConfirmDeleteScheduleId(scheduleId)
      setTimeout(() => setConfirmDeleteScheduleId(null), 3000)
      return
    }
    if (!selectedHotelId) return
    setConfirmDeleteScheduleId(null)
    try {
      const showIds = shows.map(s => s.id)
      const { error } = await supabase.from('night_schedules').delete().eq('id', scheduleId).in('entertainment_id', showIds)
      if (error) throw error
      toast('Date supprimée')
      await loadData(selectedHotelId)
    } catch {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  // ============================================================
  // Utils
  // ============================================================
  function startEdit(show?: Show) {
    if (show) {
      setShowForm({ title: show.title, description: show.description || '', location_id: show.location_id?.toString() || '' })
      setSelectedShow(show)
    } else {
      setShowForm({ title: '', description: '', location_id: '' })
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedShow) setShowForm({ title: selectedShow.title, description: selectedShow.description || '', location_id: selectedShow.location_id?.toString() || '' })
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  // All schedules sorted by date
  const allSchedules = shows
    .flatMap(s => (s.schedules || []).map(sc => ({ ...sc, show: s })))
    .sort((a, b) => a.show_date.localeCompare(b.show_date))

  const upcomingSchedules = allSchedules.filter(sc => sc.show_date >= new Date().toISOString().slice(0, 10))
  const pastSchedules = allSchedules.filter(sc => sc.show_date < new Date().toISOString().slice(0, 10))

  // Group by month
  function groupByMonth(schedules: typeof allSchedules) {
    return schedules.reduce((acc, sc) => {
      const month = sc.show_date.slice(0, 7)
      if (!acc[month]) acc[month] = []
      acc[month].push(sc)
      return acc
    }, {} as Record<string, typeof allSchedules>)
  }

  function formatMonth(m: string) {
    return new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  if (loading && selectedHotelId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Icon.Spinner className="w-8 h-8 text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer toasts={toasts} />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Icon.Show className="w-6 h-6 text-purple-600" />
              Spectacles
              {hotel && !isSuperAdmin && <span className="text-base font-normal text-gray-400 ml-2">— {hotel.name}</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isSuperAdmin ? 'Mode Super Admin — sélectionnez un hôtel' : 'Gérez le catalogue et le calendrier des spectacles'}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <HotelSelector onSelect={(id) => setSelectedHotelId(id)} selectedId={selectedHotelId} className="mb-6" />
        )}

        {selectedHotelId ? (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
              <button
                onClick={() => setTab('catalogue')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'catalogue' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon.BookOpen className="w-4 h-4" />
                Catalogue
                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{shows.length}</span>
              </button>
              <button
                onClick={() => setTab('calendrier')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'calendrier' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon.Calendar className="w-4 h-4" />
                Calendrier
                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{upcomingSchedules.length}</span>
              </button>
            </div>

            {/* ====== TAB CATALOGUE ====== */}
            {tab === 'catalogue' && (
              <div className="grid grid-cols-12 gap-6">

                {/* Liste des shows */}
                <div className="col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-700">Spectacles</h2>
                    <button
                      onClick={() => { setSelectedShow(null); startEdit() }}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition"
                    >
                      <Icon.Plus className="w-3.5 h-3.5" />
                      Nouveau
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[65vh] overflow-y-auto">
                    {shows.length === 0 ? (
                      <div className="py-12 text-center">
                        <Icon.Show className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Aucun spectacle</p>
                        <button
                          onClick={() => startEdit()}
                          className="mt-3 text-sm text-purple-600 hover:underline"
                        >
                          Créer le premier
                        </button>
                      </div>
                    ) : (
                      shows.map((show) => (
                        <button
                          key={show.id}
                          onClick={() => { setSelectedShow(show); setEditing(false) }}
                          className={`w-full text-left px-4 py-3.5 transition border-l-2 ${
                            selectedShow?.id === show.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-800 truncate">{show.title}</div>
                          <div className="flex items-center gap-3 mt-1">
                            {show.location && (
                              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                <Icon.Location className="w-3 h-3" />
                                {(show.location as any).name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {show.schedules?.length || 0} date{(show.schedules?.length || 0) > 1 ? 's' : ''}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Détail / Formulaire */}
                <div className="col-span-8 space-y-4">
                  {editing ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">
                          {selectedShow ? 'Modifier le spectacle' : 'Nouveau spectacle'}
                        </h2>
                        <div className="flex gap-2">
                          <button
                            onClick={selectedShow ? updateShow : createShow}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            {saving ? <Icon.Spinner className="w-4 h-4" /> : <Icon.Save className="w-4 h-4" />}
                            {selectedShow ? 'Mettre à jour' : 'Créer'}
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
                            Titre <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={showForm.title}
                            onChange={(e) => setShowForm({ ...showForm, title: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                            placeholder="Ex: Soirée Folklore, Spectacle de magie..."
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={showForm.description}
                            onChange={(e) => setShowForm({ ...showForm, description: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                            placeholder="Description du spectacle, artistes, programme..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Salle / Lieu</label>
                          <select
                            value={showForm.location_id}
                            onChange={(e) => setShowForm({ ...showForm, location_id: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                          >
                            <option value="">— Aucun lieu —</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                          {locations.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Aucun emplacement configuré.{' '}
                              <a href="/admin/locations" className="text-purple-600 hover:underline">Créer des emplacements</a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : selectedShow ? (
                    <>
                      {/* Détails du spectacle */}
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                          <h2 className="font-semibold text-gray-800">{selectedShow.title}</h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(selectedShow)}
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                            >
                              <Icon.Pencil className="w-4 h-4" />
                              Modifier
                            </button>
                            <button
                              onClick={() => deleteShow(selectedShow.id)}
                              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition ${
                                confirmDeleteId === selectedShow.id
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Icon.Trash className="w-4 h-4" />
                              {confirmDeleteId === selectedShow.id ? 'Confirmer ?' : 'Supprimer'}
                            </button>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          {selectedShow.description && (
                            <p className="text-sm text-gray-600">{selectedShow.description}</p>
                          )}
                          {selectedShow.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Icon.Location className="w-4 h-4" />
                              {(selectedShow.location as any).name}
                            </div>
                          )}
                          <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700">
                            <strong>{selectedShow.schedules?.length || 0}</strong> représentation{(selectedShow.schedules?.length || 0) > 1 ? 's' : ''} programmée{(selectedShow.schedules?.length || 0) > 1 ? 's' : ''}.
                            {' '}<button onClick={() => setTab('calendrier')} className="underline hover:no-underline">Voir le calendrier →</button>
                          </div>
                        </div>
                      </div>

                      {/* Dates de ce spectacle */}
                      {selectedShow.schedules && selectedShow.schedules.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Icon.Calendar className="w-4 h-4" />
                              Dates programmées
                            </h3>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {[...selectedShow.schedules]
                              .sort((a, b) => a.show_date.localeCompare(b.show_date))
                              .map((sc) => (
                                <div key={sc.id} className="flex items-center justify-between px-6 py-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 capitalize">{formatDate(sc.show_date)}</p>
                                    <p className="text-xs text-gray-500">
                                      {sc.start_time} · {sc.duration_minutes}min
                                      {sc.target_audience && ` · ${sc.target_audience}`}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => deleteSchedule(sc.id)}
                                    className={`text-xs px-3 py-1 rounded-lg transition ${
                                      confirmDeleteScheduleId === sc.id
                                        ? 'bg-red-600 text-white animate-pulse'
                                        : 'text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    {confirmDeleteScheduleId === sc.id ? 'Confirmer ?' : 'Retirer'}
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Photos du spectacle */}
                      {selectedHotelId && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Icon.Image className="w-4 h-4" />
                              Photos
                            </h3>
                          </div>
                          <div className="p-6">
                            <AdminImageGallery
                              entityType="show"
                              entityId={selectedShow.id}
                              hotelId={selectedHotelId}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                      <Icon.Show className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Sélectionnez un spectacle ou créez-en un</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== TAB CALENDRIER ====== */}
            {tab === 'calendrier' && (
              <div className="grid grid-cols-12 gap-6">

                {/* Formulaire ajout date */}
                <div className="col-span-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm sticky top-24">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Icon.Plus className="w-4 h-4 text-purple-500" />
                        Ajouter une date
                      </h2>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Spectacle <span className="text-red-500">*</span></label>
                        <select
                          value={addDateForm.show_id}
                          onChange={(e) => setAddDateForm({ ...addDateForm, show_id: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                        >
                          <option value="">— Choisir un spectacle —</option>
                          {shows.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                        {shows.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            <button onClick={() => setTab('catalogue')} className="text-purple-600 hover:underline">Créez d'abord un spectacle</button>
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={addDateForm.show_date}
                          onChange={(e) => setAddDateForm({ ...addDateForm, show_date: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                          min={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Heure <span className="text-red-500">*</span></label>
                          <input
                            type="time"
                            value={addDateForm.start_time}
                            onChange={(e) => setAddDateForm({ ...addDateForm, start_time: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Durée (min)</label>
                          <input
                            type="number"
                            value={addDateForm.duration_minutes}
                            onChange={(e) => setAddDateForm({ ...addDateForm, duration_minutes: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                            min="15"
                            step="15"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Public cible</label>
                        <input
                          type="text"
                          value={addDateForm.target_audience}
                          onChange={(e) => setAddDateForm({ ...addDateForm, target_audience: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                          placeholder="Ex: Familles, Adultes, Tous publics..."
                        />
                      </div>
                      <button
                        onClick={addDate}
                        disabled={addingDate}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50"
                      >
                        {addingDate ? <Icon.Spinner className="w-4 h-4" /> : <Icon.Plus className="w-4 h-4" />}
                        Ajouter au calendrier
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendrier des représentations */}
                <div className="col-span-8 space-y-6">
                  {/* Prochaines représentations */}
                  {upcomingSchedules.length > 0 ? (
                    <>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Prochaines représentations ({upcomingSchedules.length})
                        </h2>
                        {Object.entries(groupByMonth(upcomingSchedules)).map(([month, schedules]) => (
                          <div key={month} className="mb-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">
                              {formatMonth(month)}
                            </h3>
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                              {schedules.map((sc) => (
                                <div key={sc.id} className="flex items-center gap-4 px-5 py-4">
                                  <div className="flex-shrink-0 text-center bg-purple-50 rounded-lg px-3 py-2 w-16">
                                    <div className="text-xs font-medium text-purple-600 uppercase">
                                      {new Date(sc.show_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700">
                                      {new Date(sc.show_date + 'T00:00:00').getDate()}
                                    </div>
                                    <div className="text-xs text-purple-500">
                                      {new Date(sc.show_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{sc.show.title}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Icon.Clock className="w-3 h-3" />
                                        {sc.start_time} · {sc.duration_minutes}min
                                      </span>
                                      {sc.show.location && (
                                        <span className="flex items-center gap-1">
                                          <Icon.Location className="w-3 h-3" />
                                          {(sc.show.location as any).name}
                                        </span>
                                      )}
                                      {sc.target_audience && (
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                          {sc.target_audience}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => deleteSchedule(sc.id)}
                                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition ${
                                      confirmDeleteScheduleId === sc.id
                                        ? 'bg-red-600 text-white animate-pulse'
                                        : 'text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    {confirmDeleteScheduleId === sc.id ? 'Confirmer ?' : 'Retirer'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                      <Icon.Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Aucune représentation à venir</p>
                      <p className="text-gray-400 text-xs mt-1">Utilisez le formulaire pour ajouter des dates</p>
                    </div>
                  )}

                  {/* Représentations passées */}
                  {pastSchedules.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Représentations passées ({pastSchedules.length})
                      </h2>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50 opacity-60">
                        {[...pastSchedules].reverse().slice(0, 5).map((sc) => (
                          <div key={sc.id} className="flex items-center gap-4 px-5 py-3">
                            <div className="text-xs text-gray-400 w-24 flex-shrink-0">
                              {formatDate(sc.show_date)}
                            </div>
                            <p className="text-sm text-gray-600 flex-1">{sc.show.title}</p>
                            <span className="text-xs text-gray-400">{sc.start_time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <Icon.Hotel className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sélectionnez un hôtel pour gérer ses spectacles.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
