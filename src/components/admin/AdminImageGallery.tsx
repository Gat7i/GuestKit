'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { Icon } from '@/components/ui/Icons'
import {
  uploadEntityImage,
  deleteEntityImage,
  setEntityImageAsPrincipal,
} from '@/app/admin/image-actions'

type EntityType = 'restaurant' | 'activity' | 'show' | 'suggestion'
type BridgeTable = 'entertainment_images' | 'food_spot_images' | 'suggestion_images'

interface AdminImageGalleryProps {
  entityType: EntityType
  entityId: number
  hotelId: number
  onImageUpdate?: () => void
}

const BRIDGE_CONFIG: Record<EntityType, { table: BridgeTable; fkColumn: string }> = {
  restaurant: { table: 'food_spot_images',    fkColumn: 'food_spot_id'     },
  activity:   { table: 'entertainment_images', fkColumn: 'entertainment_id' },
  show:       { table: 'entertainment_images', fkColumn: 'entertainment_id' },
  suggestion: { table: 'suggestion_images',    fkColumn: 'suggestion_id'    },
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
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { table, fkColumn } = BRIDGE_CONFIG[entityType]

  useEffect(() => {
    loadImages()
  }, [entityType, entityId])

  async function loadImages() {
    setLoading(true)
    setError(null)
    try {
      // On sélectionne uniquement les colonnes qui existent à coup sûr
      const { data, error: queryError } = await supabase
        .from(table)
        .select(`is_principal, image:image_id(id, url, alt_text)`)
        .eq(fkColumn, entityId)
        .order('is_principal', { ascending: false })

      if (queryError) throw queryError
      setImages(data || [])
    } catch (err: any) {
      console.error('Erreur chargement images:', err)
      setError('Impossible de charger les images.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetAsPrincipal(imageId: number) {
    try {
      await setEntityImageAsPrincipal(table, entityId, imageId)
      await loadImages()
      onImageUpdate?.()
    } catch (err: any) {
      setError('Erreur lors du changement d\'image principale.')
    }
  }

  async function handleDelete(imageId: number) {
    if (confirmDeleteId !== imageId) {
      setConfirmDeleteId(imageId)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    setConfirmDeleteId(null)
    setError(null)
    try {
      await deleteEntityImage(table, entityId, imageId)
      await loadImages()
      onImageUpdate?.()
    } catch (err: any) {
      const msg: string = err.message || ''
      if (msg.includes('foreign key') || msg.includes('violates')) {
        setError('Cette image est encore utilisée ailleurs. Supprimez d\'abord les références liées.')
      } else {
        setError(`Erreur lors de la suppression : ${msg}`)
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      // 1. Upload Cloudinary (client-side)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      const cloudData = await res.json()
      if (!cloudData.secure_url) throw new Error('Upload Cloudinary échoué')

      // 2. Vérifier si c'est la première image (via état local)
      const isFirst = images.length === 0

      // 3. Enregistrer en base via server action (bypass RLS)
      await uploadEntityImage(
        table,
        entityId,
        cloudData.secure_url,
        file.name.split('.')[0],
        isFirst
      )

      await loadImages()
      onImageUpdate?.()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload. Veuillez réessayer.')
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

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2 text-sm text-red-700">
          <Icon.X className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <Icon.X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Image principale */}
      {principalImage ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img
            src={principalImage.image.url}
            alt={principalImage.image.alt_text || 'Image principale'}
            className="w-full h-56 object-cover"
          />
          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Icon.Star className="w-3 h-3" /> Principale
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => handleDelete(principalImage.image.id)}
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
                  onClick={() => handleSetAsPrincipal(img.image.id)}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                >
                  Principale
                </button>
                <button
                  onClick={() => handleDelete(img.image.id)}
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

      {/* Zone d'upload */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Ajouter une photo</p>
        <label className={`cursor-pointer block ${uploading ? 'pointer-events-none' : ''}`}>
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
                <img src={preview} alt="Aperçu de l'image à uploader" className="max-h-24 mx-auto rounded" />
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Icon.Spinner className="w-3 h-3" /> Upload en cours...
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
