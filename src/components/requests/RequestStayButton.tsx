'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { useRouter } from 'next/navigation'

interface RequestStayButtonProps {
  hotelId: number
  userId: string
  customerExists: boolean
  customerUuid?: string
  hasPendingStay: boolean
}

export default function RequestStayButton({
  hotelId,
  userId,
  customerExists,
  customerUuid,
  hasPendingStay
}: RequestStayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRequestStay = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      let customerId = customerUuid

      if (!customerExists) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            hotel_id: hotelId,
            email: (await supabase.auth.getUser()).data.user?.email,
            is_primary: true
          })
          .select('customer_uuid')
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.customer_uuid
      }

      const { error: stayError } = await supabase
        .from('stays')
        .insert({
          hotel_id: hotelId,
          primary_customer_id: customerId,
          room_id: 1,
          booking_reference: `DEM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase(),
          check_in_date: new Date().toISOString().split('T')[0],
          check_out_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          adults_count: 1,
          children_count: 0,
          status: 'upcoming',
          special_requests: "En attente d'assignation par la réception"
        })

      if (stayError) throw stayError

      setFeedback({ type: 'success', text: 'Demande envoyée ! La réception va vous assigner une chambre.' })
      router.refresh()

    } catch (error) {
      console.error('Erreur demande séjour:', error)
      setFeedback({ type: 'error', text: 'Erreur lors de la demande. Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  if (hasPendingStay) {
    return (
      <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full text-sm text-blue-700">
        <span>⏳ Demande déjà en cours</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {feedback && (
        <div className={`px-5 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {feedback.text}
        </div>
      )}
      <button
        onClick={handleRequestStay}
        disabled={loading || feedback?.type === 'success'}
        className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg font-medium transition shadow-lg hover:shadow-xl disabled:opacity-50 inline-flex items-center gap-3"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <span>🏨</span>
            Demander un séjour
          </>
        )}
      </button>
    </div>
  )
}
