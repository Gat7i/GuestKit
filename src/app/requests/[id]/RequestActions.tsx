'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RequestActionsProps = {
  requestId: number
  status: string
  existingRating?: number | null
  existingFeedback?: string | null
}

export default function RequestActions({ requestId, status, existingRating, existingFeedback }: RequestActionsProps) {
  const [cancelling, setCancelling] = useState(false)
  const [rating, setRating] = useState<number>(existingRating || 0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [feedback, setFeedback] = useState(existingFeedback || '')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingSubmitted, setRatingSubmitted] = useState(!!existingRating)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

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
      showToast('error', 'Erreur lors de l\'annulation')
    } finally {
      setCancelling(false)
    }
  }

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return

    setSubmittingRating(true)
    try {
      const { error } = await supabase
        .from('customer_requests')
        .update({ rating, feedback: feedback.trim() || null })
        .eq('id', requestId)

      if (error) throw error

      setRatingSubmitted(true)
      showToast('success', 'Merci pour votre avis !')
      router.refresh()
    } catch (error) {
      console.error('Erreur envoi avis:', error)
      showToast('error', 'Erreur lors de l\'envoi de l\'avis')
    } finally {
      setSubmittingRating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Rating section for completed requests */}
      {status === 'completed' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            {ratingSubmitted ? 'Votre avis' : 'Évaluez ce service'}
          </h2>

          {ratingSubmitted ? (
            <div className="text-center py-2">
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-3xl ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              {feedback && (
                <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 mt-3 text-left">{feedback}</p>
              )}
              <button
                onClick={() => setRatingSubmitted(false)}
                className="mt-3 text-xs text-blue-600 hover:underline"
              >
                Modifier mon avis
              </button>
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <span className={s <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-500">
                  {['', 'Très insatisfait', 'Insatisfait', 'Correct', 'Satisfait', 'Très satisfait'][rating]}
                </p>
              )}
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                placeholder="Commentaire optionnel..."
                className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!rating || submittingRating}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-40"
              >
                {submittingRating ? 'Envoi...' : 'Envoyer mon avis'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Action buttons */}
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
    </div>
  )
}
