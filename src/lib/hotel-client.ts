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
  
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Erreur utilisateur:', userError)
      return null
    }
    
    // Récupérer le profil avec une approche en deux étapes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id, hotel_id')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profileError) {
      console.error('Erreur profil:', profileError)
      return null
    }
    
    if (!profile) {
      console.log('Aucun profil trouvé pour cet utilisateur')
      return null
    }
    
    // Récupérer le nom du rôle séparément
    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .single()
    
    const roleName = roleData?.name
    
    // Pour les super_admin, on retourne null (ils gèrent tous les hôtels)
    if (roleName === 'super_admin') {
      return null
    }
    
    // Pour les admins d'hôtel, on utilise leur hotel_id
    if (profile.hotel_id) {
      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', profile.hotel_id)
        .single()
      
      if (hotelError) {
        console.error('Erreur chargement hôtel:', hotelError)
        return null
      }
      
      return hotel
    }
    
    return null
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return null
  }
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