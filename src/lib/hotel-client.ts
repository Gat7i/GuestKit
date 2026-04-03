import { createClient } from '@/lib/supabase/client-browser'

export type Hotel = {
  id: number
  name: string
  slug: string
  primary_color: string
  secondary_color: string
  logo_url: string | null
  check_in_time: string
  check_out_time: string
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export async function getCurrentHotelClient(): Promise<Hotel | null> {
  const supabase = createClient()
  const hotelId = parseInt(process.env.NEXT_PUBLIC_HOTEL_ID || '0')

  if (!hotelId) {
    console.error('❌ NEXT_PUBLIC_HOTEL_ID non défini')
    return null
  }

  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotelId)
    .single()

  if (error) {
    console.error('Erreur chargement hôtel:', error)
    return null
  }

  return data
}