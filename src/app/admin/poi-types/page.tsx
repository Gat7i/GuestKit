'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

export default function AdminPoiTypesPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [poiTypes, setPoiTypes] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    type_key: '',
    name: '',
    icon: '📍',
    color: 'bg-gray-500',
    text_color: 'text-gray-700',
    bg_color: 'bg-gray-50',
    sort_order: 0,
    is_active: true
  })

  const supabase = createClient()

  // Palettes de couleurs pour les POI
  const colorPalettes = [
    { name: 'Bleu', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    { name: 'Vert', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
    { name: 'Rouge', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
    { name: 'Orange', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    { name: 'Ambre', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    { name: 'Violet', color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
    { name: 'Rose', color: 'bg-pink-500', text: 'text-pink-700', bg: 'bg-pink-50' },
    { name: 'Indigo', color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    { name: 'Cyan', color: 'bg-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50' },
    { name: 'Émeraude', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    { name: 'Gris', color: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-50' },
    { name: 'Ardoise', color: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-50' }
  ]

  // Icônes populaires pour les POI
  const popularIcons = [
    '🛎️', '🍽️', '🍸', '🏊', '🧘', '💪', '🎭', '🛍️', '🚻', '🅿️',
    '🏖️', '🆘', '🛗', '🛏️', '🚪', '🧺', '☕', '📚', '🎮', '🏋️',
    '🚴', '🧖', '💆', '👨‍🍳', '👩‍💼', '🔑', '📞', '💻', '📷', '🎨'
  ]

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const init = async () => {
      const hotelData = await getCurrentHotelClient()
      setHotel(hotelData)
      if (hotelData) {
        await loadPoiTypes(hotelData.id)
      }
    }
    init()
  }, [])

  async function loadPoiTypes(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('poi_types')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('sort_order')
        .order('name')

      setPoiTypes(data || [])
      
      if (data?.length && !selectedType) {
        setSelectedType(data[0])
        setFormData({
          type_key: data[0].type_key || '',
          name: data[0].name || '',
          icon: data[0].icon || '📍',
          color: data[0].color || 'bg-gray-500',
          text_color: data[0].text_color || 'text-gray-700',
          bg_color: data[0].bg_color || 'bg-gray-50',
          sort_order: data[0].sort_order || 0,
          is_active: data[0].is_active !== false
        })
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // CRUD TYPES DE POI
  // ============================================
  async function createPoiType() {
    try {
      if (!formData.type_key || !formData.name) {
        alert('Veuillez remplir la clé et le nom du type')
        return
      }
      if (!hotel) {
        alert('Hôtel non identifié')
        return
      }

      // Vérifier si la clé existe déjà pour cet hôtel
      const { data: existing } = await supabase
        .from('poi_types')
        .select('id')
        .eq('hotel_id', hotel.id)
        .eq('type_key', formData.type_key)
        .maybeSingle()

      if (existing) {
        alert('Cette clé existe déjà. Veuillez en choisir une autre.')
        return
      }

      const { data, error } = await supabase
        .from('poi_types')
        .insert({
          hotel_id: hotel.id,
          type_key: formData.type_key.toLowerCase().replace(/\s+/g, '_'),
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          text_color: formData.text_color,
          bg_color: formData.bg_color,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Type de point créé avec succès !')
      setEditing(false)
      resetForm()
      await loadPoiTypes(hotel.id)
      setSelectedType(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updatePoiType() {
    if (!selectedType || !hotel) return

    try {
      const { error } = await supabase
        .from('poi_types')
        .update({
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          text_color: formData.text_color,
          bg_color: formData.bg_color,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        })
        .eq('id', selectedType.id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Type de point mis à jour')
      setEditing(false)
      await loadPoiTypes(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  async function deletePoiType(id: number) {
    if (!confirm('Supprimer définitivement ce type de point ?\nLes points d\'intérêt utilisant ce type seront orphelins.')) return
    if (!hotel) return

    try {
      const { error } = await supabase
        .from('poi_types')
        .delete()
        .eq('id', id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Type de point supprimé')
      await loadPoiTypes(hotel.id)
      if (selectedType?.id === id) {
        setSelectedType(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  async function toggleActive(id: number, currentStatus: boolean) {
    if (!hotel) return
    
    try {
      const { error } = await supabase
        .from('poi_types')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      await loadPoiTypes(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
    }
  }

  // ============================================
  // UTILS
  // ============================================
  function resetForm() {
    setFormData({
      type_key: '',
      name: '',
      icon: '📍',
      color: 'bg-gray-500',
      text_color: 'text-gray-700',
      bg_color: 'bg-gray-50',
      sort_order: 0,
      is_active: true
    })
  }

  function startEdit(type?: any) {
    if (type) {
      setFormData({
        type_key: type.type_key || '',
        name: type.name || '',
        icon: type.icon || '📍',
        color: type.color || 'bg-gray-500',
        text_color: type.text_color || 'text-gray-700',
        bg_color: type.bg_color || 'bg-gray-50',
        sort_order: type.sort_order || 0,
        is_active: type.is_active !== false
      })
      setSelectedType(type)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedType) {
      setFormData({
        type_key: selectedType.type_key || '',
        name: selectedType.name || '',
        icon: selectedType.icon || '📍',
        color: selectedType.color || 'bg-gray-500',
        text_color: selectedType.text_color || 'text-gray-700',
        bg_color: selectedType.bg_color || 'bg-gray-50',
        sort_order: selectedType.sort_order || 0,
        is_active: selectedType.is_active !== false
      })
    } else {
      resetForm()
    }
  }

  function generateKeyFromName(name: string) {
    const key = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
    setFormData({ ...formData, type_key: key })
  }

  if (loading && !poiTypes.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">📍</div>
          <p className="text-gray-600">Chargement des types de points...</p>
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
              <span>📍</span> Types de points d'intérêt
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Définissez les types de lieux affichés sur le plan de l'hôtel
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setSelectedType(null)
              setEditing(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
          >
            <span>➕</span>
            Nouveau type
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* ===== COLONNE 1 : LISTE DES TYPES ===== */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Types de POI
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {poiTypes.length}
              </span>
            </h2>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {poiTypes.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Aucun type défini
                </p>
              ) : (
                poiTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type)
                      setFormData({
                        type_key: type.type_key || '',
                        name: type.name || '',
                        icon: type.icon || '📍',
                        color: type.color || 'bg-gray-500',
                        text_color: type.text_color || 'text-gray-700',
                        bg_color: type.bg_color || 'bg-gray-50',
                        sort_order: type.sort_order || 0,
                        is_active: type.is_active !== false
                      })
                      setEditing(false)
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg transition flex items-center gap-3
                      ${selectedType?.id === type.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }
                      ${!type.is_active && 'opacity-60'}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                      ${selectedType?.id === type.id
                        ? 'bg-white/20 text-white'
                        : type.color || 'bg-gray-500'
                      }
                    `}>
                      {type.icon || '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        {type.name}
                        {!type.is_active && (
                          <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded-full">
                            Inactif
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${
                        selectedType?.id === type.id
                          ? 'text-white/80'
                          : 'text-gray-500'
                      }`}>
                        {type.type_key} • Ordre: {type.sort_order || 0}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ===== COLONNE 2 : ÉDITION ===== */}
          <div className="col-span-8">
            {editing || selectedType ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {editing 
                    ? (selectedType ? '✏️ Modifier le type' : '➕ Nouveau type')
                    : '🔍 Détails du type'
                  }
                </h2>

                {editing ? (
                  // ===== FORMULAIRE D'ÉDITION =====
                  <div className="space-y-6">
                    {/* Clé unique (uniquement pour les nouveaux) */}
                    {!selectedType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clé unique <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.type_key}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              type_key: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                            })}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm"
                            placeholder="ex: reception, restaurant, pool"
                          />
                          <button
                            type="button"
                            onClick={() => generateKeyFromName(formData.name)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Générer
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Identifiant unique utilisé dans le code
                        </p>
                      </div>
                    )}

                    {/* Nom affiché */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom affiché <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="Ex: Réception, Restaurant, Piscine"
                      />
                    </div>

                    {/* Icône */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icône
                      </label>
                      <div className="grid grid-cols-8 gap-2 mb-2">
                        {popularIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon })}
                            className={`
                              w-10 h-10 rounded-lg text-2xl flex items-center justify-center
                              ${formData.icon === icon
                                ? 'bg-emerald-100 ring-2 ring-emerald-500'
                                : 'bg-gray-100 hover:bg-gray-200'
                              }
                            `}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Couleur */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Couleur
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {colorPalettes.map((palette) => (
                          <button
                            key={palette.color}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              color: palette.color,
                              bg_color: palette.bg,
                              text_color: palette.text
                            })}
                            className={`
                              p-2 rounded-lg border-2 transition
                              ${formData.color === palette.color
                                ? 'border-emerald-500 ring-2 ring-emerald-200'
                                : 'border-transparent hover:border-gray-300'
                              }
                            `}
                          >
                            <div className={`w-full h-8 ${palette.color} rounded flex items-center justify-center text-white text-xs`}>
                              Aa
                            </div>
                            <span className="text-xs text-gray-600 mt-1 block text-center">
                              {palette.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ordre d'affichage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ordre d'affichage
                      </label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-32 rounded-lg border-gray-300 shadow-sm"
                        min="0"
                        step="10"
                      />
                    </div>

                    {/* Statut actif */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                        Type actif (affiché sur le plan)
                      </label>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={selectedType ? updatePoiType : createPoiType}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <span>💾</span>
                        {selectedType ? 'Mettre à jour' : 'Créer'}
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
                ) : (
                  // ===== DÉTAILS =====
                  selectedType && (
                    <div className="space-y-6">
                      {/* Aperçu du point */}
                      <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
                        <div className={`
                          w-16 h-16 ${selectedType.color} rounded-full flex items-center justify-center
                          text-white text-3xl shadow-lg
                        `}>
                          {selectedType.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {selectedType.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Clé: <code className="bg-gray-200 px-2 py-0.5 rounded">{selectedType.type_key}</code>
                          </p>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Ordre d'affichage</p>
                          <p className="font-medium text-gray-800">{selectedType.sort_order || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Statut</p>
                          <p className={`font-medium ${selectedType.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                            {selectedType.is_active ? 'Actif' : 'Inactif'}
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => startEdit(selectedType)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <span>✏️</span>
                          Modifier
                        </button>
                        <button
                          onClick={() => toggleActive(selectedType.id, selectedType.is_active)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <span>{selectedType.is_active ? '🔴' : '🟢'}</span>
                          {selectedType.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => deletePoiType(selectedType.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <span>🗑️</span>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-7xl mb-4">📍</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Aucun type sélectionné
                </h3>
                <p className="text-gray-600">
                  Sélectionnez un type dans la liste ou créez-en un nouveau.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}