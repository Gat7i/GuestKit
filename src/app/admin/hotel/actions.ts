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
  legal_name?: string; legal_form?: string; country?: string
  registration_number?: string; legal_representative?: string
  data_protection_officer?: string; data_protection_email?: string
  legal_jurisdiction?: string
}) {
  await requireHotelAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('hotels').update(data).eq('id', hotelId)
  if (error) throw new Error(error.message)
}

export async function addCarouselImage(hotelId: number, cloudinaryUrl: string, title: string, sortOrder: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { data: img, error: imgErr } = await supabase
    .from('images')
    .insert({ url: cloudinaryUrl, alt_text: title })
    .select()
    .single()
  if (imgErr) throw new Error(imgErr.message)
  const { error } = await supabase
    .from('hotel_images')
    .insert({ hotel_id: hotelId, image_id: img.id, title, sort_order: sortOrder, is_active: true })
  if (error) throw new Error(error.message)
}

export async function deleteCarouselImage(hotelId: number, imageId: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('hotel_images')
    .delete()
    .eq('hotel_id', hotelId)
    .eq('image_id', imageId)
  if (error) throw new Error(error.message)
}

export async function reorderCarouselImage(hotelId: number, imageId: number, sortOrder: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('hotel_images')
    .update({ sort_order: sortOrder })
    .eq('hotel_id', hotelId)
    .eq('image_id', imageId)
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
