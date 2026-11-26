'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { Icon } from '@/components/ui/Icons'

export default function NewRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFAF8' }}>
        <p className="text-sm" style={{ color: '#746865' }}>Chargement...</p>
      </div>
    }>
      <NewRequestForm />
    </Suspense>
  )
}

type CategoryComp = (props: { className?: string }) => React.ReactNode

const categoryConfig: Record<string, { title: string; Comp: CategoryComp; colorClass: string }> = {
  maintenance:  { title: 'Maintenance',  Comp: Icon.Wrench,           colorClass: 'text-[#E05947]' },
  room_service: { title: 'Room Service', Comp: Icon.Utensils,         colorClass: 'text-[#C49A5A]' },
  housekeeping: { title: 'Housekeeping', Comp: Icon.SparklesCleaning, colorClass: 'text-[#746865]' },
  concierge:    { title: 'Conciergerie', Comp: Icon.Concierge,        colorClass: 'text-[#E05947]' },
}

function NewRequestForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requestType, setRequestType] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [activeStay, setActiveStay] = useState<any>(null)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const router = useRouter()
  const searchParams = useSearchParams()
  const typeId = searchParams.get('type')
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        if (!typeId) { router.push('/requests'); return }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: customerData } = await supabase
          .from('customers')
          .select('customer_uuid, full_name')
          .eq('user_id', user.id)
          .single()
        if (!customerData) { router.push('/'); return }
        setCustomer(customerData)

        const { data: stayData } = await supabase
          .from('stays')
          .select('id')
          .eq('primary_customer_id', customerData.customer_uuid)
          .eq('status', 'active')
          .maybeSingle()
        if (!stayData) { router.push('/requests'); return }
        setActiveStay(stayData)

        const { data: typeData } = await supabase
          .from('request_types')
          .select('*')
          .eq('id', typeId)
          .maybeSingle()
        if (!typeData) { router.push('/requests'); return }
        setRequestType(typeData)
        setFormData(prev => ({ ...prev, title: typeData.name }))
      } catch (error) {
        console.error('Erreur initialisation:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [typeId, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !activeStay || !requestType) return
    setSaving(true)
    try {
      const { data: stayCheck } = await supabase
        .from('stays')
        .select('id')
        .eq('id', activeStay.id)
        .eq('primary_customer_id', customer.customer_uuid)
        .eq('status', 'active')
        .maybeSingle()
      if (!stayCheck) { showToast('error', 'Votre séjour n\'est pas ou plus confirmé par la réception'); return }

      const { data, error } = await supabase
        .from('customer_requests')
        .insert({
          hotel_id: requestType.hotel_id,
          stay_id: activeStay.id,
          customer_id: customer.customer_uuid,
          request_type_id: requestType.id,
          title: formData.title.trim().slice(0, 200),
          description: formData.description.trim().slice(0, 2000) || null,
          priority: 'normal',
          status: 'pending',
          requested_time: new Date().toISOString()
        })
        .select()
        .single()
      if (error) throw error

      showToast('success', 'Demande envoyée')
      setTimeout(() => { router.push(`/requests/${data.id}`); router.refresh() }, 1200)
    } catch (error) {
      console.error('Erreur création demande:', error)
      showToast('error', 'Erreur lors de l\'envoi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#FFFAF8' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: '1px solid #E8DEDA' }}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!requestType) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#FFFAF8' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p style={{ color: '#1C1211' }}>Type de demande invalide</p>
          <Link href="/requests" className="mt-4 inline-block text-sm" style={{ color: '#746865' }}>
            ← Retour aux demandes
          </Link>
        </div>
      </div>
    )
  }

  const cfg = categoryConfig[requestType.category]
  const CategoryIcon = cfg?.Comp || Icon.ClipboardList
  const categoryColorClass = cfg?.colorClass || 'text-[#746865]'

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#FFFAF8' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Fil d'Ariane */}
        <Link
          href="/requests"
          className="inline-flex items-center gap-1 text-sm mb-6 transition hover:opacity-70"
          style={{ color: '#746865' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux demandes
        </Link>

        {/* En-tête service */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F5EFED' }}
          >
            <CategoryIcon className={`w-6 h-6 ${categoryColorClass}`} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#1C1211' }}>
              {requestType.name}
            </h1>
            <p className="text-sm" style={{ color: '#746865' }}>
              {requestType.description || 'Décrivez votre demande'}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 space-y-5" style={{ border: '1px solid #E8DEDA' }}>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C1211' }}>
              Titre
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border-gray-200 shadow-sm text-sm focus:ring-2 focus:ring-[#E05947] focus:border-[#E05947]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C1211' }}>
              Précisions <span className="font-normal" style={{ color: '#746865' }}>(optionnel)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border-gray-200 shadow-sm text-sm focus:ring-2 focus:ring-[#E05947] focus:border-[#E05947]"
              placeholder="Décrivez votre demande en détail..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 justify-center"
            >
              {saving ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
            <Link
              href="/requests"
              className="btn-ghost flex-1 justify-center"
            >
              Annuler
            </Link>
          </div>
        </form>

        {/* Délai estimé */}
        {requestType.estimated_time && (
          <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#F5EFED' }}>
            <Icon.Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#746865]" />
            <p style={{ color: '#746865' }}>
              Délai de traitement estimé : <strong style={{ color: '#1C1211' }}>{requestType.estimated_time} minutes</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
