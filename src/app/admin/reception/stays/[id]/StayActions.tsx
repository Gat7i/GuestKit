'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast, ToastContainer } from '@/components/admin/Toast'
import { checkInStay, checkOutStay } from '@/app/admin/reception/actions'
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
  const { toast, toasts } = useToast()
  const router = useRouter()

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    try {
      await checkInStay(stay.id)
      toast('Arrivée enregistrée')
      router.refresh()
    } catch (error) {
      toast('Erreur lors de l\'enregistrement', 'error')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    try {
      await checkOutStay(stay.id)
      toast('Départ enregistré')
      router.refresh()
    } catch (error) {
      toast('Erreur lors de l\'enregistrement', 'error')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
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
    </>
  )
}