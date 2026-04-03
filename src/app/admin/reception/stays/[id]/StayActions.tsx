'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-browser'
import Link from 'next/link'

type StayActionsProps = {
  stay: {
    id: number
    status: string
    primary_customer: {
      customer_uuid: string
    }
  }
}

export default function StayActions({ stay }: StayActionsProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCheckIn = async () => {
    if (!confirm('Confirmer l\'arrivée de ce client ?')) return
    
    setIsCheckingIn(true)
    try {
      const { error } = await supabase
        .from('stays')
        .update({
          status: 'active',
          actual_check_in: new Date().toISOString()
        })
        .eq('id', stay.id)

      if (error) throw error
      
      alert('✅ Arrivée enregistrée')
      router.refresh()
    } catch (error) {
      console.error('Erreur check-in:', error)
      alert('❌ Erreur lors de l\'enregistrement')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    if (!confirm('Confirmer le départ de ce client ?')) return
    
    setIsCheckingOut(true)
    try {
      const { error } = await supabase
        .from('stays')
        .update({
          status: 'checked_out',
          actual_check_out: new Date().toISOString()
        })
        .eq('id', stay.id)

      if (error) throw error
      
      alert('✅ Départ enregistré')
      router.refresh()
    } catch (error) {
      console.error('Erreur check-out:', error)
      alert('❌ Erreur lors de l\'enregistrement')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {stay.status === 'upcoming' && (
        <button
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
        >
          {isCheckingIn ? 'Enregistrement...' : '✅ Enregistrer arrivée'}
        </button>
      )}
      {stay.status === 'active' && (
        <button
          onClick={handleCheckOut}
          disabled={isCheckingOut}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
        >
          {isCheckingOut ? 'Enregistrement...' : '🧾 Enregistrer départ'}
        </button>
      )}
      <Link
        href={`/admin/reception/stays/${stay.id}/edit`}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition text-center"
      >
        ✏️ Modifier
      </Link>
      <Link
        href={`/admin/reception/guests/${stay.primary_customer.customer_uuid}`}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition text-center"
      >
        👤 Fiche client
      </Link>
    </div>
  )
}