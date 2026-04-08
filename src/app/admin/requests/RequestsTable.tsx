'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client-browser'

type Request = {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  customer: {
    full_name: string | null
    stays?: Array<{ room?: { room_number: string } }>
  } | null
  request_type: { name: string }
}

interface RequestsTableProps {
  requests: Request[]
  category: string
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return 'À l\'instant'
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Il y a ${diffInHours}h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Il y a ${diffInDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const statusColors = {
  pending:     'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-gray-100 text-gray-800',
}
const statusLabels = {
  pending:     'En attente',
  in_progress: 'En cours',
  completed:   'Terminée',
  cancelled:   'Annulée',
}
const priorityColors = {
  low:    'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high:   'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}
const priorityLabels = {
  low:    'Basse',
  normal: 'Normale',
  high:   'Haute',
  urgent: 'Urgente',
}

export default function RequestsTable({ requests, category }: RequestsTableProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [localRequests, setLocalRequests] = useState<Request[]>(requests)
  const router = useRouter()
  const supabase = createClient()

  const getRoomNumber = (req: Request) => req.customer?.stays?.[0]?.room?.room_number || '?'
  const getCustomerName = (req: Request) => req.customer?.full_name || 'Client inconnu'

  const handleStatusChange = async (id: number, newStatus: string) => {
    setLoadingId(id)
    const { error } = await supabase
      .from('customer_requests')
      .update({ status: newStatus, ...(newStatus === 'completed' ? { completed_time: new Date().toISOString() } : {}) })
      .eq('id', id)

    if (!error) {
      setLocalRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus as Request['status'] } : r)
      )
      router.refresh()
    }
    setLoadingId(null)
  }

  const filtered = localRequests
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoomNumber(r).toLowerCase().includes(searchTerm.toLowerCase())
    )

  const counts = {
    pending:     localRequests.filter(r => r.status === 'pending').length,
    in_progress: localRequests.filter(r => r.status === 'in_progress').length,
    completed:   localRequests.filter(r => r.status === 'completed').length,
  }

  return (
    <div className="space-y-4">
      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{counts.pending}</p>
          <p className="text-sm text-yellow-600">En attente</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.in_progress}</p>
          <p className="text-sm text-blue-600">En cours</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{counts.completed}</p>
          <p className="text-sm text-green-600">Terminées</p>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher par titre, client ou chambre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border-gray-300 shadow-sm text-sm"
        />
        <div className="flex gap-2">
          {(['pending', 'in_progress', 'completed', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? f === 'all' ? 'bg-gray-800 text-white' : statusColors[f as keyof typeof statusColors]
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Toutes' : statusLabels[f]}
              {f !== 'all' && counts[f] > 0 && (
                <span className="ml-1.5 bg-white/60 rounded-full px-1.5">{counts[f]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Demande', 'Client / Chambre', 'Statut', 'Priorité', 'Reçue', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Aucune demande trouvée
                  </td>
                </tr>
              ) : filtered.map(request => (
                <tr key={request.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{request.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{request.description || '—'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{getCustomerName(request)}</p>
                    <p className="text-xs text-gray-500">Chambre {getRoomNumber(request)}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[request.priority]}`}>
                      {priorityLabels[request.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {formatRelativeTime(request.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/requests/${category}/${request.id}`}
                        className="text-xs text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Voir →
                      </Link>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'in_progress')}
                          disabled={loadingId === request.id}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {loadingId === request.id ? '...' : 'Prendre'}
                        </button>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'completed')}
                          disabled={loadingId === request.id}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {loadingId === request.id ? '...' : 'Terminer'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
