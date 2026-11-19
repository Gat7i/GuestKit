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

  // Supprimer les dépendances en cascade
  await supabase.from('daily_schedules').delete().eq('entertainment_id', id)
  await supabase.from('night_schedules').delete().eq('entertainment_id', id)
  await supabase.from('entertainment_images').delete().eq('entertainment_id', id)

  const { error } = await supabase
    .from('entertainments')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId)

  if (error) {
    if (error.message.includes('foreign key') || error.code === '23503') {
      throw new Error('Impossible de supprimer : des données liées existent encore. Supprimez d\'abord les images et les horaires associés.')
    }
    throw new Error(error.message)
  }
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

  // Supprimer les images liées en cascade
  await supabase.from('food_spot_images').delete().eq('food_spot_id', id)

  const { error } = await supabase
    .from('food_spots')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId)

  if (error) {
    if (error.message.includes('foreign key') || error.code === '23503') {
      throw new Error('Impossible de supprimer : des données liées existent encore. Supprimez d\'abord les images associées.')
    }
    throw new Error(error.message)
  }
}

// ---- Suggestions / Découvertes ----

export async function createSuggestion(data: {
  hotel_id: number
  title: string
  description?: string
  category_id?: number | null
  location_type?: string
  is_hotel_internal?: boolean
  address?: string | null
  phone?: string | null
}) {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase.from('suggestions').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateSuggestion(id: number, hotelId: number, data: {
  title?: string
  description?: string
  category_id?: number | null
  location_type?: string
  is_hotel_internal?: boolean
  address?: string | null
  phone?: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('suggestions')
    .update(data)
    .eq('id', id)
    .eq('hotel_id', hotelId)
  if (error) throw new Error(error.message)
}

export async function deleteSuggestion(id: number, hotelId: number) {
  const supabase = createAdminClient()

  // Supprimer les images liées en cascade
  await supabase.from('suggestion_images').delete().eq('suggestion_id', id)

  const { error } = await supabase
    .from('suggestions')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId)

  if (error) {
    if (error.message.includes('foreign key') || error.code === '23503') {
      throw new Error('Impossible de supprimer : des données liées existent encore.')
    }
    throw new Error(error.message)
  }
}
