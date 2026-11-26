'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireStaff } from '@/lib/auth/require-staff'

export async function createPoiType(data: {
  hotel_id: number
  type_key: string
  name: string
  icon?: string | null
  color?: string | null
  text_color?: string | null
  bg_color?: string | null
  sort_order?: number
  is_active?: boolean
}) {
  await requireStaff()
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('poi_types')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function updatePoiType(id: number, data: {
  type_key: string
  name: string
  icon?: string | null
  color?: string | null
  text_color?: string | null
  bg_color?: string | null
  sort_order?: number
  is_active?: boolean
}) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('poi_types')
    .update(data)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deletePoiType(id: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('poi_types')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function togglePoiTypeActive(id: number, is_active: boolean) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('poi_types')
    .update({ is_active })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
