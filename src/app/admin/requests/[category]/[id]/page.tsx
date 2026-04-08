import { createClient } from '@/lib/supabase/server-client'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import AdminRequestActions from './AdminRequestActions'

const categoryLabels: Record<string, { title: string; icon: string }> = {
  concierge:    { title: 'Conciergerie', icon: '💎' },
  housekeeping: { title: 'Housekeeping', icon: '🧹' },
  maintenance:  { title: 'Maintenance',  icon: '🔧' },
  room_service: { title: 'Room Service', icon: '🍽️' },
}

const statusColors = {
  pending:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed:   'bg-green-100 text-green-800 border-green-200',
  cancelled:   'bg-gray-100 text-gray-800 border-gray-200',
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
  low: 'Basse', normal: 'Normale', high: 'Haute', urgent: 'Urgente',
}

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/admin/login')

  const { data: request, error } = await supabase
    .from('customer_requests')
    .select(`
      *,
      request_type:request_types(id, category, name, icon, estimated_time),
      stay:stays(
        id,
        booking_reference,
        check_in_date,
        check_out_date,
        room:rooms(room_number, room_type, floor)
      ),
      customer:customers(full_name, email, phone),
      messages:request_messages(
        id, sender_type, sender_name, message, is_internal, created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !request) notFound()

  const cat = categoryLabels[category] || { title: category, icon: '📋' }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/requests" className="text-gray-500 hover:text-gray-700">Demandes</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/admin/requests/${category}`} className="text-gray-500 hover:text-gray-700">
            {cat.icon} {cat.title}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">#{request.id}</span>
        </div>

        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl flex-shrink-0">
                {request.request_type?.icon || cat.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {request.request_type?.name} • #{request.id}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[request.status as keyof typeof statusColors]}`}>
                {statusLabels[request.status as keyof typeof statusLabels]}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
                Priorité : {priorityLabels[request.priority as keyof typeof priorityLabels]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Colonne principale */}
          <div className="md:col-span-2 space-y-6">

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Détail de la demande</h2>
              <p className="text-gray-800 whitespace-pre-wrap">
                {request.description || <span className="text-gray-400 italic">Aucune description fournie</span>}
              </p>
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Reçue le</p>
                  <p className="font-medium">{new Date(request.created_at).toLocaleString('fr-FR')}</p>
                </div>
                {request.scheduled_time && (
                  <div>
                    <p className="text-gray-500">Planifiée</p>
                    <p className="font-medium">{new Date(request.scheduled_time).toLocaleString('fr-FR')}</p>
                  </div>
                )}
                {request.completed_time && (
                  <div>
                    <p className="text-gray-500">Traitée le</p>
                    <p className="font-medium">{new Date(request.completed_time).toLocaleString('fr-FR')}</p>
                  </div>
                )}
                {request.request_type?.estimated_time && (
                  <div>
                    <p className="text-gray-500">Temps estimé</p>
                    <p className="font-medium">{request.request_type.estimated_time} min</p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Messages</h2>
              {request.messages && request.messages.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {request.messages
                    .filter((m: any) => !m.is_internal)
                    .map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl text-sm ${
                          msg.sender_type === 'customer'
                            ? 'bg-blue-50 border border-blue-100 ml-8'
                            : 'bg-gray-50 border border-gray-100 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {msg.sender_type === 'customer' ? '👤 ' : '🏨 '}
                            {msg.sender_name || (msg.sender_type === 'customer' ? 'Client' : 'Équipe hôtel')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-700">{msg.message}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4 mb-4">Aucun message</p>
              )}

              {/* Formulaire de réponse */}
              <AdminRequestActions
                requestId={request.id}
                status={request.status}
                category={category}
              />
            </div>

            {/* Avis du client (si terminée) */}
            {request.status === 'completed' && request.rating && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Avis du client</h2>
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= request.rating ? 'text-yellow-400 text-xl' : 'text-gray-200 text-xl'}>★</span>
                  ))}
                  <span className="text-sm text-gray-600 ml-1">{request.rating}/5</span>
                </div>
                {request.feedback && (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{request.feedback}</p>
                )}
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">

            {/* Client */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Client</h2>
              <p className="font-semibold text-gray-900">{request.customer?.full_name || 'Inconnu'}</p>
              {request.customer?.email && <p className="text-sm text-gray-500 mt-1">{request.customer.email}</p>}
              {request.customer?.phone && <p className="text-sm text-gray-500">{request.customer.phone}</p>}
            </div>

            {/* Séjour / Chambre */}
            {request.stay && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Séjour</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chambre</span>
                    <span className="font-semibold text-gray-900">
                      {request.stay.room?.room_number} — {request.stay.room?.room_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Étage</span>
                    <span className="font-medium">{request.stay.room?.floor ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Arrivée</span>
                    <span className="font-medium">
                      {new Date(request.stay.check_in_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Départ</span>
                    <span className="font-medium">
                      {new Date(request.stay.check_out_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Réf.</span>
                    <span className="font-mono text-xs">{request.stay.booking_reference}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes internes */}
            {request.internal_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Notes internes</h2>
                <p className="text-sm text-amber-800">{request.internal_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
