'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { Icon } from '@/components/ui/Icons'

type EntityType = 'restaurant' | 'activity' | 'show' | 'suggestion'

interface AdminImageGalleryProps {
  entityType: EntityType
  entityId: number
  hotelId: number
  onImageUpdate?: () => void
}

const BRIDGE_CONFIG: Record<EntityType, { table: string; fkColumn: string }> = {
  restaurant: { table: 'food_spot_images',     fkColumn: 'food_spot_id'     },
  activity:   { table: 'entertainment_images',  fkColumn: 'entertainment_id' },
  show:       { table: 'entertainment_images',  fkColumn: 'entertainment_id' },
  suggestion: { table: 'suggestion_images',     fkColumn: 'suggestion_id'    },
}

const ENTITY_LABELS: Record<EntityType, string> = {
  restaurant: 'ce restaurant',
  activity:   'cette activité',
  show:       'ce spectacle',
  suggestion: 'cette découverte',
}

export default function AdminImageGallery({
  entityType,
  entityId,
  hotelId,
  onImageUpdate,
}: AdminImageGalleryProps) {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const supabase = createClient()
  const { table, fkColumn } = BRIDGE_CONFIG[entityType]

  useEffect(() => {
    loadImages()
  }, [entityType, entityId])

  async function loadImages() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from(table)
        .select(`
          is_principal,
          sort_order,
          image:image_id(id, url, alt_text)
        `)
        .eq(fkColumn, entityId)
        .order('is_principal', { ascending: false })
        .order('sort_order')
      setImages(data || [])
    } catch (error) {
      console.error('Erreur chargement images:', error)
    } finally {
      setLoading(false)
    }
  }

  async function setAsPrincipal(imageId: number) {
    try {
      await supabase.from(table).update({ is_principal: false }).eq(fkColumn, entityId)
      await supabase.from(table).update({ is_principal: true }).eq(fkColumn, entityId).eq('image_id', imageId)
      await loadImages()
      onImageUpdate?.()
    } catch (error) {
      console.error('Erreur setAsPrincipal:', error)
    }
  }

  async function deleteImage(imageId: number) {
    if (confirmDeleteId !== imageId) {
      setConfirmDeleteId(imageId)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    setConfirmDeleteId(null)
    try {
      await supabase.from(table).delete().eq(fkColumn, entityId).eq('image_id', imageId)
      await loadImages()
      onImageUpdate?.()
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const cloudData = await res.json()
      if (!cloudData.secure_url) throw new Error('Upload Cloudinary échoué')

      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({ url: cloudData.secure_url, alt_text: file.name.split('.')[0] })
        .select()
        .single()
      if (imageError) throw imageError

      const currentImages = await supabase.from(table).select('id').eq(fkColumn, entityId)
      const isFirst = !currentImages.data?.length

      const { error: linkError } = await supabase.from(table).insert({
        [fkColumn]: entityId,
        image_id: imageData.id,
        is_principal: isFirst,
      })
      if (linkError) throw linkError

      await loadImages()
      onImageUpdate?.()
    } catch (error) {
      console.error('Erreur upload:', error)
      setUploadError('Erreur lors de l\'upload. Veuillez réessayer.')
    } finally {
      setUploading(false)
      setPreview(null)
      e.target.value = ''
    }
  }

  const principalImage = images.find(img => img.is_principal)
  const otherImages = images.filter(img => !img.is_principal)

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="w-full h-48 bg-gray-200 rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Image principale */}
      {principalImage ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img
            src={principalImage.image.url}
            alt={principalImage.image.alt_text || 'Image principale'}
            className="w-full h-56 object-cover"
          />
          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Icon.Star className="w-3 h-3" />
            Principale
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => deleteImage(principalImage.image.id)}
              className={`text-white px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                confirmDeleteId === principalImage.image.id
                  ? 'bg-red-700 animate-pulse'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {confirmDeleteId === principalImage.image.id ? 'Confirmer ?' : 'Supprimer'}
            </button>
          </div>
        </div>
      ) : (
        images.length === 0 && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Icon.Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune image pour {ENTITY_LABELS[entityType]}</p>
          </div>
        )
      )}

      {/* Galerie */}
      {otherImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {otherImages.map((img) => (
            <div key={img.image.id} className="relative group rounded-lg overflow-hidden">
              <img
                src={img.image.url}
                alt={img.image.alt_text || 'Photo'}
                className="w-full h-20 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 p-1">
                <button
                  onClick={() => setAsPrincipal(img.image.id)}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                >
                  Principale
                </button>
                <button
                  onClick={() => deleteImage(img.image.id)}
                  className={`text-white px-2 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                    confirmDeleteId === img.image.id
                      ? 'bg-red-700 animate-pulse'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmDeleteId === img.image.id ? 'Confirmer ?' : 'Suppr.'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Ajouter une photo</p>
        {uploadError && (
          <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
            <Icon.X className="w-3 h-3" />
            {uploadError}
          </p>
        )}
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 transition">
            {preview ? (
              <div className="space-y-2">
                <img src={preview} alt="Aperçu" className="max-h-24 mx-auto rounded" />
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Icon.Spinner className="w-3 h-3" />
                  Upload en cours...
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Icon.Image className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-sm font-medium text-blue-600">
                  {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter une image'}
                </p>
                <p className="text-xs text-gray-400">PNG, JPG • Max 10 MB</p>
              </div>
            )}
          </div>
        </label>
      </div>
    </div>
  )
}
