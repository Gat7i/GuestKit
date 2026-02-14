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
  const hotelId = headersList.get('x-hotel-id')
  const hotelSlug = headersList.get('x-hotel-slug')
  
  const supabase = await createClient()
  
  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Récupérer le profil avec le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        role_id,
        hotel_id,
        roles (
          name
        )
      `)
      .eq('id', user.id)
      .single()
    
    if (profile) {
      // Récupérer le nom du rôle - peu importe si c'est un tableau ou un objet
      const roleName = (profile.roles as any)?.name
      
      // Si c'est un super_admin (hotel_id = NULL), on utilise le sous-domaine
      if (roleName === 'super_admin') {
        if (hotelSlug) {
          const { data } = await supabase
            .from('hotels')
            .select('*')
            .eq('slug', hotelSlug)
            .single()
          return data
        }
        // Fallback : hôtel par défaut
        const { data } = await supabase
          .from('hotels')
          .select('*')
          .eq('id', 1)
          .single()
        return data
      }
      
      // Pour les admins d'hôtel, on utilise leur hotel_id
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
  
  // Cas par défaut (développement) - utiliser l'hôtel du sous-domaine ou le 1
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