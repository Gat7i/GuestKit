'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'

interface HotelSelectorProps {
  onSelect: (hotelId: number | null) => void
  selectedId?: number | null
  className?: string
}

export default function HotelSelector({ onSelect, selectedId, className = '' }: HotelSelectorProps) {
  const [hotels, setHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadHotels()
  }, [])

  async function loadHotels() {
    const { data } = await supabase
      .from('hotels')
      .select('id, name, slug, primary_color')
      .order('name')
    
    setHotels(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <p className="text-sm text-gray-500">Chargement des hôtels...</p>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-amber-50 rounded-lg border border-amber-200 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏨</span>
        <label className="block text-sm font-medium text-amber-800">
          Mode Super Admin : sélectionnez un hôtel
        </label>
      </div>
      
      <select
        onChange={(e) => onSelect(e.target.value ? parseInt(e.target.value) : null)}
        value={selectedId || ''}
        className="w-full rounded-lg border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white"
      >
        <option value="">-- Choisir un hôtel --</option>
        {hotels.map((hotel) => (
          <option key={hotel.id} value={hotel.id}>
            {hotel.name} ({hotel.slug})
          </option>
        ))}
      </select>
      
      <p className="text-xs text-amber-600 mt-2">
        💡 Vous gérez les données pour l'hôtel sélectionné
      </p>
    </div>
  )
}