'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'

export async function updateHotelLogo(hotelId: number, logoUrl: string | null) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('hotels')
    .update({ logo_url: logoUrl })
    .eq('id', hotelId)
    .select('id, logo_url')
    .single()

  if (error) throw new Error(error.message)
  return data
}
