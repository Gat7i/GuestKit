'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import Link from 'next/link'
import Image from 'next/image'

export default function AdminHotelPage() {
  const [hotel, setHotel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
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
    logo_url: '',
    cover_image_url: ''
  })

  const supabase = createClient()

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    loadHotelData()
  }, [])

  async function loadHotelData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', 1)
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
        logo_url: data.logo_url || '',
        cover_image_url: data.cover_image_url || ''
      })
      setLogoPreview(data.logo_url || null)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // UPLOAD IMAGE CLOUDINARY
  // ============================================
  async function uploadImage(file: File, type: 'logo' | 'cover') {
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
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo_url: data.secure_url }))
        setLogoPreview(data.secure_url)
      } else {
        setFormData(prev => ({ ...prev, cover_image_url: data.secure_url }))
      }
      
      return data.secure_url
    } catch (error) {
      console.error('Erreur upload:', error)
      throw error
    }
  }

  // ============================================
  // MISE À JOUR DE L'HÔTEL
  // ============================================
  async function updateHotel() {
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
          logo_url: formData.logo_url,
          cover_image_url: formData.cover_image_url
        })
        .eq('id', 1)

      if (error) throw error

      alert('✅ Informations mises à jour avec succès !')
      setEditing(false)
      await loadHotelData()
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
  // RENDU
  // ============================================
  if (loading) {
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
            </h1>
            <p className="text-gray-600">
              Gérez les informations générales et l'apparence de votre établissement
            </p>
          </div>
          <div className="flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2"
              >
                <span>✏️</span>
                Modifier
              </button>
            ) : (
              <>
                <button
                  onClick={updateHotel}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <span>💾</span>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    loadHotelData()
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

        {/* Aperçu de l'hôtel (carte) */}
        {!editing && hotel && (
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
                  {editing ? (
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
                  {editing ? (
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
                  {editing && (
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
                  {editing ? (
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
                  {editing ? (
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
                                    await uploadImage(file, 'logo')
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
                  {editing ? (
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
                  {editing ? (
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
                {editing && (
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
                  {editing ? (
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
                  {editing ? (
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
                  {editing ? (
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
                  {editing ? (
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
                  {editing ? (
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
                  {editing ? (
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
        </div>

        {/* Informations complémentaires */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-medium mb-1">Informations système</h3>
              <p className="text-blue-700">
                ID de l'hôtel : <code className="bg-blue-100 px-2 py-0.5 rounded">1</code> • 
                Créé le : {hotel?.created_at ? new Date(hotel.created_at).toLocaleDateString('fr-FR') : '-'} • 
                Dernière mise à jour : {hotel?.updated_at ? new Date(hotel.updated_at).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}