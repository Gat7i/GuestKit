import { createClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import RequestsTable from '../RequestsTable'

export default async function HousekeepingRequestsPage() {
  const supabase = await createClient()
  const hotelId = parseInt(process.env.NEXT_PUBLIC_HOTEL_ID || '0')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/admin/login')

  const { data: requests } = await supabase
    .from('customer_requests')
    .select(`
      *,
      customer:customers(
        full_name,
        stays!inner(
          room:rooms(room_number)
        )
      ),
      request_type:request_types(name)
    `)
    .eq('hotel_id', hotelId)
    .eq('request_types.category', 'housekeeping')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🧹 Housekeeping</h1>
        <p className="text-gray-600">Gérez les demandes de ménage et de linge</p>
      </div>

      <RequestsTable
        requests={requests || []}
        category="housekeeping"
      />
    </div>
  )
}