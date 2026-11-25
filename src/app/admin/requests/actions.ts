'use server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function updateRequestStatus(requestId: number, status: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('customer_requests')
    .update({ status, ...(status === 'completed' ? { completed_time: new Date().toISOString() } : {}) })
    .eq('id', requestId)
  if (error) throw new Error(error.message)
}

export async function updateRequestPriority(requestId: number, priority: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('customer_requests')
    .update({ priority }).eq('id', requestId)
  if (error) throw new Error(error.message)
}

export async function sendRequestMessage(data: {
  request_id: number; sender_name: string; message: string; is_internal?: boolean
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('request_messages').insert({
    ...data, sender_type: 'staff', is_internal: data.is_internal ?? false,
  })
  if (error) throw new Error(error.message)
}
