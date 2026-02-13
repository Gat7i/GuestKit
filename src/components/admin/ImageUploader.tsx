'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'

interface ImageUploaderProps {
  hotelId: number
  foodSpotId?: number
  suggestionId?: number
  onImageUploaded?: () => void
}

export default function ImageUploader({ 
  hotelId, 
  foodSpotId, 
  suggestionId,
  onImageUploaded 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      // 1. Upload vers Cloudinary
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
      
      // 2. Sauvegarder l'image dans la table images
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          url: data.secure_url,
          alt_text: file.name.split('.')[0]
        })
        .select()
        .single()

      if (imageError) throw imageError

      // 3. Lier l'image au restaurant OU à la suggestion
      if (foodSpotId) {
        const { error: linkError } = await supabase
          .from('food_spot_images')
          .insert({
            food_spot_id: foodSpotId,
            image_id: imageData.id,
            is_principal: false
          })
        if (linkError) throw linkError
      }
      
      if (suggestionId) {
        const { error: linkError } = await supabase
          .from('suggestion_images')
          .insert({
            suggestion_id: suggestionId,
            image_id: imageData.id,
            is_principal: false
          })
        if (linkError) throw linkError
      }

      alert('✅ Image ajoutée avec succès!')
      if (onImageUploaded) onImageUploaded()
      
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('❌ Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      setPreview(null)
      e.target.value = ''
    }
  }

  return (
    <div className="mt-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition">
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded" />
            <p className="text-sm text-gray-600">Upload en cours...</p>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <div className="space-y-2">
              <div className="text-3xl text-gray-400">📸</div>
              <div className="text-sm font-medium text-purple-600">
                {uploading ? 'Upload...' : 'Cliquez pour ajouter une image'}
              </div>
              <div className="text-xs text-gray-500">
                PNG, JPG, GIF • Max 10MB
              </div>
            </div>
          </label>
        )}
      </div>
    </div>
  )
}