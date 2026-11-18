'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'

// ---- Activités & Spectacles (entertainments) ----

export async function createEntertainment(data: {
  hotel_id: number
  title: string
  description?: string
  category_id?: number | null
  location_id?: number | null
  is_daily_activity: boolean
  is_night_show: boolean
}) {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('entertainments')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateEntertainment(id: number, hotelId: number, data: {
  title?: string
  description?: string
  category_id?: number | null
  location_id?: number | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('entertainments')
    .update(data)
    .eq('id', id)
    .eq('hotel_id', hotelId)
  if (error) throw new Error(error.message)
}

export async function deleteEntertainment(id: number, hotelId: number) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('entertainments')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId)
  if (error) throw new Error(error.message)
}

// ---- Horaires activités (daily_schedules) ----

export async function createDailySchedule(data: {
  entertainment_id: number
  day_of_week: number
  start_time: string
  duration_minutes?: number
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('daily_schedules').insert(data)
  if (error) throw new Error(error.message)
}

export async function deleteDailySchedule(id: number) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('daily_schedules').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---- Calendrier spectacles (night_schedules) ----

export async function createNightSchedule(data: {
  entertainment_id: number
  show_date: string
  start_time: string
  duration_minutes?: number
  target_audience?: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('night_schedules').insert(data)
  if (error) throw new Error(error.message)
}

export async function deleteNightSchedule(id: number) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('night_schedules').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---- Food spots (restaurants / bars) ----

export async function createFoodSpot(data: {
  hotel_id: number
  spot_type: string
  name: string
  description?: string
  opening_hours?: string
  location?: string
  menu_pdf_url?: string
}) {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase.from('food_spots').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateFoodSpot(id: number, hotelId: number, data: {
  name?: string
  description?: string
  opening_hours?: string
  location?: string
  menu_pdf_url?: string
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('food_spots')
    .update(data)
    .eq('id', id)
    .eq('hotel_id', hotelId)
  if (error) throw new Error(error.message)
}

export async function deleteFoodSpot(id: number, hotelId: number) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('food_spots')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId)
  if (error) throw new Error(error.message)
}
