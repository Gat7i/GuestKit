'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
type CategoryType = {
  id: number
  name: string
  category_type: string
  icon: string
  color: string
  bg_color: string
  text_color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

type CategoriesByType = Record<string, CategoryType[]>

export default function AdminCategoriesPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    category_type: 'suggestion',
    icon: '✨',
    color: 'from-purple-500 to-purple-600',
    bg_color: 'bg-purple-50',
    text_color: 'text-purple-700',
    sort_order: 0,
    is_active: true
  })

  const supabase = createClient()

  // Types de catégories disponibles
  const categoryTypes = [
    { value: 'suggestion', label: 'Découvertes', icon: '✨' },
    { value: 'activity', label: 'Activités', icon: '🎭' },
    { value: 'show', label: 'Spectacles', icon: '🌟' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' }
  ]

  // Palettes de couleurs prédéfinies
  const colorPalettes = [
    { name: 'Bleu', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
    { name: 'Vert', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700' },
    { name: 'Rouge', color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-700' },
    { name: 'Orange', color: 'from-orange-500 to-red-600', bg: 'bg-orange-50', text: 'text-orange-700' },
    { name: 'Ambre', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700' },
    { name: 'Violet', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700' },
    { name: 'Rose', color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', text: 'text-pink-700' },
    { name: 'Indigo', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    { name: 'Cyan', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    { name: 'Gris', color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50', text: 'text-gray-700' }
  ]

  // Icônes populaires
  const popularIcons = [
    '✨', '🎭', '🌟', '🍽️', '🏊', '🧘', '💪', '🎨', '🎯', '⚽',
    '🏄', '🚤', '🛍️', '🏛️', '🌿', '🍷', '📷', '🎵', '🎪', '🎨',
    '🧸', '👨‍🍳', '🍸', '☕', '📚', '🎮', '🏋️', '🚴', '🧖', '💆'
  ]

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const init = async () => {
      const hotelData = await getCurrentHotelClient()
      setHotel(hotelData)
      if (hotelData) {
        await loadCategories(hotelData.id)
      }
    }
    init()
  }, [])

  async function loadCategories(hotelId: number) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('category_type')
        .order('sort_order')
        .order('name')

      setCategories(data || [])
      
      if (data?.length && !selectedCategory) {
        setSelectedCategory(data[0])
        setFormData({
          name: data[0].name || '',
          category_type: data[0].category_type || 'suggestion',
          icon: data[0].icon || '✨',
          color: data[0].color || 'from-purple-500 to-purple-600',
          bg_color: data[0].bg_color || 'bg-purple-50',
          text_color: data[0].text_color || 'text-purple-700',
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
  // CRUD CATÉGORIES
  // ============================================
  async function createCategory() {
    try {
      if (!formData.name || !formData.category_type) {
        alert('Veuillez remplir le nom et le type de catégorie')
        return
      }
      if (!hotel) {
        alert('Hôtel non identifié')
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          hotel_id: hotel.id,
          name: formData.name,
          category_type: formData.category_type,
          icon: formData.icon,
          color: formData.color,
          bg_color: formData.bg_color,
          text_color: formData.text_color,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Catégorie créée avec succès !')
      setEditing(false)
      resetForm()
      await loadCategories(hotel.id)
      setSelectedCategory(data)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  async function updateCategory() {
    if (!selectedCategory || !hotel) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          category_type: formData.category_type,
          icon: formData.icon,
          color: formData.color,
          bg_color: formData.bg_color,
          text_color: formData.text_color,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        })
        .eq('id', selectedCategory.id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Catégorie mise à jour')
      setEditing(false)
      await loadCategories(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm('Supprimer définitivement cette catégorie ?\nLes éléments liés ne seront plus catégorisés.')) return
    if (!hotel) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      alert('✅ Catégorie supprimée')
      await loadCategories(hotel.id)
      if (selectedCategory?.id === id) {
        setSelectedCategory(null)
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
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('hotel_id', hotel.id)

      if (error) throw error

      await loadCategories(hotel.id)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
    }
  }

  // ============================================
  // UTILS
  // ============================================
  function resetForm() {
    setFormData({
      name: '',
      category_type: 'suggestion',
      icon: '✨',
      color: 'from-purple-500 to-purple-600',
      bg_color: 'bg-purple-50',
      text_color: 'text-purple-700',
      sort_order: 0,
      is_active: true
    })
  }

  function startEdit(category?: CategoryType) {
    if (category) {
      setFormData({
        name: category.name || '',
        category_type: category.category_type || 'suggestion',
        icon: category.icon || '✨',
        color: category.color || 'from-purple-500 to-purple-600',
        bg_color: category.bg_color || 'bg-purple-50',
        text_color: category.text_color || 'text-purple-700',
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== false
      })
      setSelectedCategory(category)
    }
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name || '',
        category_type: selectedCategory.category_type || 'suggestion',
        icon: selectedCategory.icon || '✨',
        color: selectedCategory.color || 'from-purple-500 to-purple-600',
        bg_color: selectedCategory.bg_color || 'bg-purple-50',
        text_color: selectedCategory.text_color || 'text-purple-700',
        sort_order: selectedCategory.sort_order || 0,
        is_active: selectedCategory.is_active !== false
      })
    } else {
      resetForm()
    }
  }

  // Filtrer les catégories par type
  const filteredCategories = categories.filter((cat: CategoryType) => 
    filterType === 'all' || cat.category_type === filterType
  )

  // Grouper par type
  const categoriesByType = filteredCategories.reduce((acc: CategoriesByType, cat: CategoryType) => {
    const type = cat.category_type
    if (!acc[type]) acc[type] = []
    acc[type].push(cat)
    return acc
  }, {} as CategoriesByType)

  if (loading && !categories.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🏷️</div>
          <p className="text-gray-600">Chargement des catégories...</p>
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
              <span>🏷️</span> Gestion des catégories
              {hotel && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {hotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Créez et personnalisez les catégories pour vos activités et découvertes
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setSelectedCategory(null)
              setEditing(true)
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
          >
            <span>➕</span>
            Nouvelle catégorie
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrer par type :</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {categoryTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                    filterType === type.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* ===== COLONNE 1 : LISTE DES CATÉGORIES ===== */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Catégories
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {filteredCategories.length}
              </span>
            </h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {Object.entries(categoriesByType).length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Aucune catégorie
                </p>
              ) : (
                Object.entries(categoriesByType).map(([type, typeCategories]) => {
                  const typeInfo = categoryTypes.find(t => t.value === type) || { icon: '📌', label: type }
                  
                  return (
                    <div key={type}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span>{typeInfo.icon}</span>
                        {typeInfo.label}
                      </h3>
                      <div className="space-y-1">
                        {typeCategories.map((category: CategoryType) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category)
                              setFormData({
                                name: category.name || '',
                                category_type: category.category_type || 'suggestion',
                                icon: category.icon || '✨',
                                color: category.color || 'from-purple-500 to-purple-600',
                                bg_color: category.bg_color || 'bg-purple-50',
                                text_color: category.text_color || 'text-purple-700',
                                sort_order: category.sort_order || 0,
                                is_active: category.is_active !== false
                              })
                              setEditing(false)
                            }}
                            className={`
                              w-full text-left p-3 rounded-lg transition flex items-center gap-2
                              ${selectedCategory?.id === category.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                              }
                              ${!category.is_active && 'opacity-60'}
                            `}
                          >
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0
                              ${selectedCategory?.id === category.id
                                ? 'bg-white/20 text-white'
                                : category.bg_color || 'bg-gray-200'
                              }
                            `}>
                              {category.icon || '🏷️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate flex items-center gap-2">
                                {category.name}
                                {!category.is_active && (
                                  <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded-full">
                                    Inactif
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${
                                selectedCategory?.id === category.id
                                  ? 'text-white/80'
                                  : 'text-gray-500'
                              }`}>
                                Ordre: {category.sort_order || 0}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ===== COLONNE 2 : ÉDITION ===== */}
          <div className="col-span-8">
            {editing || selectedCategory ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {editing 
                    ? (selectedCategory ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie')
                    : '🔍 Aperçu de la catégorie'
                  }
                </h2>

                {editing ? (
                  // ===== FORMULAIRE D'ÉDITION =====
                  <div className="space-y-6">
                    {/* Type de catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de catégorie <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category_type}
                        onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                      >
                        {categoryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nom de la catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la catégorie <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="Ex: Bien-être, Sport, Gastronomie..."
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
                                ? 'bg-indigo-100 ring-2 ring-indigo-500'
                                : 'bg-gray-100 hover:bg-gray-200'
                              }
                            `}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">Ou saisissez un emoji :</span>
                        <input
                          type="text"
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          className="w-24 rounded-lg border-gray-300 shadow-sm text-center text-2xl"
                        />
                      </div>
                    </div>

                    {/* Couleurs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Palette de couleurs
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPalettes.map((palette) => (
                          <button
                            key={palette.name}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              color: palette.color,
                              bg_color: palette.bg,
                              text_color: palette.text
                            })}
                            className={`
                              p-3 rounded-lg border-2 transition
                              ${formData.color === palette.color
                                ? 'border-indigo-500 ring-2 ring-indigo-200'
                                : 'border-transparent hover:border-gray-300'
                              }
                            `}
                          >
                            <div className={`w-full h-8 rounded bg-gradient-to-r ${palette.color}`} />
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
                      <p className="text-xs text-gray-500 mt-1">
                        Plus le nombre est petit, plus la catégorie apparaît en haut
                      </p>
                    </div>

                    {/* Statut actif */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                        Catégorie active
                      </label>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={selectedCategory ? updateCategory : createCategory}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <span>💾</span>
                        {selectedCategory ? 'Mettre à jour' : 'Créer'}
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
                  // ===== APERÇU DE LA CATÉGORIE =====
                  selectedCategory && (
                    <div className="space-y-6">
                      {/* Badge d'aperçu */}
                      <div className="flex justify-center py-6">
                        <div className={`
                          w-32 h-32 rounded-3xl bg-gradient-to-br ${selectedCategory.color}
                          flex flex-col items-center justify-center text-white
                          shadow-lg
                        `}>
                          <span className="text-5xl mb-2">{selectedCategory.icon}</span>
                          <span className="text-sm font-medium">{selectedCategory.name}</span>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Type</p>
                          <p className="font-medium text-gray-800">
                            {categoryTypes.find(t => t.value === selectedCategory.category_type)?.label || selectedCategory.category_type}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Ordre d'affichage</p>
                          <p className="font-medium text-gray-800">{selectedCategory.sort_order || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Statut</p>
                          <p className={`font-medium ${selectedCategory.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                            {selectedCategory.is_active ? 'Actif' : 'Inactif'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Créée le</p>
                          <p className="font-medium text-gray-800">
                            {new Date(selectedCategory.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {/* Prévisualisation */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Prévisualisation</h3>
                        <div className="flex items-center gap-4">
                          <div className={`
                            px-4 py-2 rounded-full ${selectedCategory.bg_color} ${selectedCategory.text_color}
                            flex items-center gap-2
                          `}>
                            <span>{selectedCategory.icon}</span>
                            <span className="font-medium">{selectedCategory.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">→ apparaîtra ainsi</span>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => startEdit(selectedCategory)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <span>✏️</span>
                          Modifier
                        </button>
                        <button
                          onClick={() => toggleActive(selectedCategory.id, selectedCategory.is_active)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <span>{selectedCategory.is_active ? '🔴' : '🟢'}</span>
                          {selectedCategory.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => deleteCategory(selectedCategory.id)}
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
                <div className="text-7xl mb-4">🏷️</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Aucune catégorie sélectionnée
                </h3>
                <p className="text-gray-600">
                  Sélectionnez une catégorie dans la liste ou créez-en une nouvelle.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}