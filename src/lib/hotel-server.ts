import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server-client'

export type Hotel = {
  id: number
  name: string
  slug: string
  primary_color: string
  logo_url: string | null
  check_in_time: string
  check_out_time: string
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
}

// Version SERVEUR uniquement (utilise next/headers)
export async function getCurrentHotelServer(): Promise<Hotel | null> {
  const headersList = await headers()
  const hotelSlug = headersList.get('x-hotel-slug')
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, hotel_id')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      // super_admin (role_id = 1) utilise le sous-domaine
      if (profile.role_id === 1) {
        if (hotelSlug) {
          const { data } = await supabase
            .from('hotels')
            .select('*')
            .eq('slug', hotelSlug)
            .single()
          return data
        }
        // Fallback
        const { data } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', 1)
          .single()
        return data
      }
      
      // Admin d'hôtel
      if (profile.hotel_id) {
        const { data } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', profile.hotel_id)
          .single()
        return data
      }
    }
  }
  
  // Fallback pour le développement
  if (hotelSlug) {
    const { data } = await supabase
      .from('hotels')
      .select('*')
      .eq('slug', hotelSlug)
      .single()
    if (data) return data
  }
  
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', 1)
    .single()
  
  return data
}