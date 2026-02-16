'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { getCurrentHotelClient } from '@/lib/hotel-client'
import HotelSelector from '@/components/admin/HotelSelector'
import ImageUploader from '@/components/admin/ImageUploader'
import Link from 'next/link'
import Image from 'next/image'

export default function AdminHotelPage() {
  const [currentHotel, setCurrentHotel] = useState<any>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [hotel, setHotel] = useState<any>(null)
  const [hotelImages, setHotelImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    primary_color: '#0ea5e9',
    secondary_color: '#d4af37',
    logo_url: ''
  })

  const supabase = createClient()

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const hotelData = await getCurrentHotelClient()
        setCurrentHotel(hotelData)
        
        if (!hotelData) {
          setIsSuperAdmin(true)
          setSelectedHotelId(null)
          setLoading(false)
        } else {
          setIsSuperAdmin(false)
          setSelectedHotelId(hotelData.id)
          await loadHotelData(hotelData.id)
          await loadHotelImages(hotelData.id)
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
    if (selectedHotelId && !creating) {
      loadHotelData(selectedHotelId)
      loadHotelImages(selectedHotelId)
    }
  }, [selectedHotelId, creating])

  async function loadHotelData(hotelId: number) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single()

      if (error) throw error

      setHotel(data)
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        check_in_time: data.check_in_time?.slice(0,5) || '15:00',
        check_out_time: data.check_out_time?.slice(0,5) || '11:00',
        primary_color: data.primary_color || '#0ea5e9',
        secondary_color: data.secondary_color || '#d4af37',
        logo_url: data.logo_url || ''
      })
      setLogoPreview(data.logo_url || null)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadHotelImages(hotelId: number) {
    try {
      const { data } = await supabase
        .from('hotel_images')
        .select(`
          id,
          title,
          sort_order,
          image:image_id(
            id,
            url,
            alt_text
          )
        `)
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('sort_order')

      setHotelImages(data || [])
    } catch (error) {
      console.error('Erreur chargement images:', error)
    }
  }

  // ============================================
  // UPLOAD IMAGE CLOUDINARY
  // ============================================
  async function uploadImage(file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )
      
      const data = await res.json()
      
      setFormData(prev => ({ ...prev, logo_url: data.secure_url }))
      setLogoPreview(data.secure_url)
      
      return data.secure_url
    } catch (error) {
      console.error('Erreur upload:', error)
      throw error
    }
  }

  // ============================================
  // GESTION DES IMAGES DU CARROUSEL
  // ============================================
  async function addCarouselImage(file: File) {
    if (!selectedHotelId) return

    try {
      // Upload vers Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )
      
      const cloudinaryData = await res.json()
      
      // Sauvegarder dans la table images
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          url: cloudinaryData.secure_url,
          alt_text: file.name.split('.')[0]
        })
        .select()
        .single()

      if (imageError) throw imageError

      // Lier à l'hôtel
      const { error: linkError } = await supabase
        .from('hotel_images')
        .insert({
          hotel_id: selectedHotelId,
          image_id: imageData.id,
          title: file.name.split('.')[0],
          sort_order: hotelImages.length,
          is_active: true
        })

      if (linkError) throw linkError

      alert('✅ Image ajoutée au carrousel')
      await loadHotelImages(selectedHotelId)
    } catch (error) {
      console.error('Erreur ajout image:', error)
      alert('❌ Erreur lors de l\'ajout')
    }
  }

  async function deleteCarouselImage(imageId: number) {
    if (!confirm('Supprimer cette image du carrousel ?')) return
    if (!selectedHotelId) return

    try {
      const { error } = await supabase
        .from('hotel_images')
        .delete()
        .eq('hotel_id', selectedHotelId)
        .eq('image_id', imageId)

      if (error) throw error

      alert('✅ Image supprimée')
      await loadHotelImages(selectedHotelId)
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  async function reorderImages(imageId: number, newOrder: number) {
    if (!selectedHotelId) return

    try {
      const { error } = await supabase
        .from('hotel_images')
        .update({ sort_order: newOrder })
        .eq('hotel_id', selectedHotelId)
        .eq('image_id', imageId)

      if (error) throw error

      await loadHotelImages(selectedHotelId)
    } catch (error) {
      console.error('Erreur réorganisation:', error)
    }
  }

  // ============================================
  // CRÉER UN NOUVEL HÔTEL
  // ============================================
  async function createHotel() {
    setSaving(true)
    try {
      if (!formData.name || !formData.slug) {
        alert('Veuillez remplir le nom et le slug de l\'hôtel')
        return
      }

      const { data: existing } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', formData.slug.toLowerCase().replace(/\s+/g, '-'))
        .maybeSingle()

      if (existing) {
        alert('Ce slug est déjà utilisé. Veuillez en choisir un autre.')
        return
      }

      const { data, error } = await supabase
        .from('hotels')
        .insert({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          check_in_time: formData.check_in_time,
          check_out_time: formData.check_out_time,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          logo_url: formData.logo_url
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Hôtel créé avec succès !')
      setCreating(false)
      setEditing(false)
      setSelectedHotelId(data.id)
      await loadHotelData(data.id)
      await loadHotelImages(data.id)
    } catch (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // MISE À JOUR DE L'HÔTEL
  // ============================================
  async function updateHotel() {
    if (!selectedHotelId) return
    
    setSaving(true)
    try {
      if (!formData.name || !formData.slug) {
        alert('Veuillez remplir le nom et le slug de l\'hôtel')
        return
      }

      const { error } = await supabase
        .from('hotels')
        .update({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          check_in_time: formData.check_in_time,
          check_out_time: formData.check_out_time,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          logo_url: formData.logo_url
        })
        .eq('id', selectedHotelId)

      if (error) throw error

      alert('✅ Informations mises à jour avec succès !')
      setEditing(false)
      await loadHotelData(selectedHotelId)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // GÉNÉRATION DE SLUG
  // ============================================
  function generateSlug() {
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData({ ...formData, slug })
  }

  // ============================================
  // RESET FORMULAIRE POUR NOUVEL HÔTEL
  // ============================================
  function resetFormForNew() {
    setFormData({
      name: '',
      slug: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      check_in_time: '15:00',
      check_out_time: '11:00',
      primary_color: '#0ea5e9',
      secondary_color: '#d4af37',
      logo_url: ''
    })
    setLogoPreview(null)
    setEditing(true)
    setCreating(true)
    setSelectedHotelId(null)
    setHotel(null)
    setHotelImages([])
  }

  // ============================================
  // RENDU
  // ============================================
  if (loading && !hotel && selectedHotelId && !creating) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🏨</div>
          <p className="text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🏨</span> Configuration de l'hôtel
              {currentHotel && !isSuperAdmin && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  - {currentHotel.name}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? 'Mode Super Admin : sélectionnez un hôtel ou créez-en un nouveau'
                : 'Gérez les informations générales et l\'apparence de votre établissement'}
            </p>
          </div>
          <div className="flex gap-3">
            {isSuperAdmin && !creating && !editing && (
              <button
                onClick={resetFormForNew}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
              >
                <span>➕</span>
                Nouvel hôtel
              </button>
            )}
            {selectedHotelId && !editing && !creating && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
              >
                <span>✏️</span>
                Modifier
              </button>
            )}
            {(editing || creating) && (
              <>
                <button
                  onClick={creating ? createHotel : updateHotel}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <span>💾</span>
                  {saving ? 'Enregistrement...' : creating ? 'Créer' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setCreating(false)
                    if (selectedHotelId) {
                      loadHotelData(selectedHotelId)
                      loadHotelImages(selectedHotelId)
                    } else {
                      setSelectedHotelId(null)
                      setHotel(null)
                      setHotelImages([])
                    }
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
                >
                  <span>✕</span>
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sélecteur d'hôtel pour super_admin */}
        {isSuperAdmin && !creating && (
          <HotelSelector
            onSelect={(hotelId) => {
              setSelectedHotelId(hotelId)
              setCreating(false)
              setEditing(false)
            }}
            selectedId={selectedHotelId}
            className="mb-6"
          />
        )}

        {/* Contenu principal */}
        {selectedHotelId || creating ? (
          <>
            {/* Aperçu de l'hôtel (carte) - uniquement en mode visualisation */}
            {!editing && !creating && hotel && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div 
                  className="h-32 bg-gradient-to-r"
                  style={{ 
                    background: `linear-gradient(to right, ${hotel.primary_color || '#0ea5e9'}, ${hotel.secondary_color || '#d4af37'})` 
                  }}
                />
                <div className="px-6 py-4 flex items-center gap-4">
                  {hotel.logo_url ? (
                    <div className="w-20 h-20 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center -mt-8 border-4 border-white">
                      <img 
                        src={hotel.logo_url} 
                        alt={hotel.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl shadow-md flex items-center justify-center -mt-8 border-4 border-white">
                      <span className="text-3xl text-gray-400">🏨</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{hotel.name}</h2>
                    <p className="text-sm text-gray-500">{hotel.address || 'Adresse non définie'}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {hotel.slug}.guestskit.app
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Onglets de navigation */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px px-6">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`
                      py-4 px-4 text-sm font-medium border-b-2 transition
                      ${activeTab === 'general'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    📋 Informations générales
                  </button>
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`
                      py-4 px-4 text-sm font-medium border-b-2 transition
                      ${activeTab === 'appearance'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    🎨 Apparence
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`
                      py-4 px-4 text-sm font-medium border-b-2 transition
                      ${activeTab === 'contact'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    📞 Contact & Horaires
                  </button>
                  <button
                    onClick={() => setActiveTab('carousel')}
                    className={`
                      py-4 px-4 text-sm font-medium border-b-2 transition
                      ${activeTab === 'carousel'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    🖼️ Carrousel photos
                  </button>
                </nav>
              </div>
            </div>

            {/* Contenu des onglets */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* ===== ONGLET INFORMATIONS GÉNÉRALES ===== */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Informations générales
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Nom de l'hôtel */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'hôtel <span className="text-red-500">*</span>
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="Ex: Hôtel Paradis"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.name || '-'}</p>
                      )}
                    </div>

                    {/* Slug / Sous-domaine */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      {(editing || creating) ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm"
                            placeholder="hotel-paradis"
                          />
                          <button
                            type="button"
                            onClick={generateSlug}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Générer
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.slug || '-'}</p>
                      )}
                      {(editing || creating) && (
                        <p className="text-xs text-gray-500 mt-1">
                          URL: https://{formData.slug || 'hotel-paradis'}.guestskit.app
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      {(editing || creating) ? (
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="Description de votre établissement..."
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.description || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== ONGLET APPARENCE ===== */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Identité visuelle
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Logo */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo de l'hôtel
                      </label>
                      {(editing || creating) ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-6">
                            <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                              {logoPreview ? (
                                <img 
                                  src={logoPreview} 
                                  alt="Logo preview"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-4xl text-gray-400">🏨</span>
                              )}
                            </div>
                            <div>
                              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition inline-block">
                                Choisir un fichier
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      try {
                                        await uploadImage(file)
                                      } catch (error) {
                                        alert('Erreur lors de l\'upload')
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-xs text-gray-500 mt-2">
                                PNG, JPG ou SVG • 500x500px recommandé
                              </p>
                            </div>
                          </div>
                          {formData.logo_url && (
                            <button
                              onClick={() => {
                                setFormData({ ...formData, logo_url: '' })
                                setLogoPreview(null)
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Supprimer le logo
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          {hotel?.logo_url ? (
                            <div className="w-20 h-20 bg-white rounded-lg shadow-sm border p-2">
                              <img 
                                src={hotel.logo_url} 
                                alt={hotel.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-3xl text-gray-400">🏨</span>
                            </div>
                          )}
                          <span className="text-gray-600">
                            {hotel?.logo_url ? 'Logo personnalisé' : 'Aucun logo'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Couleur primaire */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Couleur primaire
                      </label>
                      {(editing || creating) ? (
                        <div className="flex gap-3 items-center">
                          <input
                            type="color"
                            value={formData.primary_color}
                            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.primary_color}
                            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm"
                            placeholder="#0ea5e9"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-gray-200"
                            style={{ backgroundColor: hotel?.primary_color || '#0ea5e9' }}
                          />
                          <span className="text-gray-900">{hotel?.primary_color || '#0ea5e9'}</span>
                        </div>
                      )}
                    </div>

                    {/* Couleur secondaire */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Couleur secondaire
                      </label>
                      {(editing || creating) ? (
                        <div className="flex gap-3 items-center">
                          <input
                            type="color"
                            value={formData.secondary_color}
                            onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.secondary_color}
                            onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm"
                            placeholder="#d4af37"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-gray-200"
                            style={{ backgroundColor: hotel?.secondary_color || '#d4af37' }}
                          />
                          <span className="text-gray-900">{hotel?.secondary_color || '#d4af37'}</span>
                        </div>
                      )}
                    </div>

                    {/* Aperçu des couleurs */}
                    {(editing || creating) && (
                      <div className="col-span-2 mt-2 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-3">Aperçu :</p>
                        <div className="flex gap-4">
                          <button 
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                            style={{ backgroundColor: formData.primary_color }}
                          >
                            Bouton primaire
                          </button>
                          <button 
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                            style={{ backgroundColor: formData.secondary_color }}
                          >
                            Bouton secondaire
                          </button>
                          <div 
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ 
                              backgroundColor: `${formData.primary_color}20`,
                              color: formData.primary_color,
                              border: `1px solid ${formData.primary_color}40`
                            }}
                          >
                            Badge
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== ONGLET CONTACT & HORAIRES ===== */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Contact & Horaires
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Adresse */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="123 Boulevard de la Mer, 06100 Nice"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.address || '-'}</p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="+33 4 93 12 34 56"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.phone || '-'}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="contact@hotel-paradis.fr"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.email || '-'}</p>
                      )}
                    </div>

                    {/* Site web */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site web
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                          placeholder="https://www.hotel-paradis.fr"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {hotel?.website ? (
                            <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {hotel.website}
                            </a>
                          ) : '-'}
                        </p>
                      )}
                    </div>

                    {/* Check-in */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure d'arrivée (check-in)
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="time"
                          value={formData.check_in_time}
                          onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.check_in_time?.slice(0,5) || '15:00'}</p>
                      )}
                    </div>

                    {/* Check-out */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure de départ (check-out)
                      </label>
                      {(editing || creating) ? (
                        <input
                          type="time"
                          value={formData.check_out_time}
                          onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{hotel?.check_out_time?.slice(0,5) || '11:00'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== ONGLET CARROUSEL PHOTOS ===== */}
              {activeTab === 'carousel' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Photos du carrousel (page d'accueil)
                  </h2>

                  {!editing && !creating ? (
                    // Mode visualisation
                    <div>
                      {hotelImages.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">Aucune image dans le carrousel</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {hotelImages.map((item) => (
                            <div key={item.id} className="relative group">
                              <img
                                src={item.image.url}
                                alt={item.title || item.image.alt_text || 'Photo hôtel'}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {!editing && (
                        <button
                          onClick={() => setEditing(true)}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          ✏️ Modifier les photos
                        </button>
                      )}
                    </div>
                  ) : (
                    // Mode édition
                    <div className="space-y-6">
                      {/* Liste des images existantes */}
                      {hotelImages.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">
                            Images actuelles
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {hotelImages.map((item) => (
                              <div key={item.id} className="relative group">
                                <img
                                  src={item.image.url}
                                  alt={item.title || item.image.alt_text || 'Photo hôtel'}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => deleteCarouselImage(item.image.id)}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ajout de nouvelles images */}
                      <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Ajouter une photo
                        </h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                await addCarouselImage(file)
                              }
                            }}
                            className="hidden"
                            id="carousel-image-upload"
                          />
                          <label
                            htmlFor="carousel-image-upload"
                            className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
                          >
                            <span>📸</span>
                            Choisir une image
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG • Max 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Informations complémentaires - seulement en mode visualisation */}
            {!editing && !creating && hotel && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h3 className="font-medium mb-1">Informations système</h3>
                    <p className="text-blue-700">
                      ID de l'hôtel : <code className="bg-blue-100 px-2 py-0.5 rounded">{hotel.id}</code> • 
                      Créé le : {new Date(hotel.created_at).toLocaleDateString('fr-FR')} • 
                      Dernière mise à jour : {hotel.updated_at ? new Date(hotel.updated_at).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-amber-200">
              <div className="text-7xl mb-4">🏨</div>
              <h3 className="text-xl font-medium text-amber-800 mb-2">
                Aucun hôtel sélectionné
              </h3>
              <p className="text-amber-600">
                Veuillez sélectionner un hôtel dans la liste ci-dessus pour configurer ses paramètres,
                ou cliquez sur "Nouvel hôtel" pour en créer un.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}