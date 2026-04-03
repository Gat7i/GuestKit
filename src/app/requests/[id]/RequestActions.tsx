'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RequestActionsProps = {
  requestId: number
  status: string
}

export default function RequestActions({ requestId, status }: RequestActionsProps) {
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return
    
    setCancelling(true)
    try {
      const { error } = await supabase
        .from('customer_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

      if (error) throw error
      
      router.refresh()
    } catch (error) {
      console.error('Erreur annulation:', error)
      alert('❌ Erreur lors de l\'annulation')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="flex gap-3">
      {status === 'pending' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
        >
          {cancelling ? 'Annulation...' : 'Annuler la demande'}
        </button>
      )}
      <Link
        href="/requests"
        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition"
      >
        Retour aux demandes
      </Link>
    </div>
  )
}