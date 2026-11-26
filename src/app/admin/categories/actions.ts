'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireStaff } from '@/lib/auth/require-staff'

export async function createCategory(data: {
  hotel_id: number
  category_type: string
  name: string
  icon?: string | null
  color?: string | null
  bg_color?: string | null
  text_color?: string | null
  sort_order?: number
  is_active?: boolean
}) {
  await requireStaff()
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateCategory(id: number, data: {
  category_type: string
  name: string
  icon?: string | null
  color?: string | null
  bg_color?: string | null
  text_color?: string | null
  sort_order?: number
  is_active?: boolean
}) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCategory(id: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleCategoryActive(id: number, is_active: boolean) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .update({ is_active })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
