import { createClient } from '@/lib/supabase/server-client'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RequestActions from './RequestActions'  // ← Import du composant client

export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const hotel = await getCurrentHotelServer()
  
  if (!hotel) {
    return redirect('/')
  }

  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/login')
  }

  // Récupérer le client
  const { data: customer } = await supabase
    .from('customers')
    .select('customer_uuid')
    .eq('user_id', user.id)
    .single()

  if (!customer) {
    return redirect('/')
  }

  // Récupérer la demande avec toutes ses relations
  const { data: request, error } = await supabase
    .from('customer_requests')
    .select(`
      *,
      request_type:request_types(
        id,
        category,
        name,
        icon,
        estimated_time
      ),
      stay:stays(
        id,
        booking_reference,
        room:rooms(room_number)
      ),
      messages:request_messages(
        id,
        sender_type,
        sender_name,
        message,
        is_internal,
        created_at
      )
    `)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .eq('customer_id', customer.customer_uuid)  // ← Vérification directe
    .single()

  if (error || !request) {
    console.error('Erreur chargement demande:', error)
    notFound()
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }

  const statusLabels = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée'
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600'
  }

  const priorityLabels = {
    low: 'Basse',
    normal: 'Normale',
    high: 'Haute',
    urgent: 'Urgente'
  }

  const categoryIcons: Record<string, string> = {
    maintenance: '🔧',
    room_service: '🍽️',
    housekeeping: '🧹',
    concierge: '💎'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Fil d'Ariane */}
        <div className="mb-6">
          <Link
            href="/requests"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
          >
            ← Retour aux demandes
          </Link>
        </div>

        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl">
                {request.request_type.icon || categoryIcons[request.request_type.category] || '📋'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {request.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {request.request_type.name} • Réf: #{request.id}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status as keyof typeof statusColors]}`}>
                {statusLabels[request.status as keyof typeof statusLabels]}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
                {priorityLabels[request.priority as keyof typeof priorityLabels]}
              </span>
            </div>
          </div>

          {/* Infos chambre */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-xl">🛏️</span>
              <span className="font-medium">Chambre {request.stay.room?.room_number || '?'}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">Séjour: {request.stay.booking_reference}</span>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                {request.description}
              </p>
            </div>
          )}

          {/* Horaires */}
          <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
            <div>
              <p className="text-gray-500">Demandée le</p>
              <p className="font-medium text-gray-900">
                {new Date(request.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            {request.scheduled_time && (
              <div>
                <p className="text-gray-500">Planifiée le</p>
                <p className="font-medium text-gray-900">
                  {new Date(request.scheduled_time).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {request.completed_time && (
              <div>
                <p className="text-gray-500">Traitée le</p>
                <p className="font-medium text-gray-900">
                  {new Date(request.completed_time).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Messages/Historique */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Suivi de la demande
          </h2>

          {request.messages && request.messages.length > 0 ? (
            <div className="space-y-4">
              {request.messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.sender_type === 'customer'
                      ? 'bg-blue-50 ml-8'
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {message.sender_name || (message.sender_type === 'customer' ? 'Vous' : 'Service client')}
                      </span>
                      {message.is_internal && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Interne
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Aucun message pour le moment
            </p>
          )}

          {/* Formulaire de réponse (sera ajouté plus tard) */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 text-center">
              Le service client vous répondra dans les plus brefs délais
            </p>
          </div>
        </div>

        {/* Actions - Utilisation du composant client */}
        <RequestActions requestId={request.id} status={request.status} />
      </div>
    </div>
  )
}