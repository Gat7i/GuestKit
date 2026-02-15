'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'

interface ActivityImagesProps {
  activityId: number
  editable?: boolean
  onImageUpdate?: () => void
}

export default function ActivityImages({ 
  activityId, 
  editable = false,
  onImageUpdate 
}: ActivityImagesProps) {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadImages()
  }, [activityId])

  async function loadImages() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('entertainment_images')
        .select(`
          is_principal,
          image:image_id(
            id,
            url,
            alt_text
          )
        `)
        .eq('entertainment_id', activityId)
        .order('is_principal', { ascending: false })

      setImages(data || [])
    } catch (error) {
      console.error('Erreur chargement images:', error)
    } finally {
      setLoading(false)
    }
  }

  async function setAsPrincipal(imageId: number) {
    try {
      await supabase
        .from('entertainment_images')
        .update({ is_principal: false })
        .eq('entertainment_id', activityId)

      await supabase
        .from('entertainment_images')
        .update({ is_principal: true })
        .eq('entertainment_id', activityId)
        .eq('image_id', imageId)

      await loadImages()
      if (onImageUpdate) onImageUpdate()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  async function deleteImage(imageId: number) {
    if (!confirm('Supprimer cette image ?')) return

    try {
      await supabase
        .from('entertainment_images')
        .delete()
        .eq('entertainment_id', activityId)
        .eq('image_id', imageId)

      await loadImages()
      if (onImageUpdate) onImageUpdate()
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-pulse flex gap-2">
          <div className="w-16 h-16 bg-gray-200 rounded"></div>
          <div className="w-16 h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const principalImage = images.find(img => img.is_principal)
  const otherImages = images.filter(img => !img.is_principal)

  return (
    <div className="space-y-4">
      {/* Image principale */}
      {principalImage && (
        <div className="relative group">
          <img
            src={principalImage.image.url}
            alt={principalImage.image.alt_text || 'Image principale'}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
            ⭐ Principale
          </div>
          
          {editable && (
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => deleteImage(principalImage.image.id)}
                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}

      {/* Galerie d'images */}
      {otherImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {otherImages.map((img) => (
            <div key={img.image.id} className="relative group">
              <img
                src={img.image.url}
                alt={img.image.alt_text || 'Photo'}
                className="w-full h-20 object-cover rounded-lg"
              />
              
              {editable && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-1">
                  <button
                    onClick={() => setAsPrincipal(img.image.id)}
                    className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 text-xs"
                    title="Définir comme principale"
                  >
                    ⭐
                  </button>
                  <button
                    onClick={() => deleteImage(img.image.id)}
                    className="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 text-xs"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm">Aucune image pour cette activité</p>
        </div>
      )}
    </div>
  )
}