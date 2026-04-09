'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Chargement...</p></div>}>
      <NewRequestForm />
    </Suspense>
  )
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
        if (!typeId) {
          router.push('/requests')
          return
        }

        // 1. Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 2. Récupérer le client
        const { data: customerData } = await supabase
          .from('customers')
          .select('customer_uuid, full_name')
          .eq('user_id', user.id)
          .single()

        if (!customerData) {
          alert('Client non trouvé')
          router.push('/')
          return
        }
        setCustomer(customerData)

        // 3. Récupérer le séjour actif
        const { data: stayData } = await supabase
          .from('stays')
          .select('id')
          .eq('primary_customer_id', customerData.customer_uuid)
          .eq('status', 'active')
          .single()

        if (!stayData) {
          alert('Aucun séjour actif')
          router.push('/')
          return
        }
        setActiveStay(stayData)

        // 4. Récupérer le type de demande
        const { data: typeData } = await supabase
          .from('request_types')
          .select('*')
          .eq('id', typeId)
          .single()

        if (!typeData) {
          alert('Type de demande invalide')
          router.push('/requests')
          return
        }
        setRequestType(typeData)
        setFormData(prev => ({
          ...prev,
          title: typeData.name
        }))

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
      const { data, error } = await supabase
        .from('customer_requests')
        .insert({
          hotel_id: requestType.hotel_id,
          stay_id: activeStay.id,
          customer_id: customer.customer_uuid,
          request_type_id: requestType.id,
          title: formData.title,
          description: formData.description,
          priority: 'normal',
          status: 'pending',
          requested_time: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      showToast('success', 'Demande envoyée avec succès !')
      setTimeout(() => {
        router.push(`/requests/${data.id}`)
        router.refresh()
      }, 1200)
    } catch (error) {
      console.error('Erreur création demande:', error)
      showToast('error', 'Erreur lors de l\'envoi de la demande')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-red-600">Type de demande invalide</p>
          <Link href="/requests" className="text-blue-600 mt-4 inline-block">
            Retour aux demandes
          </Link>
        </div>
      </div>
    )
  }

  const categoryColors = {
    maintenance: 'from-orange-500 to-red-600',
    room_service: 'from-green-500 to-emerald-600',
    housekeeping: 'from-blue-500 to-cyan-600',
    concierge: 'from-purple-500 to-pink-600'
  }

  const categoryIcons = {
    maintenance: '🔧',
    room_service: '🍽️',
    housekeeping: '🧹',
    concierge: '💎'
  }

  const color = categoryColors[requestType.category as keyof typeof categoryColors] || 'from-gray-500 to-gray-600'
  const icon = requestType.icon || categoryIcons[requestType.category as keyof typeof categoryIcons] || '📋'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/requests"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
          >
            ← Retour aux demandes
          </Link>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-3xl shadow-lg`}>
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {requestType.name}
              </h1>
              <p className="text-gray-600">
                {requestType.description || 'Décrivez votre demande'}
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la demande
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez votre demande en détail..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {saving ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
            <Link
              href="/requests"
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition text-center"
            >
              Annuler
            </Link>
          </div>
        </form>

        {/* Note d'information */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-medium mb-1">Temps d'attente estimé</p>
              <p>
                {requestType.estimated_time 
                  ? `Ce service est généralement traité en ${requestType.estimated_time} minutes environ.`
                  : 'Notre équipe traitera votre demande dans les plus brefs délais.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}