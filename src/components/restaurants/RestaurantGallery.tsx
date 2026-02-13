'use client'

import { useState } from 'react'
import Image from 'next/image'

interface RestaurantGalleryProps {
  images: any[]
}

export default function RestaurantGallery({ images }: RestaurantGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  // Trier les images : principale d'abord, puis les autres
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_principal && !b.is_principal) return -1
    if (!a.is_principal && b.is_principal) return 1
    return 0
  })

  const currentImage = sortedImages[selectedImage]

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-5xl mb-3">🖼️</div>
        <p>Aucune photo disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Image principale */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={currentImage.image.url}
          alt={currentImage.image.alt_text || 'Photo du restaurant'}
          className="w-full h-full object-cover"
        />
        
        {/* Badge "Principale" */}
        {currentImage.is_principal && (
          <div className="absolute top-4 left-4">
            <span className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
              <span>⭐</span> Photo principale
            </span>
          </div>
        )}

        {/* Compteur */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs">
          {selectedImage + 1} / {sortedImages.length}
        </div>
      </div>

      {/* Miniatures */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {sortedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 transition
                ${selectedImage === idx 
                  ? 'border-amber-500 ring-2 ring-amber-200' 
                  : 'border-transparent hover:border-gray-300'
                }
              `}
            >
              <img
                src={img.image.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.is_principal && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px]">
                  ⭐
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}