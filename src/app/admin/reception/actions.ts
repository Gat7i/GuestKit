'use server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireStaff } from '@/lib/auth/require-staff'

export async function activateStay(stayId: number, roomId: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase.from('stays')
    .update({ room_id: roomId, status: 'active', actual_check_in: new Date().toISOString() })
    .eq('id', stayId)
  if (error) throw new Error(error.message)
}

export async function checkInStay(stayId: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase.from('stays')
    .update({ status: 'active', actual_check_in: new Date().toISOString() })
    .eq('id', stayId)
  if (error) throw new Error(error.message)
}

export async function checkOutStay(stayId: number) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase.from('stays')
    .update({ status: 'checked_out', actual_check_out: new Date().toISOString() })
    .eq('id', stayId)
  if (error) throw new Error(error.message)
}

export async function createStay(data: {
  hotel_id: number; primary_customer_id: string; room_id: number
  booking_reference: string; check_in_date: string; check_out_date: string
  adults_count: number; children_count: number; special_requests?: string
  total_amount?: number | null; status: string; created_by?: string
}) {
  await requireStaff()
  const supabase = createAdminClient()
  const { data: row, error } = await supabase.from('stays').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function setCustomerActive(customerUuid: string) {
  await requireStaff()
  const supabase = createAdminClient()
  const { error } = await supabase.from('customers')
    .update({ is_active: true }).eq('customer_uuid', customerUuid)
  if (error) throw new Error(error.message)
}
