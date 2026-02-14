import { createClient } from '@/lib/supabase/client-browser'

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

// Version CLIENT uniquement (pas de next/headers)
export async function getCurrentHotelClient(): Promise<Hotel | null> {
  const supabase = createClient()
  
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
      // Vérifier le rôle - GESTION DES DEUX CAS
      const roleName = Array.isArray(profile.roles) 
        ? profile.roles[0]?.name 
        : (profile.roles as any)?.name
      
      // Pour les super_admin, on retourne null
      if (roleName === 'super_admin') {
        return null
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
  
  return null
}

// Fonction pour récupérer un hôtel par son ID (côté client)
export async function getHotelByIdClient(id: number): Promise<Hotel | null> {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()
  
  return data
}

// Fonction pour récupérer un hôtel par son slug (côté client)
export async function getHotelBySlugClient(slug: string): Promise<Hotel | null> {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('slug', slug)
    .single()
  
  return data
}