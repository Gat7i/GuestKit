'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireStaff, requireHotelAdmin } from '@/lib/auth/require-staff'

export async function createHotel(data: {
  name: string; slug: string; description?: string; address?: string
  phone?: string; email?: string; website?: string
  check_in_time?: string; check_out_time?: string
  primary_color?: string; secondary_color?: string; logo_url?: string
}) {
  await requireHotelAdmin()
  const supabase = createAdminClient()
  const { data: row, error } = await supabase.from('hotels').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateHotel(hotelId: number, data: {
  name?: string; slug?: string; description?: string; address?: string
  phone?: string; email?: string; website?: string
  check_in_time?: string; check_out_time?: string
  primary_color?: string; secondary_color?: string; logo_url?: string
}) {
  await requireHotelAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('hotels').update(data).eq('id', hotelId)
  if (error) throw new Error(error.message)
}

export async function updateHotelLogo(hotelId: number, logoUrl: string | null) {
  await requireHotelAdmin()
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
