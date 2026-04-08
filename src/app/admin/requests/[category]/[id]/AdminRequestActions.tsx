'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-browser'

interface Props {
  requestId: number
  status: string
  category: string
}

export default function AdminRequestActions({ requestId, status, category }: Props) {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    const { error } = await supabase
      .from('customer_requests')
      .update({
        status: newStatus,
        ...(newStatus === 'in_progress' ? {} : {}),
        ...(newStatus === 'completed' ? { completed_time: new Date().toISOString() } : {}),
      })
      .eq('id', requestId)

    if (error) {
      showFeedback('error', 'Erreur lors de la mise à jour')
    } else {
      showFeedback('success', 'Statut mis à jour')
      router.refresh()
    }
    setUpdating(false)
  }

  const handlePriorityChange = async (newPriority: string) => {
    setUpdating(true)
    const { error } = await supabase
      .from('customer_requests')
      .update({ priority: newPriority })
      .eq('id', requestId)

    if (error) {
      showFeedback('error', 'Erreur lors de la mise à jour')
    } else {
      showFeedback('success', 'Priorité mise à jour')
      setPriority(newPriority)
      router.refresh()
    }
    setUpdating(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user?.id)
      .single()

    const senderName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Équipe hôtel'
      : 'Équipe hôtel'

    const { error } = await supabase
      .from('request_messages')
      .insert({
        request_id: requestId,
        sender_type: 'staff',
        sender_name: senderName,
        message: message.trim(),
        is_internal: false,
      })

    if (error) {
      showFeedback('error', 'Erreur lors de l\'envoi')
    } else {
      setMessage('')
      showFeedback('success', 'Message envoyé')
      router.refresh()
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      {/* Feedback */}
      {feedback && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Changer le statut */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Changer le statut</p>
        <div className="flex flex-wrap gap-2">
          {status === 'pending' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={updating}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50"
            >
              ▶ Prendre en charge
            </button>
          )}
          {status === 'in_progress' && (
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={updating}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition disabled:opacity-50"
            >
              ✓ Marquer terminée
            </button>
          )}
          {status !== 'cancelled' && status !== 'completed' && (
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={updating}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition disabled:opacity-50"
            >
              ✕ Annuler
            </button>
          )}
        </div>
      </div>

      {/* Changer la priorité */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priorité</p>
        <div className="flex gap-2">
          {(['normal', 'high', 'urgent'] as const).map(p => (
            <button
              key={p}
              onClick={() => handlePriorityChange(p)}
              disabled={updating}
              className={`px-3 py-1.5 text-xs rounded-lg transition disabled:opacity-50 ${
                p === 'normal' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' :
                p === 'high'   ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' :
                                 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            >
              {p === 'normal' ? 'Normale' : p === 'high' ? 'Haute' : 'Urgente'}
            </button>
          ))}
        </div>
      </div>

      {/* Envoyer un message au client */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Répondre au client</p>
        <form onSubmit={handleSendMessage} className="space-y-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Votre message au client..."
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {sending ? 'Envoi...' : 'Envoyer le message'}
          </button>
        </form>
      </div>
    </div>
  )
}
